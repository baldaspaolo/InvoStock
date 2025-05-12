const express = require("express");
const router = express.Router();
const db = require("../db");

function generateNotificationCode(orgOrUserCode, count) {
  return `NOTIF-${orgOrUserCode}-${String(count).padStart(3, "0")}`;
}


router.post("/addNotification", async (req, res) => {
  const { userId, organizationId, sender, title, message, type } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: "Nedostaju podaci notifikacije!" });
  }

  const codePrefix = organizationId ? `O${organizationId}` : `U${userId}`;
  const idParam = organizationId || userId;

  const countQuery = `
    SELECT COUNT(*) AS notif_count
    FROM notifications
    WHERE ${organizationId ? "organization_id = ?" : "user_id = ?"}
  `;

  db.query(countQuery, [idParam], (err1, result1) => {
    if (err1) {
      console.error("Greška kod broja obavijesti:", err1);
      return res.status(500).json({ error: "Greška na serveru!" });
    }

    const count = result1[0].notif_count + 1;
    const customCode = generateNotificationCode(codePrefix, count);

    const insertQuery = `
      INSERT INTO notifications (title, message, type, user_id, organization_id, sender, custom_notification_code)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      title,
      message,
      type || "info",
      userId || null,
      organizationId || null,
      sender || "system",
      customCode,
    ];

    db.query(insertQuery, params, (err2, result2) => {
      if (err2) {
        console.error("Greška kod dodavanja obavijesti:", err2);
        return res.status(500).json({ error: "Greška na serveru!" });
      }

      res.status(201).json({
        success: true,
        message: "Obavijest uspješno dodana!",
        notificationId: result2.insertId,
        custom_notification_code: customCode,
      });
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

router.post("/getSingleNotification", (req, res) => {
  const { notificationId } = req.body;

  if (!notificationId) {
    return res.status(400).json({ error: "Nedostaje notificationId" });
  }

  const query = `
    SELECT * FROM notifications 
    WHERE id = ?
    LIMIT 1
  `;

  db.query(query, [notificationId], (err, result) => {
    if (err) {
      console.error("Greška pri izvođenju upita:", err);
      return res.status(500).send("Greška na serveru!");
    }

    if (result.length > 0) {
      res.json({
        success: true,
        notification: result[0],
        message: "Obavijest uspješno dohvaćena.",
      });
    } else {
      res.json({
        success: false,
        message: "Obavijest nije pronađena.",
      });
    }
  });
});

router.post("/markSingleNotificationAsRead", (req, res) => {
  const { notificationId } = req.body;

  if (!notificationId) {
    return res
      .status(400)
      .json({ success: false, message: "Nedostaje notificationId." });
  }

  const query = "UPDATE notifications SET `read` = 1 WHERE id = ?";

  db.query(query, [notificationId], (err, result) => {
    if (err) {
      console.error("Greška kod označavanja obavijesti kao pročitane:", err);
      return res
        .status(500)
        .json({ success: false, message: "Greška na serveru." });
    }

    res.json({
      success: true,
      message: "Obavijest je označena kao pročitana.",
    });
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
