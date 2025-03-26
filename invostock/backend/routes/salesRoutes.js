const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/getOrders", (req, res) => {
  const { userId, organizationId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje userId" });
  }

  let query = `
    SELECT *
    FROM sales_orders
    WHERE user_id = ?
  `;

  const params = [userId];

  if (organizationId) {
    query += " AND organization_id = ?";
    params.push(organizationId);
  } else {
    query += " AND organization_id IS NULL";
  }

  query += " ORDER BY created_at DESC";

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Greška pri dohvaćanju naloga:", err);
      return res.status(500).json({ error: "Greška na serveru" });
    }

    res.status(200).json({ success: true, orders: results });
  });
});

router.post("/createOrder", (req, res) => {
  const { userId, organizationId, contactId, notes, items } = req.body;

  if (!userId || !contactId || !items || items.length === 0) {
    return res.status(400).json({ error: "Nedostaju obavezni podaci" });
  }

  const query1 = `
    INSERT INTO sales_orders (user_id, organization_id, contact_id, notes, status, created_at)
    VALUES (?, ?, ?, ?, 'open', NOW())
  `;

  const params1 = [userId, organizationId || null, contactId, notes || null];

  db.query(query1, params1, (err1, result1) => {
    if (err1) {
      console.error("Greška pri unosu naloga:", err1);
      return res.status(500).json({ error: "Greška pri unosu naloga" });
    }

    const orderId = result1.insertId;

    // unos
    let completed = 0;
    let errorOccurred = false;

    items.forEach((item) => {
      const query2 = `
        INSERT INTO sales_order_items (sales_order_id, item_id, quantity, price)
        VALUES (?, ?, ?, ?)
      `;

      const params2 = [orderId, item.itemId, item.quantity, item.price];

      db.query(query2, params2, (err2) => {
        if (err2) {
          console.error("Greška pri unosu artikla:", err2);
          if (!errorOccurred) {
            errorOccurred = true;
            return res.status(500).json({ error: "Greška pri unosu artikla" });
          }
        }

        completed++;

        //artikli uneseni
        if (completed === items.length && !errorOccurred) {
          res.status(201).json({
            message: "Prodajni nalog uspješno kreiran",
            orderId: orderId,
          });
        }
      });
    });
  });
});


module.exports = router;
