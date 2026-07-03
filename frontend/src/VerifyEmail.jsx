import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./VerifyEmail.css";
import { toast } from "react-toastify";

function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (!otp.trim()) {
      setError("Please enter OTP");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

      const res = await axios.post(`${API}/api/auth/verify-email`, {
        email,
        otp,
      });

      if (res.data.success) {
        toast.success("Email verified successfully!");

        setTimeout(() => {
          navigate("/", {
            replace: true,
          });
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

      await axios.post(`${API}/api/auth/resend-otp`, {
        email,
      });

      toast.success("New OTP sent successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="verify-card">
        <div className="verify-icon">✉️</div>

        <h2 className="verify-title">Verify Your Email</h2>

        <p className="verify-subtitle">
          We've sent a verification code to
          <br />
          <span className="verify-email">{email}</span>
        </p>

        <input
          type="text"
          maxLength="6"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
          className="otp-input"
        />

        {error && <div className="verify-error">{error}</div>}

        <button
          onClick={handleVerify}
          className="verify-btn"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <button onClick={handleResendOTP} className="resend-btn">
          Resend OTP
        </button>
      </div>
    </div>
  );
}

export default VerifyEmail;
