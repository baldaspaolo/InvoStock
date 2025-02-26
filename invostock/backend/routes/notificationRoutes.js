const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/addNotification", (req, res) => {
  const { userId, organizationId, sender, title, message, type } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: "Nedostaju podaci notifikacije!" });
  }

  const query = `
    INSERT INTO notifications (title, message, type, user_id, organization_id, sender)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const queryParams = [
    title,
    message,
    type || "info",
    userId || null,
    organizationId || null,
    sender || "system",
  ];

  db.query(query, queryParams, (err, result) => {
    if (err) {
      console.error("Greška prilikom izvođenja zahtjeva:", err);
      return res.status(500).json({ error: "Greška na serveru!" });
    }

    res.status(201).json({
      success: true,
      message: "Obavijest uspješno dodana!",
      notificationId: result.insertId,
    });
  });
});

router.post("/getNotifications", (req, res) => {
  const { userId, organizationId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje userId" });
  }

  const query = `
    SELECT * FROM notifications 
    WHERE (user_id = ? OR organization_id = ?)
    ORDER BY created_at DESC
  `;

  db.query(query, [userId || null, organizationId || null], (err, result) => {
    if (err) {
      console.error("Greška pri izvođenju upita:", err);
      return res.status(500).send("Greška na serveru!");
    }

    if (result.length > 0) {
      res.json({
        success: true,
        notifications: result,
        message: "Obavijesti uspješno dohvaćene.",
      });
    } else {
      res.json({
        success: false,
        message: "Nema dostupnih obavijesti.",
      });
    }
  });
});

router.post("/markAllNotificationsAsRead", (req, res) => {
  const { userId, organizationId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje userId" });
  }

  const query = `
    UPDATE notifications
    SET \`read\` = 1
    WHERE (user_id = ? OR organization_id = ?) AND \`read\` = 0
  `;

  db.query(query, [userId, organizationId], (err, result) => {
    if (err) {
      console.error("Greška pri označavanju obavijesti:", err);
      return res.status(500).json({ error: "Greška na serveru!" });
    }

    if (result.affectedRows > 0) {
      res.status(200).json({
        success: true,
        message: `${result.affectedRows} obavijesti označeno kao pročitane.`,
      });
    } else {
      res.status(200).json({
        success: false,
        message: "Nema nepročitanih obavijesti.",
      });
    }
  });
});

module.exports = router;
