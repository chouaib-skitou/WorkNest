// tests/unit/services/auth.service.test.js

import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";
import { generateToken, generateRefreshToken, verifyToken } from "../../../config/jwt.js";
import { sendVerificationEmail, sendResetPasswordEmail } from "../../../services/email.service.js";
import {
  registerService,
  loginService,
  verifyEmailService,
  resetPasswordRequestService,
  resetPasswordService,
  refreshTokenService,
  authorizeService,
} from "../../../services/auth.service.js";
import { UserDTO } from "../../../dtos/user.dto.js";
import { AuthDTO } from "../../../dtos/auth.dto.js";

// Import repositories to be mocked
import { UserRepository } from "../../../repositories/user.repository.js";
import { VerificationTokenRepository } from "../../../repositories/verificationToken.repository.js";
import { PasswordResetTokenRepository } from "../../../repositories/passwordResetToken.repository.js";

jest.mock("../../../repositories/user.repository.js", () => ({
  UserRepository: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findManyByIds: jest.fn(),
  },
}));

jest.mock("../../../repositories/verificationToken.repository.js", () => ({
  VerificationTokenRepository: {
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("../../../repositories/passwordResetToken.repository.js", () => ({
  PasswordResetTokenRepository: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
}));

jest.mock("../../../config/jwt.js", () => ({
  generateToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyToken: jest.fn(),
}));
jest.mock("../../../services/email.service.js", () => ({
  sendVerificationEmail: jest.fn(),
  sendResetPasswordEmail: jest.fn(),
}));
jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
jest.mock("crypto", () => ({
  randomBytes: jest.fn(),
}));

dotenv.config();

describe("🧪 Auth Service Tests", () => {
  let mockUser;
  let mockDateNow;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDateNow = Date.now();
    jest.spyOn(global.Date, "now").mockReturnValue(mockDateNow);

    mockUser = {
      id: "user-123",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "hashed-pass",
      isVerified: false,
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // --- registerService ---
  describe("registerService", () => {
    test("✅ registers user successfully", async () => {
      UserRepository.findUnique.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");
      UserRepository.create.mockResolvedValue({ ...mockUser, password: "hashedPassword" });

      const fakeToken = "fake-verification-token";
      crypto.randomBytes.mockReturnValue(Buffer.from(fakeToken, "utf-8"));
      VerificationTokenRepository.create.mockResolvedValue({ id: "v-token-id" });
      sendVerificationEmail.mockResolvedValue(true);

      const data = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "PlainPass123!",
      };

      const result = await registerService(data);

      expect(UserRepository.findUnique).toHaveBeenCalledWith({ email: "john@example.com" });
      expect(bcrypt.hash).toHaveBeenCalledWith("PlainPass123!", 10);
      expect(UserRepository.create).toHaveBeenCalled();
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(VerificationTokenRepository.create).toHaveBeenCalled();
      expect(sendVerificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: "john@example.com" }),
        expect.any(String)
      );

      expect(result).toEqual({
        status: 201,
        response: {
          message: "User registered successfully. Please verify your email.",
        },
      });
    });

    test("🚫 fails if email in use => returns 409", async () => {
      UserRepository.findUnique.mockResolvedValue(mockUser);
      const data = {
        firstName: "Alice",
        lastName: "Smith",
        email: "alice@taken.com",
        password: "somepass123",
      };

      const result = await registerService(data);
      expect(result.status).toBe(409);
      expect(result.response).toEqual({ error: "Email already in use" });
    });

    test("✅ success, user created, verification email sent => 201", async () => {
      UserRepository.findUnique.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");
      UserRepository.create.mockResolvedValue({ ...mockUser, password: "hashedPassword" });
      crypto.randomBytes.mockReturnValue(Buffer.from("fake-token", "utf-8"));
      VerificationTokenRepository.create.mockResolvedValue({ id: "vtoken-1" });
      sendVerificationEmail.mockResolvedValue(true);

      const data = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "plain123!",
      };
      const result = await registerService(data);

      expect(result.status).toBe(201);
      expect(result.response).toEqual({
        message: "User registered successfully. Please verify your email.",
      });
    });

    test("🚫 email in use => 409", async () => {
      UserRepository.findUnique.mockResolvedValue(mockUser);
      const data = { email: "john@example.com", password: "abc" };
      const result = await registerService(data);
      expect(result.status).toBe(409);
      expect(result.response).toEqual({ error: "Email already in use" });
    });

    test("🚫 fails sending verification email => returns 500 partial error", async () => {
      UserRepository.findUnique.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed-here");
      UserRepository.create.mockResolvedValue(mockUser);
      crypto.randomBytes.mockReturnValue(Buffer.from("some-token", "utf-8"));
      VerificationTokenRepository.create.mockResolvedValue({ id: "vtoken-id" });

      sendVerificationEmail.mockRejectedValue(new Error("SMTP fail"));

      const data = { email: "newuser@example.com", password: "abc" };
      const result = await registerService(data);

      expect(result.status).toBe(500);
      expect(result.response).toEqual({
        error: "User created but failed to send verification email.",
      });
    });
  });

  // --- loginService ---
  describe("loginService", () => {
    test("✅ login success => returns 200 with AuthDTO", async () => {
      UserRepository.findUnique.mockResolvedValue({ ...mockUser, isVerified: true });
      bcrypt.compare.mockResolvedValue(true);
      generateToken.mockReturnValue("acc-token");
      generateRefreshToken.mockReturnValue("ref-token");
      mockUser.isVerified = true;

      const data = { email: "john@example.com", password: "PlainPass123" };
      const result = await loginService(data);

      expect(UserRepository.findUnique).toHaveBeenCalledWith({ email: data.email });
      expect(bcrypt.compare).toHaveBeenCalledWith("PlainPass123", "hashed-pass");
      expect(generateToken).toHaveBeenCalledWith(mockUser);
      expect(generateRefreshToken).toHaveBeenCalledWith(mockUser);

      expect(result.status).toBe(200);
      expect(result.response).toBeInstanceOf(AuthDTO);
      expect(result.response.user).toBeDefined();
      expect(result.response.accessToken).toBe("acc-token");
      expect(result.response.refreshToken).toBe("ref-token");
    });

    test("🚫 invalid credentials => 401", async () => {
      UserRepository.findUnique.mockResolvedValue(null);
      const result = await loginService({ email: "nope@example.com", password: "AnyPass" });
      expect(result.status).toBe(401);
      expect(result.response).toEqual({ error: "Invalid credentials" });
    });

    test("🚫 user found, but password mismatch => 401", async () => {
      UserRepository.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);
      const result = await loginService({ email: "john@example.com", password: "WrongPass" });
      expect(result.status).toBe(401);
      expect(result.response).toEqual({ error: "Invalid credentials" });
    });

    test("🚫 user not verified => 403", async () => {
      UserRepository.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      const result = await loginService({ email: "john@example.com", password: "AnyPass" });
      expect(result.status).toBe(403);
      expect(result.response).toEqual({ error: "Please verify your email before logging in." });
    });
  });

  // --- verifyEmailService ---
  describe("verifyEmailService", () => {
    test("✅ verifies token => updates user => returns redirect", async () => {
      VerificationTokenRepository.findFirst.mockResolvedValue({
        id: "vtoken-id",
        userId: "user-123",
        token: "verify-token",
        expiresAt: new Date(mockDateNow + 1000),
      });
    
      UserRepository.update.mockResolvedValue({ ...mockUser, isVerified: true });
      VerificationTokenRepository.delete.mockResolvedValue({});
    
      const result = await verifyEmailService("verify-token");
    
      expect(VerificationTokenRepository.findFirst).toHaveBeenCalledWith({ token: "verify-token" });
      expect(UserRepository.update).toHaveBeenCalledWith({ id: "user-123" }, { isVerified: true });
      expect(VerificationTokenRepository.delete).toHaveBeenCalledWith({ id: "vtoken-id" });
      expect(result.redirect).toContain("/login");
    });
    
    test("🚫 invalid or expired => 400", async () => {
      VerificationTokenRepository.findFirst.mockResolvedValue(null);
      const result = await verifyEmailService("bad-token");
      expect(result.status).toBe(400);
      expect(result.response).toEqual({ error: "Invalid or expired verification token." });
    });
  });

  // --- resetPasswordRequestService ---
  describe("resetPasswordRequestService", () => {
    test("✅ reset request success => returns 200", async () => {
      UserRepository.findUnique.mockResolvedValue(mockUser);
      PasswordResetTokenRepository.deleteMany.mockResolvedValue({ count: 0 });
      crypto.randomBytes.mockReturnValue(Buffer.from("reset-token-123", "utf-8"));
      PasswordResetTokenRepository.create.mockResolvedValue({ id: "pr-token-id" });
      sendResetPasswordEmail.mockResolvedValue(true);

      const result = await resetPasswordRequestService("john@example.com");
      expect(UserRepository.findUnique).toHaveBeenCalledWith({ email: "john@example.com" });
      expect(PasswordResetTokenRepository.deleteMany).toHaveBeenCalledWith({ userId: "user-123" });
      expect(PasswordResetTokenRepository.create).toHaveBeenCalled();
      expect(sendResetPasswordEmail).toHaveBeenCalledWith(mockUser, expect.any(String));
      expect(result.status).toBe(200);
      expect(result.response).toEqual({ message: "Password reset link sent to your email." });
    });

    test("🚫 user not found => 404", async () => {
      UserRepository.findUnique.mockResolvedValue(null);
      const result = await resetPasswordRequestService("nope@example.com");
      expect(result.status).toBe(404);
      expect(result.response).toEqual({ error: "User with this email does not exist." });
    });

    test("🚫 fails sending reset email => 500", async () => {
      UserRepository.findUnique.mockResolvedValue(mockUser);
      PasswordResetTokenRepository.deleteMany.mockResolvedValue({ count: 0 });
      crypto.randomBytes.mockReturnValue(Buffer.from("some-reset-ttt", "utf-8"));
      PasswordResetTokenRepository.create.mockResolvedValue({ id: "pr-id" });
      sendResetPasswordEmail.mockRejectedValue(new Error("Email fail"));

      const result = await resetPasswordRequestService("john@example.com");
      expect(result.status).toBe(500);
      expect(result.response).toEqual({ error: "Failed to send reset password email." });
    });
  });

  // --- resetPasswordService ---
  describe("resetPasswordService", () => {
    test("✅ resets password => 200", async () => {
      PasswordResetTokenRepository.findUnique.mockResolvedValue({
        token: "some-token",
        userId: "user-123",
        expiresAt: new Date(mockDateNow + 10000),
      });
      bcrypt.hash.mockResolvedValue("new-hashed");
      UserRepository.update.mockResolvedValue({});
      PasswordResetTokenRepository.delete.mockResolvedValue({});

      const result = await resetPasswordService("some-token", "NewPass!!!");
      expect(PasswordResetTokenRepository.findUnique).toHaveBeenCalledWith({ token: "some-token" });
      expect(bcrypt.hash).toHaveBeenCalledWith("NewPass!!!", 10);
      expect(UserRepository.update).toHaveBeenCalledWith({ id: "user-123" }, { password: "new-hashed" });
      expect(PasswordResetTokenRepository.delete).toHaveBeenCalledWith({ token: "some-token" });
      expect(result.status).toBe(200);
      expect(result.response).toEqual({
        message: "Password reset successful. You can now log in with your new password.",
      });
    });

    test("🚫 invalid or expired => 400", async () => {
      PasswordResetTokenRepository.findUnique.mockResolvedValue(null);
      const result = await resetPasswordService("expired-token", "SomeNewPass");
      expect(result.status).toBe(400);
      expect(result.response).toEqual({ error: "Invalid or expired reset token." });
    });
  });

  // --- refreshTokenService ---
  describe("refreshTokenService", () => {
    test("✅ refresh success => returns 200 with AuthDTO", async () => {
      verifyToken.mockReturnValue({ id: "user-123" });
      UserRepository.findUnique.mockResolvedValue({ ...mockUser, isVerified: true });
      generateToken.mockReturnValue("new-access-token");

      const result = await refreshTokenService("old-ref-token");
      expect(verifyToken).toHaveBeenCalledWith("old-ref-token", true);
      expect(UserRepository.findUnique).toHaveBeenCalledWith({ id: "user-123" });
      expect(generateToken).toHaveBeenCalledWith(expect.objectContaining({ id: "user-123" }));
      expect(result.status).toBe(200);
      expect(result.response).toBeInstanceOf(AuthDTO);
      expect(result.response.accessToken).toBe("new-access-token");
      expect(result.response.refreshToken).toBe("old-ref-token");
    });

    test("🚫 invalid refresh => 401", async () => {
      verifyToken.mockImplementation(() => {
        throw new Error("Invalid or expired");
      });
      const result = await refreshTokenService("bad-ref-token");
      expect(result.status).toBe(401);
      expect(result.response).toEqual({ error: "Invalid or expired refresh token" });
    });

    test("🚫 user not found => 404", async () => {
      verifyToken.mockReturnValue({ id: "user-missing" });
      UserRepository.findUnique.mockResolvedValue(null);
      const result = await refreshTokenService("some-valid-ref");
      expect(result.status).toBe(404);
      expect(result.response).toEqual({ error: "User not found" });
    });

    test("🚫 user not verified => 403", async () => {
      verifyToken.mockReturnValue({ id: "user-123" });
      UserRepository.findUnique.mockResolvedValue({ ...mockUser, isVerified: false });
      const result = await refreshTokenService("unverified-ref");
      expect(result.status).toBe(403);
      expect(result.response).toEqual({
        error: "Please verify your email before requesting a new token.",
      });
    });
  });

  // --- authorizeService ---
  describe("authorizeService", () => {
    test("🚫 missing or invalid auth header => 401", async () => {
      const result = await authorizeService("");
      expect(result.status).toBe(401);
      expect(result.response).toEqual({ error: "Unauthorized, token required" });

      const result2 = await authorizeService("Something no Bearer");
      expect(result2.status).toBe(401);
    });

    test("🚫 invalid token => 400", async () => {
      verifyToken.mockImplementation(() => {
        throw new Error("expired token");
      });
      const result = await authorizeService("Bearer bad-token");
      expect(verifyToken).toHaveBeenCalledWith("bad-token");
      expect(result.status).toBe(400);
      expect(result.response).toEqual({ error: "Invalid or expired token" });
    });

    test("🚫 user not found => 404", async () => {
      verifyToken.mockReturnValue({ id: "missing-user" });
      UserRepository.findUnique.mockResolvedValue(null);
      const result = await authorizeService("Bearer goodtoken");
      expect(result.status).toBe(404);
      expect(result.response).toEqual({ error: "User not found" });
    });

    test("🚫 user not verified => 403", async () => {
      verifyToken.mockReturnValue({ id: "user-123" });
      UserRepository.findUnique.mockResolvedValue({ ...mockUser, isVerified: false });
      const result = await authorizeService("Bearer realtoken");
      expect(result.status).toBe(403);
      expect(result.response).toEqual({ error: "User is not verified" });
    });

    test("✅ success => returns 200 with user info", async () => {
      verifyToken.mockReturnValue({ id: "user-123" });
      UserRepository.findUnique.mockResolvedValue({ ...mockUser, isVerified: true });
      const result = await authorizeService("Bearer realtoken2");
      expect(result.status).toBe(200);
      expect(result.response).toEqual({ user: expect.any(UserDTO) });
    });
  });
});
