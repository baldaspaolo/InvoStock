const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/getUserInvoices", (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje UserID!" });
  }

  const query = "SELECT * FROM invoices WHERE user_id = ?";
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.log("Greška pri dohvaćanju faktura!");
      return res.status(500).json({ error: "Greška na serveru!" });
    }
    res.status(200).json({ success: true, invoices: result });
  });
});

router.post("/getUserInvoicesSummary", (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje UserID!" });
  }

  //ukupna potraživanja
  const totalReceivablesQuery = `
    SELECT SUM(remaining_amount) AS total_receivables
    FROM invoices
    WHERE user_id = ? AND (status = 'pending' OR status = 'partially_paid')
  `;

  //broj neplaćenih faktura
  const unpaidInvoicesQuery = `
    SELECT COUNT(*) AS unpaid_count
    FROM invoices
    WHERE user_id = ? AND status = 'pending'
  `;

  //broj djelomično plaćenih faktura
  const partiallyPaidInvoicesQuery = `
    SELECT COUNT(*) AS partially_paid_count
    FROM invoices
    WHERE user_id = ? AND status = 'partially_paid'
  `;

  db.query(totalReceivablesQuery, [userId], (err, totalReceivablesResult) => {
    if (err) {
      console.log("Greška pri dohvaćanju ukupnih potraživanja!", err);
      return res.status(500).json({ error: "Greška na serveru!" });
    }

    db.query(unpaidInvoicesQuery, [userId], (err, unpaidInvoicesResult) => {
      if (err) {
        console.log("Greška pri dohvaćanju broja neplaćenih faktura!", err);
        return res.status(500).json({ error: "Greška na serveru!" });
      }

      db.query(
        partiallyPaidInvoicesQuery,
        [userId],
        (err, partiallyPaidInvoicesResult) => {
          if (err) {
            console.log(
              "Greška pri dohvaćanju broja djelomično plaćenih faktura!",
              err
            );
            return res.status(500).json({ error: "Greška na serveru!" });
          }

          res.status(200).json({
            success: true,
            total_receivables: totalReceivablesResult[0].total_receivables || 0,
            unpaid_invoices: unpaidInvoicesResult[0].unpaid_count || 0,
            partially_paid_invoices:
              partiallyPaidInvoicesResult[0].partially_paid_count || 0,
          });
        }
      );
    });
  });
});

router.post("/getInvoiceItems", (req, res) => {
  const { invoiceId } = req.body;

  if (!invoiceId) {
    return res.status(400).json({ error: "Nedostaje ID fakture!" });
  }

  const query = `
    SELECT * 
    FROM invoice_items 
    WHERE invoice_id = ?
  `;

  db.query(query, [invoiceId], (err, results) => {
    if (err) {
      console.error("Greška pri dohvaćanju stavki fakture!", err);
      return res.status(500).json({ error: "Greška na serveru!" });
    }

    res.status(200).json({
      success: true,
      items: results,
    });
  });
});

router.post("/getUserInovice", (req, res) => {
  const { invoiceId } = req.body;

  if (!invoiceId) {
    return res.status(400).json({ error: "Nedostaje ID fakture!" });
  }

  const query = `
    SELECT * 
    FROM invoices
    WHERE id = ?
  `;

  db.query(query, [invoiceId], (err, results) => {
    if (err) {
      console.error("Greška pri dohvaćanju stavki fakture!", err);
      return res.status(500).json({ error: "Greška na serveru!" });
    }

    res.status(200).json({
      success: true,
      invoice: results,
    });
  });
});

module.exports = router;
