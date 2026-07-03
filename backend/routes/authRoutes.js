import express from "express";
import {
  register,
  login,
  verifyEmail,
  resendOTP,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

// AUTH ROUTES
router.post("/register", register);
router.post("/login", login);

// EMAIL VERIFICATION
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);

// FORGOT PASSWORD
router.post("/forgot-password", forgotPassword);

// RESET PASSWORD
router.post("/reset-password/:token", resetPassword);

export default router;
