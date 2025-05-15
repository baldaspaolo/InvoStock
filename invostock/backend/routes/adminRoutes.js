// adminRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/users/no-organization", (req, res) => {
  const query = `
    SELECT id, name, email, created_at
    FROM users
    WHERE organization_id IS NULL
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: "Greška kod korisnika." });
    res.json(results);
  });
});


router.get("/users/with-organization", (req, res) => {
  const query = `
    SELECT u.id, u.name, u.email, u.created_at, o.id AS organization_id, o.name AS organization_name
    FROM users u
    LEFT JOIN organizations o ON u.organization_id = o.id
    WHERE u.organization_id IS NOT NULL
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: "Greška kod korisnika." });
    res.json(results);
  });
});


router.get("/organizations", (req, res) => {
  const query = `
    SELECT o.id, o.name,
    (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id) AS member_count
    FROM organizations o
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: "Greška kod organizacija." });
    res.json(results);
  });
});

router.get("/users/:id", (req, res) => {
  db.query(
    "SELECT * FROM users WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (err || results.length === 0)
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      const user = results[0];
      delete user.password;
      res.json({ user });
    }
  );
});


router.get("/users/:id/invoices", (req, res) => {
  const userId = req.params.id;
  db.query(
    "SELECT organization_id FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err || results.length === 0)
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      const orgId = results[0].organization_id;
      const query = orgId
        ? "SELECT * FROM invoices WHERE organization_id = ?"
        : "SELECT * FROM invoices WHERE user_id = ? AND organization_id IS NULL";
      const params = [orgId || userId];
      db.query(query, params, (err, results) => {
        if (err)
          return res
            .status(500)
            .json({ error: "Greška kod dohvaćanja faktura." });
        res.json(results);
      });
    }
  );
});

router.get("/users/:id/orders", (req, res) => {
  const userId = req.params.id;
  db.query(
    "SELECT organization_id FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err || results.length === 0)
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      const orgId = results[0].organization_id;
      const query = orgId
        ? "SELECT * FROM orders WHERE organization_id = ?"
        : "SELECT * FROM orders WHERE user_id = ? AND organization_id IS NULL";
      const params = [orgId || userId];
      db.query(query, params, (err, results) => {
        if (err)
          return res
            .status(500)
            .json({ error: "Greška kod dohvaćanja narudžbenica." });
        res.json(results);
      });
    }
  );
});

router.get("/users/:id/expenses", (req, res) => {
  const userId = req.params.id;
  db.query(
    "SELECT organization_id FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err || results.length === 0)
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      const orgId = results[0].organization_id;
      const query = orgId
        ? "SELECT * FROM expenses WHERE organization_id = ?"
        : "SELECT * FROM expenses WHERE user_id = ? AND organization_id IS NULL";
      const params = [orgId || userId];
      db.query(query, params, (err, results) => {
        if (err)
          return res
            .status(500)
            .json({ error: "Greška kod dohvaćanja troškova." });
        res.json(results);
      });
    }
  );
});

router.get("/users/:id/payments", (req, res) => {
  const userId = req.params.id;
  db.query(
    "SELECT organization_id FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err || results.length === 0)
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      const orgId = results[0].organization_id;
      const query = orgId
        ? "SELECT * FROM payments WHERE organization_id = ?"
        : "SELECT * FROM payments WHERE user_id = ? AND organization_id IS NULL";
      const params = [orgId || userId];
      db.query(query, params, (err, results) => {
        if (err)
          return res
            .status(500)
            .json({ error: "Greška kod dohvaćanja uplata." });
        res.json(results);
      });
    }
  );
});

router.get("/users/:id/packages", (req, res) => {
  const userId = req.params.id;
  db.query(
    "SELECT organization_id FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err || results.length === 0)
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      const orgId = results[0].organization_id;
      const query = orgId
        ? "SELECT * FROM packages WHERE organization_id = ?"
        : "SELECT * FROM packages WHERE user_id = ? AND organization_id IS NULL";
      const params = [orgId || userId];
      db.query(query, params, (err, results) => {
        if (err)
          return res
            .status(500)
            .json({ error: "Greška kod dohvaćanja paketa." });
        res.json(results);
      });
    }
  );
});

router.get("/users/:id/inventory", (req, res) => {
  const userId = req.params.id;
  db.query(
    "SELECT organization_id FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err || results.length === 0)
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      const orgId = results[0].organization_id;
      const query = orgId
        ? "SELECT * FROM inventory_items WHERE organization_id = ?"
        : "SELECT * FROM inventory_items WHERE user_id = ? AND organization_id IS NULL";
      const params = [orgId || userId];
      db.query(query, params, (err, results) => {
        if (err)
          return res
            .status(500)
            .json({ error: "Greška kod dohvaćanja inventara." });
        res.json(results);
      });
    }
  );
});

// POJEDINAČNA FAKTURA 
router.get("/users/:userId/invoices/:invoiceId", (req, res) => {
  const { userId, invoiceId } = req.params;

  db.query(
    "SELECT organization_id FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err || results.length === 0)
        return res.status(404).json({ error: "Korisnik nije pronađen." });

      const orgId = results[0].organization_id;

      const query = `
  SELECT 
    i.*, 
    c.first_name AS contact_first_name,
    c.last_name AS contact_last_name,
    c.email AS client_email,
    c.company_name AS client_company
  FROM invoices i
  LEFT JOIN contacts c ON i.contact_id = c.id
  WHERE i.id = ? AND ${
    orgId
      ? "i.organization_id = ?"
      : "i.user_id = ? AND i.organization_id IS NULL"
  }
`;
      const params = [invoiceId, orgId || userId];

      db.query(query, params, (err, invoiceResults) => {
        if (err)
          return res
            .status(500)
            .json({ error: "Greška kod dohvaćanja fakture." });
        if (invoiceResults.length === 0)
          return res.status(404).json({ error: "Faktura nije pronađena." });

        const invoice = invoiceResults[0];

        db.query(
          "SELECT * FROM invoice_items WHERE invoice_id = ?",
          [invoiceId],
          (err, itemResults) => {
            if (err)
              return res
                .status(500)
                .json({ error: "Greška kod dohvaćanja stavki fakture." });

            invoice.items = itemResults;
            res.json(invoice);
          }
        );
      });
    }
  );
});

// POJEDINAČNI TROŠAK
router.get("/users/:userId/expenses/:expenseId", (req, res) => {
  const { userId, expenseId } = req.params;

  db.query(
    "SELECT organization_id FROM users WHERE id = ?",
    [userId],
    (err, userRes) => {
      if (err || userRes.length === 0)
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      const orgId = userRes[0].organization_id;

      const query = `
      SELECT e.*, ec.name AS category_name
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      WHERE e.id = ? AND ${
        orgId
          ? "e.organization_id = ?"
          : "e.user_id = ? AND e.organization_id IS NULL"
      }
    `;
      db.query(query, [expenseId, orgId || userId], (err, expenseRes) => {
        if (err)
          return res
            .status(500)
            .json({ error: "Greška kod dohvaćanja troška." });
        if (expenseRes.length === 0)
          return res.status(404).json({ error: "Trošak nije pronađen." });
        res.json(expenseRes[0]);
      });
    }
  );
});


// OJEDINAČNA NARUDŽBENICA 
router.get("/users/:userId/orders/:orderId", (req, res) => {
  const { userId, orderId } = req.params;

  db.query(
    "SELECT organization_id FROM users WHERE id = ?",
    [userId],
    (err, userRes) => {
      if (err || userRes.length === 0)
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      const orgId = userRes[0].organization_id;

      const query = `
      SELECT o.*, s.name AS supplier_name, s.email AS supplier_email, s.address AS supplier_address
      FROM orders o
      LEFT JOIN suppliers s ON o.supplier_id = s.id
      WHERE o.id = ? AND ${
        orgId
          ? "o.organization_id = ?"
          : "o.user_id = ? AND o.organization_id IS NULL"
      }
    `;
      db.query(query, [orderId, orgId || userId], (err, orderRes) => {
        if (err)
          return res
            .status(500)
            .json({ error: "Greška kod dohvaćanja narudžbenice." });
        if (orderRes.length === 0)
          return res
            .status(404)
            .json({ error: "Narudžbenica nije pronađena." });

        const order = orderRes[0];
        db.query(
          "SELECT * FROM order_items WHERE order_id = ?",
          [orderId],
          (err, items) => {
            if (err)
              return res
                .status(500)
                .json({ error: "Greška kod dohvaćanja stavki narudžbe." });
            order.items = items;
            res.json(order);
          }
        );
      });
    }
  );
});


// POJEDINAČNA UPLATA 
router.get("/users/:userId/payments/:paymentId", (req, res) => {
  const { userId, paymentId } = req.params;

  db.query(
    "SELECT organization_id FROM users WHERE id = ?",
    [userId],
    (err, userRes) => {
      if (err || userRes.length === 0)
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      const orgId = userRes[0].organization_id;

      const query = `
  SELECT 
    p.*, 
    i.custom_invoice_code AS invoice_code, 
    i.final_amount AS invoice_amount, 
    i.status AS invoice_status,
    CONCAT(c.first_name, ' ', c.last_name) AS client_name
  FROM payments p
  LEFT JOIN invoices i ON p.invoice_id = i.id
  LEFT JOIN contacts c ON i.contact_id = c.id
  WHERE p.id = ? AND ${
    orgId
      ? "p.organization_id = ?"
      : "p.user_id = ? AND p.organization_id IS NULL"
  }
`;
      db.query(query, [paymentId, orgId || userId], (err, paymentRes) => {
        if (err)
          return res
            .status(500)
            .json({ error: "Greška kod dohvaćanja uplate." });
        if (paymentRes.length === 0)
          return res.status(404).json({ error: "Uplata nije pronađena." });
        res.json(paymentRes[0]);
      });
    }
  );
});


// POJEDINAČNI PAKET 
router.get("/users/:userId/packages/:packageId", (req, res) => {
  const { userId, packageId } = req.params;

  db.query(
    "SELECT organization_id FROM users WHERE id = ?",
    [userId],
    (err, userRes) => {
      if (err || userRes.length === 0)
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      const orgId = userRes[0].organization_id;

      const query = `
      SELECT 
        p.*, 
        c.first_name AS contact_first_name, 
        c.last_name AS contact_last_name,
        c.company_name AS contact_company
      FROM packages p
      LEFT JOIN contacts c ON p.contact_id = c.id
      WHERE p.id = ? AND ${
        orgId
          ? "p.organization_id = ?"
          : "p.user_id = ? AND p.organization_id IS NULL"
      }
    `;
      db.query(query, [packageId, orgId || userId], (err, packageRes) => {
        if (err)
          return res
            .status(500)
            .json({ error: "Greška kod dohvaćanja paketa." });
        if (packageRes.length === 0)
          return res.status(404).json({ error: "Paket nije pronađen." });
        res.json(packageRes[0]);
      });
    }
  );
});


// POJEDINAČNI INVENTAR 
router.get("/users/:userId/inventory/:inventoryId", (req, res) => {
  const { userId, inventoryId } = req.params;

  db.query(
    "SELECT organization_id FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err || results.length === 0)
        return res.status(404).json({ error: "Korisnik nije pronađen." });

      const orgId = results[0].organization_id;
      const query = orgId
        ? "SELECT * FROM inventory_items WHERE id = ? AND organization_id = ?"
        : "SELECT * FROM inventory_items WHERE id = ? AND user_id = ? AND organization_id IS NULL";
      db.query(query, [inventoryId, orgId || userId], (err, results) => {
        if (err)
          return res
            .status(500)
            .json({ error: "Greška kod dohvaćanja artikla iz inventara." });
        if (results.length === 0)
          return res.status(404).json({ error: "Inventar nije pronađen." });
        res.json(results[0]);
      });
    }
  );
});

module.exports = router;
