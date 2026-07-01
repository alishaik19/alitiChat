import User from "../models/User.js";

// --------------------
// UPLOAD AVATAR
// --------------------
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const url = req.file.path;

    // ⚠️ IMPORTANT: frontend se userId bhejo
    const { userId } = req.body;

    if (userId) {
      const user = await User.findByIdAndUpdate(
        userId,
        { avatar: url },
        { new: true },
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
    }

    return res.json({ url });
  } catch (err) {
    console.log("UPLOAD ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// --------------------
// UPDATE PROFILE
// --------------------
export const updateProfile = async (req, res) => {
  try {
    const { userId, name, status, avatar } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...(name && { name }),
        ...(status && { status }),
        ...(avatar && { avatar }),
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
        status: user.status || "Available",
      },
    });
  } catch (err) {
    console.log("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
