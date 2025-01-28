const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Pogreška pri povezivanju na bazu: ", err.stack);
    return;
  }
  console.log("Povezali ste se na bazu sa ID-jem: " + db.threadId);
});

app.get("/", (req, res) => {
  res.send("Dobrodošli na server!");
});

app.get("/get-users", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error("Greška pri izvršavanju upita:", err);
      res.status(500).send("Greška pri izvršavanju upita");
      return;
    }
    console.log("Rezultati upita:", results);
    res.json(results);
  });
});

app.use((req, res) => {
  res.status(404).send("Ruta nije pronađena");
});

app.listen(PORT, () => {
  console.log(`Server pokrenut na portu ${PORT}`);
});
