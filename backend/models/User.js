import mongoose from "mongoose";

const friendSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },

  // per-user chat-list preferences — these live on MY copy of the
  // friend entry only, so pinning/archiving a chat never affects
  // what the other person sees on their side.
  pinned: { type: Boolean, default: false },
  archived: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    avatar: { type: String, default: "" },
    status: { type: String, default: "Available" },

    friends: [friendSchema],

    // ✅ PASSWORD RESET FIELDS (Nodemailer system ke liye zaroori)
    resetPasswordToken: {
      type: String,
      default: undefined,
    },
    resetPasswordExpires: {
      type: Date,
      default: undefined,
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
