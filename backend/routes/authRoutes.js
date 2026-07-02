import express from "express";
import {
  register,
  login,
  forgotPassword, // ✅ verifyUser ki jagah forgotPassword (jo email bhejega)
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

// AUTH ROUTES
router.post("/register", register);
router.post("/login", login);

// ✅ FORGOT PASSWORD (Email bhejne ke liye)
router.post("/forgot-password", forgotPassword);

// ✅ RESET PASSWORD (Gmail link se token lene ke liye)
router.post("/reset-password/:token", resetPassword);

export default router;
