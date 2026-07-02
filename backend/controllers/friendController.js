import User from "../models/User.js";

// ================= SEND FRIEND REQUEST =================
export const sendFriendRequest = async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;

    if (!fromUserId || !toUserId) {
      return res.status(400).json({ message: "Missing user ids" });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({ message: "Cannot add yourself" });
    }

    const toUser = await User.findById(toUserId);

    if (!toUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const existing = toUser.friends.find(
      (f) => f.userId.toString() === fromUserId,
    );

    // pending → block (only one request at a time)
    if (existing?.status === "pending") {
      return res.status(400).json({ message: "Request already sent" });
    }

    // accepted → block
    if (existing?.status === "accepted") {
      return res.status(400).json({ message: "Already friends" });
    }

    // rejected (or no entry) → remove ALL stale entries for this user
    // first so we never end up with duplicates, then push exactly one
    toUser.friends = toUser.friends.filter(
      (f) => f.userId.toString() !== fromUserId,
    );

    toUser.friends.push({
      userId: fromUserId,
      status: "pending",
    });

    await toUser.save();

    res.json({ message: "Friend request sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GET INCOMING (PENDING) REQUESTS =================
export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId).populate("friends.userId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const requests = user.friends.filter((f) => f.status === "pending");

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GET OUTGOING (SENT) REQUESTS =================
export const getSentRequests = async (req, res) => {
  try {
    const userId = req.params.userId;

    const usersWithPendingFromMe = await User.find({
      friends: { $elemMatch: { userId, status: "pending" } },
    }).select("_id");

    const sentTo = usersWithPendingFromMe.map((u) => u._id.toString());

    res.json(sentTo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= ACCEPT FRIEND REQUEST =================
export const acceptFriendRequest = async (req, res) => {
  try {
    const { userId, requestId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const request = user.friends.id(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // if it's already accepted, don't do anything again (guards
    // against double-click / duplicate network calls)
    if (request.status === "accepted") {
      return res.json({ message: "Already accepted" });
    }

    request.status = "accepted";
    const senderId = request.userId.toString();

    // de-dupe: keep only ONE entry per userId in my own list too
    const seen = new Set();
    user.friends = user.friends.filter((f) => {
      const key = f.userId.toString();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    await user.save();

    // mirror on the sender's side, de-duped as well
    const sender = await User.findById(senderId);

    if (sender) {
      const mirrored = sender.friends.find(
        (f) => f.userId.toString() === userId,
      );

      if (mirrored) {
        mirrored.status = "accepted";
      } else {
        sender.friends.push({ userId, status: "accepted" });
      }

      const senderSeen = new Set();
      sender.friends = sender.friends.filter((f) => {
        const key = f.userId.toString();
        if (senderSeen.has(key)) return false;
        senderSeen.add(key);
        return true;
      });

      await sender.save();
    }

    res.json({ message: "Friend request accepted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= REJECT FRIEND REQUEST =================
// Removes the request completely so the sender can send exactly one
// fresh request again later (handled by sendFriendRequest above).
export const rejectFriendRequest = async (req, res) => {
  try {
    const { userId, requestId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const request = user.friends.id(requestId);
    const rejectedFromId = request?.userId?.toString();

    user.friends = user.friends.filter((f) => f._id?.toString() !== requestId);

    await user.save();

    res.json({ message: "Request rejected", fromUserId: rejectedFromId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= PIN / UNPIN A CHAT =================
export const togglePinFriend = async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const entry = user.friends.find((f) => f.userId.toString() === friendId);
    if (!entry) return res.status(404).json({ message: "Friend not found" });

    entry.pinned = !entry.pinned;
    await user.save();

    res.json({ pinned: entry.pinned });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= ARCHIVE / UNARCHIVE A CHAT =================
export const toggleArchiveFriend = async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const entry = user.friends.find((f) => f.userId.toString() === friendId);
    if (!entry) return res.status(404).json({ message: "Friend not found" });

    entry.archived = !entry.archived;
    await user.save();

    res.json({ archived: entry.archived });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= DELETE CHAT (messages only, friendship stays) =================
// NOTE: this project's current code doesn't include a Message model,
// so this is wired to call your messages API once you have one —
// e.g. Message.deleteMany({ chatId: [userId, friendId].sort().join("_") })
// or however you identify a conversation between two users.
// For now it just acknowledges the request; plug in your real delete
// logic here so the endpoint actually clears stored messages.
export const deleteChatHistory = async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    if (!userId || !friendId) {
      return res.status(400).json({ message: "Missing user ids" });
    }

    // TODO: replace with your real message-deletion query, e.g.:
    // await Message.deleteMany({
    //   $or: [
    //     { sender: userId, receiver: friendId },
    //     { sender: friendId, receiver: userId },
    //   ],
    // });

    res.json({ message: "Chat history deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= REMOVE FRIEND (unfriend, both sides) =================
// This ends the friendship entirely — both users lose each other from
// their chat list, and either side can send a fresh request later.
export const removeFriend = async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.friends = user.friends.filter((f) => f.userId.toString() !== friendId);
    await user.save();

    const friend = await User.findById(friendId);
    if (friend) {
      friend.friends = friend.friends.filter(
        (f) => f.userId.toString() !== userId,
      );
      await friend.save();
    }

    res.json({ message: "Friend removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GET ACCEPTED FRIENDS LIST =================
export const getFriendsList = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId).populate("friends.userId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // de-dupe by userId — belt and braces in case old duplicate
    // entries exist in the DB from before this fix
    const seen = new Set();
    const friends = [];

    for (const f of user.friends) {
      if (f.status !== "accepted" || !f.userId) continue;
      const key = f.userId._id.toString();
      if (seen.has(key)) continue;
      seen.add(key);
      friends.push({
        ...f.userId.toObject(),
        pinned: f.pinned,
        archived: f.archived,
      });
    }

    res.json(friends);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
