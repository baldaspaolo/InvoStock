const express = require("express");
const router = express.Router();
const db = require("../db");


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
  db.query(
    "INSERT INTO expenses (user_id, organization_id, category_id, expense_date, amount, name, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [userId, organizationId, categoryId, date, amount, name, description],
    (err, result) => {
      if (err)
        return res
          .status(500)
          .json({ success: false, message: "Greška kod spremanja." });
      res.status(201).json({ success: true, expenseId: result.insertId });
    }
  );
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
