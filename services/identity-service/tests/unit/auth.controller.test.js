import * as authController from "../../controllers/auth.controller.js";
import { prisma } from "../../config/database.js";
import { generateToken, generateRefreshToken, verifyToken } from "../../config/jwt.js";
import { sendMail } from "../../config/mail.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Mock dependencies
jest.mock("../../config/database.js", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    verificationToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock("../../config/jwt.js", () => ({
  generateToken: jest.fn(() => "mockAccessToken"),
  generateRefreshToken: jest.fn(() => "mockRefreshToken"),
  verifyToken: jest.fn((token) => {
    if (token === "mockRefreshToken") return { id: "1" };
    throw new Error("Invalid or expired refresh token");
  }),
}));

jest.mock("../../config/mail.js", () => ({
  sendMail: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(() => "hashedPassword"),
  compare: jest.fn(),
}));

jest.mock("crypto", () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => "mockToken"),
  })),
}));

describe("🛂 Auth Controller Tests (100% Coverage)", () => {
  let req, res;
  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      redirect: jest.fn(),
    };
    jest.clearAllMocks();
  });

  /*** REGISTER ***/
  test("✅ Register new user (success)", async () => {
    req.body = { firstName: "John", lastName: "Doe", email: "john@example.com", password: "TestPass123!" };
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: "1", ...req.body });
    prisma.verificationToken.create.mockResolvedValue({});
    sendMail.mockResolvedValue();
    await authController.register[2](req, res);
    expect(prisma.user.create).toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "User registered successfully. Please verify your email.",
    });
  });

  test("🚫 Register duplicate user", async () => {
    req.body.email = "john@example.com";
    prisma.user.findUnique.mockResolvedValue({ id: "1", email: req.body.email });
    await authController.register[2](req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Email already in use" });
  });

  test("🚫 Catch internal error in registration", async () => {
    req.body = { firstName: "John", lastName: "Doe", email: "john@example.com", password: "TestPass123!" };
    prisma.user.findUnique.mockRejectedValue(new Error("DB error"));
    await authController.register[2](req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /*** LOGIN ***/
  test("🚫 Prevent login with unregistered email", async () => {
    req.body = { email: "unknown@example.com", password: "TestPass123!" };
    prisma.user.findUnique.mockResolvedValue(null);
    await authController.login[2](req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
  });

  test("🚫 Prevent login with incorrect password", async () => {
    req.body = { email: "john@example.com", password: "WrongPass" };
    prisma.user.findUnique.mockResolvedValue({
      id: "1",
      email: req.body.email,
      password: "hashedPassword",
      isVerified: true,
    });
    bcrypt.compare.mockResolvedValue(false);
    await authController.login[2](req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
  });

  test("🚫 Prevent login if user not verified", async () => {
    req.body = { email: "john@example.com", password: "TestPass123!" };
    prisma.user.findUnique.mockResolvedValue({
      id: "1",
      email: req.body.email,
      password: "hashedPassword",
      isVerified: false,
    });
    bcrypt.compare.mockResolvedValue(true);
    await authController.login[2](req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Please verify your email before logging in." });
  });

  test("✅ Login with valid credentials", async () => {
    req.body = { email: "john@example.com", password: "TestPass123!" };
    prisma.user.findUnique.mockResolvedValue({
      id: "1",
      email: req.body.email,
      password: "hashedPassword",
      isVerified: true,
    });
    bcrypt.compare.mockResolvedValue(true);
    await authController.login[2](req, res);
    expect(res.json).toHaveBeenCalledWith({
      accessToken: "mockAccessToken",
      refreshToken: "mockRefreshToken",
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });
  });

  test("🚫 Catch internal error on login", async () => {
    req.body = { email: "john@example.com", password: "TestPass123!" };
    prisma.user.findUnique.mockRejectedValue(new Error("DB error"));
    await authController.login[2](req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /*** VERIFY EMAIL ***/
  test("✅ Verify email successfully", async () => {
    req.params = { userId: "1", token: "validToken" };
    prisma.verificationToken.findFirst.mockResolvedValue({
      token: "validToken",
      userId: "1",
      expiresAt: new Date(Date.now() + 3600000),
      id: "vt1",
    });
    prisma.user.update.mockResolvedValue({});
    prisma.verificationToken.delete.mockResolvedValue({});
    await authController.verifyEmail(req, res);
    expect(res.redirect).toHaveBeenCalledWith(`${process.env.FRONTEND_URL}/login`);
  });

  test("🚫 Verify email with invalid/expired token", async () => {
    req.params = { userId: "1", token: "invalidToken" };
    prisma.verificationToken.findFirst.mockResolvedValue(null);
    await authController.verifyEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired verification token." });
  });

  /*** RESET PASSWORD REQUEST ***/
  test("🚫 Prevent password reset request for non-existent email", async () => {
    req.body = { email: "nonexistent@example.com" };
    prisma.user.findUnique.mockResolvedValue(null);
    await authController.resetPasswordRequest[2](req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "User with this email does not exist." });
  });

  test("✅ Request password reset successfully", async () => {
    req.body = { email: "john@example.com" };
    prisma.user.findUnique.mockResolvedValue({ id: "1", email: req.body.email });
    prisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 1 });
    prisma.passwordResetToken.create.mockResolvedValue({ token: "mockToken" });
    sendMail.mockResolvedValue();
    await authController.resetPasswordRequest[2](req, res);
    expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: "Password reset link sent to your email." });
  });

  /*** RESET PASSWORD ***/
  test("🚫 Prevent reset password if token is invalid/expired", async () => {
    req.params = { token: "expiredToken" };
    req.body = { newPassword: "NewPass123!" };
    prisma.passwordResetToken.findUnique.mockResolvedValue(null);
    await authController.resetPassword[2](req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired reset token." });
  });

  test("✅ Reset password successfully", async () => {
    req.params = { token: "mockToken" };
    req.body = { newPassword: "NewPass123!" };
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      token: "mockToken",
      userId: "1",
      expiresAt: new Date(Date.now() + 3600000),
    });
    prisma.user.update.mockResolvedValue({});
    prisma.passwordResetToken.delete.mockResolvedValue({});
    await authController.resetPassword[2](req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Password reset successful. You can now log in with your new password.",
    });
  });

  /*** REFRESH TOKEN ***/
  test("🚫 Prevent refresh token if user not found", async () => {
    req.body = { refreshToken: "mockRefreshToken" };
    verifyToken.mockReturnValue({ id: "1" });
    prisma.user.findUnique.mockResolvedValue(null);
    await authController.refreshToken[2](req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  test("🚫 Prevent refresh token if user is unverified", async () => {
    req.body = { refreshToken: "mockRefreshToken" };
    verifyToken.mockReturnValue({ id: "1" });
    prisma.user.findUnique.mockResolvedValue({ id: "1", isVerified: false });
    await authController.refreshToken[2](req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Please verify your email before requesting a new token.",
    });
  });

  test("✅ Refresh token successfully (default expiresIn)", async () => {
    req.body = { refreshToken: "mockRefreshToken" };
    verifyToken.mockReturnValue({ id: "1" });
    prisma.user.findUnique.mockResolvedValue({ id: "1", email: "john@example.com", isVerified: true });
    await authController.refreshToken[2](req, res);
    expect(res.json).toHaveBeenCalledWith({
      accessToken: "mockAccessToken",
      refreshToken: "mockRefreshToken",
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });
  });

  test("✅ Refresh token successfully with custom expiresIn", async () => {
    req.body = { refreshToken: "mockRefreshToken" };
    process.env.JWT_EXPIRES_IN = "2h";
    verifyToken.mockReturnValue({ id: "1" });
    prisma.user.findUnique.mockResolvedValue({ id: "1", email: "john@example.com", isVerified: true });
    await authController.refreshToken[2](req, res);
    expect(res.json).toHaveBeenCalledWith({
      accessToken: "mockAccessToken",
      refreshToken: "mockRefreshToken",
      expiresIn: "2h",
    });
    delete process.env.JWT_EXPIRES_IN;
  });

  test("🚫 Catch internal error on refresh token", async () => {
    req.body = { refreshToken: "mockRefreshToken" };
    verifyToken.mockReturnValue({ id: "1" });
    prisma.user.findUnique.mockRejectedValue(new Error("DB error"));
    await authController.refreshToken[2](req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  test("🚫 Prevent refresh token if verifyToken throws (invalid token)", async () => {
    req.body = { refreshToken: "invalidToken" };
    verifyToken.mockImplementation(() => {
      throw new Error("Invalid or expired refresh token");
    });
    await authController.refreshToken[2](req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired refresh token" });
  });
});
