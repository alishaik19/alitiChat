import { useState, useMemo } from "react";
import "./Sidebar.css";
import { FiSettings } from "react-icons/fi";

const users = [
  {
    id: 1,
    name: "Rahul Sharma",
    lastMessage: "Kal milte hain, sahi hai?",
    time: "09:41",
    unread: 2,
    online: true,
    pinned: true,
    typing: false,
    lastStatus: "seen",
    isGroup: false,
  },
  {
    id: 2,
    name: "Aman Verma",
    lastMessage: "Bhai wo file bhej de jaldi",
    time: "08:15",
    unread: 0,
    online: false,
    pinned: false,
    typing: true,
    lastStatus: "delivered",
    isGroup: false,
  },
  {
    id: 3,
    name: "MERN Devs",
    lastMessage: "New update deployed 🚀",
    time: "Yesterday",
    unread: 5,
    online: true,
    pinned: true,
    typing: false,
    lastStatus: "sent",
    isGroup: true,
    members: ["R", "A", "J"],
  },
  {
    id: 4,
    name: "Priya Nair",
    lastMessage: "Haha ekdum sahi 😂",
    time: "Yesterday",
    unread: 0,
    online: true,
    pinned: false,
    typing: false,
    lastStatus: "seen",
    isGroup: false,
  },
];

const gradients = [
  ["#FF8A65", "#FF5E62"],
  ["#6C63FF", "#8E7CFF"],
  ["#4ECDC4", "#3AB0A6"],
  ["#FFB86B", "#FF8A3D"],
];

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getGradient(id) {
  const [from, to] = gradients[id % gradients.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}

function Sidebar({ onSelectUser, currentUser, onOpenProfile }) {
  const [activeId, setActiveId] = useState(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");

  const handleSelect = (user) => {
    setActiveId(user.id);
    onSelectUser(user);
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = u.name.toLowerCase().includes(query.toLowerCase());
      if (!matchSearch) return false;

      if (tab === "unread") return u.unread > 0;
      if (tab === "groups") return u.isGroup;

      return true;
    });
  }, [query, tab]);

  const pinned = filteredUsers.filter((u) => u.pinned);
  const normal = filteredUsers.filter((u) => !u.pinned);

  const renderUser = (user) => (
    <div
      key={user.id}
      className={`user-item ${activeId === user.id ? "active" : ""}`}
      onClick={() => handleSelect(user)}
    >
      <span className="accent-bar" />

      {user.isGroup ? (
        <div className="group-avatar">
          {user.members.slice(0, 3).map((m, i) => (
            <span key={i} className={`g g${i}`}>
              {m}
            </span>
          ))}
        </div>
      ) : (
        <div className="avatar" style={{ background: getGradient(user.id) }}>
          {getInitials(user.name)}
          {user.online && <span className="online-dot" />}
        </div>
      )}

      <div className="user-info">
        <div className="user-row">
          <span className="user-name">{user.name}</span>
          <span className="user-time">{user.time}</span>
        </div>

        <div className="user-row">
          {user.typing ? (
            <span className="typing">typing...</span>
          ) : (
            <span className="last-message">
              {user.lastMessage}
              <span className={`status ${user.lastStatus}`}>
                {user.lastStatus === "seen"
                  ? " ✓✓"
                  : user.lastStatus === "delivered"
                    ? " ✓✓"
                    : " ✓"}
              </span>
            </span>
          )}

          {user.unread > 0 && (
            <span className="unread-badge">{user.unread}</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="sidebar">
      {/* HEADER */}
      <div className="sidebar-header">
        <div className="header-left">
          <h3>Chats</h3>
        </div>

        {/* SETTINGS BUTTON */}
        <button className="settings-btn" onClick={onOpenProfile}>
          <FiSettings  className="settings-icon" />
        </button>
      </div>

      {/* SEARCH */}
      <div className="search-wrap">
        <input
          className="search-input"
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* TABS */}
      <div className="tabs">
        <button onClick={() => setTab("all")}>All</button>
        <button onClick={() => setTab("unread")}>Unread</button>
        <button onClick={() => setTab("groups")}>Groups</button>
      </div>

      {/* LIST */}
      <div className="user-list">
        {pinned.length > 0 && <div className="section-title">📌 Pinned</div>}
        {pinned.map(renderUser)}
        {normal.map(renderUser)}

        {filteredUsers.length === 0 && (
          <div className="empty-state">No chats found</div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
