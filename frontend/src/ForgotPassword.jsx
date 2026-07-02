import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSendLink = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return setError("Please enter email or username");

    try {
      setLoading(true);
      setError("");
      // ✅ Backend call jo Gmail pe link bhejega
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`,
        { identifier },
      );

      setSent(true);
      toast.success("Reset link sent to your Gmail!");
    } catch (err) {
      setError(
        err.response?.data?.message || "User not found or Error sending email",
      );
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

        <h2 className="auth-title">Forgot Password?</h2>

        {!sent ? (
          <>
            <p className="auth-subtitle">
              Enter your details to receive a reset link on your Gmail.
            </p>
            <form onSubmit={handleSendLink} noValidate>
              <div className="field-group">
                <label className="field-label">Username or Email</label>
                <input
                  type="text"
                  className={`auth-input ${error ? "is-invalid" : ""}`}
                  placeholder="e.g. ali_shaikh or ali@gmail.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>

              {error && (
                <div
                  className="invalid-feedback"
                  style={{ marginBottom: "15px" }}
                >
                  {error}
                </div>
              )}

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? <span className="loader"></span> : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <div className="sent-success">
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>📧</div>
            <p style={{ color: "#4ecdc4" }}>
              Check your Gmail! We've sent a password reset link to your
              account.
            </p>
          </div>
        )}

        <p className="switch-line">
          Back to{" "}
          <Link to="/" className="switch-link">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
