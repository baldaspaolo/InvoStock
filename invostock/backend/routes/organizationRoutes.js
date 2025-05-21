const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/registerOrganization", (req, res) => {
  const { name, address } = req.body;

  if (!name || !address) {
    return res.status(400).json({ error: "Sva polja su obavezna!" });
  }

  const orgQuery = "INSERT INTO organizations (name, address) VALUES (?, ?)";

  db.query(orgQuery, [name, address], (err, result) => {
    if (err) {
      console.error("Greška pri dodavanju organizacije:", err);
      return res.status(500).json({ error: "Greška na serveru!" });
    }

    res.status(201).json({ success: true, organizationId: result.insertId });
  });
});

module.exports = router;
