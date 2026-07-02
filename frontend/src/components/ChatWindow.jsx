import { useState, useRef, useEffect, useMemo } from "react";
import "./ChatWindow.css";
import { io } from "socket.io-client";
import axios from "axios";
import { FiArrowLeft } from "react-icons/fi";
import { toast } from "react-toastify"; // Ensure toast is imported

function ChatWindow({ selectedUser, onBack, onChatCleared }) {
  const currentUser = useMemo(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (savedUser) {
        if (savedUser.id && !savedUser._id) {
          savedUser._id = savedUser.id;
        }
        return savedUser;
      }
      return null;
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return null;
    }
  }, []);

  const socket = useRef(null);
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  useEffect(() => {
    const closeMenu = () => setActiveMenuId(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);
  // 1. FETCH MESSAGES
  const fetchMessages = async () => {
    if (!selectedUser?._id || !currentUser?._id) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/messages/${currentUser._id}/${selectedUser._id}`,
      );
      setMessages(res.data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  // 2. INITIALIZE SOCKET & STATUS LISTENERS
  useEffect(() => {
    if (!currentUser?._id) return;

    socket.current = io(import.meta.env.VITE_API_URL);
    socket.current.emit("user-online", currentUser._id);
    socket.current.emit("join-room", currentUser._id);

    const handleStatusUpdate = (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === updatedMessage._id
            ? { ...msg, status: updatedMessage.status }
            : msg,
        ),
      );
    };

    const handleChatCleared = ({ userId, friendId }) => {
      if (
        userId === currentUser?._id &&
        (friendId === selectedUser?._id || !selectedUser)
      ) {
        setMessages([]);
      }
    };

    // ✅ UNSEND LISTENER (Recipient side sync)
    const handleMessageUnsent = (messageId) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    };

    socket.current.on("message-status-updated", handleStatusUpdate);
    socket.current.on("chat-cleared", handleChatCleared);
    socket.current.on("message_unsent", handleMessageUnsent);

    return () => {
      socket.current?.off("message-status-updated");
      socket.current?.off("chat-cleared");
      socket.current?.off("message_unsent");
      socket.current?.disconnect();
    };
  }, [currentUser, selectedUser]);

  // 3. HANDLE INCOMING MESSAGES
  useEffect(() => {
    if (!socket.current || !selectedUser?._id || !currentUser?._id) return;

    const handleReceiveMessage = (message) => {
      const isCurrentChat =
        (message.senderId === selectedUser._id &&
          message.receiverId === currentUser._id) ||
        (message.senderId === currentUser._id &&
          message.receiverId === selectedUser._id);

      if (isCurrentChat) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === message._id);
          if (exists) return prev;
          return [...prev, message];
        });

        if (
          message.receiverId === currentUser._id &&
          message.status === "sent"
        ) {
          socket.current.emit("message-delivered", message._id);
        }
      }
    };

    socket.current.on("receive_message", handleReceiveMessage);
    return () => socket.current?.off("receive_message");
  }, [selectedUser, currentUser]);

  // 4. FETCH TRIGGERS & SYNC
  useEffect(() => {
    fetchMessages();
    setShowProfile(false);
  }, [selectedUser, currentUser]);

  // Sidebar Delete Sync
  useEffect(() => {
    const handleLocalDelete = (e) => {
      const friendId = e?.detail?.friendId;
      if (
        friendId &&
        selectedUser &&
        String(friendId) === String(selectedUser._id)
      ) {
        setMessages([]);
      }
    };
    window.addEventListener("chat-deleted", handleLocalDelete);
    return () => window.removeEventListener("chat-deleted", handleLocalDelete);
  }, [selectedUser]);

  // Seen Marking
  useEffect(() => {
    if (!socket.current || !selectedUser?._id) return;
    messages.forEach((msg) => {
      if (
        msg.receiverId === currentUser._id &&
        msg.senderId === selectedUser._id &&
        msg.status !== "seen"
      ) {
        socket.current.emit("message-seen", msg._id);
      }
    });
  }, [messages, selectedUser, currentUser]);
  const [showDotsId, setShowDotsId] = useState(null);

  // Click outside handler ko update karein
  useEffect(() => {
    const closeAll = () => {
      setActiveMenuId(null);
      setShowDotsId(null);
    };
    window.addEventListener("click", closeAll);
    return () => window.removeEventListener("click", closeAll);
  }, []);

  // Scroll Handling
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setShowScrollBtn(!isBottom);
  };

  // 5. CORE ACTIONS (Send & Unsend)
  const sendMessage = async () => {
    if (!currentUser?._id || !selectedUser?._id || !input.trim()) return;

    const messageData = {
      senderId: currentUser._id,
      receiverId: selectedUser._id,
      text: input,
      replyTo: replyTo ? replyTo.text : null,
    };

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/messages/send`,
        messageData,
      );
      setMessages((prev) => [...prev, res.data]);

      window.dispatchEvent(
        new CustomEvent("message-sent", {
          detail: { receiverId: selectedUser._id },
        }),
      );

      if (socket.current) {
        socket.current.emit("send_message", res.data);
      }

      setInput("");
      setReplyTo(null);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // ✅ HANDLED UNSEND (Integrated API + Socket)
  const handleUnsend = async (messageId) => {
    try {
      // 1. API Call
      await axios.post(`${import.meta.env.VITE_API_URL}/api/messages/unsend`, {
        messageId,
        senderId: currentUser._id,
      });

      // 2. Local State Update
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));

      // 3. Socket Emit (Delete for Everyone)
      if (socket.current) {
        socket.current.emit("unsend_message", {
          messageId,
          senderId: currentUser._id,
          receiverId: selectedUser._id,
        });
      }

      // ✅ Toast notification turant
      toast.success("Message unsent successfully", {
        position: "top-right",
        autoClose: 2000,
        theme: "dark",
      });
    } catch (err) {
      console.error("Unsend Error:", err);
      toast.error("Failed to unsend message");
    }
  };

  const addReaction = (messageId, emoji) => {
    setMessages((prev) =>
      prev.map((m) =>
        m._id === messageId
          ? { ...m, reactions: [...(m.reactions || []), emoji] }
          : m,
      ),
    );
  };

  const emojis = ["😂", "❤️", "👍", "🔥", "😮"];

  if (!selectedUser || !currentUser) {
    return (
      <div className="chat-window empty">
        <div>💬</div>
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

  const username = selectedUser?.name || selectedUser?.username || "User";
  const initials = username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="chat-window">
      {/* HEADER — clickable, profile kholega */}
      <div className="chat-header">
        <button className="back-btn" onClick={onBack}>
          ←
        </button>

        <div className="header-clickable" onClick={() => setShowProfile(true)}>
          <div className="header-avatar">
            {selectedUser?.avatar ? (
              <img src={selectedUser.avatar} alt={username} />
            ) : (
              initials
            )}
          </div>

          <div>
            <div className="header-name">{username}</div>
            <div className="header-status">
              {selectedUser?.isOnline ? "Online" : "Offline"}
            </div>
          </div>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="messages" ref={containerRef} onScroll={handleScroll}>
        {messages.length > 0 && <div className="date-sep">Today</div>}

        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser._id;

          return (
            <div
              key={msg._id}
              className={`message-row ${isMe ? "me" : "other"}`}
            >
              <div className="message-container">
                <div
                  className={`message ${activeMenuId === msg._id ? "menu-active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDotsId(showDotsId === msg._id ? null : msg._id);
                    setActiveMenuId(null);
                  }}
                >
                  {/* ✅ DYNAMIC 3-DOT MENU */}
                  <div
                    className={`message-options ${isMe ? "options-left" : "options-right"} ${
                      showDotsId === msg._id || activeMenuId === msg._id
                        ? "visible"
                        : ""
                    }`}
                  >
                    <button
                      className="msg-dots-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(
                          activeMenuId === msg._id ? null : msg._id,
                        );
                      }}
                    >
                      ⋮
                    </button>

                    {activeMenuId === msg._id && (
                      <div
                        /* ✅ FIX: Agar aakhri 3 messages mein se ek hai toh 'open-top' class lagao */
                        className={`msg-dropdown ${
                          messages.indexOf(msg) >= messages.length - 3
                            ? "open-top"
                            : ""
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setReplyTo(msg);
                            setActiveMenuId(null);
                            setShowDotsId(null);
                          }}
                        >
                          Reply
                        </button>
                        {isMe && (
                          <button
                            className="unsend-btn"
                            onClick={() => {
                              handleUnsend(msg._id);
                              setActiveMenuId(null);
                              setShowDotsId(null);
                            }}
                          >
                            Unsend
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ✅ COMPACT REPLY BOX */}
                  {msg.replyTo && (
                    <div className="reply-box">
                      <span className="reply-arrow">↪</span>
                      <div className="reply-text-content">{msg.replyTo}</div>
                    </div>
                  )}

                  {/* ✅ INLINE MESSAGE CONTENT */}
                  <div className="message-content-wrapper">
                    <span className="message-text">{msg.text}</span>

                    <div className="meta">
                      <span className="time">
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : new Date().toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                      </span>
                      {isMe && (
                        <span className={`tick ${msg.status}`}>
                          {msg.status === "sent" && "✓"}
                          {msg.status === "delivered" && "✓✓"}
                          {msg.status === "seen" && "✓✓"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* SCROLL BUTTON */}
      {showScrollBtn && (
        <button
          className="scroll-btn"
          onClick={() =>
            bottomRef.current?.scrollIntoView({ behavior: "smooth" })
          }
        >
          ↓
        </button>
      )}

      {/* INPUT */}

      <div className="chat-input-container">
        {/* 1. REPLY PREVIEW (Input ke upar poori width lega) */}
        {replyTo && (
          <div className="reply-preview-bar">
            <div className="reply-preview-content">
              <span className="reply-tag">Replying to:</span>
              <p className="reply-text">{replyTo.text}</p>
            </div>
            <button
              className="reply-close-btn"
              onClick={() => setReplyTo(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* 2. MAIN INPUT ROW (Reply ke niche) */}
        <div className="chat-input-row">
          <button className="attach-btn">📎</button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />

          <button className="send-btn" onClick={sendMessage}>
            ➤
          </button>
        </div>
      </div>

      {/* ✅ PROFILE — ab FULL SCREEN page hai, chhota modal nahi */}
      {showProfile && (
        <div className="profile-fullscreen">
          <div className="profile-page-header">
            <button
              className="profile-back-btn"
              onClick={() => setShowProfile(false)}
            >
              <FiArrowLeft size={22} />
            </button>
            <span className="profile-page-title">Contact Info</span>
          </div>

          <div className="profile-page-body">
            <div className="profile-big-avatar">
              {selectedUser?.avatar ? (
                <img src={selectedUser.avatar} alt={username} />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <h2 className="profile-name">{username}</h2>

            <div className="profile-status-row">
              <span
                className={`status-dot ${
                  selectedUser?.isOnline ? "online" : "offline"
                }`}
              />
              {selectedUser?.isOnline ? "Online" : "Offline"}
            </div>

            {/* ✅ NAYA: STATUS SECTION */}
            <div className="profile-section">
              <div className="profile-section-title">Status</div>
              <div className="profile-section-text">
                {selectedUser?.status
                  ? selectedUser.status
                  : "Hey there! I am using this app."}
              </div>
            </div>

            {selectedUser?.about && (
              <div className="profile-section">
                <div className="profile-section-title">About</div>
                <div className="profile-section-text">{selectedUser.about}</div>
              </div>
            )}

            {selectedUser?.email && (
              <div className="profile-section">
                <div className="profile-section-title">Email</div>
                <div className="profile-section-text">{selectedUser.email}</div>
              </div>
            )}

            {selectedUser?.createdAt && (
              <div className="profile-section">
                <div className="profile-section-title">Joined</div>
                <div className="profile-section-text">
                  {new Date(selectedUser.createdAt).toLocaleDateString(
                    "en-US",
                    { year: "numeric", month: "long", day: "numeric" },
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatWindow;
