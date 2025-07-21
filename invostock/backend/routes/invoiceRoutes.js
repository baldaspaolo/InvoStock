const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/getUserInvoices", (req, res) => {
  const { userId, organizationId } = req.body;
  console.log("REQ BODY:", req.body);

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje userId!" });
  }

  let query;
  let params;

  const hasValidOrgId =
    organizationId !== null &&
    organizationId !== undefined &&
    organizationId !== "null" &&
    !isNaN(organizationId);

  if (hasValidOrgId) {
    query = `
      SELECT 
        invoices.*, 
        contacts.first_name AS contact_first_name, 
        contacts.last_name AS contact_last_name,
        users.name AS issuer_name
      FROM invoices
      LEFT JOIN contacts ON invoices.contact_id = contacts.id
      LEFT JOIN users ON invoices.user_id = users.id
      WHERE invoices.organization_id = ?
      ORDER BY invoices.invoice_date DESC
    `;
    params = [organizationId];
  } else {
    query = `
      SELECT 
        invoices.*, 
        contacts.first_name AS contact_first_name, 
        contacts.last_name AS contact_last_name,
        users.name AS issuer_name
      FROM invoices
      LEFT JOIN contacts ON invoices.contact_id = contacts.id
      LEFT JOIN users ON invoices.user_id = users.id
      WHERE invoices.user_id = ? AND invoices.organization_id IS NULL
      ORDER BY invoices.invoice_date DESC
    `;
    params = [userId];
  }

  db.query(query, params, (err, result) => {
    if (err) {
      console.log("Greška pri dohvaćanju faktura:", err);
      return res.status(500).json({ error: "Greška na serveru!" });
    }

    res.status(200).json({ success: true, invoices: result });
  });
});

