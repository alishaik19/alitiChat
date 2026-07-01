import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// socket
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// middleware
app.use(cors());
app.use(express.json());

// DB connect
const startServer = async () => {
  try {
    await connectDB();

    console.log("DB connected successfully");

    // routes
    app.use("/api/auth", authRoutes);
    app.use("/api/messages", messageRoutes);
    app.use("/api/users", userRoutes); // ✅ NEW ADDED

    app.get("/", (req, res) => {
      res.send("API is running...");
    });

    // socket
    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      socket.on("send_message", (data) => {
        io.emit("receive_message", data);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected");
      });
    });

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.log("SERVER START ERROR:", error);
  }
};

startServer();
