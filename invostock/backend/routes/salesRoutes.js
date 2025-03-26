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

    const total = items.reduce((sum, item) => {
      return sum + item.quantity * item.price;
    }, 0);

    const queryDiscount = `
      SELECT discount FROM sales_orders WHERE id = ?
    `;

    db.query(queryDiscount, [orderId], (err2, result) => {
      if (err2) {
        console.error("Greška pri dohvaćanju popusta:", err2);
        return res.status(500).json({ error: "Greška na serveru" });
      }

      const discount = result[0]?.discount || 0;
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

router.post("/getOrderDetails", (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: "Nedostaje orderId" });
  }

  const query1 = `
  SELECT 
    sales_orders.id,
    sales_orders.invoice_id,
    sales_orders.status,
    sales_orders.notes,
    sales_orders.discount, -- 👈 OVDJE
    sales_orders.created_at,
    contacts.first_name,
    contacts.last_name,
    contacts.company_name,
    contacts.email
  FROM sales_orders
  JOIN contacts ON sales_orders.contact_id = contacts.id
  WHERE sales_orders.id = ?
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

router.post("/createOrder", (req, res) => {
  const { userId, organizationId, contactId, notes, items, discount } =
    req.body;

  if (!userId || !contactId || !items || items.length === 0) {
    return res.status(400).json({ error: "Nedostaju obavezni podaci" });
  }

  const query1 = `
    INSERT INTO sales_orders (user_id, organization_id, contact_id, notes, discount, status, created_at)
VALUES (?, ?, ?, ?, ?, 'open', NOW())

  `;

  const params1 = [
    userId,
    organizationId || null,
    contactId,
    notes || null,
    discount || 0,
  ];

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
