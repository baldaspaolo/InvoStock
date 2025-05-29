const express = require("express");
const router = express.Router();
const db = require("../db");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

router.post("/getUser", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email i lozinka su obavezni!" });
  }

  const query = `SELECT * FROM users WHERE email = ?`;
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error("Greška pri izvođenju upita!", err);
      return res.status(500).send("Internal Server Error!");
    }

    if (results.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Neispravan email ili lozinka." });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Neispravan email ili lozinka." });
    }

    delete user.password;

    res.json({ success: true, user, message: "Uspješan login!" });
  });
});

/*router.post("/getUser", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email i zaporka su obavezni!" });
  }

  const query = `SELECT id, name, email, role, organization_id FROM users WHERE email=? AND password=?`;

  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error("Greška pri izvođenju upita!", err);
      return res.status(500).send("Internal Server Error!");
    }

    if (results.length > 0) {
      res.json({ success: true, user: results[0], message: "Uspješan login!" });
    } else {
      res.json({
        success: false,
        message: "Pogrešno korisničko ime ili zaporka.",
      });
    }
  });
});*/

router.post("/forgot-password", (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email je obavezan." });

  const checkQuery = "SELECT * FROM users WHERE email = ?";
  db.query(checkQuery, [email], (err, results) => {
    if (err) {
      console.error("Greška kod SELECT upita", err);
      return res.status(500).json({ message: "Greška na serveru." });
    }

    if (results.length === 0) {
      return res
        .status(200)
        .json({ message: "Ako postoji račun, link je poslan." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000); // 1 sat

    const updateQuery =
      "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?";
    db.query(updateQuery, [token, expiry, email], (updateErr) => {
      if (updateErr) {
        console.error("Greška kod UPDATE upita", updateErr);
        return res
          .status(500)
          .json({ message: "Greška kod spremanja tokena." });
      }

      const resetLink = `http://localhost:5173/reset-password/${token}`;

      resend.emails
        .send({
          from: "Acme <onboarding@resend.dev>",
          to: [email],
          subject: "Resetiranje lozinke",
          html: `<p>Kliknite <a href="${resetLink}">ovdje</a> kako biste resetirali lozinku.</p> <p>Vaš token: ${token}</p> <p><i>Token je važeći 1 sat od vremena dobivanja ove email poruke.</i></p>`,
        })
        .then(() => {
          res
            .status(200)
            .json({ message: "Ako postoji račun, link je poslan." });
        })
        .catch((emailErr) => {
          console.error("Greška pri slanju e-maila", emailErr);
          res.status(500).json({ message: "Greška pri slanju e-maila." });
        });
    });
  });
});

router.post("/reset-password/:token", (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword)
    return res.status(400).json({ message: "Nova lozinka je obavezna." });

  const selectQuery =
    "SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()";
  db.query(selectQuery, [token], async (err, results) => {
    if (err) {
      console.error("Greška kod SELECT upita", err);
      return res.status(500).json({ message: "Greška na serveru." });
    }

    if (results.length === 0) {
      return res
        .status(400)
        .json({ message: "Token je nevažeći ili je istekao." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateQuery =
      "UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?";
    db.query(updateQuery, [hashedPassword, results[0].id], (updateErr) => {
      if (updateErr) {
        console.error("Greška kod UPDATE upita", updateErr);
        return res
          .status(500)
          .json({ message: "Greška kod spremanja lozinke." });
      }

      res.status(200).json({ message: "Lozinka je uspješno postavljena." });
    });
  });
});

router.post("/registerUser", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Sva polja su obavezna." });
  }

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err)
        return res
          .status(500)
          .json({ success: false, message: "Greška na serveru." });
      if (results.length > 0)
        return res
          .status(409)
          .json({ success: false, message: "Email već postoji." });

      const hashedPassword = await bcrypt.hash(password, 10);
      db.query(
        "INSERT INTO users (name, email, password, org_role) VALUES (?, ?, ?, 'member')",
        [name, email, hashedPassword],
        (err) => {
          if (err)
            return res
              .status(500)
              .json({ success: false, message: "Greška pri spremanju." });
          res
            .status(201)
            .json({ success: true, message: "Korisnik registriran." });
        }
      );
    }
  );
});

