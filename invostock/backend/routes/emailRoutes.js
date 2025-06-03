const express = require("express");
const router = express.Router();
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

router.post("/sendWelcomeEmail", async (req, res) => {
  const { userEmail, userName } = req.body;

  if (!userEmail || !userName) {
    return res.status(400).json({ error: "Nedostaju podaci." });
  }

  try {
    const result = await resend.emails.send({
      from: "InvoStock <noreply@seimasters.com>",
      to: [userEmail],
      subject: "Dobrodošli u InvoStock!",
      html: `
    <h2>Pozdrav ${userName},</h2>
    <p>Vaša registracija je uspješna! 🎉</p>
    <p>Možete se prijaviti i započeti s radom.</p>
    <p>Hvala što koristite InvoStock!</p>
  `,
    });

    res.status(200).json({
      success: true,
      message: `Welcome email poslan korisniku ${userEmail}`,
    });
  } catch (err) {
    console.error("Greška pri slanju welcome emaila:", err);
    res.status(500).json({ error: "Greška pri slanju welcome emaila." });
  }
});

router.post("/sendInvoiceEmail", async (req, res) => {
  const {
    clientEmail,
    clientName,
    invoiceNumber,
    totalAmount,
    dueDate,
    items,
  } = req.body;

  if (
    !clientEmail ||
    !clientName ||
    !invoiceNumber ||
    !totalAmount ||
    !dueDate ||
    !items ||
    !Array.isArray(items)
  ) {
    return res
      .status(400)
      .json({ error: "Nedostaju podaci za slanje fakture." });
  }

  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${
        item.quantity
      }</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">€${Number(
        item.unitPrice
      ).toFixed(2)}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">€${(
        item.quantity * Number(item.unitPrice)
      ).toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  try {
    const result = await resend.emails.send({
      from: "InvoStock <noreply@seimasters.com>",
      to: [clientEmail],
      subject: `Faktura ${invoiceNumber} od InvoStock`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>Pozdrav ${clientName},</h2>
          <p>Primili ste novu fakturu:</p>
          <p><strong>Broj fakture:</strong> ${invoiceNumber}</p>
          <p><strong>Rok za plaćanje:</strong> ${new Date(
            dueDate
          ).toLocaleDateString("hr-HR")}</p>
          <table style="border-collapse: collapse; width: 100%; margin-top: 20px;">
            <thead>
              <tr>
                <th style="border: 1px solid #ddd; padding: 8px;">Artikl</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Količina</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Jed. cijena</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Ukupno</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <p style="margin-top: 20px; font-size: 16px;">
            <strong>Ukupno za uplatu:</strong> €${totalAmount.toFixed(2)}
          </p>
          <p>Molimo Vas da izvršite uplatu do naznačenog roka.</p>
          <p>Hvala na suradnji!</p>
          <hr />
          <p style="font-size: 12px; color: #888;">
            Ovaj email je automatski generiran iz InvoStock sustava. Za dodatna pitanja kontaktirajte nas na <a href="mailto:support@seimasters.com">support@seimasters.com</a>.
          </p>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: `Invoice email poslan klijentu ${clientEmail}`,
    });
  } catch (err) {
    console.error("Greška pri slanju invoice emaila:", err);
    res.status(500).json({ error: "Greška pri slanju invoice emaila." });
  }
});

module.exports = router;
