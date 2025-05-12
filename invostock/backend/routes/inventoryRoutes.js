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
    query = "SELECT * FROM inventory_items WHERE organization_id = ?";
    queryParams = [organizationId];
  } else {
    query = "SELECT * FROM inventory_items WHERE user_id = ?";
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

  if (!userId || !itemData || !itemData.item_name || !itemData.category) {
    return res.status(400).json({ error: "Nedostaju podaci" });
  }

  const checkQuery =
    "SELECT * FROM inventory_items WHERE item_name = ? AND organization_id = ?";
  db.query(
    checkQuery,
    [itemData.item_name, organizationId || null],
    (err, existingItem) => {
      if (err) {
        console.error("Greška kod provjere:", err);
        return res.status(500).json({ error: "Greška na serveru." });
      }

      if (existingItem.length > 0) {
        return res
          .status(400)
          .json({ error: "Artikal s tim nazivom već postoji" });
      }

      const codePrefix = organizationId ? `O${organizationId}` : `U${userId}`;
      const countQuery = `SELECT COUNT(*) AS count FROM inventory_items WHERE ${
        organizationId ? "organization_id = ?" : "user_id = ?"
      }`;

      db.query(countQuery, [organizationId || userId], (err2, countResult) => {
        if (err2) {
          console.error("Greška kod brojanja:", err2);
          return res.status(500).json({ error: "Greška na serveru." });
        }

        const count = countResult[0].count + 1;
        const customInventoryCode = generateInventoryCode(codePrefix, count);

        const insertQuery = `
        INSERT INTO inventory_items (
          organization_id, user_id, item_name, category, description,
          stock_quantity, reorder_level, price, custom_inventory_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

        const values = [
          organizationId || null,
          userId,
          itemData.item_name,
          itemData.category,
          itemData.description || null,
          itemData.stock_quantity || 0,
          itemData.reorder_level || 1,
          itemData.price || 0,
          customInventoryCode,
        ];

        db.query(insertQuery, values, (err3, result) => {
          if (err3) {
            console.error("Greška kod unosa:", err3);
            return res.status(500).json({ error: "Greška kod dodavanja" });
          }

          db.query(
            "SELECT * FROM inventory_items WHERE id = ?",
            [result.insertId],
            (err4, addedItem) => {
              if (err4) {
                console.error("Greška kod dohvata unesenog artikla:", err4);
                return res.status(500).json({ error: "Greška na serveru." });
              }

              res.status(201).json({
                message: "Artikal dodan",
                item: addedItem[0],
                custom_inventory_code: customInventoryCode,
              });
            }
          );
        });
      });
    }
  );
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

router.post("/checkOrAddItem", async (req, res) => {
  try {
    const { userId, organizationId, item_name, category, price } = req.body;

    if (!userId || !item_name || !category) {
      return res.status(400).json({
        error: "Nedostaju obavezni podaci (userId, item_name, category)",
      });
    }

    const [existing] = await db.query(
      `SELECT * FROM inventory_items WHERE item_name = ? AND 
        ${
          organizationId
            ? "organization_id = ?"
            : "user_id = ? AND organization_id IS NULL"
        } LIMIT 1`,
      organizationId ? [item_name, organizationId] : [item_name, userId]
    );

    if (existing.length > 0) {
      return res
        .status(200)
        .json({ item: existing[0], message: "Artikal već postoji" });
    }

    const [result] = await db.query(
      `INSERT INTO inventory_items (
        item_name, category, description, stock_quantity, reorder_level, price, user_id, organization_id
      ) VALUES (?, ?, '', 0, 1, ?, ?, ?)`,
      [item_name, category, price || 0, userId, organizationId || null]
    );

    const [newItem] = await db.query(
      "SELECT * FROM inventory_items WHERE id = ?",
      [result.insertId]
    );

    res
      .status(201)
      .json({ item: newItem[0], message: "Artikal dodan jer nije postojao" });
  } catch (err) {
    console.error("Greška kod provjere ili dodavanja artikla:", err);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

router.post("/increaseStock", async (req, res) => {
  try {
    const { itemId, quantity } = req.body;

    if (!itemId || typeof quantity !== "number") {
      return res
        .status(400)
        .json({ error: "Nedostaje itemId ili neispravna količina" });
    }

    const [existing] = await db.query(
      "SELECT stock_quantity FROM inventory_items WHERE id = ?",
      [itemId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Artikal nije pronađen" });
    }

    const newQuantity = existing[0].stock_quantity + quantity;

    await db.query(
      "UPDATE inventory_items SET stock_quantity = ? WHERE id = ?",
      [newQuantity, itemId]
    );

    res.status(200).json({
      success: true,
      message: "Zaliha uspješno ažurirana",
      newQuantity,
    });
  } catch (err) {
    console.error("Greška pri povećanju zalihe:", err);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

router.post("/getCategories", (req, res) => {
  const { userId, organizationId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje userId" });
  }

  let query, params;
  if (organizationId) {
    query = `SELECT DISTINCT category FROM inventory_items WHERE organization_id = ?`;
    params = [organizationId];
  } else {
    query = `SELECT DISTINCT category FROM inventory_items WHERE user_id = ? AND organization_id IS NULL`;
    params = [userId];
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Greška pri dohvatu kategorija:", err);
      return res.status(500).json({ error: "Greška na serveru" });
    }

    const categories = results.map((r) => ({
      label: r.category,
      value: r.category,
    }));

    categories.unshift({ label: "Sve kategorije", value: null });

    res.status(200).json({ success: true, categories });
  });
});

module.exports = router;
