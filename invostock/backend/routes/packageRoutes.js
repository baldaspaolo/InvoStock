const express = require("express");
const router = express.Router();
const db = require("../db");

function generatePackageCode(orgOrUserCode, count) {
  const paddedCount = String(count).padStart(3, "0");
  return `PCK-${orgOrUserCode}-${paddedCount}`;
}

function checkAndCloseSalesOrder(salesOrderId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        so.id,
        i.status AS invoice_status,
        p.status AS package_status,
        i.remaining_amount
      FROM sales_orders so
      LEFT JOIN invoices i ON so.invoice_id = i.id
      LEFT JOIN packages p ON p.sales_order_id = so.id
      WHERE so.id = ?
    `;

    db.query(query, [salesOrderId], (err, result) => {
      if (err) return reject("Greška kod provjere naloga");
      if (result.length === 0) return resolve("Nalog nije pronađen");

      const order = result[0];
      if (
        order.invoice_status === "paid" &&
        order.package_status === "delivered" &&
        Number(order.remaining_amount) === 0
      ) {
        const updateQuery = `UPDATE sales_orders SET status = 'closed' WHERE id = ?`;
        db.query(updateQuery, [salesOrderId], (err2) => {
          if (err2) return reject("Greška kod zatvaranja naloga");
          return resolve("Nalog zatvoren automatski.");
        });
      } else {
        return resolve(
          "Nalog nije zatvoren jer faktura nije plaćena i/ili paket nije dostavljen."
        );
      }
    });
  });
}

router.post("/createPackage", async (req, res) => {
  const {
    userId,
    organizationId,
    contactId,
    salesOrderId,
    courier,
    description,
  } = req.body;

  if (!userId || (!organizationId && !userId)) {
    return res.status(400).json({ error: "Nedostaju podaci!" });
  }

  const codePrefix = organizationId ? `O${organizationId}` : `U${userId}`;

  const countQuery = `
    SELECT COUNT(*) AS package_count
    FROM packages
    WHERE ${organizationId ? "organization_id = ?" : "user_id = ?"}
  `;

  const queryParam = organizationId || userId;

  db.query(countQuery, [queryParam], (err1, result1) => {
    if (err1) {
      console.error("Greška pri dohvaćanju broja paketa:", err1);
      return res.status(500).json({ error: "Greška na serveru." });
    }

    const count = result1[0].package_count + 1;
    const customCode = generatePackageCode(codePrefix, count);

    const insertQuery = `
  INSERT INTO packages
  (user_id, organization_id, contact_id, sales_order_id, courier, status, code, created_at, description)
  VALUES (?, ?, ?, ?, ?, 'not_shipped', ?, NOW(), ?)
`;

    const values = [
      userId,
      organizationId || null,
      contactId || null,
      salesOrderId || null,
      courier || null,
      customCode,
      description || null,
    ];

    db.query(insertQuery, values, (err2, result2) => {
      if (err2) {
        console.error("Greška pri unosu paketa:", err2);
        return res.status(500).json({ error: "Greška pri unosu paketa." });
      }

      res.status(201).json({
        success: true,
        message: "Paket uspješno dodan",
        packageId: result2.insertId,
        custom_package_code: customCode,
      });
    });
  });
});

router.post("/getUserPackages", (req, res) => {
  const { userId, organizationId } = req.body;

  if (!userId) return res.status(400).json({ error: "Nedostaje User ID" });

  let query = `
    SELECT 
      p.*, 
      c.first_name, 
      c.last_name,
      so.custom_order_code AS order_code
    FROM packages p
    LEFT JOIN contacts c ON p.contact_id = c.id
    LEFT JOIN sales_orders so ON p.sales_order_id = so.id
    WHERE p.user_id = ?
  `;

  const params = [userId];

  if (organizationId) {
    query += " AND p.organization_id = ?";
    params.push(organizationId);
  } else {
    query += " AND p.organization_id IS NULL";
  }

  query += " ORDER BY p.created_at DESC";

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Greška kod dohvaćanja paketa:", err);
      return res.status(500).json({ error: "Greška na serveru." });
    }
    res.status(200).json({ success: true, packages: results });
  });
});


router.post("/updatePackageStatus", (req, res) => {
  const { packageId, status } = req.body;

  if (!packageId || !status)
    return res.status(400).json({ error: "Nedostaju podaci" });

  let query = "UPDATE packages SET status = ?";
  const params = [status];

  if (status === "shipped") {
    query += ", delivery_date = NOW()";
  } else if (status === "delivered") {
    query += ", received_date = NOW()";
  }

  query += " WHERE id = ?";
  params.push(packageId);

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Greška kod ažuriranja statusa paketa:", err);
      return res.status(500).json({ error: "Greška na serveru." });
    }

    // Ako je status postao "delivered", provjeri i zatvori nalog ako treba
    if (status === "delivered") {
      const salesOrderIdQuery = `
        SELECT sales_order_id FROM packages WHERE id = ?
      `;

      db.query(salesOrderIdQuery, [packageId], async (err2, result2) => {
        if (err2) {
          console.error("Greška kod dohvaćanja sales_order_id:", err2);
          return res.status(500).json({ error: "Greška na serveru." });
        }

        const salesOrderId = result2[0]?.sales_order_id;
        if (salesOrderId) {
          try {
            const message = await checkAndCloseSalesOrder(salesOrderId);
            return res.status(200).json({ success: true, message });
          } catch (error) {
            console.error(error);
            return res.status(500).json({ success: true, warning: error });
          }
        } else {
          return res.status(200).json({
            success: true,
            message: "Paket ažuriran, ali nije povezan s nalogom.",
          });
        }
      });
    } else {
      return res.status(200).json({ success: true });
    }
  });
});

module.exports = router;
