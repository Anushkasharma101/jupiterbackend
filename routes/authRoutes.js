const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const forgotPasswordController = require("../controllers/forgotPasswordController");
const verifyOtpController = require("../controllers/verifyOtpController");
const resetPasswordController = require("../controllers/resetPasswordController");


router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/forgot-password", forgotPasswordController.forgotPassword);
router.post("/verify-otp", verifyOtpController.verifyOtp);
router.post("/reset-password", resetPasswordController.resetPassword);

module.exports = router;
