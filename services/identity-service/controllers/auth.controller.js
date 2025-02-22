import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";
import { generateToken, generateRefreshToken, verifyToken } from "../config/jwt.js";
import { sendMail } from "../config/mail.js";
import crypto from "crypto";
import dotenv from "dotenv";
import { loginValidationRules, registerValidationRules, refreshTokenRules, resetPasswordRequestRules, resetPasswordRules } from "../validators/auth.validator.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { UserDTO } from "../dtos/user.dto.js";


dotenv.config();

// User Registration
export const register = [
  registerValidationRules,  // Apply validation rules
  validateRequest,          // Middleware to check validation results
  async (req, res) => {
    try {
      const { firstName, lastName, email, password } = req.body;

      // Check if the email already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: "Email already in use" });
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
        `Click here to verify your email: ${process.env.BASE_URL}/api/auth/verify-email/${user.id}/${verificationToken}`,
        `<a href="${process.env.BASE_URL}/api/auth/verify-email/${user.id}/${verificationToken}">Verify Email</a>`
      );

      // Send response with only needed user info
      res.status(201).json({
        message: "User registered successfully. Please verify your email.",
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
];

// User Login
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

      // Return user info using DTO
      res.json({
        user: new UserDTO(user), // Ensures only safe fields are returned
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
];

// Verify Email
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

// Request Password Reset
export const resetPasswordRequest = [
  resetPasswordRequestRules,
  validateRequest,  // Middleware to check validation results
  async (req, res) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "User with this email does not exist." });
    }

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const resetToken = crypto.randomBytes(32).toString("hex");

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token: resetToken, expiresAt: new Date(Date.now() + 3600000) }, 
    });

    await sendMail(
      user.email,
      "Reset Your Password",
      `Click here to reset your password: ${process.env.FRONTEND_URL}/reset-password/${resetToken}`,
      `<a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}">Reset Password</a>`
    );

    res.json({ message: "Password reset link sent to your email." });
  }
];

// Reset Password
export const resetPassword = [
  resetPasswordRules,
  validateRequest,
  async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

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
  }
];

// Refresh Token
export const refreshToken = [
  refreshTokenRules,  
  validateRequest, 
  async (req, res) => {
    try {
      const { refreshToken } = req.body;

      let decoded;
      try {
        decoded = verifyToken(refreshToken, true);
      } catch (error) {
        return res.status(401).json({ error: "Invalid or expired refresh token" });
      }

      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.isVerified) {
        return res.status(403).json({ error: "Please verify your email before requesting a new token." });
      }

      const accessToken = generateToken(user);

      res.json({
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
];


export const authorize = async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized, token required" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: "User is not verified" });
    }

    // Return user data using DTO
    res.status(200).json({ user: new UserDTO(user) });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};