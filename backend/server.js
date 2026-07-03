import dotenv from "dotenv";
// ✅ Sabse pehle config load karein
dotenv.config();

import express from "express";
import http from "http";
import cors from "cors";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";

import { initSocket } from "./socket/socket.js";

const app = express();
const server = http.createServer(app);

initSocket(server);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*", // .env se origin uthayega
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.log("SERVER START ERROR:", error);
    process.exit(1);
  }
};

startServer();
