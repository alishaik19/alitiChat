import express from "express";
import {
  sendFriendRequest,
  getFriendRequests,
  getSentRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendsList,
  togglePinFriend,
  toggleArchiveFriend,
  deleteChatHistory,
  removeFriend,
} from "../controllers/friendController.js";

const router = express.Router();

router.post("/send", sendFriendRequest);
router.get("/requests/:userId", getFriendRequests);
router.get("/sent/:userId", getSentRequests);
router.post("/accept", acceptFriendRequest);
router.post("/reject", rejectFriendRequest);
router.get("/list/:userId", getFriendsList);

router.post("/pin", togglePinFriend);
router.post("/archive", toggleArchiveFriend);
router.post("/delete-chat", deleteChatHistory);
router.post("/remove", removeFriend);

export default router;
