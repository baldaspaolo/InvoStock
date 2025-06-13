const express = require("express");
const router = express.Router();
const db = require("../db");

function generateInventoryCode(orgOrUserCode, count) {
  const padded = String(count).padStart(3, "0");
  return `INV-${orgOrUserCode}-${padded}`;
}

router.post("/getInventory", (req, res) => {
  const { userId, organizationId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje UserID" });
  }

  let query = "";
  let queryParams = [];

  if (organizationId) {
    query = `
      SELECT ii.*, ic.name AS category_name
      FROM inventory_items ii
      LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
      WHERE ii.organization_id = ? AND ii.is_deleted = FALSE
    `;
    queryParams = [organizationId];
  } else {
    query = `
      SELECT ii.*, ic.name AS category_name
      FROM inventory_items ii
      LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
      WHERE ii.user_id = ? AND ii.organization_id IS NULL AND ii.is_deleted = FALSE
    `;
    queryParams = [userId];
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Greška prilikom dohvaćanja inventara:", err);
      return res.status(500).json({ error: "Greška na serveru." });
    }

    res.status(200).json({ success: true, inventory: results });
  });
});

router.post("/addInventoryItem", (req, res) => {
  const { userId, organizationId, itemData } = req.body;

  if (!userId || !itemData?.item_name || !itemData?.category_id) {
    return res
      .status(400)
      .json({ error: "Nedostaju podaci (userId, item_name, category_id)" });
  }

  let checkQuery = "";
  let checkParams = [];

  if (organizationId) {
    checkQuery =
      "SELECT * FROM inventory_items WHERE item_name = ? AND organization_id = ?";
    checkParams = [itemData.item_name, organizationId];
  } else {
    checkQuery =
      "SELECT * FROM inventory_items WHERE item_name = ? AND user_id = ? AND organization_id IS NULL";
    checkParams = [itemData.item_name, userId];
  }

  db.query(checkQuery, checkParams, (err, existingItem) => {
    if (err) return res.status(500).json({ error: "Greška na serveru." });
    if (existingItem.length > 0) {
      return res
        .status(400)
        .json({ error: "Artikal s tim nazivom već postoji" });
    }

    const codePrefix = organizationId ? `O${organizationId}` : `U${userId}`;
    const countQuery = `SELECT COUNT(*) AS count FROM inventory_items WHERE ${
      organizationId
        ? "organization_id = ?"
        : "user_id = ? AND organization_id IS NULL"
    }`;

    db.query(countQuery, [organizationId || userId], (err2, countResult) => {
      if (err2) return res.status(500).json({ error: "Greška kod brojanja" });

      const count = countResult[0].count + 1;
      const customCode = generateInventoryCode(codePrefix, count);

      const insertQuery = `
        INSERT INTO inventory_items (
          organization_id, user_id, item_name, category_id, description,
          stock_quantity, reorder_level, price, custom_inventory_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const values = [
        organizationId || null,
        userId,
        itemData.item_name,
        itemData.category_id,
        itemData.description || null,
        itemData.stock_quantity || 0,
        itemData.reorder_level || 1,
        itemData.price || 0,
        customCode,
      ];

      db.query(insertQuery, values, (err3, result) => {
        if (err3)
          return res.status(500).json({ error: "Greška kod dodavanja" });

        db.query(
          "SELECT * FROM inventory_items WHERE id = ?",
          [result.insertId],
          (err4, item) => {
            if (err4)
              return res.status(500).json({ error: "Greška kod dohvaćanja" });
            res.status(201).json({
              message: "Artikal dodan",
              item: item[0],
              custom_inventory_code: customCode,
            });
          }
        );
      });
    });
  });
});

router.get("/getCategories", (req, res) => {
  const { userId, organizationId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje userId" });
  }

  const query = organizationId
    ? `SELECT id, name FROM inventory_categories WHERE organization_id = ? AND is_deleted = 0 ORDER BY name ASC`
    : `SELECT id, name FROM inventory_categories WHERE user_id = ? AND organization_id IS NULL AND is_deleted = 0 ORDER BY name ASC`;

  const param = organizationId || userId;

  db.query(query, [param], (err, results) => {
    if (err) {
      console.error("Greška kod dohvaćanja kategorija:", err);
      return res.status(500).json({ error: "Greška na serveru" });
    }

    res.status(200).json({ success: true, categories: results });
  });
});

router.post("/updateStockAfterInvoice", (req, res) => {
  const { userId, organizationId, items } = req.body;

  if (!userId || !items || items.length === 0) {
    return res.status(400).json({ error: "Nedostaju obavezni podaci." });
  }

  let completed = 0;
  let errorOccurred = false;

  items.forEach((item) => {
    const updateQuery = `
      UPDATE inventory_items
      SET stock_quantity = stock_quantity - ?
      WHERE id = ? AND user_id = ? AND ${
        organizationId ? "organization_id = ?" : "organization_id IS NULL"
      }
    `;

    const params = organizationId
      ? [item.quantity, item.itemId, userId, organizationId]
      : [item.quantity, item.itemId, userId];

    db.query(updateQuery, params, (err) => {
      if (err && !errorOccurred) {
        errorOccurred = true;
        console.error(
          "Greška pri ažuriranju zaliha za artikl:",
          item.itemId,
          err
        );
        return res.status(500).json({ error: "Greška pri ažuriranju zaliha." });
      }

      completed++;

      if (completed === items.length && !errorOccurred) {
        console.log("Zalihe uspješno ažurirane.");
        return res.status(200).json({
          success: true,
          message: "Zalihe uspješno ažurirane.",
        });
      }
    });
  });
});

router.post("/lowStock", (req, res) => {
  const { userId, organizationId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje userId" });
  }

  let query, params;

  if (organizationId) {
    query = `SELECT * FROM inventory_items 
             WHERE organization_id = ? 
             AND stock_quantity > 0 
             AND stock_quantity <= reorder_level
             ORDER BY stock_quantity ASC`;
    params = [organizationId];
  } else {
    query = `SELECT * FROM inventory_items 
             WHERE user_id = ? 
             AND organization_id IS NULL
             AND stock_quantity > 0 
             AND stock_quantity <= reorder_level
             ORDER BY stock_quantity ASC`;
    params = [userId];
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Greška pri dohvatu artikala sa niskom zalihom:", err);
      return res.status(500).json({ error: "Interna server greška" });
    }

    res.status(200).json({
      success: true,
      inventory: results,
      count: results.length,
    });
  });
});

router.post("/zeroStock", (req, res) => {
  const { userId, organizationId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje userId" });
  }

  let query, params;

  if (organizationId) {
    query = `SELECT * FROM inventory_items 
             WHERE organization_id = ? 
             AND stock_quantity = 0
             ORDER BY item_name ASC`;
    params = [organizationId];
  } else {
    query = `SELECT * FROM inventory_items 
             WHERE user_id = ? 
             AND organization_id IS NULL
             AND stock_quantity = 0
             ORDER BY item_name ASC`;
    params = [userId];
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Greška pri dohvatu artikala bez zaliha:", err);
      return res.status(500).json({ error: "Interna server greška" });
    }

    res.status(200).json({
      success: true,
      inventory: results,
      count: results.length,
    });
  });
});

router.post("/checkOrAddItem", (req, res) => {
  const { userId, organizationId, item_name, category_id, price } = req.body;

  if (!userId || !item_name || !category_id) {
    return res.status(400).json({
      error: "Nedostaju obavezni podaci (userId, item_name, category_id)",
    });
  }

  // Provjera postoji li već artikl
  let checkQuery = "";
  let checkParams = [];

  if (organizationId) {
    checkQuery =
      "SELECT * FROM inventory_items WHERE item_name = ? AND organization_id = ? LIMIT 1";
    checkParams = [item_name, organizationId];
  } else {
    checkQuery =
      "SELECT * FROM inventory_items WHERE item_name = ? AND user_id = ? AND organization_id IS NULL LIMIT 1";
    checkParams = [item_name, userId];
  }

  db.query(checkQuery, checkParams, (err, existing) => {
    if (err) {
      console.error("Greška kod provjere artikla:", err);
      return res.status(500).json({ error: "Greška na serveru." });
    }

    if (existing.length > 0) {
      return res.status(200).json({
        item: existing[0],
        message: "Artikal već postoji",
      });
    }

    // Generiranje custom_inventory_code
    const codePrefix = organizationId ? `O${organizationId}` : `U${userId}`;

    let countQuery = "";
    let countParams = [];

    if (organizationId) {
      countQuery =
        "SELECT COUNT(*) AS count FROM inventory_items WHERE organization_id = ?";
      countParams = [organizationId];
    } else {
      countQuery =
        "SELECT COUNT(*) AS count FROM inventory_items WHERE user_id = ?";
      countParams = [userId];
    }

    db.query(countQuery, countParams, (err, countResult) => {
      if (err) {
        console.error("Greška kod brojanja artikala:", err);
        return res.status(500).json({ error: "Greška na serveru." });
      }

      const count = countResult[0].count + 1;
      const customCode = generateInventoryCode(codePrefix, count);

      // Unos artikla s custom kodom
      const insertQuery = `
        INSERT INTO inventory_items (
          item_name, category_id, description, stock_quantity, reorder_level, price,
          user_id, organization_id, custom_inventory_code
        ) VALUES (?, ?, '', 0, 1, ?, ?, ?, ?)
      `;

      const insertParams = [
        item_name,
        category_id,
        price || 0,
        userId,
        organizationId || null,
        customCode,
      ];

      db.query(insertQuery, insertParams, (err, result) => {
        if (err) {
          console.error("Greška kod unosa artikla:", err);
          return res.status(500).json({ error: "Greška na serveru." });
        }

        db.query(
          "SELECT * FROM inventory_items WHERE id = ?",
          [result.insertId],
          (err, newItem) => {
            if (err) {
              console.error("Greška kod dohvaćanja novog artikla:", err);
              return res.status(500).json({ error: "Greška na serveru." });
            }

            res.status(201).json({
              item: newItem[0],
              custom_inventory_code: customCode,
              message: "Artikal dodan jer nije postojao",
            });
          }
        );
      });
    });
  });
});

router.post("/increaseStock", (req, res) => {
  const { itemId, quantity, userId, organizationId } = req.body;

  if (!itemId || typeof quantity !== "number" || !userId) {
    return res
      .status(400)
      .json({ error: "Nedostaje itemId, userId ili neispravna količina" });
  }

  const query = organizationId
    ? "SELECT stock_quantity FROM inventory_items WHERE id = ? AND organization_id = ?"
    : "SELECT stock_quantity FROM inventory_items WHERE id = ? AND user_id = ? AND organization_id IS NULL";
  const params = organizationId ? [itemId, organizationId] : [itemId, userId];

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Greška kod dohvaćanja artikla:", err);
      return res.status(500).json({ error: "Greška na serveru." });
    }

    if (results.length === 0) {
      return res.status(404).json({
        error: "Artikal nije pronađen ili ne pripada korisniku/organizaciji",
      });
    }

    const newQuantity = results[0].stock_quantity + quantity;

    db.query(
      "UPDATE inventory_items SET stock_quantity = ? WHERE id = ?",
      [newQuantity, itemId],
      (updateErr) => {
        if (updateErr) {
          console.error("Greška pri ažuriranju zalihe:", updateErr);
          return res.status(500).json({ error: "Greška na serveru." });
        }

        res.status(200).json({
          success: true,
          message: "Zaliha uspješno ažurirana",
          newQuantity,
        });
      }
    );
  });
});

router.post("/updateStock", (req, res) => {
  const { id, quantityChange, reorder_level, userId, organizationId } =
    req.body;

  if (!id || typeof quantityChange !== "number" || !userId) {
    return res.status(400).json({ error: "Nedostaju podaci za ažuriranje" });
  }

  const selectQuery = organizationId
    ? "SELECT stock_quantity FROM inventory_items WHERE id = ? AND organization_id = ?"
    : "SELECT stock_quantity FROM inventory_items WHERE id = ? AND user_id = ? AND organization_id IS NULL";

  const selectParams = organizationId ? [id, organizationId] : [id, userId];

  db.query(selectQuery, selectParams, (err, results) => {
    if (err) {
      console.error("Greška kod dohvaćanja artikla:", err);
      return res.status(500).json({ error: "Greška na serveru" });
    }

    if (results.length === 0) {
      return res.status(404).json({
        error: "Artikal nije pronađen ili ne pripada korisniku/organizaciji",
      });
    }

    const newQuantity = results[0].stock_quantity + quantityChange;

    const updateQuery = `
      UPDATE inventory_items 
      SET stock_quantity = ?, 
          reorder_level = ?
      WHERE id = ?
      ${
        organizationId
          ? "AND organization_id = ?"
          : "AND user_id = ? AND organization_id IS NULL"
      }
    `;

    const updateParams = organizationId
      ? [newQuantity, reorder_level || 1, id, organizationId]
      : [newQuantity, reorder_level || 1, id, userId];

    db.query(updateQuery, updateParams, (updateErr, result) => {
      if (updateErr) {
        console.error("Greška pri ažuriranju zalihe:", updateErr);
        return res.status(500).json({ error: "Greška na serveru" });
      }

      res.status(200).json({
        success: true,
        message: "Zaliha ažurirana",
        newQuantity,
      });
    });
  });
});

router.get("/getInventoryItem/:id", (req, res) => {
  const { id } = req.params;
  const { userId, organizationId } = req.query;

  if (!id || !userId)
    return res.status(400).json({ error: "Nedostaje ID artikla ili userId" });

  const query = organizationId
    ? `
      SELECT ii.*, ic.name AS category_name
      FROM inventory_items ii
      LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
      WHERE ii.id = ? AND ii.organization_id = ?
    `
    : `
      SELECT ii.*, ic.name AS category_name
      FROM inventory_items ii
      LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
      WHERE ii.id = ? AND ii.user_id = ? AND ii.organization_id IS NULL
    `;

  const params = organizationId ? [id, organizationId] : [id, userId];

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Greška kod dohvaćanja artikla:", err);
      return res.status(500).json({ error: "Greška na serveru" });
    }

    if (results.length === 0) {
      return res.status(404).json({
        error: "Artikal nije pronađen ili ne pripada korisniku/organizaciji",
      });
    }

    res.status(200).json({ success: true, item: results[0] });
  });
});

router.put("/updateInventoryItem/:id", (req, res) => {
  const { id } = req.params;
  const {
    userId,
    organizationId,
    item_name,
    category_id,
    price,
    description,
    reorder_level,
  } = req.body;

  if (!id || !userId || !item_name || !category_id) {
    return res.status(400).json({ error: "Nedostaju obavezni podaci" });
  }

  const query = `
    UPDATE inventory_items SET
      item_name = ?,
      category_id = ?,   -- <-- novo
      price = ?,
      description = ?,
      reorder_level = ?
    WHERE id = ?
    ${
      organizationId
        ? "AND organization_id = ?"
        : "AND user_id = ? AND organization_id IS NULL"
    }
  `;

  const params = [
    item_name,
    category_id,
    price || 0,
    description || null,
    reorder_level || 1,
    id,
    organizationId || userId,
  ];

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Greška pri ažuriranju artikla:", err);
      return res.status(500).json({ error: "Greška na serveru." });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Artikal nije pronađen ili nemaš ovlasti." });
    }

    res.status(200).json({ success: true, message: "Artikal ažuriran" });
  });
});

router.delete("/deleteInventoryItem/:id", (req, res) => {
  const { id } = req.params;
  const { userId, organizationId } = req.query;

  if (!id || !userId) {
    return res.status(400).json({ error: "Nedostaje ID ili userId" });
  }

  const query = `
    UPDATE inventory_items 
    SET is_deleted = TRUE 
    WHERE id = ? 
    ${
      organizationId
        ? "AND organization_id = ?"
        : "AND user_id = ? AND organization_id IS NULL"
    }
  `;

  const params = [id, organizationId || userId];

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Greška pri mekom brisanju artikla:", err);
      return res.status(500).json({ error: "Greška na serveru." });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Artikal nije pronađen ili nemaš ovlasti." });
    }

    res
      .status(200)
      .json({ success: true, message: "Artikal označen kao obrisan" });
  });
});

router.post("/addInventoryCategory", (req, res) => {
  const { userId, organizationId, name } = req.body;

  if (!userId || !name) {
    return res
      .status(400)
      .json({ error: "Nedostaju obavezni podaci (userId, name)" });
  }

  const checkQuery = organizationId
    ? `SELECT id FROM inventory_categories WHERE name = ? AND organization_id = ? AND is_deleted = 0 LIMIT 1`
    : `SELECT id FROM inventory_categories WHERE name = ? AND user_id = ? AND organization_id IS NULL AND is_deleted = 0 LIMIT 1`;

  const checkParams = organizationId ? [name, organizationId] : [name, userId];

  db.query(checkQuery, checkParams, (err, existing) => {
    if (err) {
      console.error("Greška kod provjere kategorije:", err);
      return res.status(500).json({ error: "Greška na serveru." });
    }

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ error: "Kategorija s tim nazivom već postoji." });
    }

    const insertQuery = `
      INSERT INTO inventory_categories (name, user_id, organization_id, is_deleted)
      VALUES (?, ?, ?, 0)
    `;

    const insertParams = [name, userId, organizationId || null];

    db.query(insertQuery, insertParams, (err2, result) => {
      if (err2) {
        console.error("Greška kod unosa nove kategorije:", err2);
        return res.status(500).json({ error: "Greška na serveru." });
      }

      res.status(201).json({
        success: true,
        message: "Kategorija uspješno dodana.",
        category_id: result.insertId,
      });
    });
  });
});

router.put("/updateCategory/:id", (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || !id) {
    return res.status(400).json({ error: "Nedostaje naziv ili ID." });
  }

  const query = `UPDATE inventory_categories SET name = ? WHERE id = ? AND is_deleted = 0`;

  db.query(query, [name, id], (err, result) => {
    if (err) {
      console.error("Greška kod ažuriranja kategorije:", err);
      return res.status(500).json({ error: "Greška na serveru." });
    }

    res.json({ success: true, message: "Kategorija ažurirana." });
  });
});

router.delete("/deleteCategory/:id", (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Nedostaje ID kategorije." });
  }

  const query = `UPDATE inventory_categories SET is_deleted = 1 WHERE id = ?`;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Greška kod brisanja kategorije:", err);
      return res.status(500).json({ error: "Greška na serveru." });
    }

    res.json({ success: true, message: "Kategorija obrisana." });
  });
});

router.post("/addCategory", (req, res) => {
  const { userId, organizationId, name } = req.body;

  if (!userId || !name) {
    return res.status(400).json({ error: "Nedostaje userId ili naziv." });
  }

  const query = `
    INSERT INTO inventory_categories (name, user_id, organization_id, is_deleted)
    VALUES (?, ?, ?, 0)
  `;

  db.query(query, [name, userId, organizationId || null], (err, result) => {
    if (err) {
      console.error("Greška kod dodavanja kategorije:", err);
      return res.status(500).json({ error: "Greška na serveru." });
    }

    res.status(201).json({
      success: true,
      category_id: result.insertId,
    });
  });
});




module.exports = router;
