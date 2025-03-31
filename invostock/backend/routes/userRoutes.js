const express = require("express");
const router = express.Router();
const db = require("../db");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

router.get("/getUsers", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error("Greška pri izvršavanju upita:", err);
      return res.status(500).send("Greška pri izvršavanju upita");
    }
    res.json(results);
  });
});

router.post("/getUser", (req, res) => {
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
});

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

      const resetLink = `http://localhost:3000/reset-password/${token}`;

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

module.exports = router;
