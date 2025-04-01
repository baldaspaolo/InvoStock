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
          html: `<p>Kliknite <a href="${resetLink}">ovdje</a> kako biste resetirali lozinku.</p> <p>Vaš token: ${token}</p>`,
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

module.exports = router;
