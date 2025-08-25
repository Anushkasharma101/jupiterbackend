// routes/subAccountRoutes.js
const express = require("express");
const router = express.Router();
const {
  createSubAccount,
  getUserSubAccounts,
  getSubAccountByIdAdmin,
  updateSubAccount,
  deleteSubAccount,
} = require("../controllers/subAccountController");
const { protect,authorize } = require("../middlewares/authMiddleware");

// Create sub-account
router.post("/", protect, createSubAccount);

// Get all sub-accounts of a user
router.get("/:accountId", protect, getUserSubAccounts);

router.get("/admin/:id", protect,authorize("Admin"), getSubAccountByIdAdmin);

// Update sub-account
router.put("/:id", protect, updateSubAccount);

// Delete sub-account
router.delete("/:id", protect, deleteSubAccount);

module.exports = router;
