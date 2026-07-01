import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import ProfilePanel from "../components/ProfilePanel";
import "./Chat.css";

function Chat() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isChatOpenMobile, setIsChatOpenMobile] = useState(false);

  const [currentUser, setCurrentUser] = useState({
    name: "Guest",
    status: "Available",
  });

  // ✅ LOAD + SYNC USER
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  // select user
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setIsChatOpenMobile(true);
  };

  const handleBack = () => {
    setIsChatOpenMobile(false);
  };

  // ✅ SAVE PROFILE (safe merge)
  const handleSaveUser = (updatedUser) => {
    setCurrentUser(updatedUser);

    const existing = JSON.parse(localStorage.getItem("user")) || {};

    const merged = {
      ...existing,
      ...updatedUser,
    };

    localStorage.setItem("user", JSON.stringify(merged));
  };

  // logout
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="chat-container">
      {/* SIDEBAR */}
      <div
        className={`sidebar-wrapper ${isChatOpenMobile ? "hide-mobile" : ""}`}
      >
        <Sidebar
          onSelectUser={handleSelectUser}
          currentUser={currentUser}
          onOpenProfile={() => setShowProfile(true)}
        />
      </div>

      {/* CHAT */}
      <div
        className={`chat-wrapper ${isChatOpenMobile ? "show-mobile-chat" : ""}`}
      >
        <ChatWindow selectedUser={selectedUser} onBack={handleBack} />
      </div>

      {/* PROFILE PANEL */}
      {showProfile && (
        <ProfilePanel
          user={currentUser}
          onClose={() => setShowProfile(false)}
          onSave={handleSaveUser}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default Chat;
