const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/getInvoiceContact", (req, res) => {
  const { contactId } = req.body;

  if (!contactId) {
    return res.status(400).json({ error: "Nedostaje id fakture!" });
  }

  const query = "SELECT * FROM contacts WHERE id = ?";
  db.query(query, [contactId], (err, result) => {
    if (err) {
      console.log("Greška pri dohvaćanju faktura!");
      return res.status(500).json({ error: "Greška na serveru!" });
    }
    res.status(200).json({ success: true, contact: result });
  });
});

router.post("/getUserContacts", (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje id korisnika!" });
  }

  const query = "SELECT * FROM contacts WHERE user_id = ?";
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.log("Greška pri dohvaćanju faktura!");
      return res.status(500).json({ error: "Greška na serveru!" });
    }
    res.status(200).json({ success: true, contacts: result });
  });
});

module.exports = router;
