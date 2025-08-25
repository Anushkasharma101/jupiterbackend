// routes/transactionRoutes.js
const express = require("express");
const router = express.Router();
const {
  createTransaction,
  getTransactions,
} = require("../controllers/transactionController");
const { protect } = require("../middlewares/authMiddleware");

// Create transaction
router.post("/", protect, createTransaction);

// Get all transactions of a sub-account
router.get("/:subAccountId", protect, getTransactions);

module.exports = router;
