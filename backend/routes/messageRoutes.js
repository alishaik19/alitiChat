import express from "express";
import {
  sendMessage,
  getMessages,
  updateMessageStatus,
  deleteChatForUser,
  unsendMessage, // ✅ Controller se import karein
} from "../controllers/messageController.js";

const router = express.Router();

// 1. Send Message
router.post("/send", sendMessage);

// 2. Unsend Message (Delete for Everyone)
router.post("/unsend", unsendMessage);

// 3. Status update (ticks)
router.put("/status", updateMessageStatus);

// 4. Chat delete (Sirf ek side se)
router.post("/delete-chat", deleteChatForUser);

// 5. Get Messages (Dynamic Route)
// ⚠️ Isse humesha SABSE NEECHE rakhein taaki ye dusre routes ko block na kare
router.get("/:senderId/:receiverId", getMessages);

export default router;
