import { useState, useRef, useEffect } from "react";
import "./ChatWindow.css";

function getTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ChatWindow({ selectedUser, onBack }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello 👋",
      sender: "me",
      time: "09:38",
      status: "seen",
    },
    {
      id: 2,
      text: "Hi there!",
      sender: "other",
      time: "09:39",
      status: null,
    },
  ]);

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser]);

  // scroll detect
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;

    setShowScrollBtn(!isBottom);
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMsg = {
      id: Date.now(),
      text: input,
      sender: "me",
      time: getTime(),
      status: "sent",
      replyTo: replyTo ? replyTo.text : null,
      reactions: [],
    };

    setMessages([...messages, newMsg]);
    setInput("");
    setReplyTo(null);
  };

  const addReaction = (id, emoji) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, reactions: [...(m.reactions || []), emoji] } : m,
      ),
    );
  };

  const emojis = ["😂", "❤️", "👍", "🔥", "😮"];

  if (!selectedUser) {
    return (
      <div className="chat-window empty">
        <div>💬</div>
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* HEADER */}
      <div className="chat-header">
        {/* BACK BUTTON */}
        <button className="back-btn" onClick={onBack}>
          ←
        </button>

        <div className="header-avatar">
          {selectedUser.name.slice(0, 2).toUpperCase()}
        </div>

        <div>
          <div className="header-name">{selectedUser.name}</div>
          <div className="header-status">
            {selectedUser.online ? "Online" : "Offline"}
          </div>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="messages" ref={containerRef} onScroll={handleScroll}>
        {/* DATE SEPARATOR */}
        <div className="date-sep">Today</div>

        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.sender}`}>
            {/* MESSAGE */}
            <div
              className="message"
              onDoubleClick={() => addReaction(msg.id, "❤️")}
              onContextMenu={(e) => {
                e.preventDefault();
                setReplyTo(msg);
              }}
            >
              {/* REPLY PREVIEW */}
              {msg.replyTo && <div className="reply-box">↪ {msg.replyTo}</div>}

              {msg.text}

              {/* TIME + TICKS */}
              <div className="meta">
                <span className="time">{msg.time}</span>

                {msg.sender === "me" && (
                  <span className={`tick ${msg.status}`}>
                    {msg.status === "seen"
                      ? "✓✓"
                      : msg.status === "delivered"
                        ? "✓✓"
                        : "✓"}
                  </span>
                )}
              </div>

              {/* REACTIONS */}
              <div className="reactions">
                {(msg.reactions || []).map((r, i) => (
                  <span key={i}>{r}</span>
                ))}
              </div>

              {/* QUICK EMOJI BAR */}
              <div className="emoji-bar">
                {emojis.map((e, i) => (
                  <span key={i} onClick={() => addReaction(msg.id, e)}>
                    {e}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* FLOAT SCROLL BUTTON */}
      {showScrollBtn && (
        <button
          className="scroll-btn"
          onClick={() =>
            bottomRef.current?.scrollIntoView({
              behavior: "smooth",
            })
          }
        >
          ↓
        </button>
      )}

      {/* INPUT AREA */}
      <div className="chat-input">
        {/* ATTACH */}
        <button className="attach">📎</button>

        {/* EMOJI */}
        <button onClick={() => setShowEmoji(!showEmoji)}>😊</button>

        {/* REPLY PREVIEW */}
        {replyTo && (
          <div className="reply-preview">Replying to: {replyTo.text}</div>
        )}

        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setTyping(true);
            setTimeout(() => setTyping(false), 1000);
          }}
          placeholder="Type a message..."
        />

        <button onClick={sendMessage}>➤</button>
      </div>

      {/* EMOJI PICKER */}
      {showEmoji && (
        <div className="emoji-picker">
          {emojis.map((e, i) => (
            <span key={i} onClick={() => setInput(input + e)}>
              {e}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChatWindow;
