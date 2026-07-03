import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import "./Sidebar.css";
import { FiSettings, FiUserPlus, FiMoreVertical } from "react-icons/fi";
import { toast } from "react-toastify";
import { io } from "socket.io-client";

function Sidebar({ onSelectUser, onOpenProfile, currentUser, onChatDeleted }) {
  const currentUserId = currentUser?._id || currentUser?.id;

  const [allUsers, setAllUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [query, setQuery] = useState("");

  const [unreadCounts, setUnreadCounts] = useState({});

  // ✅ NAYA STATE: har friend ki last activity (timestamp) — WhatsApp jaisi sorting ke liye
  const [lastActivity, setLastActivity] = useState({});

  const loadedRef = useRef(false);

  const [showFriends, setShowFriends] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");

  const [sentRequests, setSentRequests] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [showArchived, setShowArchived] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const socket = useMemo(() => {
    return io(import.meta.env.VITE_API_URL);
  }, []);

  // LOAD unreadCounts + lastActivity from localStorage jab currentUserId ready ho
  useEffect(() => {
    if (!currentUserId) return;
    try {
      const savedUnread =
        JSON.parse(localStorage.getItem(`chat_unread_${currentUserId}`)) || {};
      const savedActivity =
        JSON.parse(localStorage.getItem(`chat_activity_${currentUserId}`)) ||
        {};
      setUnreadCounts(savedUnread);
      setLastActivity(savedActivity);
    } catch {
      setUnreadCounts({});
      setLastActivity({});
    }
    loadedRef.current = true;
  }, [currentUserId]);

  // SAVE unreadCounts (sirf load ke baad)
  useEffect(() => {
    if (!currentUserId || !loadedRef.current) return;
    localStorage.setItem(
      `chat_unread_${currentUserId}`,
      JSON.stringify(unreadCounts),
    );
  }, [unreadCounts, currentUserId]);

  // ✅ SAVE lastActivity (sirf load ke baad)
  useEffect(() => {
    if (!currentUserId || !loadedRef.current) return;
    localStorage.setItem(
      `chat_activity_${currentUserId}`,
      JSON.stringify(lastActivity),
    );
  }, [lastActivity, currentUserId]);

  // Socket Online Listener
  useEffect(() => {
    if (!currentUserId) return;

    socket.emit("user-online", currentUserId);

    socket.on("online-users", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("online-users");
    };
  }, [currentUserId, socket]);

  // ✅ Real-time New Message Notifications — unread count + sequence (lastActivity) dono update
  useEffect(() => {
    if (!socket) return;

    const handleNewMessageNotification = (data) => {
      const senderId = data.senderId;

      // ✅ Jiska message aaya usko upar le aao
      setLastActivity((prev) => ({
        ...prev,
        [senderId]: Date.now(),
      }));

      if (activeId === senderId) return;

      setUnreadCounts((prev) => ({
        ...prev,
        [senderId]: (prev[senderId] || 0) + 1,
      }));
    };

    socket.on("new_message_notification", handleNewMessageNotification);

    return () => {
      socket.off("new_message_notification", handleNewMessageNotification);
    };
  }, [socket, activeId]);

  // ✅ Jab tum khud message bhejo (ChatWindow se) — tab bhi wo chat upar aaye
  useEffect(() => {
    const handleMessageSent = (e) => {
      const receiverId = e?.detail?.receiverId;
      if (!receiverId) return;
      setLastActivity((prev) => ({
        ...prev,
        [receiverId]: Date.now(),
      }));
    };

    window.addEventListener("message-sent", handleMessageSent);
    return () => window.removeEventListener("message-sent", handleMessageSent);
  }, []);

  // Chat open hote hi: unread count reset -> row wapas Online/Offline dikhayega
  useEffect(() => {
    if (!activeId) return;
    setUnreadCounts((prev) => ({ ...prev, [activeId]: 0 }));
  }, [activeId]);

  useEffect(() => {
    setFriends((prev) =>
      prev.map((friend) => ({
        ...friend,
        isOnline: onlineUsers.includes(friend._id),
      })),
    );
  }, [onlineUsers]);

  const dedupeById = (list) => {
    const seen = new Set();
    return (list || []).filter((u) => {
      if (!u?._id || seen.has(u._id)) return false;
      seen.add(u._id);
      return true;
    });
  };

  // FETCH ALL USERS
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/users/all`,
        );
        setAllUsers(res.data || []);
      } catch (err) {
        console.log("USER FETCH ERROR:", err);
      }
    };
    fetchUsers();
  }, []);

  // FETCH ACCEPTED FRIENDS
  // FETCH ACCEPTED FRIENDS
  const fetchFriends = async () => {
    if (!currentUserId) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/friends/list/${currentUserId}`,
      );
      const updatedFriends = dedupeById(res.data).map((friend) => ({
        ...friend,
        isOnline: onlineUsers.includes(friend._id),
      }));
      setFriends(updatedFriends);

      // ✅ lastActivity — server ka time authoritative
      setLastActivity((prev) => {
        const updated = { ...prev };
        updatedFriends.forEach((f) => {
          if (f.lastMessageTime) {
            const serverTime = new Date(f.lastMessageTime).getTime();
            if (!updated[f._id] || serverTime > updated[f._id]) {
              updated[f._id] = serverTime;
            }
          }
        });
        return updated;
      });

      // ✅ unreadCount — server ka count authoritative
      // (isse user B ka browser band ho tab bhi wapas aane par sahi count dikhega)
      setUnreadCounts((prev) => {
        const updated = { ...prev };
        updatedFriends.forEach((f) => {
          if (typeof f.unreadCount === "number") {
            updated[f._id] = f.unreadCount;
          }
        });
        return updated;
      });
    } catch (err) {
      console.log("FRIENDS FETCH ERROR:", err);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [currentUserId]);

  // FETCH INCOMING REQUESTS
  const fetchRequests = async () => {
    if (!currentUserId) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/friends/requests/${currentUserId}`,
      );
      setFriendRequests(res.data || []);
    } catch (err) {
      console.log("REQUEST ERROR:", err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentUserId]);

  // FETCH SENT REQUESTS
  const fetchSent = async () => {
    if (!currentUserId) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/friends/sent/${currentUserId}`,
      );
      setSentRequests(res.data || []);
    } catch (err) {
      console.log("SENT FETCH ERROR:", err);
    }
  };

  useEffect(() => {
    fetchSent();
  }, [currentUserId]);

  // Close menu on outside click
  useEffect(() => {
    const close = () => setOpenMenuId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  // ACTIONS
  const sendFriendRequest = async (toUserId) => {
    if (!currentUserId || !toUserId) return;
    if (sentRequests.includes(toUserId)) return;

    setSentRequests((prev) => [...prev, toUserId]);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/friends/send`, {
        fromUserId: currentUserId,
        toUserId,
      });
      toast.success("Friend request sent");
    } catch (err) {
      console.log("SEND ERROR:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Couldn't send request");
      setSentRequests((prev) => prev.filter((id) => id !== toUserId));
    }
  };

  const acceptRequest = async (requestId, fromUserId) => {
    setFriendRequests((prev) => prev.filter((r) => r._id !== requestId));
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/friends/accept`, {
        userId: currentUserId,
        requestId,
      });
      toast.success("Friend request accepted");
      fetchFriends();
      if (fromUserId) {
        setSentRequests((prev) => prev.filter((id) => id !== fromUserId));
      }
    } catch (err) {
      console.log("ACCEPT ERROR:", err.message);
      toast.error("Couldn't accept request");
      fetchRequests();
    }
  };

  const rejectRequest = async (requestId) => {
    setFriendRequests((prev) => prev.filter((r) => r._id !== requestId));
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/friends/reject`, {
        userId: currentUserId,
        requestId,
      });
      toast.info("Friend request rejected");
    } catch (err) {
      console.log("REJECT ERROR:", err.message);
      toast.error("Couldn't reject request");
      fetchRequests();
    }
  };

  const togglePin = async (friendId) => {
    const wasPinned = friends.find((f) => f._id === friendId)?.pinned;
    setFriends((prev) =>
      prev.map((f) => (f._id === friendId ? { ...f, pinned: !f.pinned } : f)),
    );
    setOpenMenuId(null);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/friends/pin`, {
        userId: currentUserId,
        friendId,
      });
      toast.success(wasPinned ? "Chat unpinned" : "Chat pinned");
    } catch (err) {
      console.log("PIN ERROR:", err.message);
      toast.error("Couldn't update pin");
      fetchFriends();
    }
  };

  const toggleArchive = async (friendId) => {
    const wasArchived = friends.find((f) => f._id === friendId)?.archived;
    setFriends((prev) =>
      prev.map((f) =>
        f._id === friendId ? { ...f, archived: !f.archived } : f,
      ),
    );
    setOpenMenuId(null);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/friends/archive`, {
        userId: currentUserId,
        friendId,
      });
      toast.success(wasArchived ? "Chat unarchived" : "Chat archived");
    } catch (err) {
      console.log("ARCHIVE ERROR:", err.message);
      toast.error("Couldn't update archive");
      fetchFriends();
    }
  };

  const deleteChat = (friendId, friendName) => {
    setOpenMenuId(null);
    setConfirmDialog({ type: "deleteChat", friendId, friendName });
  };

  const removeFriend = (friendId, friendName) => {
    setOpenMenuId(null);
    setConfirmDialog({ type: "removeFriend", friendId, friendName });
  };

  const runConfirmedAction = async () => {
    if (!confirmDialog) return;
    const { type, friendId } = confirmDialog;
    setConfirmDialog(null);

    if (type === "deleteChat") {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/messages/delete-chat`,
          { userId: currentUserId, friendId },
        );

        console.log("DELETE CHAT RESPONSE:", res.data);

        setUnreadCounts((prev) => {
          const updated = { ...prev };
          delete updated[friendId];
          return updated;
        });

        // ✅ Delete hone par sequence se bhi hata do
        setLastActivity((prev) => {
          const updated = { ...prev };
          delete updated[friendId];
          return updated;
        });

        window.dispatchEvent(
          new CustomEvent("chat-deleted", { detail: { friendId } }),
        );

        if (onChatDeleted) onChatDeleted(friendId);

        toast.success("Chat history deleted");
      } catch (err) {
        console.log("DELETE CHAT ERROR:", err.response?.data || err.message);
        toast.error("Couldn't delete chat history");
      }
    }

    if (type === "removeFriend") {
      setFriends((prev) => prev.filter((f) => f._id !== friendId));
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/friends/remove`, {
          userId: currentUserId,
          friendId,
        });
        toast.success("Friend removed");
      } catch (err) {
        console.log("REMOVE FRIEND ERROR:", err.message);
        toast.error("Couldn't remove friend");
        fetchFriends();
      }
    }
  };

  const friendResults = useMemo(() => {
    const filtered = (allUsers || []).filter((u) => u?._id !== currentUserId);
    if (!friendSearch.trim()) return filtered.slice(0, 5);
    return filtered.filter((u) =>
      (u?.username || "").toLowerCase().includes(friendSearch.toLowerCase()),
    );
  }, [allUsers, friendSearch, currentUserId]);

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((n) => n?.[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const getGradient = (id) => {
    const colors = [
      ["#FF8A65", "#FF5E62"],
      ["#6C63FF", "#8E7CFF"],
      ["#4ECDC4", "#3AB0A6"],
      ["#FFB86B", "#FF8A3D"],
    ];
    const str = String(id || "");
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
    const [from, to] = colors[hash % colors.length];
    return `linear-gradient(135deg, ${from}, ${to})`;
  };

  const activeFriends = friends.filter((f) => !f.archived);
  const archivedFriends = friends.filter((f) => f.archived);

  // ✅ SORTING: Pehle Pinned, uske baad jisne sabse recent message kiya wo upar (WhatsApp style)
  const filteredFriends = useMemo(() => {
    return activeFriends
      .filter((u) =>
        (u?.username || "").toLowerCase().includes(query.toLowerCase()),
      )
      .sort((a, b) => {
        // 1. Pinned chats hamesha sabse upar
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;

        // 2. Baaki sab last activity (naya message) ke hisaab se, sabse naya upar
        const timeA = lastActivity[a._id] || 0;
        const timeB = lastActivity[b._id] || 0;
        return timeB - timeA;
      });
  }, [activeFriends, query, lastActivity]);

  // RENDER ROW — hamesha Online/Offline, kabhi last message preview nahi
  const renderChatRow = (u, isArchived = false) => {
    const count = unreadCounts[u._id] || 0;

    return (
      <div
        key={u._id}
        className={`user-item ${activeId === u._id ? "active" : ""} ${
          openMenuId === u._id ? "menu-open" : ""
        }`}
        onClick={() => {
          setActiveId(u._id);
          onSelectUser(u);
        }}
      >
        <div
          className="avatar"
          style={{ background: u.avatar ? "transparent" : getGradient(u._id) }}
        >
          {u.avatar ? (
            <img src={u.avatar} alt={u.username} className="avatar-photo" />
          ) : (
            getInitials(u.username)
          )}
        </div>

        <div className="user-info">
          <div className="user-name">
            {u.pinned && (
              <svg
                className="pin-icon"
                viewBox="0 0 24 24"
                width="13"
                height="13"
              >
                <path
                  d="M14.5 2.5l7 7-3 3-1.5-.5-4 4 .5 5.5-2 2-4-6-5 5-1-1 5-5-6-4 2-2 5.5.5 4-4-.5-1.5z"
                  fill="currentColor"
                />
              </svg>
            )}
            {u.username}
          </div>

          <div className="user-status-line">
            <span className="user-status">
              <span
                className={`status-dot ${u.isOnline ? "online" : "offline"}`}
              />
              {u.isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        {count > 0 && <div className="sidebar-unread-badge">{count}</div>}

        <div className="chat-menu-wrap">
          <button
            className="dots-btn"
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuId(openMenuId === u._id ? null : u._id);
            }}
          >
            <FiMoreVertical size={18} />
          </button>

          {openMenuId === u._id && (
            <div className="chat-menu" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => togglePin(u._id)}>
                {u.pinned ? "Unpin" : "Pin"}
              </button>
              <button onClick={() => toggleArchive(u._id)}>
                {u.archived ? "Unarchive" : "Archive"}
              </button>
              <button onClick={() => deleteChat(u._id, u.username)}>
                Delete Chat
              </button>
              <button
                className="danger"
                onClick={() => removeFriend(u._id, u.username)}
              >
                Remove Friend
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>Chats</h3>
          <div className="header-actions">
            <button className="icon-btn" onClick={() => setShowFriends(true)}>
              <FiUserPlus size={22} />
              {friendRequests.length > 0 && (
                <span className="request-dot">{friendRequests.length}</span>
              )}
            </button>
            <button className="icon-btn" onClick={onOpenProfile}>
              <FiSettings size={22} />
            </button>
          </div>
        </div>

        <input
          className="search-input"
          placeholder="Search friends..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="user-list">
          {filteredFriends.length === 0 && (
            <div className="empty-text">
              No friends yet — tap <FiUserPlus size={14} /> to add someone
            </div>
          )}

          {filteredFriends.map((u) => renderChatRow(u))}

          {archivedFriends.length > 0 && (
            <div className="archived-section">
              <button
                className="archived-toggle"
                onClick={() => setShowArchived(!showArchived)}
              >
                {showArchived ? "Hide" : "Show"} archived (
                {archivedFriends.length})
              </button>
              {showArchived &&
                archivedFriends.map((u) => renderChatRow(u, true))}
            </div>
          )}
        </div>
      </div>

      {/* FRIEND MODAL */}
      {showFriends && (
        <div className="modal-overlay" onClick={() => setShowFriends(false)}>
          <div
            className="friend-modal split-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-left">
              <h3>Find Friends</h3>
              <input
                className="modal-search"
                placeholder="Search users..."
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
              />
              <p className="suggestion-hint">
                {friendSearch.trim()
                  ? `${friendResults.length} result(s)`
                  : "Suggestions — type a username to search everyone"}
              </p>
              <div className="modal-list">
                {friendResults.map((u) => {
                  const alreadySent = sentRequests.includes(u._id);
                  return (
                    <div key={u._id} className="friend-item">
                      <div
                        className="avatar small"
                        style={{
                          background: u.avatar
                            ? "transparent"
                            : getGradient(u._id),
                        }}
                      >
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={u.username}
                            className="avatar-photo"
                          />
                        ) : (
                          getInitials(u.username)
                        )}
                      </div>
                      <div className="friend-info">
                        <div>{u.username}</div>
                        <small>{u.status}</small>
                      </div>
                      <button
                        className="add-btn"
                        disabled={alreadySent}
                        onClick={() => sendFriendRequest(u._id)}
                      >
                        {alreadySent ? "Pending" : "Add"}
                      </button>
                    </div>
                  );
                })}
                {friendResults.length === 0 && (
                  <p className="empty-text">No users found</p>
                )}
              </div>
            </div>

            <div className="modal-right">
              <h3>Friend Requests</h3>
              {friendRequests.length === 0 ? (
                <p className="empty-text">No requests yet</p>
              ) : (
                friendRequests.map((req) => (
                  <div key={req._id} className="friend-item">
                    <div
                      className="avatar small"
                      style={{
                        background: req.userId?.avatar
                          ? "transparent"
                          : getGradient(req.userId?._id),
                      }}
                    >
                      {req.userId?.avatar ? (
                        <img
                          src={req.userId.avatar}
                          alt={req.userId?.username}
                          className="avatar-photo"
                        />
                      ) : (
                        getInitials(req.userId?.username)
                      )}
                    </div>
                    <div className="friend-info">
                      <div>{req.userId?.username}</div>
                      <small>Pending</small>
                    </div>
                    <div className="action-btns">
                      <button
                        className="accept"
                        onClick={() => acceptRequest(req._id, req.userId?._id)}
                      >
                        Accept
                      </button>
                      <button
                        className="reject"
                        onClick={() => rejectRequest(req._id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG */}
      {confirmDialog && (
        <div className="confirm-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: "#fff", marginBottom: "10px" }}>
              {confirmDialog.type === "removeFriend"
                ? "Remove Friend?"
                : "Delete Chat?"}
            </h3>
            <p
              style={{
                color: "#948fb0",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
              {confirmDialog.type === "removeFriend"
                ? `Are you sure you want to remove ${confirmDialog.friendName}?`
                : `This will permanently clear chat with ${confirmDialog.friendName}.`}
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setConfirmDialog(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  background: "#322b47",
                  color: "#fff",
                }}
              >
                Cancel
              </button>
              <button
                onClick={runConfirmedAction}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  background: "#ff6b6b",
                  color: "#fff",
                }}
              >
                {confirmDialog.type === "removeFriend" ? "Remove" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
