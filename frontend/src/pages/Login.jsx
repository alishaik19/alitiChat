import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Email aur password dono zaroori hain");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

      const res = await axios.post(`${API}/api/auth/login`, {
        email,
        password,
      });

      console.log("LOGIN SUCCESS:", res.data);

      localStorage.setItem("token", res.data.token);

      // 🔥 FIXED USER STORAGE (NO DATA LOSS)
      const existingUser = JSON.parse(localStorage.getItem("user")) || {};

      const finalUser = {
        ...existingUser,
        ...res.data.user,
        avatar: res.data.user.avatar ?? existingUser.avatar ?? "",
        status: res.data.user.status ?? existingUser.status ?? "Available",
      };

      localStorage.setItem("user", JSON.stringify(finalUser));

      setLoading(false);
      navigate("/chat");
    } catch (err) {
      console.log("LOGIN ERROR:", err.response?.data);

      setError(err.response?.data?.message || "Login failed");
      setLoading(false);
    }
  };
  return (
    <div className="auth-wrapper">
      <div className="auth-glow" />

      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">A</div>
        </div>

        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Log in to continue to Aliti</p>

        <form onSubmit={handleLogin} noValidate>
          <div className="field-group">
            <label className="field-label">Email</label>
            <input
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Password</label>
            <div className="password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                className="auth-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.5 5.3A9.6 9.6 0 0112 5c5 0 9 4.5 10 7-.4 1.1-1.2 2.4-2.3 3.6M6.2 6.6C4 8.1 2.4 10.1 2 12c1 2.5 5 7 10 7 1.3 0 2.6-.3 3.7-.8"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      fill="none"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <div className="field-error">{error}</div>}

          <div className="forgot-row">
            <Link to="/" className="forgot-link">
              Forgot password?
            </Link>
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : "Log in"}
          </button>
        </form>

        <p className="switch-line">
          Don't have an account?{" "}
          <Link to="/register" className="switch-link">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
