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
  const [name, setName] = useState("");
  const [status, setStatus] = useState("Available");
  const [avatar, setAvatar] = useState("");

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [uploading, setUploading] = useState(false);

  // ✅ FIX: sync BOTH user prop + localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));

    const activeUser = user || storedUser;

    if (activeUser) {
      setName(activeUser.name || "");
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

  // ✅ FIX: proper save (no stale user overwrite)
  const handleSave = async () => {
  try {
    const updated = {
      userId: user?._id || user?.id, // ✅ FIX
      name,
      status,
      avatar,
    };

    const res = await axios.put(
      `${import.meta.env.VITE_API_URL}/api/users/update-profile`,
      updated
    );

    localStorage.setItem("user", JSON.stringify(res.data.user));

    onSave?.(res.data.user);
    onClose();
  } catch (err) {
    console.log("SAVE ERROR:", err.response?.data || err.message);
  }
};

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />

      <div className="profile-panel">
        <div className="panel-header">
          <h3>Settings</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="panel-body">
          {/* AVATAR */}
          <div className="avatar-block">
            {avatar ? (
              <img src={avatar} className="avatar-img" />
            ) : (
              <div className="avatar-fallback">{getInitials(name || "U")}</div>
            )}

            <label className="upload-btn">
              {uploading ? "Uploading..." : "Change Photo"}
              <input type="file" hidden onChange={handleAvatarUpload} />
            </label>
          </div>

          {/* NAME */}
          <label className="field">
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          {/* STATUS */}
          <label className="field">
            <span>Status</span>
            <input value={status} onChange={(e) => setStatus(e.target.value)} />
          </label>

          {/* TOGGLES */}
          <div className="toggle-row">
            <div>
              <div className="toggle-label">Notifications</div>
              <div className="toggle-sub">Get notified about messages</div>
            </div>

            <button
              className={`toggle ${notifications ? "on" : ""}`}
              onClick={() => setNotifications(!notifications)}
            >
              <span className="toggle-knob" />
            </button>
          </div>

          <div className="toggle-row">
            <div>
              <div className="toggle-label">Dark Mode</div>
              <div className="toggle-sub">Better for night usage</div>
            </div>

            <button
              className={`toggle ${darkMode ? "on" : ""}`}
              onClick={() => setDarkMode(!darkMode)}
            >
              <span className="toggle-knob" />
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="panel-footer">
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>

          <button className="save-btn" onClick={handleSave}>
            Save changes
          </button>
        </div>
      </div>
    </>
  );
}

export default ProfilePanel;
