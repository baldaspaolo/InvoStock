const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/getDashboardStats", (req, res) => {
  const { userId, organizationId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje UserID!" });
  }

   const statsQueries = {
     totalInvoices30Days: `
      SELECT COUNT(*) AS count FROM invoices 
      WHERE user_id = ? ${organizationId ? "AND organization_id = ?" : ""}
      AND invoice_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `,
     totalRevenue30Days: `
      SELECT COALESCE(SUM(final_amount), 0) AS sum FROM invoices 
      WHERE user_id = ? AND status IN ('paid', 'partially_paid')
      ${organizationId ? "AND organization_id = ?" : ""}
      AND invoice_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `,
     outstandingAmount: `
      SELECT COALESCE(SUM(remaining_amount), 0) AS sum FROM invoices 
      WHERE user_id = ? AND (status = 'pending' OR status = 'partially_paid') 
      ${organizationId ? "AND organization_id = ?" : ""}
    `,
     totalExpenses30Days: `
      SELECT COALESCE(SUM(amount), 0) AS sum FROM expenses 
      WHERE user_id = ? ${organizationId ? "AND organization_id = ?" : ""}
      AND expense_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `,
     inventoryStats: `
      SELECT 
        COUNT(*) AS total_items,
        SUM(CASE WHEN stock_quantity <= reorder_level THEN 1 ELSE 0 END) AS low_stock_items
      FROM inventory_items
      WHERE user_id = ? ${organizationId ? "AND organization_id = ?" : ""}
    `,
   };

  const timeRange = req.body.timeRange || "30days";

  
  let dateCondition = "";
  const now = new Date();
  let startDate = new Date();

  switch (timeRange) {
    case "30days":
      startDate.setDate(now.getDate() - 30);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarter":
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }

  dateCondition = `AND date >= '${startDate.toISOString().split("T")[0]}'`;


  const recentActivitiesQuery = `
    (
      SELECT 
        'invoice' AS type,
        id,
        custom_invoice_code AS code,
        client_name AS title,
        final_amount AS amount,
        invoice_date AS date,
        status,
        NULL AS details
      FROM invoices
      WHERE user_id = ? ${organizationId ? "AND organization_id = ?" : ""}
      ORDER BY invoice_date DESC
      LIMIT 5
    )
    UNION ALL
    (
      SELECT 
        'payment' AS type,
        p.id,
        NULL AS code,
        CONCAT('Plaćanje za fakturu #', p.invoice_id) AS title,
        p.amount_paid AS amount,
        p.payment_date AS date,
        NULL AS status,
        p.payment_method AS details
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      WHERE i.user_id = ? ${organizationId ? "AND i.organization_id = ?" : ""}
      ORDER BY p.payment_date DESC
      LIMIT 5
    )
    UNION ALL
    (
      SELECT 
        'order' AS type,
        o.id,
        NULL AS code,
        CONCAT('Narudžba #', o.id) AS title,
        o.total_price AS amount,
        o.order_date AS date,
        o.status,
        s.name AS details
      FROM orders o
      LEFT JOIN suppliers s ON o.supplier_id = s.id
      WHERE o.user_id = ? ${organizationId ? "AND o.organization_id = ?" : ""}
      ORDER BY o.order_date DESC
      LIMIT 5
    )
    UNION ALL
    (
      SELECT 
        'expense' AS type,
        e.id,
        NULL AS code,
        e.name AS title,
        e.amount AS amount,
        e.expense_date AS date,
        NULL AS status,
        ec.name AS details
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      WHERE e.user_id = ? ${organizationId ? "AND e.organization_id = ?" : ""}
      ORDER BY e.expense_date DESC
      LIMIT 5
    )
    ORDER BY date DESC
    LIMIT 10
  `;

  //Podaci za grafikon (prihodi i troškovi po mjesecima)
  const financialDataQuery = `
    SELECT 
      DATE_FORMAT(date, '%Y-%m') AS month,
      COALESCE(SUM(CASE WHEN type = 'revenue' THEN amount ELSE 0 END), 0) AS revenue,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
    FROM (
      SELECT 
        invoice_date AS date, 
        final_amount AS amount, 
        'revenue' AS type
      FROM invoices
      WHERE user_id = ? 
      ${organizationId ? "AND organization_id = ?" : ""}
      AND status IN ('paid', 'partially_paid')
      AND invoice_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      
      UNION ALL
      
      SELECT 
        expense_date AS date, 
        amount, 
        'expense' AS type
      FROM expenses
      WHERE user_id = ? 
      ${organizationId ? "AND organization_id = ?" : ""}
      AND expense_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
    ) AS combined_data
    GROUP BY DATE_FORMAT(date, '%Y-%m')
    ORDER BY month ASC
  `;

  //Upozorenja za zalihe
  const inventoryAlertsQuery = `
    SELECT 
      id,
      item_name,
      stock_quantity,
      reorder_level,
      price
    FROM inventory_items
    WHERE user_id = ? ${organizationId ? "AND organization_id = ?" : ""}
    AND stock_quantity <= reorder_level
    ORDER BY stock_quantity ASC
    LIMIT 10
  `;

  const queryParams = organizationId ? [userId, organizationId] : [userId];
  const financialParams = organizationId
    ? [userId, organizationId, userId, organizationId]
    : [userId, userId];

  db.query(
    statsQueries.totalInvoices30Days,
    queryParams,
    (err, invoicesResult) => {
      if (err) return handleError(res, err, "Ukupne fakture");

      db.query(
        statsQueries.totalRevenue30Days,
        queryParams,
        (err, revenueResult) => {
          if (err) return handleError(res, err, "Ukupni prihodi");

          db.query(
            statsQueries.outstandingAmount,
            queryParams,
            (err, outstandingResult) => {
              if (err) return handleError(res, err, "Neizmireni iznosi");

              db.query(
                statsQueries.totalExpenses30Days,
                queryParams,
                (err, expensesResult) => {
                  if (err) return handleError(res, err, "Ukupni troškovi");

                  db.query(
                    statsQueries.inventoryStats,
                    queryParams,
                    (err, inventoryResult) => {
                      if (err) return handleError(res, err, "Stanje zaliha");

                      db.query(
                        recentActivitiesQuery,
                        [
                          ...queryParams,
                          ...queryParams,
                          ...queryParams,
                          ...queryParams,
                        ],
                        (err, activitiesResult) => {
                          if (err)
                            return handleError(res, err, "Nedavne aktivnosti");

                          db.query(
                            financialDataQuery,
                            financialParams,
                            (err, financialResult) => {
                              if (err)
                                return handleError(
                                  res,
                                  err,
                                  "Financijski podaci"
                                );

                              db.query(
                                inventoryAlertsQuery,
                                queryParams,
                                (err, alertsResult) => {
                                  if (err)
                                    return handleError(
                                      res,
                                      err,
                                      "Upozorenja zaliha"
                                    );

                                  res.status(200).json({
                                    success: true,
                                    stats: {
                                      total_invoices:
                                        invoicesResult[0]?.count || 0,
                                      total_revenue: revenueResult[0]?.sum || 0,
                                      outstanding_amount:
                                        outstandingResult[0]?.sum || 0,
                                      total_expenses:
                                        expensesResult[0]?.sum || 0,
                                      inventory_stats: {
                                        total_items:
                                          inventoryResult[0]?.total_items || 0,
                                        low_stock_items:
                                          inventoryResult[0]?.low_stock_items ||
                                          0,
                                      },
                                    },
                                    recent_activities: activitiesResult || [],
                                    financial_data: financialResult || [],
                                    inventory_alerts: alertsResult || [],
                                  });
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

function handleError(res, err, context) {
  console.error(`Greška pri dohvaćanju ${context}:`, err);
  return res.status(500).json({ error: `Greška na serveru (${context})` });
}

router.post("/getRecentActivities", (req, res) => {
  const { userId, organizationId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje UserID!" });
  }

  const query = `
    (
      SELECT 
        'invoice' AS type,
        id,
        custom_invoice_code AS code,
        client_name AS title,
        final_amount AS amount,
        invoice_date AS date,
        status,
        NULL AS details
      FROM invoices
      WHERE user_id = ? ${organizationId ? "AND organization_id = ?" : ""}
      ORDER BY invoice_date DESC
      LIMIT 5
    )
    UNION ALL
    (
      SELECT 
        'payment' AS type,
        p.id,
        NULL AS code,
        CONCAT('Plaćanje za fakturu #', p.invoice_id) AS title,
        p.amount_paid AS amount,
        p.payment_date AS date,
        NULL AS status,
        p.payment_method AS details
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      WHERE i.user_id = ? ${organizationId ? "AND i.organization_id = ?" : ""}
      ORDER BY p.payment_date DESC
      LIMIT 5
    )
    UNION ALL
    (
      SELECT 
        'order' AS type,
        o.id,
        NULL AS code,
        CONCAT('Narudžba #', o.id) AS title,
        o.total_price AS amount,
        o.order_date AS date,
        o.status,
        s.name AS details
      FROM orders o
      LEFT JOIN suppliers s ON o.supplier_id = s.id
      WHERE o.user_id = ? ${organizationId ? "AND o.organization_id = ?" : ""}
      ORDER BY o.order_date DESC
      LIMIT 5
    )
    ORDER BY date DESC
    LIMIT 10
  `;

  const queryParams = organizationId
    ? [userId, organizationId, userId, organizationId, userId, organizationId]
    : [userId, userId, userId];

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Greška pri dohvaćanju nedavnih aktivnosti!", err);
      return res.status(500).json({ error: "Greška na serveru!" });
    }

    res.status(200).json({
      success: true,
      activities: results,
    });
  });
});

router.post("/getInventoryAlerts", (req, res) => {
  const { userId, organizationId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje UserID!" });
  }

  const query = `
    SELECT 
      id,
      item_name,
      stock_quantity,
      reorder_level,
      price
    FROM inventory_items
    WHERE user_id = ? ${organizationId ? "AND organization_id = ?" : ""}
    AND stock_quantity <= reorder_level
    ORDER BY stock_quantity ASC
    LIMIT 10
  `;

  const queryParams = organizationId ? [userId, organizationId] : [userId];

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Greška pri dohvaćanju upozorenja za zalihe!", err);
      return res.status(500).json({ error: "Greška na serveru!" });
    }

    res.status(200).json({
      success: true,
      alerts: results,
    });
  });
});

module.exports = router;
