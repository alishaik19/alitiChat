import { Server } from "socket.io";
import Message from "../models/Message.js";

let io;

// userId => Set(socketIds)
const onlineUsers = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    // ================= USER ONLINE =================
    socket.on("user-online", (userId) => {
      try {
        if (!userId) return;
        socket.userId = userId;
        socket.join(userId);

        if (!onlineUsers.has(userId)) {
          onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socket.id);

        io.emit("online-users", [...onlineUsers.keys()]);
      } catch (err) {
        console.log("User Online Error:", err);
      }
    });

    // ================= JOIN ROOM =================
    socket.on("join-room", (userId) => {
      if (!userId) return;
      socket.join(userId);
    });

    // ================= SEND MESSAGE =================
    socket.on("send_message", async (messageData) => {
      try {
        if (!messageData) return;
        const senderId = messageData.senderId;
        const receiverId = messageData.receiverId;

        if (!senderId || !receiverId) return;

        // Receiver aur Sender dono ko message bhejdo
        io.to(receiverId).emit("receive_message", messageData);
        io.to(senderId).emit("receive_message", messageData);

        // Sidebar notification
        io.to(receiverId).emit("new_message_notification", {
          senderId,
          text: messageData.text,
          createdAt: messageData.createdAt,
        });

        // Double Tick Fix: Agar receiver online hai to delivered mark karo
        const receiverOnline =
          onlineUsers.has(receiverId) && onlineUsers.get(receiverId).size > 0;
        if (receiverOnline && messageData._id) {
          const updated = await Message.findByIdAndUpdate(
            messageData._id,
            { status: "delivered" },
            { new: true },
          );
          if (updated) {
            io.to(senderId).emit("message-status-updated", updated);
          }
        }
      } catch (err) {
        console.log("Send Message Error:", err);
      }
    });

    // ================= UNSEND MESSAGE (DELETE FOR EVERYONE) =================
    socket.on("unsend_message", async ({ messageId, senderId, receiverId }) => {
      try {
        if (!messageId || !senderId) return;

        // 1. Database se physically delete karein
        const message = await Message.findById(messageId);
        if (!message) return;

        // Security check: Sirf sender hi unsend kar sakta hai
        if (message.senderId.toString() === senderId) {
          await Message.findByIdAndDelete(messageId);

          // 2. Receiver ko batayein ki message delete ho gaya hai
          io.to(receiverId).emit("message_unsent", messageId);

          // 3. Sender ko confirm karein (multiple devices sync ke liye)
          io.to(senderId).emit("message_unsent", messageId);

          console.log(`Message ${messageId} unsent by ${senderId}`);
        }
      } catch (err) {
        console.log("Unsend Message Error:", err);
      }
    });

    // ================= MESSAGE DELIVERED =================
    socket.on("message-delivered", async (messageId) => {
      try {
        if (!messageId) return;
        const updatedMessage = await Message.findByIdAndUpdate(
          messageId,
          { status: "delivered" },
          { new: true },
        );
        if (updatedMessage) {
          io.to(updatedMessage.senderId.toString()).emit(
            "message-status-updated",
            updatedMessage,
          );
        }
      } catch (err) {
        console.log("Delivered Error:", err);
      }
    });

    // ================= MESSAGE SEEN =================
    socket.on("message-seen", async (messageId) => {
      try {
        if (!messageId) return;
        const updatedMessage = await Message.findByIdAndUpdate(
          messageId,
          { status: "seen" },
          { new: true },
        );
        if (updatedMessage) {
          io.to(updatedMessage.senderId.toString()).emit(
            "message-status-updated",
            updatedMessage,
          );
        }
      } catch (err) {
        console.log("Seen Error:", err);
      }
    });

    // ================= CLEAR CHAT (EK SIDE SE) =================
    socket.on("clear-chat", async ({ userId, friendId }) => {
      try {
        if (!userId || !friendId) return;
        await Message.updateMany(
          {
            $or: [
              { senderId: userId, receiverId: friendId },
              { senderId: friendId, receiverId: userId },
            ],
          },
          { $addToSet: { deletedFor: userId } },
        );
        io.to(userId).emit("chat-cleared", { userId, friendId });
      } catch (err) {
        console.log("Clear Chat Error:", err);
      }
    });

    // ================= TYPING / STOP TYPING =================
    socket.on("typing", (data) => {
      if (data?.receiverId) io.to(data.receiverId).emit("user_typing", data);
    });

    socket.on("stop_typing", (data) => {
      if (data?.receiverId)
        io.to(data.receiverId).emit("user_stop_typing", data);
    });

    // ================= DISCONNECT =================
    socket.on("disconnect", () => {
      try {
        const userId = socket.userId;
        if (!userId) return;
        const userSockets = onlineUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) onlineUsers.delete(userId);
        }
        io.emit("online-users", [...onlineUsers.keys()]);
      } catch (err) {
        console.log("Disconnect Error:", err);
      }
    });
  });

  return io;
};

export const getIO = () => io;
export const getOnlineUsers = () => [...onlineUsers.keys()];
