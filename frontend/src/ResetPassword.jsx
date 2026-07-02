import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "../src/pages/auth.css";

function ResetPassword() {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Live Password Strength States
  const [strength, setStrength] = useState(0);
  const [checks, setChecks] = useState({
    length: false,
    number: false,
    special: false,
    uppercase: false,
  });

  // ✅ Live Validation Effect
  useEffect(() => {
    const newChecks = {
      length: newPassword.length >= 8,
      number: /[0-9]/.test(newPassword),
      special: /[!@#$%^&*]/.test(newPassword),
      uppercase: /[A-Z]/.test(newPassword),
    };
    setChecks(newChecks);

    const activeChecks = Object.values(newChecks).filter(Boolean).length;
    setStrength((activeChecks / 4) * 100);
  }, [newPassword]);

  const getStrengthColor = () => {
    if (strength <= 25) return "#ff6b6b"; // Weak
    if (strength <= 50) return "#f1c40f"; // Fair
    if (strength <= 75) return "#3498db"; // Good
    return "#4ecdc4"; // Strong
  };

  const handleReset = async (e) => {
    e.preventDefault();

    // ✅ Form submission block agar password strong nahi hai
    if (strength < 100) {
      return toast.error("Please fulfill all password requirements");
    }

    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/reset-password/${token}`,
        { newPassword },
      );

      toast.success("Password updated! Redirecting to login...");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Link expired or invalid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-glow-1"></div>
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">
            <img src="/faviicon.png" alt="Logo" className="brand-logo-img" />
          </div>
        </div>

        <h2 className="auth-title">Set New Password</h2>
        <p className="auth-subtitle">
          Choose a strong password to secure your account.
        </p>

        <form onSubmit={handleReset} noValidate>
          <div className="field-group">
            <label className="field-label">New Password</label>
            <div className="password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                className={`auth-input ${newPassword && strength === 100 ? "is-valid" : newPassword ? "is-invalid" : ""}`}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {/* ✅ LIVE STRENGTH METER UI */}
            {newPassword && (
              <div className="strength-container">
                <div className="strength-bar-bg">
                  <div
                    className="strength-bar-fill"
                    style={{
                      width: `${strength}%`,
                      background: getStrengthColor(),
                    }}
                  ></div>
                </div>
                <div className="password-checklist">
                  <div className={`check-item ${checks.length ? "met" : ""}`}>
                    {checks.length ? "●" : "○"} 8+ chars
                  </div>
                  <div
                    className={`check-item ${checks.uppercase ? "met" : ""}`}
                  >
                    {checks.uppercase ? "●" : "○"} Uppercase
                  </div>
                  <div className={`check-item ${checks.number ? "met" : ""}`}>
                    {checks.number ? "●" : "○"} Number
                  </div>
                  <div className={`check-item ${checks.special ? "met" : ""}`}>
                    {checks.special ? "●" : "○"} Special
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            className="auth-btn"
            type="submit"
            disabled={loading || strength < 100}
          >
            {loading ? <span className="loader"></span> : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
