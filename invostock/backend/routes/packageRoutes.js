const express = require("express");
const router = express.Router();
const db = require("../db");

function generatePackageCode(orgOrUserCode, count) {
  const paddedCount = String(count).padStart(3, "0");
  return `PCK-${orgOrUserCode}-${paddedCount}`;
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

  const query = `
  SELECT p.*, c.first_name, c.last_name
  FROM packages p
  LEFT JOIN contacts c ON p.contact_id = c.id
  WHERE p.user_id = ? AND ${
    organizationId ? "p.organization_id = ?" : "p.organization_id IS NULL"
  }
  ORDER BY p.created_at DESC
`;

  const params = organizationId ? [userId, organizationId] : [userId];

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

  const query = `UPDATE packages SET status = ? WHERE id = ?`;

  db.query(query, [status, packageId], (err, result) => {
    if (err) {
      console.error("Greška kod ažuriranja statusa paketa:", err);
      return res.status(500).json({ error: "Greška na serveru." });
    }
    res.status(200).json({ success: true });
  });
});

module.exports = router;
