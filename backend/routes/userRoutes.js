import express from "express";
import upload from "../middleware/upload.js";
import { uploadAvatar, updateProfile } from "../controllers/userController.js";

const router = express.Router();

// 🔥 Upload avatar route (Cloudinary + multer)
router.post("/upload-avatar", upload.single("avatar"), uploadAvatar);
router.put("/update-profile", updateProfile);

export default router;
