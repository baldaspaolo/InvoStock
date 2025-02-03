const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

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

app.get("/getUsers", (req, res) => {
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

app.post("/getUser", (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);

  if (!email || !password) {
    return res.status(400).json({
      error: "Korisničko ime i zaporka obavezni su parametri!",
    });
  }

  const query = `SELECT id, name, email, role, organization_id FROM users WHERE email=? AND password=?`;

  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error("Greška pri izvođenju upita!", err);
      return res.status(500).send("Internal Server Error!");
    }

    if (results.length > 0) {
      const user = results[0];
      res.json({ success: true, user, message: "Uspješan login!" });
    } else {
      res.json({
        success: false,
        message: "Pogrešno korisničko ime ili zaporka.",
      });
    }
  });
});

app.post("/registerOrganization", (req, res) => {
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

    const organizationId = result.insertId;
    res.status(201).json({ success: true, organizationId });
  });
});

app.post("/registerUser", (req, res) => {
  const { name, email, password, organizationId } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Sva polja su obavezna!" });
  }

  const userQuery =
    "INSERT INTO users (name, email, password, organization_id) VALUES (?, ?, ?, ?)";

  db.query(
    userQuery,
    [name, email, password, organizationId || null],
    (err, result) => {
      if (err) {
        console.error("Greška pri dodavanju korisnika:", err);
        return res.status(500).json({ error: "Greška na serveru!" });
      }

      res.status(201).json({ success: true, userId: result.insertId });
    }
  );
});

app.use((req, res) => {
  res.status(404).send("Ruta nije pronađena");
});

app.listen(PORT, () => {
  console.log(`Server pokrenut na portu ${PORT}`);
});
