import Message from "../models/Message.js";

// SEND MESSAGE
export const sendMessage = async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;

    const newMessage = await Message.create({
      sender,
      receiver,
      message,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET CHAT BETWEEN TWO USERS
export const getMessages = async (req, res) => {
  try {
    const { sender, receiver } = req.query;

    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