router.post("/registerOrganizationUser", (req, res) => {
  const { name, email, password, orgName, orgAddress } = req.body;

  if (!name || !email || !password || !orgName || !orgAddress) {
    return res
      .status(400)
      .json({ success: false, message: "Sva polja su obavezna." });
  }

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err)
        return res
          .status(500)
          .json({ success: false, message: "Greška na serveru." });
      if (results.length > 0)
        return res
          .status(409)
          .json({ success: false, message: "Email već postoji." });

      db.query(
        "INSERT INTO organizations (name, address) VALUES (?, ?)",
        [orgName, orgAddress],
        async (orgErr, orgResult) => {
          if (orgErr)
            return res.status(500).json({
              success: false,
              message: "Greška pri kreiranju organizacije.",
            });

          const organizationId = orgResult.insertId;
          const hashedPassword = await bcrypt.hash(password, 10);

          db.query(
            "INSERT INTO users (name, email, password, organization_id, org_role) VALUES (?, ?, ?, ?, 'admin')",
            [name, email, hashedPassword, organizationId],
            (userErr) => {
              if (userErr)
                return res.status(500).json({
                  success: false,
                  message: "Greška pri kreiranju korisnika.",
                });

              res.status(201).json({
                success: true,
                message: "Organizacija i admin korisnik registrirani.",
                organizationId,
              });
            }
          );
        }
      );
    }
  );
});

router.get("/getUserOrganization/:userId", (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT 
      o.name AS name,
      COUNT(u2.id) AS members
    FROM users u
    JOIN organizations o ON u.organization_id = o.id
    JOIN users u2 ON u2.organization_id = o.id
    WHERE u.id = ?
    GROUP BY o.id
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Greška kod dohvaćanja organizacije:", err);
      return res.status(500).json({ message: "Greška na serveru." });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Organizacija nije pronađena." });
    }

    res.status(200).json(results[0]);
  });
});

router.get("/getOrganizationUsers/:orgId", (req, res) => {
  const orgId = req.params.orgId;

  db.query(
    "SELECT id, name, email, org_role AS role FROM users WHERE organization_id = ?",
    [orgId],
    (err, results) => {
      if (err) {
        console.error("Greška kod dohvaćanja korisnika organizacije:", err);
        return res.status(500).json({ message: "Greška na serveru." });
      }

      res.status(200).json(results);
    }
  );
});

router.put("/updateUserRole/:id", (req, res) => {
  const userId = req.params.id;
  const { role, adminId } = req.body;

  if (!role || !adminId) {
    return res.status(400).json({ message: "Nedostaju podaci." });
  }

  const checkQuery = "SELECT * FROM users WHERE id = ? AND org_role = 'admin'";
  db.query(checkQuery, [adminId], (err, results) => {
    if (err) return res.status(500).json({ message: "Greška na serveru." });
    if (results.length === 0)
      return res.status(403).json({ message: "Nemate prava za ovu radnju." });

    db.query(
      "UPDATE users SET org_role = ? WHERE id = ?",
      [role, userId],
      (err) => {
        if (err)
          return res
            .status(500)
            .json({ message: "Greška kod ažuriranja uloge." });

        res.status(200).json({ message: "Uloga ažurirana." });
      }
    );
  });
});

router.delete("/deleteUser/:id", (req, res) => {
  const userId = req.params.id;
  const { adminId } = req.query;

  if (!adminId) return res.status(400).json({ message: "Nedostaje adminId." });

  const checkQuery = "SELECT * FROM users WHERE id = ? AND org_role = 'admin'";
  db.query(checkQuery, [adminId], (err, results) => {
    if (err) return res.status(500).json({ message: "Greška na serveru." });
    if (results.length === 0)
      return res.status(403).json({ message: "Nemate prava za ovu radnju." });

    db.query("DELETE FROM users WHERE id = ?", [userId], (err) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Greška kod brisanja korisnika." });

      res.status(200).json({ message: "Korisnik obrisan." });
    });
  });
});


