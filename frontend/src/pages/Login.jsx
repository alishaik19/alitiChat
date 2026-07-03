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
      setError("Please enter both email and password");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

      const res = await axios.post(`${API}/api/auth/login`, {
        email,
        password,
      });

      if (!res.data?.token || !res.data?.user) {
        setError("Invalid response from server");
        setLoading(false);
        return;
      }

      // Save Token
      localStorage.setItem("token", res.data.token);

      // Save User
      const backendUser = res.data.user;
      const existingUser = JSON.parse(localStorage.getItem("user")) || {};

      const finalUser = {
        ...backendUser,
        id: backendUser.id || backendUser._id,
        avatar: backendUser.avatar || existingUser.avatar || "",
        status: backendUser.status || existingUser.status || "Available",
      };

      localStorage.setItem("user", JSON.stringify(finalUser));

      navigate("/chat");
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      // Email not verified
      if (
        err.response?.status === 403 &&
        err.response?.data?.message === "Please verify your email first"
      ) {
        navigate("/verify-email", {
          state: { email },
        });
        return;
      }

      if (err.code === "ERR_NETWORK") {
        setError("Can't reach the server. Is your backend running?");
      } else {
        setError(err.response?.data?.message || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Background Glows */}
      <div className="auth-glow-1"></div>
      <div className="auth-glow-2"></div>

      <div className="auth-card">
        {/* Brand Logo */}
        <div className="auth-brand">
          <div className="brand-mark">
            <img
              src="/faviicon.png"
              alt="Brand Logo"
              className="brand-logo-img"
            />
          </div>
        </div>

        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Log in to continue your conversations</p>

        <form onSubmit={handleLogin} noValidate>
          {/* EMAIL FIELD */}
          <div className="field-group">
            <label className="field-label">Email Address</label>
            <input
              type="email"
              className={`auth-input ${error && !email ? "is-invalid" : ""}`}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* PASSWORD FIELD */}
          <div className="field-group">
            <div className="label-row">
              <label className="field-label">Password</label>
              <Link
                to="/forgot-password"
                title="Forgot your password?"
                className="forgot-link"
              >
                Forgot password?
              </Link>
            </div>

            <div className="password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                className={`auth-input ${error && !password ? "is-invalid" : ""}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* ERROR ALERT */}
          {error && <div className="server-error-alert">{error}</div>}

          {/* SUBMIT BUTTON */}
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? <span className="loader"></span> : "Log in"}
          </button>
        </form>

        <p className="switch-line">
          Don't have an account?{" "}
          <Link to="/register" className="switch-link">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
