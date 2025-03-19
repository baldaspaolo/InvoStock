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

router.post("/addUser", (req, res) => {
  const {
    userId,
    organizationId,
    first_name,
    last_name,
    address,
    zip_code,
    phone_number,
    email,
    company_name,
    tax_id,
    notes,
  } = req.body;

  
  if (!userId || !first_name || !last_name) {
    return res.status(400).json({ error: "Nedostaju obavezni podaci!" });
  }

  const query = `
    INSERT INTO contacts 
      (user_id, organization_id, first_name, last_name, address, zip_code, phone_number, email, company_name, tax_id, notes) 
    VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    userId,
    organizationId,
    first_name,
    last_name,
    address,
    zip_code,
    phone_number,
    email,
    company_name,
    tax_id,
    notes,
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Greška pri dodavanju kontakta:", err);
      return res.status(500).json({ error: "Greška na serveru!" });
    }
    res.status(200).json({ success: true, contactId: result.insertId });
  });
});

router.delete("/deleteContact/:id", (req, res) => {
  const contactId = req.params.id;

  if (!contactId) {
    return res.status(400).json({ error: "Nedostaje ID kontakta!" });
  }

  const query = "DELETE FROM contacts WHERE id = ?";
  db.query(query, [contactId], (err, result) => {
    if (err) {
      console.error("Greška pri brisanju kontakta:", err);
      return res.status(500).json({ error: "Greška na serveru!" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Kontakt nije pronađen!" });
    }

    res
      .status(200)
      .json({ success: true, message: "Kontakt uspješno obrisan." });
  });
});

module.exports = router;
