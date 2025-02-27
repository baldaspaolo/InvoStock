const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const userRoutes = require("./routes/userRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const contactRoutes = require("./routes/contactRoutes");

app.use("/api/users", userRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/contacts", contactRoutes);

app.get("/", (req, res) => {
  res.send("Dobrodošli na server!");
});

app.use((req, res) => {
  res.status(404).send("Ruta nije pronađena");
});

app.listen(PORT, () => {
  console.log(`Server pokrenut na portu ${PORT}`);
});