router.post("/getUserInvoicesSummary", (req, res) => {
  const { userId, organizationId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje UserID!" });
  }

  const isOrg =
    organizationId !== null &&
    organizationId !== undefined &&
    organizationId !== "null" &&
    !isNaN(organizationId);

  const whereCondition = isOrg
    ? "organization_id = ?"
    : "organization_id IS NULL AND user_id = ?";
  const params = isOrg ? [organizationId] : [userId];

  const totalReceivablesQuery = `
    SELECT SUM(remaining_amount) AS total_receivables
    FROM invoices
    WHERE ${whereCondition} AND (status = 'pending' OR status = 'partially_paid')
  `;

  const unpaidInvoicesQuery = `
    SELECT COUNT(*) AS unpaid_count
    FROM invoices
    WHERE ${whereCondition} AND status = 'pending'
  `;

  const partiallyPaidInvoicesQuery = `
    SELECT COUNT(*) AS partially_paid_count
    FROM invoices
    WHERE ${whereCondition} AND status = 'partially_paid'
  `;

  db.query(totalReceivablesQuery, params, (err, totalReceivablesResult) => {
    if (err) {
      console.log("Greška pri dohvaćanju ukupnih potraživanja!", err);
      return res.status(500).json({ error: "Greška na serveru!" });
    }

    db.query(unpaidInvoicesQuery, params, (err, unpaidInvoicesResult) => {
      if (err) {
        console.log("Greška pri dohvaćanju broja neplaćenih faktura!", err);
        return res.status(500).json({ error: "Greška na serveru!" });
      }

      db.query(
        partiallyPaidInvoicesQuery,
        params,
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

router.post("/getUserInvoice", (req, res) => {
  const { invoiceId } = req.body;

  if (!invoiceId) {
    return res.status(400).json({ error: "Nedostaje ID fakture!" });
  }

  const query = `
  SELECT 
    invoices.*, 
    users.name AS issuer_name
  FROM invoices
  LEFT JOIN users ON invoices.user_id = users.id
  WHERE invoices.id = ?
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

function generateInvoiceCode(date, orgOrUserCode, count) {
  const formattedDate = new Date(date)
    .toLocaleDateString("hr-HR")
    .split(".")
    .reverse()
    .join("");
  return `FK-${formattedDate}-${orgOrUserCode}-${count}`;
}

router.post("/createInvoice", async (req, res) => {
  const {
    userId,
    organizationId,
    contactId,
    invoiceDate,
    dueDate,
    discount,
    items,
    salesOrderId,
  } = req.body;

  if (
    !userId ||
    !contactId ||
    !invoiceDate ||
    !dueDate ||
    !items ||
    items.length === 0
  ) {
    return res.status(400).json({ error: "Nedostaju obavezni podaci." });
  }

  try {
    const countQuery = `
      SELECT COUNT(*) AS invoice_count
      FROM invoices
      WHERE user_id = ? AND ${
        organizationId ? "organization_id = ?" : "organization_id IS NULL"
      }
    `;

    const countParams = organizationId ? [userId, organizationId] : [userId];

    db.query(countQuery, countParams, (err1, result1) => {
      if (err1) {
        console.error("Greška pri dohvaćanju broja faktura:", err1);
        return res.status(500).json({ error: "Greška na serveru." });
      }

      const count = result1[0].invoice_count + 1;
      const codePrefix = organizationId ? `O${organizationId}` : "U";
      const customCode = generateInvoiceCode(invoiceDate, codePrefix, count);

      const subtotal = items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );
      const finalAmount = subtotal - (discount || 0);

      const insertInvoiceQuery = `
        INSERT INTO invoices (
          user_id, organization_id, contact_id, invoice_date, due_date,
          total_amount, discount, final_amount, remaining_amount, status,
          custom_invoice_code, custom_invoice_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, NOW())
      `;

      const invoiceParams = [
        userId,
        organizationId || null,
        contactId,
        new Date(invoiceDate).toISOString().split("T")[0],
        new Date(dueDate).toISOString().split("T")[0],
        subtotal,
        discount || 0,
        finalAmount,
        finalAmount,
        customCode,
        count,
      ];

      db.query(insertInvoiceQuery, invoiceParams, (err2, result2) => {
        if (err2) {
          console.error("Greška pri unosu fakture:", err2);
          return res.status(500).json({ error: "Greška pri unosu fakture." });
        }

        const invoiceId = result2.insertId;

        if (salesOrderId) {
          const updateOrderQuery = `
            UPDATE sales_orders SET invoice_id = ? WHERE id = ?
          `;
          db.query(updateOrderQuery, [invoiceId, salesOrderId], (err4) => {
            if (err4) {
              console.error("Greška pri povezivanju naloga s fakturom:", err4);
            }
          });
        }

        let completed = 0;
        let errorOccurred = false;

        items.forEach((item) => {
          const itemQuery = `
            INSERT INTO invoice_items (invoice_id, item_name, item_description, quantity, price, total_price)
            VALUES (?, ?, ?, ?, ?, ?)
          `;

          const itemParams = [
            invoiceId,
            item.itemName,
            item.itemDescription || null,
            item.quantity,
            item.price,
            item.quantity * item.price,
          ];

          db.query(itemQuery, itemParams, (err3) => {
            if (err3 && !errorOccurred) {
              errorOccurred = true;
              console.error("Greška pri unosu stavke fakture:", err3);
              return res
                .status(500)
                .json({ error: "Greška pri unosu stavki." });
            }

            completed++;

            if (completed === items.length && !errorOccurred) {
                            const getClientQuery = `
                SELECT first_name, last_name, email
                FROM contacts
                WHERE id = ?
              `;

              db.query(
                getClientQuery,
                [contactId],
                async (errClient, resultClient) => {
                  if (errClient || resultClient.length === 0) {
                    console.error(
                      "Greška pri dohvaćanju podataka o klijentu:",
                      errClient
                    );
                    
                    return res.status(201).json({
                      success: true,
                      message:
                        "Faktura kreirana, ali email nije poslan (greška dohvaćanja klijenta).",
                      invoiceId,
                      custom_invoice_code: customCode,
                    });
                  }

                  const client = resultClient[0];
                  const clientEmail = client.email;
                  const clientName = `${client.first_name} ${client.last_name}`;

                  const formattedItems = items.map((item) => ({
                    name: item.itemName,
                    quantity: item.quantity,
                    unitPrice: item.price,
                  }));

                  
                  try {
                    await fetch(
                      `${process.env.API_URL}/api/email/sendInvoiceEmail`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          clientEmail,
                          clientName,
                          invoiceNumber: customCode,
                          totalAmount: finalAmount,
                          dueDate,
                          items: formattedItems,
                        }),
                      }
                    );

                    console.log("Invoice email poslan.");
                  } catch (emailErr) {
                    console.error(
                      "Greška pri slanju invoice emaila:",
                      emailErr
                    );
                  }

                                    return res.status(201).json({
                    success: true,
                    message: "Faktura uspješno kreirana",
                    invoiceId,
                    custom_invoice_code: customCode,
                  });
                }
              );
            }
          });
        });
      });
    });
  } catch (error) {
    console.error("Greška pri kreiranju fakture:", error);
    res.status(500).json({ error: "Interna greška na serveru." });
  }
});

module.exports = router;
