import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./auth.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Saari fields fill karo");
      return;
    }

    if (password.length < 6) {
      setError("Password kam se kam 6 characters ka ho");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/register`,
        {
          name,
          email,
          password, // ✅ FIXED (NO HASHING HERE)
          avatar: "",
          status: "Available",
        },
      );

      console.log("REGISTER SUCCESS:", res.data);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...res.data.user,
          avatar: res.data.user.avatar || "",
          status: res.data.user.status || "Available",
        }),
      );

      setLoading(false);
      navigate("/chat");
    } catch (err) {
      console.log("REGISTER ERROR:", err.response?.data || err.message);

      setError(err.response?.data?.message || "Registration failed");
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

        <h2 className="auth-title">Create your account</h2>
        <p className="auth-subtitle">Join Aliti and start chatting</p>

        <form onSubmit={handleRegister} noValidate>
          <div className="field-group">
            <label className="field-label">Full name</label>
            <input
              type="text"
              className="auth-input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

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
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowPassword(!showPassword)}
              >
                👁
              </button>
            </div>
          </div>

          {error && <div className="field-error">{error}</div>}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
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
