const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/getSuppliers", (req, res) => {
  const { userId, organizationId } = req.body;

  if (!userId) return res.status(400).json({ error: "Nedostaje userId" });

  let query = "";
  let params = [];

  if (organizationId) {
    query = "SELECT * FROM suppliers WHERE user_id = ? AND organization_id = ?";
    params = [userId, organizationId];
  } else {
    query =
      "SELECT * FROM suppliers WHERE user_id = ? AND organization_id IS NULL";
    params = [userId];
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Greška kod dohvata dobavljača:", err);
      return res.status(500).json({ error: "Greška na serveru" });
    }

    res.status(200).json({ success: true, suppliers: results });
  });
});

router.post("/addSupplier", (req, res) => {
  const { userId, organizationId, name, address, phone } = req.body;

  if (!userId || !name) {
    return res.status(400).json({ error: "Nedostaju obavezni podaci" });
  }

  const query = `INSERT INTO suppliers (user_id, organization_id, name, address, phone) VALUES (?, ?, ?, ?, ?)`;
  const params = [
    userId,
    organizationId || null,
    name,
    address || null,
    phone || null,
  ];

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Greška kod dodavanja dobavljača:", err);
      return res.status(500).json({ error: "Greška na serveru" });
    }

    db.query(
      "SELECT * FROM suppliers WHERE id = ?",
      [result.insertId],
      (err2, results2) => {
        if (err2) {
          console.error("Greška kod dohvaćanja novog dobavljača:", err2);
          return res.status(500).json({ error: "Greška na serveru" });
        }

        res.status(201).json({ success: true, supplier: results2[0] });
      }
    );
  });
});

router.put("/updateSupplier/:id", (req, res) => {
  const { id } = req.params;
  const { name, address, phone } = req.body;

  if (!name) return res.status(400).json({ error: "Naziv je obavezan" });

  const query = `UPDATE suppliers SET name = ?, address = ?, phone = ? WHERE id = ?`;
  const params = [name, address || null, phone || null, id];

  db.query(query, params, (err) => {
    if (err) {
      console.error("Greška kod ažuriranja dobavljača:", err);
      return res.status(500).json({ error: "Greška na serveru" });
    }

    db.query("SELECT * FROM suppliers WHERE id = ?", [id], (err2, results2) => {
      if (err2) {
        console.error("Greška kod dohvaćanja ažuriranog dobavljača:", err2);
        return res.status(500).json({ error: "Greška na serveru" });
      }

      res.status(200).json({ success: true, supplier: results2[0] });
    });
  });
});

router.delete("/deleteSupplier/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM suppliers WHERE id = ?", [id], (err) => {
    if (err) {
      console.error("Greška kod brisanja dobavljača:", err);
      return res.status(500).json({ error: "Greška na serveru" });
    }

    res.status(200).json({ success: true, message: "Dobavljač je obrisan." });
  });
});

module.exports = router;
