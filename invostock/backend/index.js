const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { Resend } = require("resend");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const resend = new Resend(process.env.RESEND_API_KEY);

app.use(express.json());
app.use(cors());

const userRoutes = require("./routes/userRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const contactRoutes = require("./routes/contactRoutes");
const salesRoutes = require("./routes/salesRoutes");
const expenses = require("./routes/expensesRoutes");
const suppliers = require("./routes/suppliersRoutes");
const orders = require("./routes/ordersRoutes");
const payments = require("./routes/paymentsRoutes");
const packages = require("./routes/packageRoutes");

app.use("/api/users", userRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/expenses", expenses);
app.use("/api/suppliers", suppliers);
app.use("/api/orders", orders);
app.use("/api/payments", payments);
app.use("/api/packages", packages);

app.post("/api/sendLowStockNotification", (req, res) => {
  const { itemName, userEmail } = req.body;

  if (!userEmail || !userEmail) {
    return res
      .status(400)
      .json({ error: "Email i podatak o stavki su obavezni." });
  }

  resend.emails.send(
    {
      from: "Acme <onboarding@resend.dev>",
      to: [userEmail],
      subject: `Niska zaliha za artikal: ${itemName}`,
      html: `<p>Obavještavamo vas da zaliha artikla <strong>${itemName}</strong> pada ispod minimalne razine. Molimo da poduzmete odgovarajuće mjere.</p>`,
    },
    (err, result) => {
      if (err) {
        console.error("Greška pri slanju emaila:", err);
        return res
          .status(500)
          .json({ error: "Interna greška pri slanju emaila." });
      }

      res.status(200).json({
        message: `Email obavijest za ${itemName} poslana korisniku.`,
      });
    }
  );
});

app.post("/api/sendZeroStockNotification", (req, res) => {
  const { itemName, userEmail } = req.body;

  if (!userEmail || !userEmail) {
    return res
      .status(400)
      .json({ error: "Email i podatak o stavki su obavezni." });
  }

  resend.emails.send(
    {
      from: "Acme <onboarding@resend.dev>",
      to: [userEmail],
      subject: `Niska zaliha za artikal: ${itemName}`,
      html: `<p>Obavještavamo vas da zaliha artikla <strong>${itemName}</strong> je jednaka nuli. Molimo da poduzmete odgovarajuće mjere.</p>`,
    },
    (err, result) => {
      if (err) {
        console.error("Greška pri slanju emaila:", err);
        return res
          .status(500)
          .json({ error: "Interna greška pri slanju emaila." });
      }

      res.status(200).json({
        message: `Email obavijest za ${itemName} poslana korisniku.`,
      });
    }
  );
});

app.get("/", (req, res) => {
  res.send("Dobrodošli na server!");
});

app.use((req, res) => {
  res.status(404).send("Ruta nije pronađena");
});

const HOST = "0.0.0.0";
app.listen(PORT, HOST, () => {
  console.log(`Server pokrenut na http://${HOST}:${PORT}`);
});
