const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/getUserInvoices", (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje UserID!" });
  }

  const query = "SELECT * FROM invoices WHERE user_id = ?";
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.log("Greška pri dohvaćanju faktura!");
      return res.status(500).json({ error: "Greška na serveru!" });
    }
    res.status(200).json({ success: true, invoices: result });
  });
});


module.exports = router;
