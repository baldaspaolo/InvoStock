const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/getOrders", async (req, res) => {
  const { userId, organizationId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje userId" });
  }

  let query = `
    SELECT o.*, s.name AS supplier
    FROM orders o
    LEFT JOIN suppliers s ON o.supplier_id = s.id
    WHERE o.user_id = ?
  `;

  const params = [userId];

  if (organizationId) {
    query += " AND o.organization_id = ?";
    params.push(organizationId);
  } else {
    query += " AND o.organization_id IS NULL";
  }

  query += " ORDER BY o.order_date DESC";

  try {
    db.query(query, params, async (err, orders) => {
      if (err) {
        console.error("Greška pri dohvaćanju narudžbi:", err);
        return res.status(500).json({ error: "Greška na serveru" });
      }

      // Dohvati items za sve narudžbe
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          return new Promise((resolve, reject) => {
            const itemsQuery = `
              SELECT item_name, quantity, price, description
              FROM order_items
              WHERE order_id = ?
            `;
            db.query(itemsQuery, [order.id], (err2, items) => {
              if (err2) {
                console.error("Greška pri dohvaćanju stavki:", err2);
                return reject("Greška kod stavki");
              }
              resolve({ ...order, items });
            });
          });
        })
      );

      res.status(200).json({ success: true, orders: ordersWithItems });
    });
  } catch (err) {
    console.error("Greška u Promise.all:", err);
    res.status(500).json({ error: "Nešto je pošlo po zlu" });
  }
});

// Izračun ukupnog iznosa naloga
/*router.post("/calculateOrderTotal", (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: "Nedostaje orderId" });
  }

  const queryItems = `
    SELECT quantity, price 
    FROM order_items 
    WHERE order_id = ?
  `;

  db.query(queryItems, [orderId], (err1, items) => {
    if (err1) {
      console.error("Greška pri dohvaćanju artikala:", err1);
      return res.status(500).json({ error: "Greška na serveru" });
    }

    const total = items.reduce((sum, item) => {
      return sum + item.quantity * item.price;
    }, 0);

    res.status(200).json({
      success: true,
      orderId,
      total: parseFloat(total.toFixed(2)),
    });
  });
});*/

