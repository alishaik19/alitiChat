import express from "express";
import upload from "../middleware/upload.js";
import { uploadAvatar, updateProfile } from "../controllers/userController.js";
import User from "../models/User.js";

const router = express.Router();
router.get("/all", async (req, res) => {
  try {
    const users = await User.find({}, "username avatar status");

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔥 Upload avatar route (Cloudinary + multer)
router.post("/upload-avatar", upload.single("avatar"), uploadAvatar);
router.put("/update-profile", updateProfile);

export default router;
