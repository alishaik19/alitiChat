import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Resend } from "resend";
import crypto from "crypto";
import PendingUser from "../models/PendingUser.js";

// 🔐 TOKEN GENERATOR
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ✅ RESEND CLIENT
let resendClient = null;
const getResend = () => {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

// ✅ SHARED EMAIL HELPER
const sendEmail = async ({
  to,
  subject,
  html,
  fromName = "Ali☕ Verification",
}) => {
  await getResend().emails.send({
    from: `${fromName} <onboarding@resend.dev>`,
    to,
    subject,
    html,
  });
};

// =======================
// ✅ REGISTER CONTROLLER
// =======================
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Username or email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await PendingUser.deleteMany({
      email: email.toLowerCase(),
    });

    await PendingUser.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    await sendEmail({
      to: email,
      subject: "Verify Your Email",
      html: `
        <h2>Email Verification</h2>
        <p>Your verification code is:</p>
        <h1>${otp}</h1>
        <p>This code expires in 10 minutes.</p>
      `,
    });

    res.status(201).json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const pendingUser = await PendingUser.findOne({
      email: email.toLowerCase(),
    });

    if (!pendingUser) {
      return res.status(404).json({
        message: "Verification request not found",
      });
    }

    if (pendingUser.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    if (pendingUser.expiresAt < Date.now()) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: pendingUser.email }, { username: pendingUser.username }],
    });

    if (existingUser) {
      await PendingUser.deleteOne({
        _id: pendingUser._id,
      });

      return res.status(400).json({
        message: "Account already exists",
      });
    }

    await User.create({
      username: pendingUser.username,
      email: pendingUser.email,
      password: pendingUser.password,
      avatar: "",
      status: "Available",
    });

    await PendingUser.deleteOne({
      _id: pendingUser._id,
    });

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const pendingUser = await PendingUser.findOne({
      email: email.toLowerCase(),
    });

    if (!pendingUser) {
      return res.status(404).json({
        message: "Verification request not found",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    pendingUser.otp = otp;
    pendingUser.expiresAt = Date.now() + 10 * 60 * 1000;

    await pendingUser.save();

    await sendEmail({
      to: email,
      subject: "New Verification OTP",
      html: `
        <h2>Email Verification</h2>
        <h1>${otp}</h1>
        <p>This code expires in 10 minutes.</p>
      `,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent again",
    });
  } catch (error) {
    console.error("RESEND OTP ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================
// ✅ LOGIN CONTROLLER
// =======================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar || "",
        status: user.status || "Available",
      },
      token,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================
// ✅ FORGOT PASSWORD (Resend Link Logic)
// =====================================
export const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found with this email/username" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 600000; // 10 Mins
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      fromName: "Support Ali☕",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Password Reset</h2>
          <p>Aapne apna password reset karne ki request ki hai. Naya password set karne ke liye niche diye gaye link par click karein:</p>
          <a href="${resetUrl}" style="background: #6c63ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0;">Reset Password Now</a>
          <p>Yeh link sirf 10 minutes ke liye valid hai.</p>
        </div>
      `,
    });

    res.status(200).json({ message: "Reset link sent to your Gmail!" });
  } catch (error) {
    console.error("MAIL_ERROR:", error);
    res.status(500).json({ message: "Failed to send email." });
  }
};

// =====================================
// ✅ RESET PASSWORD (Action Logic)
// =====================================
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
