import mongoose from "mongoose";
import Message from "../models/Message.js";

// ================= SEND MESSAGE =================
export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, text, replyTo } = req.body;

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      replyTo: replyTo || null,
      status: "sent",
      deletedFor: [],
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET CHAT BETWEEN TWO USERS =================
export const getMessages = async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ message: "Invalid Sender ID" });
    }

    const meId = new mongoose.Types.ObjectId(senderId);

    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
      deletedFor: { $ne: meId }, // ✅ Sirf wahi msgs jo user ne delete nahi kiye
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= UPDATE MESSAGE STATUS =================
export const updateMessageStatus = async (req, res) => {
  try {
    const { messageId, status } = req.body;

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { status },
      { new: true },
    );

    if (!updatedMessage) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.status(200).json(updatedMessage);
  } catch (error) {
    console.error("Status Update Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ================= UNSEND MESSAGE (DELETE FOR EVERYONE) =================
export const unsendMessage = async (req, res) => {
  try {
    const { messageId, senderId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid Message ID" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // ✅ Security: Sirf sender hi apna message unsend kar sakta hai
    if (message.senderId.toString() !== senderId) {
      return res
        .status(403)
        .json({
          message: "Unauthorized: You can only unsend your own messages",
        });
    }

    // ✅ Physically delete from database (Delete for Everyone)
    await Message.findByIdAndDelete(messageId);

    res
      .status(200)
      .json({ success: true, message: "Message unsent successfully" });
  } catch (err) {
    console.error("Unsend Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================= DELETE CHAT (SIRF EK SIDE SE) =================
export const deleteChatForUser = async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    if (!userId || !friendId) {
      return res.status(400).json({ message: "userId and friendId required" });
    }

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(friendId)
    ) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const meId = new mongoose.Types.ObjectId(userId);
    const frId = new mongoose.Types.ObjectId(friendId);

    // ✅ Messages ko physically delete nahi karte, bas deletedFor array mein userId daal dete hain
    const result = await Message.updateMany(
      {
        $or: [
          { senderId: meId, receiverId: frId },
          { senderId: frId, receiverId: meId },
        ],
      },
      { $addToSet: { deletedFor: meId } },
    );

    res.status(200).json({
      success: true,
      modified: result.modifiedCount,
      message: "Chat cleared from your side",
    });
  } catch (error) {
    console.error("Delete Chat Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
