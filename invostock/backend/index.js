const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Ispravni importi s obzirom na novu strukturu direktorija
const userRoutes = require("./routes/userRoutes");
const organizationRoutes = require("./routes/organizationRoutes");

// Korištenje ruta
app.use("/api/users", userRoutes);
app.use("/api/organizations", organizationRoutes);

// Početna ruta
app.get("/", (req, res) => {
  res.send("Dobrodošli na server!");
});

// 404 handler
app.use((req, res) => {
  res.status(404).send("Ruta nije pronađena");
});

// Pokretanje servera
app.listen(PORT, () => {
  console.log(`Server pokrenut na portu ${PORT}`);
});
