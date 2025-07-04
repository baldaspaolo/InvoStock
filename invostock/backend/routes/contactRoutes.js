const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/getInvoiceContact", (req, res) => {
  const { contactId } = req.body;

  if (!contactId) {
    return res.status(400).json({ error: "Nedostaje id fakture!" });
  }

  const query = "SELECT * FROM contacts WHERE id = ? AND is_deleted = 0";
  db.query(query, [contactId], (err, result) => {
    if (err) {
      console.log("Greška pri dohvaćanju faktura!");
      return res.status(500).json({ error: "Greška na serveru!" });
    }
    res.status(200).json({ success: true, contact: result });
  });
});

router.post("/getUserContacts", (req, res) => {
  const { userId, organizationId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje ID korisnika!" });
  }

  const query = organizationId
    ? "SELECT * FROM contacts WHERE organization_id = ? AND is_deleted = 0"
    : "SELECT * FROM contacts WHERE user_id = ? AND is_deleted = 0";

  const params = organizationId ? [organizationId] : [userId];

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Greška pri dohvaćanju kontakata:", err);
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
    place,
    phone_number,
    email,
    company_name,
    tax_id,
    notes,
  } = req.body;

  if (!userId || !first_name || !last_name) {
    return res.status(400).json({ error: "Nedostaju obavezni podaci!" });
  }

  const duplicateCheckQuery = organizationId
    ? `SELECT * FROM contacts WHERE first_name = ? AND last_name = ? AND organization_id = ?`
    : `SELECT * FROM contacts WHERE first_name = ? AND last_name = ? AND user_id = ?`;

  const duplicateParams = organizationId
    ? [first_name, last_name, organizationId]
    : [first_name, last_name, userId];

  db.query(duplicateCheckQuery, duplicateParams, (err, existing) => {
    if (err) {
      console.error("Greška pri provjeri duplikata:", err);
      return res.status(500).json({ error: "Greška na serveru!" });
    }

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ error: "Kontakt s istim imenom i prezimenom već postoji." });
    }

    const insertQuery = `
      INSERT INTO contacts 
        (user_id, organization_id, first_name, last_name, address, zip_code, place, phone_number, email, company_name, tax_id, notes) 
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertValues = [
      userId,
      organizationId,
      first_name,
      last_name,
      address,
      zip_code,
      place,
      phone_number,
      email,
      company_name,
      tax_id,
      notes,
    ];

    db.query(insertQuery, insertValues, (err, result) => {
      if (err) {
        console.error("Greška pri dodavanju kontakta:", err);
        return res.status(500).json({ error: "Greška na serveru!" });
      }

      res.status(200).json({ success: true, contactId: result.insertId });
    });
  });
});

router.put("/updateContact/:id", (req, res) => {
  const contactId = req.params.id;
  const {
    userId,
    organizationId,
    first_name,
    last_name,
    address,
    zip_code,
    place,
    phone_number,
    email,
    company_name,
    tax_id,
    notes,
  } = req.body;

  if (!contactId || !userId || !first_name || !last_name) {
    return res.status(400).json({ error: "Nedostaju obavezni podaci!" });
  }

  const checkQuery = organizationId
    ? "SELECT * FROM contacts WHERE id = ? AND organization_id = ?"
    : "SELECT * FROM contacts WHERE id = ? AND user_id = ?";

  const checkParams = organizationId
    ? [contactId, organizationId]
    : [contactId, userId];

  db.query(checkQuery, checkParams, (err, results) => {
    if (err) {
      console.error("Greška pri provjeri vlasništva kontakta:", err);
      return res.status(500).json({ error: "Greška na serveru!" });
    }

    if (results.length === 0) {
      return res
        .status(403)
        .json({ error: "Nemate dozvolu za ažuriranje ovog kontakta." });
    }

    const updateQuery = `
      UPDATE contacts 
      SET 
        first_name = ?,
        last_name = ?,
        address = ?,
        zip_code = ?,
        place = ?,
        phone_number = ?,
        email = ?,
        company_name = ?,
        tax_id = ?,
        notes = ?
      WHERE id = ?
    `;

    const updateValues = [
      first_name,
      last_name,
      address,
      zip_code,
      place,
      phone_number,
      email,
      company_name,
      tax_id,
      notes,
      contactId,
    ];

    db.query(updateQuery, updateValues, (err, result) => {
      if (err) {
        console.error("Greška pri ažuriranju kontakta:", err);
        return res.status(500).json({ error: "Greška na serveru!" });
      }

      res
        .status(200)
        .json({ success: true, message: "Kontakt uspješno ažuriran." });
    });
  });
});

router.delete("/deleteContact/:id", (req, res) => {
  const contactId = req.params.id;
  const { userId, organizationId } = req.body;

  if (!contactId || !userId) {
    return res
      .status(400)
      .json({ error: "Nedostaje ID kontakta ili korisnika!" });
  }

  const checkQuery = organizationId
    ? "SELECT * FROM contacts WHERE id = ? AND organization_id = ? AND is_deleted = 0"
    : "SELECT * FROM contacts WHERE id = ? AND user_id = ? AND organization_id IS NULL AND is_deleted = 0";

  const checkParams = organizationId
    ? [contactId, organizationId]
    : [contactId, userId];

  db.query(checkQuery, checkParams, (err, results) => {
    if (err) {
      console.error("Greška pri provjeri vlasništva kontakta:", err);
      return res.status(500).json({ error: "Greška na serveru!" });
    }

    if (results.length === 0) {
      return res
        .status(403)
        .json({ error: "Nemate dozvolu ili kontakt ne postoji." });
    }

    const deleteQuery = "UPDATE contacts SET is_deleted = 1 WHERE id = ?";
    db.query(deleteQuery, [contactId], (err, result) => {
      if (err) {
        console.error("Greška pri mekom brisanju kontakta:", err);
        return res.status(500).json({ error: "Greška na serveru!" });
      }

      res
        .status(200)
        .json({ success: true, message: "Kontakt označen kao obrisan." });
    });
  });
});

module.exports = router;
