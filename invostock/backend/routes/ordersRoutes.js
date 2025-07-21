const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/getOrders", async (req, res) => {
  const { userId, organizationId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Nedostaje userId" });
  }

  const condition = organizationId
    ? "o.organization_id = ?"
    : "o.organization_id IS NULL AND o.user_id = ?";

  const params = organizationId ? [organizationId] : [userId];

  let query = `
    SELECT o.*, s.name AS supplier
    FROM orders o
    LEFT JOIN suppliers s ON o.supplier_id = s.id
    WHERE ${condition}
    ORDER BY o.order_date DESC
  `;

  try {
    db.query(query, params, async (err, orders) => {
      if (err) {
        console.error("Greška pri dohvaćanju narudžbi:", err);
        return res.status(500).json({ error: "Greška na serveru" });
      }

      const ordersWithItems = await Promise.all(
        orders.map((order) => {
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

function generateCustomCode(prefix, date, orgOrUserCode, count) {
  const formattedDate = new Date(date)
    .toLocaleDateString("hr-HR")
    .split(".")
    .reverse()
    .join("");
  return `${prefix}-${formattedDate}-${orgOrUserCode}-${count}`;
}

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

  const countQuery = `
    SELECT COUNT(*) AS order_count
    FROM orders
    WHERE ${
      organizationId
        ? "organization_id = ?"
        : "organization_id IS NULL AND user_id = ?"
    }
  `;
  const countParams = organizationId ? [organizationId] : [userId];

  db.query(countQuery, countParams, (err1, result1) => {
    if (err1) {
      console.error("Greška pri brojanju narudžbi:", err1);
      return res.status(500).json({ error: "Greška na serveru" });
    }

    const count = result1[0].order_count + 1;
    const prefix = "ORD";
    const codePrefix = organizationId ? `O${organizationId}` : `U${userId}`;
    const customCode = generateCustomCode(
      prefix,
      new Date(orderDate),
      codePrefix,
      count
    );

    const insertOrderQuery = `
      INSERT INTO orders (user_id, organization_id, supplier_id, order_date, total_price, status, custom_order_code)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `;

    const params = [
      userId,
      organizationId || null,
      supplierId,
      orderDate,
      totalPrice,
      customCode,
    ];

    db.query(insertOrderQuery, params, (err2, result2) => {
      if (err2) {
        console.error("Greška pri unosu narudžbe:", err2);
        return res.status(500).json({ error: "Greška pri unosu narudžbe" });
      }

      const orderId = result2.insertId;
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

        db.query(insertItemQuery, itemParams, (err3) => {
          if (err3) {
            console.error("Greška pri unosu artikla:", err3);
            if (!errorOccurred) {
              errorOccurred = true;
              return res
                .status(500)
                .json({ error: "Greška pri unosu artikla" });
            }
          }

          completed++;
          if (completed === items.length && !errorOccurred) {
            res.status(201).json({
              success: true,
              message: "Narudžba uspješno spremljena",
              orderId,
              totalPrice,
              custom_order_code: customCode,
            });
          }
        });
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

function generateCustomCode(prefix, date, orgOrUserCode, count) {
  const formattedDate = new Date(date)
    .toLocaleDateString("hr-HR")
    .split(".")
    .reverse()
    .join("");
  return `${prefix}-${formattedDate}-${orgOrUserCode}-${count}`;
}

router.put("/markAsReceived", (req, res) => {
  const { orderId, userId, organizationId, receivedDate } = req.body;

  if (!orderId || !userId || !receivedDate) {
    return res.status(400).json({ error: "Nedostaju obavezni podaci" });
  }

  const updateOrderQuery = `
    UPDATE orders 
    SET status = 'delivered', received_date = ?
    WHERE id = ?
  `;

  db.query(updateOrderQuery, [receivedDate, orderId], (err1) => {
    if (err1) {
      console.error("Greška pri ažuriranju narudžbe:", err1);
      return res.status(500).json({ error: "Greška na serveru" });
    }

    const getOrderItemsQuery = `
      SELECT item_name, quantity, price, description 
      FROM order_items 
      WHERE order_id = ?
    `;

    db.query(getOrderItemsQuery, [orderId], (err2, items) => {
      if (err2) {
        console.error("Greška pri dohvaćanju stavki narudžbe:", err2);
        return res.status(500).json({ error: "Greška kod stavki" });
      }

      const getOrderQuery = `
        SELECT o.total_price, o.custom_order_code, s.name AS supplier_name
        FROM orders o
        LEFT JOIN suppliers s ON o.supplier_id = s.id
        WHERE o.id = ?
      `;

      db.query(getOrderQuery, [orderId], (err3, orderResults) => {
        if (err3 || orderResults.length === 0) {
          console.error("Greška kod dohvaćanja narudžbe:", err3);
          return res
            .status(500)
            .json({ error: "Greška kod dohvaćanja narudžbe" });
        }

        const { total_price, custom_order_code, supplier_name } =
          orderResults[0];

        const categoryQuery = `
          SELECT id FROM expense_categories 
          WHERE name = 'Nabava dijelova' 
          AND (user_id = ? OR organization_id = ?)
          LIMIT 1
        `;

        db.query(
          categoryQuery,
          [userId, organizationId],
          (err4, catResults) => {
            if (err4) {
              console.error("Greška kod traženja kategorije:", err4);
              return res
                .status(500)
                .json({ error: "Greška kod traženja kategorije" });
            }

            const insertExpense = (categoryId) => {
              const countQuery = `
              SELECT COUNT(*) AS count FROM expenses
              WHERE ${
                organizationId
                  ? "organization_id = ?"
                  : "user_id = ? AND organization_id IS NULL"
              }
            `;
              const countParams = organizationId ? [organizationId] : [userId];

              db.query(countQuery, countParams, (errC, countResult) => {
                if (errC) {
                  console.error("Greška kod brojanja troškova:", errC);
                  return res
                    .status(500)
                    .json({ error: "Greška kod generiranja koda" });
                }

                const count = countResult[0].count + 1;
                const orgOrUserCode = organizationId
                  ? `O${organizationId}`
                  : `U${userId}`;

                const customExpenseCode = generateCustomCode(
                  "EXP",
                  receivedDate,
                  orgOrUserCode,
                  count
                );

                const insertExpenseQuery = `
                INSERT INTO expenses (user_id, organization_id, category_id, expense_date, amount, name, description, custom_expense_code)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `;

                const expenseParams = [
                  userId,
                  organizationId || null,
                  categoryId,
                  receivedDate,
                  total_price,
                  `Nabava - ${supplier_name}`,
                  `Automatski trošak za narudžbu ${
                    custom_order_code || `#${orderId}`
                  }`,
                  customExpenseCode,
                ];

                db.query(insertExpenseQuery, expenseParams, (err5) => {
                  if (err5) {
                    console.error("Greška kod unosa troška:", err5);
                    return res
                      .status(500)
                      .json({ error: "Greška kod unosa troška" });
                  }

                  let completed = 0;
                  items.forEach((item) => {
                    const checkQuery = `
                    SELECT id, stock_quantity FROM inventory_items
                    WHERE item_name = ? AND ${
                      organizationId
                        ? "organization_id = ?"
                        : "user_id = ? AND organization_id IS NULL"
                    }
                  `;
                    const checkParams = organizationId
                      ? [item.item_name, organizationId]
                      : [item.item_name, userId];

                    db.query(checkQuery, checkParams, (err6, found) => {
                      if (err6) {
                        console.error("Greška kod provjere inventara:", err6);
                        return;
                      }

                      if (found.length > 0) {
                        const newQuantity =
                          found[0].stock_quantity + item.quantity;
                        db.query(
                          "UPDATE inventory_items SET stock_quantity = ? WHERE id = ?",
                          [newQuantity, found[0].id],
                          (err7) => {
                            if (err7) {
                              console.error(
                                "Greška kod ažuriranja zalihe:",
                                err7
                              );
                            }
                            completed++;
                            if (completed === items.length) {
                              res.status(200).json({
                                success: true,
                                message:
                                  "Narudžba primljena, trošak zabilježen i zaliha ažurirana.",
                              });
                            }
                          }
                        );
                      } else {
                        db.query(
                          `INSERT INTO inventory_items (item_name, category, description, stock_quantity, reorder_level, price, user_id, organization_id)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                          [
                            item.item_name,
                            item.category || "Nedefinirano",
                            item.description || "",
                            item.quantity,
                            1,
                            item.price,
                            userId,
                            organizationId || null,
                          ],
                          (err8) => {
                            if (err8) {
                              console.error(
                                "Greška kod dodavanja artikla:",
                                err8
                              );
                            }
                            completed++;
                            if (completed === items.length) {
                              res.status(200).json({
                                success: true,
                                message:
                                  "Narudžba primljena, trošak zabilježen i artikli dodani.",
                              });
                            }
                          }
                        );
                      }
                    });
                  });
                });
              });
            };

            if (catResults.length > 0) {
              insertExpense(catResults[0].id);
            } else {
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
                  insertExpense(resultCat.insertId);
                }
              );
            }
          }
        );
      });
    });
  });
});

module.exports = router;
