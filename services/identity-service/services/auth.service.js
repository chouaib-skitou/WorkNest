import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";
import { prisma } from "../config/database.js";
import { generateToken, generateRefreshToken, verifyToken } from "../config/jwt.js";
import {
  sendVerificationEmail,
  sendResetPasswordEmail,
} from "./email.service.js";
import { UserDTO } from "../dtos/user.dto.js";
import { AuthDTO } from "../dtos/auth.dto.js";

dotenv.config();

/**
 * Service to handle user registration
 * @param {Object} data - { firstName, lastName, email, password }
 * @returns {Object} { status, response }
 */
export async function registerService(data) {
  const { firstName, lastName, email, password } = data;

  // Check if email is already used
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { status: 409, response: { error: "Email already in use" } };
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
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    },
  });

  // Try sending verification email
  try {
    await sendVerificationEmail(user, verificationToken);
  // eslint-disable-next-line no-unused-vars
  } catch (err) {
    // console.error("Error sending verification email:", err);
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
  const { email, password } = data;
  const user = await prisma.user.findUnique({ where: { email } });
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
 * @param {string} userId
 * @param {string} token
 * @returns {Object} { status, response, redirect }
 */
export async function verifyEmailService(userId, token) {
  const storedToken = await prisma.verificationToken.findFirst({
    where: { userId, token },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    return {
      status: 400,
      response: { error: "Invalid or expired verification token." },
    };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isVerified: true },
  });

  await prisma.verificationToken.delete({ where: { id: storedToken.id } });

  return {
    status: 302,
    redirect: `${process.env.FRONTEND_URL}/login`,
    response: { message: "Email verified successfully" },
  };
}

/**
 * Service to handle password reset request
 * @param {string} email
 * @returns {Object} { status, response }
 */
export async function resetPasswordRequestService(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return {
      status: 404,
      response: { error: "User with this email does not exist." },
    };
  }

  // Clear old tokens
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  // Generate new reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    },
  });

  // Try sending reset email
  try {
    await sendResetPasswordEmail(user, resetToken);
  // eslint-disable-next-line no-unused-vars
  } catch (err) {
    // console.error("Error sending reset password email:", err);
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
  const resetTokenEntry = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetTokenEntry || resetTokenEntry.expiresAt < new Date()) {
    return {
      status: 400,
      response: { error: "Invalid or expired reset token." },
    };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: resetTokenEntry.userId },
    data: { password: hashedPassword },
  });

  await prisma.passwordResetToken.delete({ where: { token } });

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
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return {
      status: 401,
      response: { error: "Invalid or expired refresh token" },
    };
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) {
    return { status: 404, response: { error: "User not found" } };
  }

  if (!user.isVerified) {
    return {
      status: 403,
      response: {
        error: "Please verify your email before requesting a new token.",
      },
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
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return { status: 400, response: { error: "Invalid or expired token" } };
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) {
    return { status: 404, response: { error: "User not found" } };
  }

  if (!user.isVerified) {
    return { status: 403, response: { error: "User is not verified" } };
  }

  return { status: 200, response: { user: new UserDTO(user) } };
}
