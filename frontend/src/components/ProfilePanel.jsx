import { useState, useEffect } from "react";
import axios from "axios";
import "./ProfilePanel.css";

function getInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ProfilePanel({ user, onClose, onSave, onLogout }) {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("Available");
  const [avatar, setAvatar] = useState("");

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [uploading, setUploading] = useState(false);

  // sync user
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const activeUser = user || storedUser;

    if (activeUser) {
      setUsername(activeUser.username || activeUser.name || "");
      setStatus(activeUser.status || "Available");
      setAvatar(activeUser.avatar || "");
    }
  }, [user]);

  // upload avatar
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setUploading(true);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/users/upload-avatar`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      setAvatar(res.data.url);
    } catch (err) {
      console.log("UPLOAD ERROR:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const updated = {
        userId: user?._id || user?.id,
        status,
        avatar, // ✅ Current state wala avatar bhej rahe hain
      };

      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/update-profile`,
        updated,
      );

      // ✅ Fix: LocalStorage ko update karte waqt purana data aur naya data merge karein
      const existingUser = JSON.parse(localStorage.getItem("user") || "{}");
      const newUserData = {
        ...existingUser,
        ...res.data.user,
        avatar: res.data.user.avatar || avatar, // Backend se na aaye toh state wala use karein
        username: username,
      };

      localStorage.setItem("user", JSON.stringify(newUserData));

      onSave?.(newUserData);
      onClose();
    } catch (err) {
      console.log("SAVE ERROR:", err.response?.data || err.message);
    }
  };

  return (
    <>
      <div className="profile-overlay" onClick={onClose} />

      <div className="profile-panel">
        <div className="profile-panel-header">
          <h3>Settings</h3>
          <button className="profile-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="profile-panel-body">
          {/* AVATAR */}
          <div className="profile-avatar-block">
            {avatar ? (
              <img src={avatar} className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-fallback">
                {getInitials(username || "U")}
              </div>
            )}

            <label className="profile-upload-btn">
              {uploading ? "Uploading..." : "Change Photo"}
              <input type="file" hidden onChange={handleAvatarUpload} />
            </label>
          </div>

          {/* USERNAME (READ ONLY) */}
          <label className="profile-field">
            <span>Username </span>
            <input value={username} disabled />
          </label>

          {/* STATUS */}
          <label className="profile-field">
            <span>Status</span>
            <input value={status} onChange={(e) => setStatus(e.target.value)} />
          </label>

          {/* TOGGLES */}
          <div className="profile-toggle-row">
            <div>
              <div className="profile-toggle-label">Notifications</div>
              <div className="profile-toggle-sub">
                Get notified about messages
              </div>
            </div>
            <button
              className={`profile-toggle ${notifications ? "on" : ""}`}
              onClick={() => setNotifications(!notifications)}
            >
              <span className="profile-toggle-knob" />
            </button>
          </div>

          <div className="profile-toggle-row">
            <div>
              <div className="profile-toggle-label">Dark Mode</div>
              <div className="profile-toggle-sub">Better for night usage</div>
            </div>
            <button
              className={`profile-toggle ${darkMode ? "on" : ""}`}
              onClick={() => setDarkMode(!darkMode)}
            >
              <span className="profile-toggle-knob" />
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="profile-panel-footer">
          <button className="profile-logout-btn" onClick={onLogout}>
            Logout
          </button>
          <button className="profile-save-btn" onClick={handleSave}>
            Save changes
          </button>
        </div>
      </div>
    </>
  );
}

export default ProfilePanel;