router.post("/getOrderDetails", (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: "Nedostaje orderId" });
  }

  const query1 = `
    SELECT 
      orders.id,
      orders.status,
      orders.total_price,
      orders.order_date,
      suppliers.name AS supplier_name,
      suppliers.email AS supplier_email
    FROM orders
    JOIN suppliers ON orders.supplier_id = suppliers.id
    WHERE orders.id = ?
  `;

  db.query(query1, [orderId], (err1, result1) => {
    if (err1) {
      console.error("Greška pri dohvaćanju narudžbe:", err1);
      return res.status(500).json({ error: "Greška na serveru" });
    }

    if (result1.length === 0) {
      return res.status(404).json({ error: "Narudžba nije pronađena" });
    }

    const orderData = result1[0];

    const query2 = `
      SELECT 
        item_name,
        quantity,
        price,
        description
      FROM order_items
      WHERE order_id = ?
    `;

    db.query(query2, [orderId], (err2, result2) => {
      if (err2) {
        console.error("Greška pri dohvaćanju stavki narudžbe:", err2);
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
  const { userId, organizationId, supplierId, orderDate, items, totalPrice } =
    req.body;

  if (
    !userId ||
    !supplierId ||
    !orderDate ||
    !items ||
    items.length === 0 ||
    totalPrice == null
  ) {
    return res.status(400).json({ error: "Nedostaju obavezni podaci" });
  }

  const insertOrderQuery = `
    INSERT INTO orders (user_id, organization_id, supplier_id, order_date, total_price, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `;

  const params = [
    userId,
    organizationId || null,
    supplierId,
    orderDate,
    totalPrice,
  ];

  db.query(insertOrderQuery, params, (err, result) => {
    if (err) {
      console.error("Greška pri unosu narudžbe:", err);
      return res.status(500).json({ error: "Greška pri unosu narudžbe" });
    }

    const orderId = result.insertId;

    let completed = 0;
    let errorOccurred = false;

    items.forEach((item) => {
      const insertItemQuery = `
        INSERT INTO order_items (order_id, item_name, quantity, price, description)
        VALUES (?, ?, ?, ?, ?)
      `;

      const itemParams = [
        orderId,
        item.name,
        item.quantity,
        item.price,
        item.description || null,
      ];

      db.query(insertItemQuery, itemParams, (err2) => {
        if (err2) {
          console.error("Greška pri unosu artikla:", err2);
          if (!errorOccurred) {
            errorOccurred = true;
            return res.status(500).json({ error: "Greška pri unosu artikla" });
          }
        }

        completed++;
        if (completed === items.length && !errorOccurred) {
          res.status(201).json({
            success: true,
            message: "Narudžba uspješno spremljena",
            orderId,
            totalPrice,
          });
        }
      });
    });
  });
});

router.delete("/cancelOrder/:id", (req, res) => {
  const { id } = req.params;

  const query = `
    UPDATE orders 
    SET status = 'cancelled'
    WHERE id = ?
  `;

  db.query(query, [id], (err) => {
    if (err) {
      console.error("Greška pri obustavi narudžbe:", err);
      return res.status(500).json({ error: "Greška na serveru" });
    }

    res.status(200).json({ success: true, message: "Narudžba obustavljena" });
  });
});

router.put("/markAsReceived", (req, res) => {
  const { orderId, userId, organizationId, receivedDate } = req.body;

  if (!orderId || !userId || !receivedDate) {
    return res.status(400).json({ error: "Nedostaju obavezni podaci" });
  }

  console.log("➡️ Početak obrade /markAsReceived");
  console.log("Primljeni podaci:", {
    orderId,
    userId,
    organizationId,
    receivedDate,
  });

  const updateOrderQuery = `
    UPDATE orders 
    SET status = 'delivered', received_date = ?
    WHERE id = ?
  `;

  db.query(updateOrderQuery, [receivedDate, orderId], (err1) => {
    if (err1) {
      console.error("❌ Greška pri ažuriranju narudžbe:", err1);
      return res.status(500).json({ error: "Greška na serveru" });
    }


    const getOrderQuery = `
      SELECT o.total_price, s.name AS supplier_name
      FROM orders o
      LEFT JOIN suppliers s ON o.supplier_id = s.id
      WHERE o.id = ?
    `;

    db.query(getOrderQuery, [orderId], (err2, results) => {
      if (err2 || results.length === 0) {
        console.error("❌ Greška kod dohvaćanja narudžbe:", err2);
        return res
          .status(500)
          .json({ error: "Greška kod dohvaćanja narudžbe" });
      }

      const { total_price, supplier_name } = results[0];
      console.log("📦 Dohvaćena narudžba:", { total_price, supplier_name });

      const categoryQuery = `
        SELECT id FROM expense_categories 
        WHERE name = 'Nabava dijelova' 
        AND (user_id = ? OR organization_id = ?)
        LIMIT 1
      `;

      db.query(
        categoryQuery,
        [userId, organizationId],
        (errCat, catResults) => {
          if (errCat) {
            console.error("Greška kod traženja kategorije:", errCat);
            return res
              .status(500)
              .json({ error: "Greška kod traženja kategorije" });
          }

          const handleInsertExpense = (categoryId) => {
            console.log("🧾 Unos troška sa categoryId:", categoryId);

            const insertExpenseQuery = `
            INSERT INTO expenses (user_id, organization_id, category_id, expense_date, amount, name, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `;

            const expenseParams = [
              userId,
              organizationId || null,
              categoryId,
              receivedDate,
              total_price,
              `Nabava - ${supplier_name}`,
              `Automatski trošak za narudžbu #${orderId}`,
            ];

            db.query(insertExpenseQuery, expenseParams, (err3) => {
              if (err3) {
                console.error("Greška kod unosa troška:", err3);
                return res
                  .status(500)
                  .json({ error: "Greška kod unosa troška" });
              }

              console.log("✅ Trošak uspješno unesen");
              res.status(200).json({
                success: true,
                message: "Narudžba primljena i trošak zabilježen.",
              });
            });
          };

          if (catResults.length > 0) {
            console.log("✅ Kategorija pronađena:", catResults[0].id);
            handleInsertExpense(catResults[0].id);
          } else {
            console.log("⚠️ Kategorija ne postoji, kreiram novu...");

            const insertCategoryQuery = `
            INSERT INTO expense_categories (user_id, organization_id, name)
            VALUES (?, ?, 'Nabava dijelova')
          `;

            db.query(
              insertCategoryQuery,
              [userId, organizationId || null],
              (errIns, resultCat) => {
                if (errIns) {
                  console.error("Greška kod unosa kategorije:", errIns);
                  return res
                    .status(500)
                    .json({ error: "Greška kod dodavanja kategorije" });
                }

                console.log(
                  "✅ Nova kategorija kreirana s ID:",
                  resultCat.insertId
                );
                handleInsertExpense(resultCat.insertId);
              }
            );
          }
        }
      );
    });
  });
});

module.exports = router;
