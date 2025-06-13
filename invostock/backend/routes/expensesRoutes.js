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

router.post("/getUserExpenses", (req, res) => {
  const { userId, organizationId } = req.body;

  let query = `
  SELECT 
    e.id, e.name, e.expense_date, e.amount, e.description,
    e.category_id, e.custom_expense_code,
    ec.name AS category
  FROM expenses e
  LEFT JOIN expense_categories ec ON e.category_id = ec.id
  WHERE e.user_id = ?
`;

  let params = [userId];

  if (organizationId) {
    query += " AND e.organization_id = ?";
    params.push(organizationId);
  } else {
    query += " AND e.organization_id IS NULL";
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Greška kod dohvata troškova:", err);
      return res
        .status(500)
        .json({ success: false, message: "Greška kod dohvata." });
    }

    res.json({ success: true, expenses: results });
  });
});

router.post("/addExpense", (req, res) => {
  const {
    userId,
    organizationId,
    categoryId,
    date,
    amount,
    name,
    description,
  } = req.body;

  if (!userId || !categoryId || !date || !amount || !name) {
    return res.status(400).json({ error: "Nedostaju obavezni podaci" });
  }

  
  const formattedDate = new Date(date).toISOString().split("T")[0];

  const countQuery = `
    SELECT COUNT(*) AS expense_count
    FROM expenses
    WHERE ${
      organizationId
        ? "organization_id = ?"
        : "organization_id IS NULL AND user_id = ?"
    }
  `;
  const params = organizationId ? [organizationId] : [userId];

  db.query(countQuery, params, (err1, result1) => {
    if (err1) {
      console.error("Greška pri brojanju troškova:", err1);
      return res.status(500).json({ error: "Greška na serveru" });
    }

    const count = result1[0].expense_count + 1;
    const prefix = "EXP";
    const codePrefix = organizationId ? `O${organizationId}` : `U${userId}`;
    const customCode = generateCustomCode(
      prefix,
      new Date(date),
      codePrefix,
      count
    );

    const insertQuery = `
      INSERT INTO expenses (user_id, organization_id, category_id, expense_date, amount, name, description, custom_expense_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertParams = [
      userId,
      organizationId || null,
      categoryId,
      formattedDate, 
      amount,
      name,
      description || null,
      customCode,
    ];

    db.query(insertQuery, insertParams, (err2, result) => {
      if (err2) {
        console.error("Greška kod spremanja:", err2);
        return res
          .status(500)
          .json({ success: false, message: "Greška kod spremanja." });
      }
      res.status(201).json({
        success: true,
        expenseId: result.insertId,
        custom_expense_code: customCode,
      });
    });
  });
});


router.put("/updateExpense/:id", (req, res) => {
  const { id } = req.params;
  const { categoryId, date, amount, name, description } = req.body;
  db.query(
    "UPDATE expenses SET category_id = ?, expense_date = ?, amount = ?, name = ?, description = ? WHERE id = ?",
    [categoryId, date, amount, name, description, id],
    (err) => {
      if (err)
        return res
          .status(500)
          .json({ success: false, message: "Greška kod ažuriranja." });
      res.json({ success: true });
    }
  );
});

router.delete("/deleteExpense/:id", (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, message: "Nedostaje ID." });
  }

  db.query(
    "UPDATE expenses SET is_deleted = 1 WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error("Greška kod mekog brisanja troška:", err);
        return res
          .status(500)
          .json({ success: false, message: "Greška kod mekog brisanja." });
      }

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Trošak nije pronađen." });
      }

      res.json({ success: true, message: "Trošak je označen kao obrisan." });
    }
  );
});

router.post("/getExpenseCategories", (req, res) => {
  const { userId } = req.body;
  db.query(
    "SELECT * FROM expense_categories WHERE user_id = ? ORDER BY name",
    [userId],
    (err, results) => {
      if (err)
        return res
          .status(500)
          .json({ success: false, message: "Greška kod dohvata kategorija." });
      res.json({ success: true, categories: results });
    }
  );
});

router.post("/addExpenseCategory", (req, res) => {
  const { userId, name } = req.body;
  db.query(
    "INSERT INTO expense_categories (user_id, name) VALUES (?, ?)",
    [userId, name],
    (err, result) => {
      if (err)
        return res
          .status(500)
          .json({ success: false, message: "Greška kod dodavanja." });
      res.status(201).json({ success: true, categoryId: result.insertId });
    }
  );
});

router.put("/updateExpenseCategory/:id", (req, res) => {
  const { name } = req.body;
  const { id } = req.params;

  if (!name) return res.status(400).json({ error: "Naziv je obavezan" });

  const query = `UPDATE expense_categories SET name = ? WHERE id = ?`;
  db.query(query, [name, id], (err) => {
    if (err) return res.status(500).json({ error: "Greška na serveru." });
    res.json({ success: true });
  });
});


router.delete("/deleteExpenseCategory/:id", (req, res) => {
  const { id } = req.params;

  const query = `UPDATE expense_categories SET is_deleted = 1 WHERE id = ?`;
  db.query(query, [id], (err) => {
    if (err) return res.status(500).json({ error: "Greška na serveru." });
    res.json({ success: true });
  });
});


router.post("/getExpenseSummary", (req, res) => {
  const { userId, organizationId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaju podaci" });
  }

  let whereClause;
  let params;

  if (organizationId) {
    whereClause = "e.organization_id = ? AND e.user_id = ?";
    params = [organizationId, userId];
  } else {
    whereClause = "e.organization_id IS NULL AND e.user_id = ?";
    params = [userId];
  }

  const queries = {
    last30Days: `
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM expenses e
      WHERE ${whereClause}
      AND expense_date >= CURDATE() - INTERVAL 30 DAY
    `,
    last3Months: `
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM expenses e
      WHERE ${whereClause}
      AND expense_date >= CURDATE() - INTERVAL 3 MONTH
    `,
    lastYear: `
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM expenses e
      WHERE ${whereClause}
      AND expense_date >= CURDATE() - INTERVAL 1 YEAR
    `,
    topCategory: `
      SELECT ec.name AS category, COALESCE(SUM(e.amount), 0) AS total
      FROM expenses e
      JOIN expense_categories ec ON e.category_id = ec.id
      WHERE ${whereClause}
      GROUP BY ec.name
      ORDER BY total DESC
      LIMIT 1
    `,
  };

  db.query(queries.last30Days, params, (err30, result30) => {
    if (err30) return res.status(500).json({ error: "Greška 30 dana" });

    db.query(queries.last3Months, params, (err3m, result3m) => {
      if (err3m) return res.status(500).json({ error: "Greška 3 mjeseca" });

      db.query(queries.lastYear, params, (erry, resulty) => {
        if (erry) return res.status(500).json({ error: "Greška godina" });

        db.query(queries.topCategory, params, (errc, resultc) => {
          if (errc) return res.status(500).json({ error: "Greška kategorije" });

          res.json({
            success: true,
            last30Days: result30[0].total,
            last3Months: result3m[0].total,
            lastYear: resulty[0].total,
            topCategory: resultc[0] || { category: null, total: 0 },
          });
        });
      });
    });
  });
});

module.exports = router;
