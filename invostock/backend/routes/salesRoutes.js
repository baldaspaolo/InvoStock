const express = require("express");
const router = express.Router();
const db = require("../db");

function generateCustomCode(prefix, date, orgOrUserCode, count) {
  const formattedDate = new Date(date)
    .toLocaleDateString("hr-HR")
    .split(".")
    .reverse()
    .join("");
  return `${prefix}-${formattedDate}-${orgOrUserCode}-${count}`;
}

router.post("/createOrder", (req, res) => {
  const { userId, organizationId, contactId, notes, items, discount } =
    req.body;

  if (!userId || !contactId || !items || items.length === 0) {
    return res.status(400).json({ error: "Nedostaju obavezni podaci" });
  }

  const countQuery = organizationId
    ? `SELECT COUNT(*) AS order_count FROM sales_orders WHERE user_id = ? AND organization_id = ?`
    : `SELECT COUNT(*) AS order_count FROM sales_orders WHERE user_id = ? AND organization_id IS NULL`;

  const countParams = organizationId ? [userId, organizationId] : [userId];

  db.query(countQuery, countParams, (err1, result1) => {
    if (err1) {
      console.error("Greška pri dohvaćanju broja naloga:", err1);
      return res.status(500).json({ error: "Greška na serveru." });
    }

    const count = result1[0].order_count + 1;
    const prefix = "SO";
    const codePrefix = organizationId ? `O${organizationId}` : `U${userId}`;
    const date = new Date();
    const customOrderCode = generateCustomCode(prefix, date, codePrefix, count);

    const insertOrderQuery = `
      INSERT INTO sales_orders (
        user_id, organization_id, contact_id, notes, discount,
        status, created_at, custom_order_code
      ) VALUES (?, ?, ?, ?, ?, 'open', NOW(), ?)
    `;

    const orderParams = [
      userId,
      organizationId || null,
      contactId,
      notes || null,
      discount || 0,
      customOrderCode,
    ];

    db.query(insertOrderQuery, orderParams, (err2, result2) => {
      if (err2) {
        console.error("Greška pri unosu naloga:", err2);
        return res.status(500).json({ error: "Greška pri unosu naloga" });
      }

      const orderId = result2.insertId;

      let completed = 0;
      let errorOccurred = false;

      items.forEach((item) => {
        const insertItemQuery = `
          INSERT INTO sales_order_items (sales_order_id, item_id, quantity, price)
          VALUES (?, ?, ?, ?)
        `;
        const itemParams = [orderId, item.itemId, item.quantity, item.price];

        db.query(insertItemQuery, itemParams, (err3) => {
          if (err3 && !errorOccurred) {
            console.error("Greška pri unosu artikla:", err3);
            errorOccurred = true;
            return res.status(500).json({ error: "Greška pri unosu artikla" });
          }

          completed++;
          if (completed === items.length && !errorOccurred) {
            res.status(201).json({
              success: true,
              message: "Prodajni nalog uspješno kreiran",
              orderId: orderId,
              custom_order_code: customOrderCode,
            });
          }
        });
      });
    });
  });
});

router.post("/getOrders", (req, res) => {
  const { userId, organizationId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje userId" });
  }

  const hasOrg =
    organizationId !== null &&
    organizationId !== undefined &&
    !isNaN(organizationId);
  const condition = hasOrg
    ? "so.organization_id = ?"
    : "so.organization_id IS NULL AND so.user_id = ?";
  const params = hasOrg ? [organizationId] : [userId];

  const query = `
    SELECT 
      so.*,
      c.first_name,
      c.last_name,
      i.status AS invoice_status,
      p.status AS package_status
    FROM sales_orders so
    LEFT JOIN contacts c ON so.contact_id = c.id
    LEFT JOIN invoices i ON so.invoice_id = i.id
    LEFT JOIN packages p ON p.sales_order_id = so.id
    WHERE ${condition}
    ORDER BY so.created_at DESC
  `;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Greška pri dohvaćanju naloga:", err);
      return res.status(500).json({ error: "Greška na serveru" });
    }

    res.status(200).json({ success: true, orders: results });
  });
});

