const express = require("express");
const router = express.Router();
const db = require("../db");

function generateCustomCode(prefix, date, orgOrUserCode, count) {
  const formattedDate = new Date(date)
    .toLocaleDateString("hr-HR")
    .split(".")
    .reverse()
    .join(""); 
  return `${prefix}-${formattedDate}-${orgOrUserCode}-${count}`;
}

router.post("/addPayment", (req, res) => {
  const { invoiceId, amount_paid, payment_method, userId, organizationId } =
    req.body;

  if (!invoiceId || !amount_paid || !payment_method) {
    return res.status(400).json({ error: "Nedostaju obavezni podaci" });
  }

  const countQuery = `
    SELECT COUNT(*) AS payment_count
    FROM payments
    WHERE ${
      organizationId
        ? "organization_id = ?"
        : "organization_id IS NULL AND user_id = ?"
    }
  `;
  const params = organizationId ? [organizationId] : [userId];

  db.query(countQuery, params, (err1, result1) => {
    if (err1) {
      console.error("Greška pri brojanju uplata:", err1);
      return res.status(500).json({ error: "Greška na serveru" });
    }

    const count = result1[0].payment_count + 1;
    const prefix = "PAY";
    const codePrefix = organizationId ? `O${organizationId}` : "U";
    const date = new Date();
    const customPaymentCode = generateCustomCode(
      prefix,
      date,
      codePrefix,
      count
    );

    const insertQuery = `
      INSERT INTO payments (
        invoice_id, amount_paid, payment_method, payment_date,
        user_id, organization_id, custom_payment_code
      )
      VALUES (?, ?, ?, NOW(), ?, ?, ?)
    `;

    db.query(
      insertQuery,
      [
        invoiceId,
        amount_paid,
        payment_method,
        userId || null,
        organizationId || null,
        customPaymentCode,
      ],
      (err2, result2) => {
        if (err2) {
          console.error("Greška kod unosa uplate:", err2);
          return res.status(500).json({ error: "Greška na serveru" });
        }

        res.status(201).json({
          success: true,
          message: "Uplata zabilježena",
          paymentId: result2.insertId,
          custom_payment_code: customPaymentCode,
        });
      }
    );
  });
});

router.post("/getUserPayments", (req, res) => {
  const { userId, organizationId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje userId" });
  }

  const query = `
    SELECT 
      p.id,
      p.custom_payment_code,
      p.invoice_id,
      i.custom_invoice_code,
      p.amount_paid,
      p.payment_date,
      p.payment_method,
      i.status
    FROM payments p
    LEFT JOIN invoices i ON p.invoice_id = i.id
    WHERE (i.user_id = ? OR i.organization_id = ?)
    ORDER BY p.payment_date DESC
  `;

  db.query(query, [userId, organizationId], (err, results) => {
    if (err) {
      console.error("Greška kod dohvaćanja uplata:", err);
      return res.status(500).json({ error: "Greška na serveru" });
    }

    res.status(200).json({ success: true, payments: results });
  });
});

// Dohvaćanje neplaćenih faktura
router.post("/getUnpaidInvoices", (req, res) => {
  const { userId, organizationId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje userId" });
  }

  const query = `
    SELECT 
      i.id, 
      i.custom_invoice_code, 
      i.status, 
      i.remaining_amount, 
      i.final_amount, 
      i.invoice_date, 
      CONCAT(c.first_name, ' ', c.last_name) AS client_name
    FROM invoices i
    LEFT JOIN contacts c ON i.contact_id = c.id
    WHERE 
      i.status IN ('pending', 'partially_paid')
      AND (${
        organizationId
          ? "i.organization_id = ?"
          : "i.organization_id IS NULL AND i.user_id = ?"
      })
  `;

  const params = organizationId ? [organizationId] : [userId];

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Greška kod dohvaćanja faktura:", err);
      return res.status(500).json({ error: "Greška na serveru" });
    }

    res.status(200).json({ success: true, invoices: results });
  });
});

module.exports = router;
