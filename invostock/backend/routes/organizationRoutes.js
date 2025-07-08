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

router.post("/sendOrganizationInvite", (req, res) => {
  const { email, organizationId, invitedBy } = req.body;

  console.log(
    "Poziv za:",
    email,
    "u org:",
    organizationId,
    "od:",
    invitedBy
  );

  if (!email || !organizationId || !invitedBy) {
    console.log("Nedostaju podaci");
    return res.status(400).json({ error: "Nedostaju podaci." });
  }

  const checkQuery = "SELECT * FROM users WHERE email = ?";
  db.query(checkQuery, [email], (err, results) => {
    if (err) {
      console.error("Greška pri provjeri korisnika:", err);
      return res.status(500).json({ error: "Greška pri provjeri korisnika." });
    }

    if (results.length === 0) {
      console.log("Korisnik ne postoji:", email);
      return res
        .status(404)
        .json({ error: "Korisnik s tim emailom ne postoji." });
    }

    const user = results[0];

    if (user.organization_id) {
      console.log("Već u organizaciji:", email);
      return res
        .status(400)
        .json({ error: "Korisnik već pripada organizaciji." });
    }

    const insertInvite = `
      INSERT INTO organization_invites (email, user_id, organization_id, invited_by)
      VALUES (?, ?, ?, ?)
    `;

    db.query(
      insertInvite,
      [email, user.id, organizationId, invitedBy],
      (err2, result) => {
        if (err2) {
          console.error("Greška pri dodavanju poziva:", err2);
          return res
            .status(500)
            .json({ error: "Greška pri kreiranju poziva." });
        }

        const inviteId = result.insertId;
        const insertNotification = `
  INSERT INTO notifications (user_id, organization_id, title, message, type, ref_id)
  VALUES (?, ?, ?, ?, 'org_invite', ?)
`;

        const title = "Poziv u organizaciju";
        const message = "Pozvani ste da se pridružite organizaciji.";

        db.query(
          insertNotification,
          [user.id, organizationId, title, message, inviteId],
          (err3) => {
            if (err3) {
              console.error("Greška pri kreiranju notifikacije:", err3);
              return res.status(500).json({
                error: "Poziv je kreiran, ali notifikacija nije poslana.",
              });
            }

            console.log("Pozivnica i notifikacija uspješno poslane.");
            res.json({ success: true, message: "Poziv uspješno poslan." });
          }
        );
      }
    );
  });
});


router.post("/acceptOrganizationInvite", (req, res) => {
  const { inviteId, userId } = req.body;

  const getInvite = `
    SELECT * FROM organization_invites 
    WHERE id = ? AND user_id = ? AND status = 'pending'
  `;

  db.query(getInvite, [inviteId, userId], (err, results) => {
    if (err || results.length === 0) {
      return res
        .status(400)
        .json({ error: "Poziv nije pronađen ili je već iskorišten." });
    }

    const invite = results[0];

    const updateUser = `
      UPDATE users 
      SET organization_id = ?, org_role = 'member' 
      WHERE id = ?
    `;
    const updateInvite = `
      UPDATE organization_invites 
      SET status = 'accepted' 
      WHERE id = ?
    `;

    db.query(updateUser, [invite.organization_id, userId], (err2) => {
      if (err2)
        return res
          .status(500)
          .json({ error: "Greška pri ažuriranju korisnika." });

      db.query(updateInvite, [inviteId], (err3) => {
        if (err3)
          return res
            .status(500)
            .json({ error: "Greška pri ažuriranju statusa poziva." });

        res.json({ success: true, message: "Uspješno ste prihvatili poziv." });
      });
    });
  });
});


router.post("/declineOrganizationInvite", (req, res) => {
  const { inviteId, userId } = req.body;

  const query = `
    UPDATE organization_invites 
    SET status = 'declined'
    WHERE id = ? AND user_id = ? AND status = 'pending'
  `;

  db.query(query, [inviteId, userId], (err, result) => {
    if (err || result.affectedRows === 0) {
      return res
        .status(400)
        .json({ error: "Poziv nije pronađen ili nije u statusu 'pending'." });
    }

    res.json({ success: true, message: "Poziv odbijen." });
  });
});

router.put("/updateOrganization", (req, res) => {
  const { userId, organizationId, name, email, address } = req.body;

  if (!userId || !organizationId || !name || !email || !address) {
    return res.status(400).json({ success: false, message: "Nedostaju podaci." });
  }

  const checkQuery = `
    SELECT * FROM users 
    WHERE id = ? AND organization_id = ? AND org_role = 'admin'
  `;

  db.query(checkQuery, [userId, organizationId], (err, result) => {
    if (err) {
      console.error("Greška kod provjere korisnika:", err);
      return res.status(500).json({ success: false, message: "Greška na serveru." });
    }

    if (result.length === 0) {
      return res.status(403).json({ success: false, message: "Nemate ovlasti za uređivanje ove organizacije." });
    }

    const updateQuery = `
      UPDATE organizations
      SET name = ?, email = ?, address = ?
      WHERE id = ?
    `;

    db.query(updateQuery, [name, email, address, organizationId], (err, updateResult) => {
      if (err) {
        console.error("Greška kod ažuriranja organizacije:", err);
        return res.status(500).json({ success: false, message: "Greška kod ažuriranja." });
      }

      return res.status(200).json({ success: true, message: "Podaci o organizaciji su ažurirani." });
    });
  });
});





module.exports = router;
