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

router.get("/getAllOrganizations", (req, res) => {
  const query = `
    SELECT 
      o.id,
      o.name,
      o.email,
      o.address,
      COUNT(u.id) AS member_count
    FROM organizations o
    LEFT JOIN users u ON u.organization_id = o.id
    GROUP BY o.id
    ORDER BY o.name ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Greška pri dohvaćanju organizacija:", err);
      return res
        .status(500)
        .json({ success: false, error: "Greška na serveru!" });
    }

    res.json({ success: true, organizations: results });
  });
});


module.exports = router;
