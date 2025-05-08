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
  const { userId } = req.body;

  const query = `
    SELECT 
      e.id,
      e.name,
      e.expense_date,
      e.amount,
      e.description,
      e.category_id,             
      e.custom_expense_code,
      ec.name AS category
    FROM expenses e
    LEFT JOIN expense_categories ec ON e.category_id = ec.id
    WHERE e.user_id = ?
    ORDER BY e.expense_date DESC
  `;

  db.query(query, [userId], (err, results) => {
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
      date,
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
      res
        .status(201)
        .json({
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
  db.query("DELETE FROM expenses WHERE id = ?", [id], (err) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "Greška kod brisanja." });
    res.json({ success: true });
  });
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
  const { id } = req.params;
  const { name } = req.body;
  db.query(
    "UPDATE expense_categories SET name = ? WHERE id = ?",
    [name, id],
    (err) => {
      if (err)
        return res.status(500).json({
          success: false,
          message: "Greška kod ažuriranja kategorije.",
        });
      res.json({ success: true });
    }
  );
});

router.delete("/deleteExpenseCategory/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM expense_categories WHERE id = ?", [id], (err) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "Greška kod brisanja kategorije." });
    res.json({ success: true });
  });
});

module.exports = router;
