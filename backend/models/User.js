import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // 🔥 ADD THIS
    avatar: { type: String, default: "" },
    status: { type: String, default: "Available" },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
