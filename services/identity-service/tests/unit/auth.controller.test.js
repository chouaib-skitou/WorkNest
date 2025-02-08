import * as authController from "../../controllers/auth.controller.js";
import { prisma } from "../../config/database.js";
import { generateToken, generateRefreshToken } from "../../config/jwt.js";
import { sendMail } from "../../config/mail.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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
    },
  },
}));

jest.mock("../../config/jwt.js", () => ({
  generateToken: jest.fn(() => "mockAccessToken"),
  generateRefreshToken: jest.fn(() => "mockRefreshToken"),
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

describe("🛂 Auth Controller Tests", () => {
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

  /** 📌 Register User */
  test("✅ Register new user", async () => {
    req.body = { firstName: "John", lastName: "Doe", email: "john@example.com", password: "TestPass123!" };

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: "1", ...req.body });
    prisma.verificationToken.create.mockResolvedValue({});
    sendMail.mockResolvedValue();

    await authController.register[2](req, res); // Call the actual function in the middleware array

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: req.body.email } });
    expect(prisma.user.create).toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "User registered successfully. Please verify your email."
    });
  });

  test("🚫 Prevent duplicate registration", async () => {
    req.body.email = "john@example.com";
    prisma.user.findUnique.mockResolvedValue({ id: "1", email: req.body.email });

    await authController.register[2](req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Email already in use" });
  });

  /** 📌 User Login */
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
      expiresIn: "1h",
    });
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

  test("🚫 Prevent login if email not verified", async () => {
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
    expect(res.json).toHaveBeenCalledWith({
      error: "Please verify your email before logging in.",
    });
  });

  /** 📌 Email Verification */
  test("✅ Verify email with valid token", async () => {
    req.params = { userId: "1", token: "mockToken" };

    prisma.verificationToken.findFirst.mockResolvedValue({
      userId: "1",
      token: "mockToken",
      expiresAt: new Date(Date.now() + 3600000),
    });

    prisma.user.update.mockResolvedValue({});
    prisma.verificationToken.delete.mockResolvedValue({});

    await authController.verifyEmail(req, res);

    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining("/login"));
  });

  test("🚫 Prevent email verification with expired token", async () => {
    req.params = { userId: "1", token: "mockToken" };

    prisma.verificationToken.findFirst.mockResolvedValue({
      userId: "1",
      token: "mockToken",
      expiresAt: new Date(Date.now() - 3600000),
    });

    await authController.verifyEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired verification token." });
  });

  /** 📌 Password Reset Request */
  test("✅ Request password reset", async () => {
    req.body.email = "john@example.com";

    prisma.user.findUnique.mockResolvedValue({ id: "1", email: req.body.email });
    prisma.passwordResetToken.create.mockResolvedValue({ token: "mockToken" });
    sendMail.mockResolvedValue();

    await authController.resetPasswordRequest(req, res);

    expect(sendMail).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: "Password reset link sent to your email." });
  });

  test("🚫 Prevent password reset for non-existent email", async () => {
    req.body.email = "nonexistent@example.com";

    prisma.user.findUnique.mockResolvedValue(null);

    await authController.resetPasswordRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "User with this email does not exist." });
  });

  test("✅ Reset password with valid token", async () => {
    req.params.token = "mockToken";
    req.body = { newPassword: "NewPass123!", confirmNewPassword: "NewPass123!" };

    prisma.passwordResetToken.findUnique.mockResolvedValue({
      token: "mockToken",
      userId: "1",
      expiresAt: new Date(Date.now() + 3600000),
    });

    prisma.user.update.mockResolvedValue({});
    prisma.passwordResetToken.delete.mockResolvedValue({});

    await authController.resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Password reset successful. You can now log in with your new password." });
  });
  test("🚫 Prevent password reset with expired token", async () => {
    req.params.token = "mockToken";
    req.body = { newPassword: "NewPass123!", confirmNewPassword: "NewPass123!" };
  
    prisma.passwordResetToken.findUnique.mockResolvedValue(null); // Simulating expired token
  
    await authController.resetPassword(req, res);
  
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired reset token." });
  });
  
});
