import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      default: "sent",
      enum: ["sent", "delivered", "seen"],
    },
    replyTo: {
      type: String,
      default: null,
    },
    reactions: {
      type: [String],
      default: [],
    },

    // ✅ Jin users ne apne side se ye message delete kiya (one-sided delete)
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("Message", messageSchema);
