// routes/schemeRoutes.js
const express = require("express");
const router = express.Router();
const {
  createScheme,
  getSchemes,
  getSchemeById,
  updateScheme,
  deleteScheme,
} = require("../controllers/schemeController");
const { protect, authorize } = require("../middlewares/authMiddleware");

// Public → view schemes
router.get("/", getSchemes);
router.get("/:id", getSchemeById);

// Admin only → manage schemes
router.post("/", protect, authorize("Admin"), createScheme);
router.put("/:id", protect, authorize("Admin"), updateScheme);
router.delete("/:id", protect, authorize("Admin"), deleteScheme);

module.exports = router;
