const express = require("express");
const router = express.Router();
const db = require("../db"); 


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

module.exports = router;
