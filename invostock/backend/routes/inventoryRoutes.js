const express = require("express");
const router = express.Router();
const db = require("../db");

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

router.post("/addInventoryItem", async (req, res) => {
  try {
    const { userId, organizationId, itemData } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Nedostaje userId" });
    }

    if (!itemData || !itemData.item_name || !itemData.category) {
      return res
        .status(400)
        .json({ error: "Nedostaju obavezni podaci o artiklu" });
    }

    const [existingItem] = await db.query(
      "SELECT * FROM inventory_items WHERE item_name = ? AND organization_id = ?",
      [itemData.item_name, organizationId || null]
    );

    if (existingItem.length > 0) {
      return res
        .status(400)
        .json({ error: "Artikal sa ovim nazivom već postoji" });
    }

    const [result] = await db.query(
      `INSERT INTO inventory_items (
                organization_id, 
                user_id,
                item_name, 
                category, 
                description, 
                stock_quantity, 
                reorder_level, 
                price
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        organizationId || null,
        userId,
        itemData.item_name,
        itemData.category,
        itemData.description || null,
        itemData.stock_quantity || 0,
        itemData.reorder_level || 1, 
        itemData.price || 0,
      ]
    );

    const [addedItem] = await db.query(
      "SELECT * FROM inventory_items WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({
      message: "Artikal uspješno dodan",
      item: addedItem[0],
    });
  } catch (error) {
    console.error("Greška pri dodavanju artikla:", error);
    res.status(500).json({ error: "Interna server greška" });
  }
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
      count: results.length
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
      count: results.length
    });
  });
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