router.delete("/deleteOrgUser/:id", (req, res) => {
  const userIdToRemove = req.params.id;
  const { adminId } = req.body;

  if (!adminId || !userIdToRemove) {
    return res.status(400).json({ error: "Nedostaje ID administratora ili korisnika." });
  }

  const adminQuery = "SELECT * FROM users WHERE id = ?";
  db.query(adminQuery, [adminId], (err1, adminResult) => {
    if (err1) {
      console.error("Greška pri provjeri administratora:", err1);
      return res.status(500).json({ error: "Greška na serveru." });
    }

    if (adminResult.length === 0) {
      return res.status(404).json({ error: "Administrator nije pronađen." });
    }

    const admin = adminResult[0];

    if (admin.org_role !== "admin") {
      return res.status(403).json({ error: "Nemate ovlasti za ovu radnju." });
    }

    const userQuery = "SELECT * FROM users WHERE id = ?";
    db.query(userQuery, [userIdToRemove], (err2, userResult) => {
      if (err2) {
        console.error("Greška pri dohvaćanju korisnika:", err2);
        return res.status(500).json({ error: "Greška na serveru." });
      }

      if (userResult.length === 0) {
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      }

      const targetUser = userResult[0];

      if (targetUser.organization_id !== admin.organization_id) {
        return res.status(403).json({ error: "Korisnik ne pripada vašoj organizaciji." });
      }

      const updateQuery = "UPDATE users SET organization_id = NULL, org_role = NULL WHERE id = ?";
      db.query(updateQuery, [userIdToRemove], (err3, result) => {
        if (err3) {
          console.error("Greška kod uklanjanja korisnika iz organizacije:", err3);
          return res.status(500).json({ error: "Greška na serveru." });
        }

        return res.status(200).json({
          success: true,
          message: "Korisnik je uspješno uklonjen iz organizacije.",
        });
      });
    });
  });
});


router.put("/updateUser/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, newPassword, currentPassword } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Ime i email su obavezni." });
  }

  if (newPassword && newPassword.trim() !== "") {
    db.query(
      "SELECT password FROM users WHERE id = ?",
      [id],
      async (err, results) => {
        if (err) return res.status(500).json({ error: "Greška na serveru." });
        if (results.length === 0)
          return res.status(404).json({ error: "Korisnik nije pronađen." });

        const isMatch = await bcrypt.compare(
          currentPassword,
          results[0].password
        );
        if (!isMatch) {
          return res
            .status(401)
            .json({ success: false, message: "Pogrešna lozinka." });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        db.query(
          "UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?",
          [name, email, hashed, id],
          (updateErr) => {
            if (updateErr)
              return res.status(500).json({ error: "Greška kod spremanja." });
            res
              .status(200)
              .json({ success: true, message: "Korisnik je ažuriran." });
          }
        );
      }
    );
  } else {
    db.query(
      "UPDATE users SET name = ?, email = ? WHERE id = ?",
      [name, email, id],
      (err) => {
        if (err) {
          console.error("Greška kod ažuriranja korisnika:", err);
          return res.status(500).json({ error: "Greška na serveru." });
        }

        res
          .status(200)
          .json({ success: true, message: "Korisnik je ažuriran." });
      }
    );
  }
});

router.put("/deactivate", (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ success: false, message: "Nedostaju podaci!" });
  }

  db.query("SELECT * FROM users WHERE id = ?", [userId], async (err, results) => {
    if (err || results.length === 0) return res.status(500).json({ success: false, message: "Korisnik nije pronađen!" });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Pogrešna lozinka." });

    db.query("UPDATE users SET is_active = 0 WHERE id = ?", [userId], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: "Greška kod deaktivacije." });

      return res.json({ success: true, message: "Račun deaktiviran." });
    });
  });
});



module.exports = router;