router.post("/getOrderDetails", (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: "Nedostaje orderId" });
  }

  const query1 = `
  SELECT 
  so.id,
  so.invoice_id,
  i.status AS invoice_status,
  p.id AS package_id,
  p.status AS package_status,
  so.status,
  so.close_reason,
  so.notes,
  so.discount,
  so.custom_order_code,
  so.created_at,
  so.contact_id,
  c.first_name,
  c.last_name,
  c.company_name,
  c.email,
  c.address,
  c.zip_code,
  c.place,
  c.phone_number
FROM sales_orders so
JOIN contacts c ON so.contact_id = c.id
LEFT JOIN invoices i ON so.invoice_id = i.id
LEFT JOIN packages p ON p.sales_order_id = so.id
WHERE so.id = ?
`;

  db.query(query1, [orderId], (err1, result1) => {
    if (err1) {
      console.error("Greška pri dohvaćanju naloga:", err1);
      return res.status(500).json({ error: "Greška na serveru" });
    }

    if (result1.length === 0) {
      return res.status(404).json({ error: "Nalog nije pronađen" });
    }

    const orderData = result1[0];

    const query2 = `
      SELECT 
        sales_order_items.item_id,
        inventory_items.item_name,
        sales_order_items.quantity,
        sales_order_items.price
      FROM sales_order_items
      JOIN inventory_items ON sales_order_items.item_id = inventory_items.id
      WHERE sales_order_items.sales_order_id = ?
    `;

    db.query(query2, [orderId], (err2, result2) => {
      if (err2) {
        console.error("Greška pri dohvaćanju artikala:", err2);
        return res.status(500).json({ error: "Greška na serveru" });
      }

      res.status(200).json({
        success: true,
        order: orderData,
        items: result2,
      });
    });
  });
});

// Izračun ukupne cijene naloga
router.post("/calculateOrderTotal", (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: "Nedostaje orderId" });
  }

  const queryItems = `
    SELECT quantity, price 
    FROM sales_order_items 
    WHERE sales_order_id = ?
  `;

  db.query(queryItems, [orderId], (err1, items) => {
    if (err1) {
      console.error("Greška pri dohvaćanju artikala:", err1);
      return res.status(500).json({ error: "Greška na serveru" });
    }

    const total = items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    const queryDiscount = `
      SELECT discount FROM sales_orders WHERE id = ?
    `;

    db.query(queryDiscount, [orderId], (err2, result) => {
      if (err2) {
        console.error("Greška pri dohvaćanju popusta:", err2);
        return res.status(500).json({ error: "Greška na serveru" });
      }

      const discount = parseFloat(result[0]?.discount || 0);
      const finalTotal = total - discount;

      res.status(200).json({
        success: true,
        orderId,
        subtotal: parseFloat(total.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        total: parseFloat(finalTotal.toFixed(2)),
      });
    });
  });
});

router.post("/markOrderComplete", (req, res) => {
  const { orderId } = req.body;
  const query = `UPDATE sales_orders SET status = 'completed' WHERE id = ?`;
  db.query(query, [orderId], (err, result) => {
    if (err) {
      console.error("Greška kod zatvaranja naloga:", err);
      return res.status(500).json({ error: "Greška kod zatvaranja naloga." });
    }
    res.json({ success: true, message: "Nalog uspješno označen kao završen." });
  });
});

router.post("/closeOrder", (req, res) => {
  const { orderId, reason } = req.body;

  if (!orderId || !reason) {
    return res
      .status(400)
      .json({ success: false, message: "Nedostaje orderId ili razlog." });
  }

  const query = `
    UPDATE sales_orders
    SET status = 'closed', close_reason = ?
    WHERE id = ?
  `;

  db.query(query, [reason, orderId], (err, result) => {
    if (err) {
      console.error("Greška kod zatvaranja naloga:", err);
      return res
        .status(500)
        .json({ success: false, message: "Greška na serveru." });
    }

    res.status(200).json({ success: true, message: "Nalog zatvoren." });
  });
});

module.exports = router;
