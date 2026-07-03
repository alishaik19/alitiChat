import nodemailer from "nodemailer";
import crypto from "crypto";

// ✅ Common transporter (isse alag file bana ke reuse karna best practice hai)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for port 465
  family: 4, // 👈 IMPORTANT: IPv6 issue fix - Render jaise platforms pe IPv6 se Gmail unreachable hota hai
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password use karein
  },
});

// Reset Password Link bhejne ka function
export const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 600000; // 10 mins
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const mailOptions = {
      to: user.email,
      subject: "Password Reset Request",
      html: `<h3>You requested a password reset</h3>
             <p>Click this link to reset your password. Valid for 10 minutes:</p>
             <a href="${resetUrl}">${resetUrl}</a>`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Reset link sent to your email!" });
  } catch (error) {
    console.error("FORGOT PASSWORD EMAIL ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// Naya Password save karne ka function
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
