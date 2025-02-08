import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";
import { generateToken, generateRefreshToken } from "../config/jwt.js";
import { sendMail } from "../config/mail.js";
import crypto from "crypto";
import dotenv from "dotenv";
import { loginValidationRules, registerValidationRules } from "../validators/auth.validator.js";
import { validateRequest } from "../middleware/validate.middleware.js";

dotenv.config();

// 📝 User Registration
export const register = [
  registerValidationRules,  // Apply validation rules
  validateRequest,          // Middleware to check validation results
  async (req, res) => {
    try {
      const { firstName, lastName, email, password } = req.body;

      // Check if the email already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: { firstName, lastName, email, password: hashedPassword },
      });

      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      await prisma.verificationToken.create({
        data: {
          userId: user.id,
          token: verificationToken,
          expiresAt: new Date(Date.now() + 3600000), // 1 hour expiry
        },
      });

      // Send email verification
      await sendMail(
        user.email,
        "Verify Your Email",
        `Click here to verify your email: ${process.env.BASE_URL}/auth/verify-email/${user.id}/${verificationToken}`,
        `<a href="${process.env.BASE_URL}/auth/verify-email/${user.id}/${verificationToken}">Verify Email</a>`
      );

      // Send response with only needed user info
      res.status(201).json({
        message: "User registered successfully. Please verify your email.",
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
];

// 📝 User Login
export const login = [
  loginValidationRules, // Apply validation rules
  validateRequest,      // Middleware to check validation results
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Ensure user is verified
      if (!user.isVerified) {
        return res.status(403).json({ error: "Please verify your email before logging in." });
      }

      // Generate tokens
      const accessToken = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      res.json({
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
];

// 📝 Verify Email
export const verifyEmail = async (req, res) => {
  const { userId, token } = req.params;

  const storedToken = await prisma.verificationToken.findFirst({
    where: { userId, token },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    return res.status(400).json({ error: "Invalid or expired verification token." });
  }

  await prisma.user.update({ where: { id: userId }, data: { isVerified: true } });
  await prisma.verificationToken.delete({ where: { id: storedToken.id } });

  res.redirect(`${process.env.FRONTEND_URL}/login`);
};

// 🔄 Request Password Reset
export const resetPasswordRequest = async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(400).json({ error: "User with this email does not exist." });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: { userId: user.id, token: resetToken, expiresAt: new Date(Date.now() + 3600000) }, // 1 hour expiry
  });

  // Send password reset email
  await sendMail(
    user.email,
    "Reset Your Password",
    `Click here to reset your password: ${process.env.BASE_URL}/auth/reset-password/${resetToken}`,
    `<a href="${process.env.BASE_URL}/auth/reset-password/${resetToken}">Reset Password</a>`
  );

  res.json({ message: "Password reset link sent to your email." });
};

// 🔄 Reset Password
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword, confirmNewPassword } = req.body;

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ error: "Passwords do not match." });
  }

  const resetTokenEntry = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetTokenEntry || resetTokenEntry.expiresAt < new Date()) {
    return res.status(400).json({ error: "Invalid or expired reset token." });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: resetTokenEntry.userId },
    data: { password: hashedPassword },
  });

  await prisma.passwordResetToken.delete({ where: { token } });

  res.status(200).json({ message: "Password reset successful. You can now log in with your new password." });
};
