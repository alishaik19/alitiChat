import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: String,
    receiver: String,
    message: String,
  },
  { timestamps: true },
);

export default mongoose.model("Message", messageSchema);
