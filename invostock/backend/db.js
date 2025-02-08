const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

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
  console.log("Povezan na bazu s ID-jem: " + db.threadId);
});

module.exports = db;
