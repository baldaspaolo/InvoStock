const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/getInventory", (req, res) => {
  const { userId, organizationId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Nedostaje UserID" });
  }

  let query = "";
  let queryParams = [];

  if (organizationId) {
    query = "SELECT * FROM inventory_items WHERE organization_id = ?";
    queryParams = [organizationId];
  } else {
    query = "SELECT * FROM inventory_items WHERE user_id = ?";
    queryParams = [userId];
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Greška prilikom dohvaćanja inventara:", err);
      return res.status(500).json({ error: "Greška na serveru." });
    }

    res.status(200).json({ success: true, inventory: results });
  });
});

router.post("/addInventoryItem", (req,res) =>{
    const {userId, organizationId} = req.body;

    if (!userId){
        return res.status(400).json({error: "Nedostaje userId"});
    }

    
})

module.exports = router;
