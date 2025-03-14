/**
 * Auth Service Module
 * Handles the core business logic and database operations for auth-related features.
 */

// services/auth.service.js

import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";
import { generateToken, generateRefreshToken, verifyToken } from "../config/jwt.js";
import { sendVerificationEmail, sendResetPasswordEmail } from "./email.service.js";
import { UserDTO } from "../dtos/user.dto.js";
import { AuthDTO } from "../dtos/auth.dto.js";

// Import repositories
import { UserRepository } from "../repositories/user.repository.js";
import { VerificationTokenRepository } from "../repositories/verificationToken.repository.js";
import { PasswordResetTokenRepository } from "../repositories/passwordResetToken.repository.js";

dotenv.config();

/**
 * Service to handle user registration
 * @param {Object} data - { firstName, lastName, email, password }
 * @returns {Object} { status, response }
 */
export async function registerService(data) {
  let { firstName, lastName, email, password } = data;

  //lowercase email
  email = email.toLowerCase();

  // Check if email is already used
  const existingUser = await UserRepository.findUnique({ email });
  if (existingUser) {
    return { status: 409, response: { error: "Email already in use" } };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await UserRepository.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
  });

  // Generate email verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");
  await VerificationTokenRepository.create({
    userId: user.id,
    token: verificationToken,
    expiresAt: new Date(Date.now() + 3600000), // 1 hour
  });

  // Try sending verification email
  try {
    await sendVerificationEmail(user, verificationToken);
  } catch (err) {
    return {
      status: 500,
      response: { error: "User created but failed to send verification email." },
    };
  }

  return {
    status: 201,
    response: {
      message: "User registered successfully. Please verify your email.",
    },
  };
}

/**
 * Service to handle user login
 * @param {Object} data - { email, password }
 * @returns {Object} { status, response }
 */
export async function loginService(data) {
  let { email, password } = data;
  email = email.toLowerCase();
  const user = await UserRepository.findUnique({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { status: 401, response: { error: "Invalid credentials" } };
  }

  if (!user.isVerified) {
    return {
      status: 403,
      response: { error: "Please verify your email before logging in." },
    };
  }

  const accessToken = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    status: 200,
    response: new AuthDTO({
      user,
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN,
    }),
  };
}

/**
 * Service to verify email
 * @param {string} token
 * @returns {Object} { status, response, redirect }
 */
export const verifyEmailService = async (token) => {
  const storedToken = await VerificationTokenRepository.findFirst({ token });
  if (!storedToken || storedToken.expiresAt < new Date()) {
    return { status: 400, response: { error: "Invalid or expired verification token." } };
  }

  // Update user to be verified
  await UserRepository.update({ id: storedToken.userId }, { isVerified: true });

  // Delete the token after usage
  await VerificationTokenRepository.delete({ id: storedToken.id });

  return { redirect: `${process.env.FRONTEND_URL}/login` };
};

/**
 * Service to handle password reset request
 * @param {string} email
 * @returns {Object} { status, response }
 */
export async function resetPasswordRequestService(email) {
  email = email.toLowerCase();
  const user = await UserRepository.findUnique({ email });
  if (!user) {
    return {
      status: 404,
      response: { error: "User with this email does not exist." },
    };
  }

  // Clear old tokens using the reset token repository
  await PasswordResetTokenRepository.deleteMany({ userId: user.id });

  // Generate new reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  await PasswordResetTokenRepository.create({
    userId: user.id,
    token: resetToken,
    expiresAt: new Date(Date.now() + 3600000), // 1 hour
  });

  // Try sending reset email
  try {
    await sendResetPasswordEmail(user, resetToken);
  } catch (err) {
    return {
      status: 500,
      response: { error: "Failed to send reset password email." },
    };
  }

  return {
    status: 200,
    response: { message: "Password reset link sent to your email." },
  };
}

/**
 * Service to handle password reset
 * @param {string} token
 * @param {string} newPassword
 * @returns {Object} { status, response }
 */
export async function resetPasswordService(token, newPassword) {
  const resetTokenEntry = await PasswordResetTokenRepository.findUnique({ token });
  if (!resetTokenEntry || resetTokenEntry.expiresAt < new Date()) {
    return {
      status: 400,
      response: { error: "Invalid or expired reset token." },
    };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await UserRepository.update({ id: resetTokenEntry.userId }, { password: hashedPassword });
  await PasswordResetTokenRepository.delete({ token });

  return {
    status: 200,
    response: {
      message: "Password reset successful. You can now log in with your new password.",
    },
  };
}

/**
 * Service to handle refresh token
 * @param {string} refreshToken
 * @returns {Object} { status, response }
 */
export async function refreshTokenService(refreshToken) {
  let decoded;
  try {
    decoded = verifyToken(refreshToken, true);
  } catch (error) {
    return {
      status: 401,
      response: { error: "Invalid or expired refresh token" },
    };
  }

  const user = await UserRepository.findUnique({ id: decoded.id });
  if (!user) {
    return { status: 404, response: { error: "User not found" } };
  }

  if (!user.isVerified) {
    return {
      status: 403,
      response: { error: "Please verify your email before requesting a new token." },
    };
  }

  const accessToken = generateToken(user);
  return {
    status: 200,
    response: new AuthDTO({
      user,
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN,
    }),
  };
}

/**
 * Service to handle user authorization
 * @param {string} authHeader - "Authorization" header from the request
 * @returns {Object} { status, response }
 */
export async function authorizeService(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { status: 401, response: { error: "Unauthorized, token required" } };
  }

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    return { status: 400, response: { error: "Invalid or expired token" } };
  }

  const user = await UserRepository.findUnique({ id: decoded.id });
  if (!user) {
    return { status: 404, response: { error: "User not found" } };
  }

  if (!user.isVerified) {
    return { status: 403, response: { error: "User is not verified" } };
  }

  return { status: 200, response: { user: new UserDTO(user) } };
}
