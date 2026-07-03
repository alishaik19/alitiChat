import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./auth.css";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // ✅ Live Password Strength States
  const [strength, setStrength] = useState(0);
  const [checks, setChecks] = useState({
    length: false,
    number: false,
    special: false,
    uppercase: false,
  });

  const navigate = useNavigate();

  // ✅ Effect for Live Password Validation
  useEffect(() => {
    const newChecks = {
      length: password.length >= 8,
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password),
      uppercase: /[A-Z]/.test(password),
    };
    setChecks(newChecks);

    const activeChecks = Object.values(newChecks).filter(Boolean).length;
    setStrength((activeChecks / 4) * 100);
  }, [password]);

  const getStrengthColor = () => {
    if (strength <= 25) return "#ff6b6b"; // Weak
    if (strength <= 50) return "#f1c40f"; // Fair
    if (strength <= 75) return "#3498db"; // Good
    return "#4ecdc4"; // Strong
  };

  const validate = () => {
    let tempErrors = {};
    const userRegex = /^[a-zA-Z0-9_]{3,15}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!username.trim()) tempErrors.username = "Username is required";
    else if (!userRegex.test(username))
      tempErrors.username = "3-15 chars, no spaces allowed";

    if (!email.trim()) tempErrors.email = "Email is required";
    else if (!emailRegex.test(email))
      tempErrors.email = "Invalid email address";

    if (!password) tempErrors.password = "Password is required";
    else if (strength < 100)
      tempErrors.password = "Please fulfill all password requirements";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    try {
      setLoading(true);

      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        username,
        email,
        password,
        avatar: "",
        status: "Available",
      });

      navigate("/verify-email", {
        state: {
          email,
        },
      });
    } catch (err) {
      setServerError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-glow-1"></div>
      <div className="auth-glow-2"></div>

      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">
            <img src="/faviicon.png" alt="Logo" className="brand-logo-img" />
          </div>
        </div>

        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Join the community & start chatting</p>

        <form onSubmit={handleRegister} noValidate className="auth-form">
          {/* USERNAME */}
          <div className="field-group">
            <label className="field-label">Username</label>
            <input
              type="text"
              className={`auth-input ${errors.username ? "is-invalid" : username ? "is-valid" : ""}`}
              placeholder="e.g. ali_shaikh"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
            />
            {errors.username && (
              <div className="invalid-feedback">{errors.username}</div>
            )}
          </div>

          {/* EMAIL */}
          <div className="field-group">
            <label className="field-label">Email Address</label>
            <input
              type="email"
              className={`auth-input ${errors.email ? "is-invalid" : email ? "is-valid" : ""}`}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email}</div>
            )}
          </div>

          {/* PASSWORD WITH LIVE STRENGTH */}
          <div className="field-group">
            <label className="field-label">Password</label>
            <div className="password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                className={`auth-input ${errors.password ? "is-invalid" : password && strength === 100 ? "is-valid" : ""}`}
                placeholder="••••••••"
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

            {/* ✅ STRENGTH METER UI */}
            {password && (
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
            {errors.password && (
              <div className="invalid-feedback">{errors.password}</div>
            )}
          </div>

          {serverError && (
            <div className="server-error-alert">{serverError}</div>
          )}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? <span className="loader"></span> : "Create Account"}
          </button>
        </form>

        <p className="switch-line">
          Already have an account?{" "}
          <Link to="/" className="switch-link">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
