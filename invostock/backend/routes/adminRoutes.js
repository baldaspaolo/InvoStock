// adminRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/users/no-organization", (req, res) => {
  const query = `
    SELECT id, name, email, created_at, is_active
    FROM users
    WHERE organization_id IS NULL AND role != 'systemadmin'
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: "Greška kod korisnika." });
    res.json(results);
  });
});

router.get("/users/with-organization", (req, res) => {
  const query = `
    SELECT u.id, u.name, u.email, u.created_at, u.is_active, o.id AS organization_id, o.name AS organization_name
    FROM users u
    LEFT JOIN organizations o ON u.organization_id = o.id
    WHERE u.organization_id IS NOT NULL AND u.role != 'systemadmin'
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: "Greška kod korisnika." });
    res.json(results);
  });
});

router.get("/organizations", (req, res) => {
  const query = `
  SELECT 
    o.id, 
    o.name, 
    o.email, 
    o.address,
    o.is_active,
    (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id AND u.is_active = 1) AS member_count
  FROM organizations o
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: "Greška kod organizacija." });
    res.json(results);
  });
});

router.get("/users/:id", (req, res) => {
  db.query(
    "SELECT u.id, u.name, u.email, u.organization_id, u.created_at, u.role, o.name AS organization_name FROM users u LEFT JOIN organizations o ON u.organization_id = o.id WHERE u.id = ?",
    [req.params.id],
    (err, results) => {
      if (err || results.length === 0)
        return res.status(404).json({ error: "Korisnik nije pronađen." });

      const user = results[0];
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

            db.query(
              "SELECT * FROM payments WHERE invoice_id = ?",
              [invoiceId],
              (err, paymentsRes) => {
                if (err)
                  return res
                    .status(500)
                    .json({ error: "Greška kod dohvaćanja uplata." });

                invoice.payments = paymentsRes;
                res.json(invoice);
              }
            );
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

router.get("/organizations/:id", (req, res) => {
  const orgId = req.params.id;

  const query = `
    SELECT 
      o.*,
      (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id) AS member_count
    FROM organizations o
    WHERE o.id = ?
  `;

  db.query(query, [orgId], (err, results) => {
    if (err) {
      console.error("MySQL error:", err);
      return res.status(500).json({
        error: "Database error",
        details: err.sqlMessage,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Organizacija nije pronađena." });
    }

    const organization = {
      ...results[0],
      member_count: parseInt(results[0].member_count) || 0,
    };

    res.json({ organization });
  });
});

router.get("/organizations/:id/members", (req, res) => {
  const orgId = req.params.id;
  const query = `
    SELECT id, name, email, role, created_at,
           CASE WHEN role = 'organization' THEN 'admin' ELSE 'member' END AS org_role
    FROM users
    WHERE organization_id = ?
  `;
  db.query(query, [orgId], (err, results) => {
    if (err) return res.status(500).json({ error: "Greška kod članova." });
    res.json(results);
  });
});

router.get("/organizations/:id/invoices", (req, res) => {
  const orgId = req.params.id;
  const query = `
    SELECT i.*, c.first_name AS contact_first_name, c.last_name AS contact_last_name
    FROM invoices i
    LEFT JOIN contacts c ON i.contact_id = c.id
    WHERE i.organization_id = ?
  `;
  db.query(query, [orgId], (err, results) => {
    if (err) return res.status(500).json({ error: "Greška kod faktura." });
    res.json(results);
  });
});

router.get("/organizations/:id/orders", (req, res) => {
  const orgId = req.params.id;
  const query = `
    SELECT o.*, s.name AS supplier_name
    FROM orders o
    LEFT JOIN suppliers s ON o.supplier_id = s.id
    WHERE o.organization_id = ?
  `;
  db.query(query, [orgId], (err, results) => {
    if (err) return res.status(500).json({ error: "Greška kod narudžbi." });
    res.json(results);
  });
});

router.get("/organizations/:id/expenses", (req, res) => {
  const orgId = req.params.id;
  const query = `
    SELECT e.*, ec.name AS category_name
    FROM expenses e
    LEFT JOIN expense_categories ec ON e.category_id = ec.id
    WHERE e.organization_id = ?
  `;
  db.query(query, [orgId], (err, results) => {
    if (err) return res.status(500).json({ error: "Greška kod troškova." });
    res.json(results);
  });
});

router.get("/organizations/:id/packages", (req, res) => {
  const orgId = req.params.id;
  const query = `
    SELECT p.*, c.first_name AS contact_first_name, c.last_name AS contact_last_name, p.courier
    FROM packages p
    LEFT JOIN contacts c ON p.contact_id = c.id
    WHERE p.organization_id = ?
  `;
  db.query(query, [orgId], (err, results) => {
    if (err) return res.status(500).json({ error: "Greška kod paketa." });
    res.json(results);
  });
});

router.get("/organizations/:id/payments", (req, res) => {
  const orgId = req.params.id;
  const query = `
    SELECT p.*, i.custom_invoice_code AS invoice_code, CONCAT(c.first_name, ' ', c.last_name) AS client_name,
           i.final_amount AS invoice_amount
    FROM payments p
    LEFT JOIN invoices i ON p.invoice_id = i.id
    LEFT JOIN contacts c ON i.contact_id = c.id
    WHERE p.organization_id = ?
  `;
  db.query(query, [orgId], (err, results) => {
    if (err) return res.status(500).json({ error: "Greška kod uplata." });
    res.json(results);
  });
});

router.get("/organizations/:id/inventory", (req, res) => {
  const orgId = req.params.id;
  const query = `SELECT * FROM inventory_items WHERE organization_id = ?`;
  db.query(query, [orgId], (err, results) => {
    if (err) return res.status(500).json({ error: "Greška kod inventara." });
    res.json(results);
  });
});

router.get("/organizations/:orgId/invoices/:invoiceId", (req, res) => {
  const { orgId, invoiceId } = req.params;
  const query = `
    SELECT i.*, c.first_name AS contact_first_name, c.last_name AS contact_last_name,
           c.email AS client_email, c.company_name AS client_company
    FROM invoices i
    LEFT JOIN contacts c ON i.contact_id = c.id
    WHERE i.id = ? AND i.organization_id = ?
  `;
  db.query(query, [invoiceId, orgId], (err, results) => {
    if (err) return res.status(500).json({ error: "Greška kod fakture." });
    if (results.length === 0)
      return res.status(404).json({ error: "Faktura nije pronađena." });
    const invoice = results[0];
    db.query(
      "SELECT * FROM invoice_items WHERE invoice_id = ?",
      [invoiceId],
      (err, items) => {
        if (err) return res.status(500).json({ error: "Greška kod stavki." });
        invoice.items = items;
        db.query(
          "SELECT * FROM payments WHERE invoice_id = ?",
          [invoiceId],
          (err, payments) => {
            if (err)
              return res.status(500).json({ error: "Greška kod uplata." });
            invoice.payments = payments;
            res.json(invoice);
          }
        );
      }
    );
  });
});

router.get("/organizations/:orgId/orders/:orderId", (req, res) => {
  const { orgId, orderId } = req.params;
  const query = `
    SELECT o.*, s.name AS supplier_name, s.email AS supplier_email, s.phone AS supplier_phone
    FROM orders o
    LEFT JOIN suppliers s ON o.supplier_id = s.id
    WHERE o.id = ? AND o.organization_id = ?
  `;
  db.query(query, [orderId, orgId], (err, results) => {
    if (err) return res.status(500).json({ error: "Greška kod narudžbe." });
    if (results.length === 0)
      return res.status(404).json({ error: "Narudžba nije pronađena." });
    const order = results[0];
    db.query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [orderId],
      (err, items) => {
        if (err) return res.status(500).json({ error: "Greška kod stavki." });
        order.items = items;
        res.json(order);
      }
    );
  });
});

router.get("/organizations/:orgId/expenses/:expenseId", (req, res) => {
  const { orgId, expenseId } = req.params;
  const query = `
    SELECT e.*, ec.name AS category_name
    FROM expenses e
    LEFT JOIN expense_categories ec ON e.category_id = ec.id
    WHERE e.id = ? AND e.organization_id = ?
  `;
  db.query(query, [expenseId, orgId], (err, results) => {
    if (err) return res.status(500).json({ error: "Greška kod troška." });
    if (results.length === 0)
      return res.status(404).json({ error: "Trošak nije pronađen." });
    res.json(results[0]);
  });
});

router.get("/organizations/:orgId/packages/:packageId", (req, res) => {
  const { orgId, packageId } = req.params;
  const query = `
    SELECT p.*, c.first_name AS contact_first_name, c.last_name AS contact_last_name,
           c.address AS contact_address, c.phone_number AS contact_phone
    FROM packages p
    LEFT JOIN contacts c ON p.contact_id = c.id
    WHERE p.id = ? AND p.organization_id = ?
  `;
  db.query(query, [packageId, orgId], (err, results) => {
    if (err) return res.status(500).json({ error: "Greška kod paketa." });
    if (results.length === 0)
      return res.status(404).json({ error: "Paket nije pronađen." });
    res.json(results[0]);
  });
});

router.get("/organizations/:orgId/payments/:paymentId", (req, res) => {
  const { orgId, paymentId } = req.params;
  const query = `
    SELECT p.*, i.custom_invoice_code AS invoice_code,
           i.final_amount AS invoice_amount, i.status AS invoice_status,
           CONCAT(c.first_name, ' ', c.last_name) AS client_name
    FROM payments p
    LEFT JOIN invoices i ON p.invoice_id = i.id
    LEFT JOIN contacts c ON i.contact_id = c.id
    WHERE p.id = ? AND p.organization_id = ?
  `;
  db.query(query, [paymentId, orgId], (err, results) => {
    if (err) return res.status(500).json({ error: "Greška kod uplate." });
    if (results.length === 0)
      return res.status(404).json({ error: "Uplata nije pronađena." });
    res.json(results[0]);
  });
});

router.get("/organizations/:orgId/inventory/:inventoryId", (req, res) => {
  const { orgId, inventoryId } = req.params;
  const query = `
    SELECT * FROM inventory_items
    WHERE id = ? AND organization_id = ?
  `;
  db.query(query, [inventoryId, orgId], (err, results) => {
    if (err) return res.status(500).json({ error: "Greška kod inventara." });
    if (results.length === 0)
      return res.status(404).json({ error: "Inventar nije pronađen." });
    res.json(results[0]);
  });
});

router.get("/organizations/:orgId/users/:userId", (req, res) => {
  const { orgId, userId } = req.params;
  const query = `SELECT * FROM users WHERE id = ? AND organization_id = ?`;
  db.query(query, [userId, orgId], (err, results) => {
    if (err) return res.status(500).json({ error: "Greška kod korisnika." });
    if (results.length === 0)
      return res.status(404).json({ error: "Korisnik nije pronađen." });
    const user = results[0];
    delete user.password;
    res.json(user);
  });
});

///
router.put("/users/:id", (req, res) => {
  const { id } = req.params;
  const { name, email, organization_id } = req.body;

  const query = `UPDATE users SET name = ?, email = ?, organization_id = ? WHERE id = ?`;
  db.query(query, [name, email, organization_id || null, id], (err, result) => {
    if (err) return res.status(500).json({ error: "Greška kod ažuriranja" });
    res.json({ success: true });
  });
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", (req, res) => {
  const { id } = req.params;

  const query = `UPDATE users SET is_active = 0 WHERE id = ?`;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Greška kod soft brisanja korisnika:", err);
      return res.status(500).json({ error: "Greška kod soft brisanja." });
    }
    res.json({ success: true, message: "Korisnik je soft obrisan." });
  });
});

router.put("/organizations/:id", (req, res) => {
  const { id } = req.params;
  const { name, address } = req.body;

  const query = `UPDATE organizations SET name = ?, address = ? WHERE id = ?`;
  db.query(query, [name, address, id], (err, result) => {
    if (err) {
      console.error("Greška kod ažuriranja organizacije:", err);
      return res
        .status(500)
        .json({ error: "Greška kod ažuriranja organizacije." });
    }
    res.json({ success: true });
  });
});

router.put("/organizations/:id/activate", (req, res) => {
  const { id } = req.params;

  const query = `UPDATE organizations SET is_active = 1 WHERE id = ?`;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Greška kod aktivacije organizacije:", err);
      return res
        .status(500)
        .json({ error: "Greška kod aktivacije organizacije." });
    }

    res.json({ success: true, message: "Organizacija je aktivirana." });
  });
});

router.delete("/organizations/:id", (req, res) => {
  const { id } = req.params;

  const query = `UPDATE organizations SET is_active = 0 WHERE id = ?`;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Greška kod soft brisanja organizacije:", err);
      return res
        .status(500)
        .json({ error: "Greška kod soft brisanja organizacije." });
    }
    res.json({ success: true, message: "Organizacija je soft obrisana." });
  });
});

router.put("/users/:id/activate", (req, res) => {
  const { id } = req.params;

  const query = `UPDATE users SET is_active = 1 WHERE id = ?`;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Greška kod aktiviranja korisnika:", err);
      return res.status(500).json({ error: "Greška kod aktiviranja." });
    }
    res.json({ success: true, message: "Korisnik je aktiviran." });
  });
});

router.get("/statistics", (req, res) => {
  const statisticsQuery = `
    SELECT 
      -- Osnovne statistike
      (SELECT COUNT(*) FROM users) AS total_users,
      (SELECT COUNT(*) FROM users WHERE organization_id IS NULL) AS individual_users,
      (SELECT COUNT(*) FROM users WHERE organization_id IS NOT NULL) AS organization_users,
      (SELECT COUNT(*) FROM organizations) AS total_organizations,
      
      -- Financijske statistike
      (SELECT COALESCE(SUM(final_amount), 0) FROM invoices) AS total_invoice_amount,
      (SELECT COALESCE(SUM(amount), 0) FROM expenses) AS total_expenses,
      (SELECT COALESCE(SUM(amount_paid), 0) FROM payments) AS total_payments,
      
      -- Transakcijske statistike
      (SELECT COUNT(*) FROM invoices) AS total_invoices,
      (SELECT COUNT(*) FROM invoices WHERE status = 'paid') AS paid_invoices,
      (SELECT COUNT(*) FROM invoices WHERE status = 'pending') AS pending_invoices,
      (SELECT COUNT(*) FROM invoices WHERE status = 'partially_paid') AS partially_paid_invoices,
      
      -- Inventar statistike
      (SELECT COUNT(*) FROM inventory_items) AS total_inventory_items,
      (SELECT COALESCE(SUM(stock_quantity), 0) FROM inventory_items) AS total_stock_quantity,
      (SELECT COALESCE(SUM(stock_quantity * price), 0) FROM inventory_items) AS total_inventory_value,
      
      -- Narudžbe i paketi
      (SELECT COUNT(*) FROM orders) AS total_orders,
      (SELECT COUNT(*) FROM orders WHERE status = 'pending') AS pending_orders,
      (SELECT COUNT(*) FROM orders WHERE status = 'delivered') AS delivered_orders,
      (SELECT COUNT(*) FROM orders WHERE status = 'cancelled') AS cancelled_orders,
      (SELECT COUNT(*) FROM packages) AS total_packages,
      
      -- Organizacijske statistike
      (SELECT COALESCE(AVG(member_count), 0) FROM (
        SELECT COUNT(*) AS member_count 
        FROM users 
        WHERE organization_id IS NOT NULL 
        GROUP BY organization_id
      ) AS subquery) AS avg_members_per_org,
      (SELECT COALESCE(MAX(member_count), 0) FROM (
        SELECT COUNT(*) AS member_count 
        FROM users 
        WHERE organization_id IS NOT NULL 
        GROUP BY organization_id
      ) AS subquery) AS max_members_in_org
  `;

  db.query(statisticsQuery, (err, results) => {
    if (err) {
      console.error("Greška kod dohvaćanja statistike:", err);
      return res
        .status(500)
        .json({ error: "Greška kod dohvaćanja statistike." });
    }

    const stats = results[0];

    // Izračun postotaka
    stats.paid_invoices_percentage =
      stats.total_invoices > 0
        ? ((stats.paid_invoices / stats.total_invoices) * 100).toFixed(2)
        : 0;

    stats.pending_invoices_percentage =
      stats.total_invoices > 0
        ? ((stats.pending_invoices / stats.total_invoices) * 100).toFixed(2)
        : 0;

    stats.organization_users_percentage =
      stats.total_users > 0
        ? ((stats.organization_users / stats.total_users) * 100).toFixed(2)
        : 0;

    stats.average_invoice_amount =
      stats.total_invoices > 0
        ? (stats.total_invoice_amount / stats.total_invoices).toFixed(2)
        : 0;

    // Broj troškova za prosječni iznos troška
    db.query(
      "SELECT COUNT(*) AS expense_count FROM expenses",
      (err, expenseRes) => {
        if (err) {
          console.error("Greška kod dohvaćanja broja troškova:", err);
          stats.average_expense_amount = 0;
        } else {
          const expenseCount = expenseRes[0]?.expense_count || 0;
          stats.average_expense_amount =
            expenseCount > 0
              ? (stats.total_expenses / expenseCount).toFixed(2)
              : 0;
        }

        stats.inventory_turnover_ratio =
          stats.total_inventory_value > 0
            ? (
                stats.total_invoice_amount / stats.total_inventory_value
              ).toFixed(2)
            : 0;

        res.json(stats);
      }
    );
  });
});

module.exports = router;
