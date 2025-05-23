const express = require("express");
const router = express.Router();
const db = require("../db");

function generateNotificationCode(orgOrUserCode, count) {
  return `NOTIF-${orgOrUserCode}-${String(count).padStart(3, "0")}`;
}


router.post("/addNotification", async (req, res) => {
  const {
    senderUserId, 
    title,
    message,
    type, 
    organizationId, 
    isGlobal = false,
  } = req.body;

  if (!title || !message || !senderUserId) {
    return res.status(400).json({ error: "Nedostaju ključni podaci!" });
  }

  const senderQuery = "SELECT * FROM users WHERE id = ?";
  db.query(senderQuery, [senderUserId], (err1, senderResult) => {
    if (err1 || senderResult.length === 0) {
      return res.status(400).json({ error: "Korisnik ne postoji." });
    }

    const senderUser = senderResult[0];
    const isSystem = senderUser.role === "systemadmin";
    const isOrgAdmin = senderUser.org_role === "admin";
    const userOrgId = senderUser.organization_id;

    let finalOrgId = null;
    let finalUserId = null;
    let senderType = isSystem ? "system" : "admin";

    if (isGlobal && isSystem) {
      finalOrgId = null;
      finalUserId = null;
    } else if (organizationId && isSystem) {
      finalOrgId = organizationId;
      finalUserId = null;
    } else if (!isSystem && isOrgAdmin) {
      finalOrgId = userOrgId;
      finalUserId = null;
    } else {
      return res.status(403).json({ error: "Nemate pravo za ovu akciju." });
    }
    const codePrefix = finalOrgId
      ? `O${finalOrgId}`
      : isGlobal
      ? "ALL"
      : `U${senderUserId}`;
    const countQuery = `
      SELECT COUNT(*) AS notif_count
      FROM notifications
      WHERE ${
        finalOrgId
          ? "organization_id = ?"
          : "user_id IS NULL AND organization_id IS NULL"
      }
    `;

    db.query(countQuery, [finalOrgId].filter(Boolean), (err2, result2) => {
      if (err2) {
        console.error("Greška kod broja obavijesti:", err2);
        return res.status(500).json({ error: "Greška na serveru!" });
      }

      const count = result2[0].notif_count + 1;
      const customCode = generateNotificationCode(codePrefix, count);

      const insertQuery = `
        INSERT INTO notifications (title, message, type, user_id, organization_id, sender, custom_notification_code)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        title,
        message,
        type || "info",
        finalUserId,
        finalOrgId,
        senderType,
        customCode,
      ];

      db.query(insertQuery, params, (err3, result3) => {
        if (err3) {
          console.error("Greška kod dodavanja obavijesti:", err3);
          return res.status(500).json({ error: "Greška na serveru!" });
        }

        res.status(201).json({
          success: true,
          message: "Obavijest uspješno poslana!",
          notificationId: result3.insertId,
          custom_notification_code: customCode,
        });
      });
    });
  });
});

router.get("/admin/getAllNotifications", (req, res) => {
  const query = `
    SELECT n.*, u.name AS user_name
    FROM notifications n
    LEFT JOIN users u ON n.user_id = u.id
    ORDER BY n.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Greška pri dohvaćanju notifikacija:", err);
      return res.status(500).json({ error: "Greška na serveru!" });
    }

    res.status(200).json({
      success: true,
      notifications: results,
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
