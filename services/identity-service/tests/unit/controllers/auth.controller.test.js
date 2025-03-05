/**
 * tests/unit/controllers/auth.controller.test.js
 */
import * as authController from "../../../controllers/auth.controller.js";
import {
  registerService,
  loginService,
  verifyEmailService,
  resetPasswordRequestService,
  resetPasswordService,
  refreshTokenService,
  authorizeService,
} from "../../../services/auth.service.js";

// Mock the entire auth service module
jest.mock("../../../services/auth.service.js");

describe("🧪 Auth Controller Tests", () => {
  let req, res;

  beforeEach(() => {
    // Mock request/response objects
    req = {
      body: {},
      params: {},
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      redirect: jest.fn(), // used by verifyEmail for the redirect scenario
    };

    jest.clearAllMocks();
  });

  describe("register", () => {
    // The final handler is at index [2] in authController.register array
    const registerHandler = authController.register[2];

    test("✅ should register user successfully (status from service)", async () => {
      registerService.mockResolvedValue({
        status: 201,
        response: { message: "User registered" },
      });

      req.body = {
        firstName: "Alice",
        lastName: "Smith",
        email: "alice@example.com",
        password: "MyPassword123!",
      };

      await registerHandler(req, res);

      expect(registerService).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: "User registered" });
    });

    test("🚫 should handle error with defined status code", async () => {
      registerService.mockRejectedValue({
        status: 409,
        message: "Email already in use",
      });

      await registerHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: "Email already in use" });
    });

    test("🚫 should handle error with no status => 500 fallback", async () => {
      registerService.mockRejectedValue(new Error("Register error"));

      await registerHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Register error" });
    });
  });

  describe("login", () => {
    // The final handler is at index [2] in authController.login array
    const loginHandler = authController.login[2];

    test("✅ should login user successfully (200)", async () => {
      loginService.mockResolvedValue({
        status: 200,
        response: { user: { id: "u1" }, accessToken: "abc" },
      });

      req.body = { email: "test@example.com", password: "Pass123!" };

      await loginHandler(req, res);

      expect(loginService).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        user: { id: "u1" },
        accessToken: "abc",
      });
    });

    test("🚫 should handle error with defined status code (e.g. 403)", async () => {
      loginService.mockRejectedValue({
        status: 403,
        message: "Please verify your email",
      });

      await loginHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Please verify your email" });
    });

    test("🚫 should handle error with no status => 500 fallback", async () => {
      loginService.mockRejectedValue(new Error("Login error"));

      await loginHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Login error" });
    });
  });

  describe("verifyEmail", () => {
    test("✅ should verify email and redirect", async () => {
      verifyEmailService.mockResolvedValue({
        status: 302,
        redirect: "http://frontend/login",
        response: { message: "Email verified" },
      });

      req.params = { userId: "user-123", token: "verify-token" };

      await authController.verifyEmail(req, res);

      expect(verifyEmailService).toHaveBeenCalledWith("user-123", "verify-token");
      // Because result.redirect was set, we expect res.redirect
      expect(res.redirect).toHaveBeenCalledWith("http://frontend/login");
    });

    test("✅ should verify email without redirect, just JSON response", async () => {
      verifyEmailService.mockResolvedValue({
        status: 200,
        response: { message: "Email verified no redirect" },
      });

      req.params = { userId: "user-xyz", token: "no-redirect-token" };

      await authController.verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email verified no redirect",
      });
    });

    test("🚫 error with defined status code => 400 or 401 etc", async () => {
      verifyEmailService.mockRejectedValue({
        status: 400,
        message: "Invalid token",
      });

      req.params = { userId: "u1", token: "bad-token" };

      await authController.verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
    });

    test("🚫 error => no status => 500 fallback", async () => {
      verifyEmailService.mockRejectedValue(new Error("Unknown verify error"));

      await authController.verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Unknown verify error" });
    });
  });

  describe("resetPasswordRequest", () => {
    // The final handler is at index [2]
    const resetPwdRequestHandler = authController.resetPasswordRequest[2];

    test("✅ should request password reset successfully (200)", async () => {
      resetPasswordRequestService.mockResolvedValue({
        status: 200,
        response: { message: "Password reset link sent" },
      });

      req.body = { email: "bob@example.com" };

      await resetPwdRequestHandler(req, res);

      expect(resetPasswordRequestService).toHaveBeenCalledWith("bob@example.com");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Password reset link sent" });
    });

    test("🚫 error => defined status code (e.g. 404)", async () => {
      resetPasswordRequestService.mockRejectedValue({
        status: 404,
        message: "User not found",
      });

      await resetPwdRequestHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    test("🚫 error => fallback 500", async () => {
      resetPasswordRequestService.mockRejectedValue(new Error("Some error"));

      await resetPwdRequestHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Some error" });
    });
  });

  describe("resetPassword", () => {
    // The final handler is at index [2]
    const resetPasswordHandler = authController.resetPassword[2];

    test("✅ should reset password successfully (200)", async () => {
      resetPasswordService.mockResolvedValue({
        status: 200,
        response: { message: "Password reset successful" },
      });

      req.params = { token: "reset-token-123" };
      req.body = { newPassword: "NewPass123!" };

      await resetPasswordHandler(req, res);

      expect(resetPasswordService).toHaveBeenCalledWith("reset-token-123", "NewPass123!");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Password reset successful",
      });
    });

    test("🚫 error => defined status code (e.g. 400)", async () => {
      resetPasswordService.mockRejectedValue({
        status: 400,
        message: "Expired token",
      });

      await resetPasswordHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Expired token" });
    });

    test("🚫 error => fallback 500", async () => {
      resetPasswordService.mockRejectedValue(new Error("Reset error"));

      await resetPasswordHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Reset error" });
    });
  });

  describe("refreshToken", () => {
    // The final handler is at index [2]
    const refreshTokenHandler = authController.refreshToken[2];

    test("✅ should refresh token successfully", async () => {
      refreshTokenService.mockResolvedValue({
        status: 200,
        response: { accessToken: "new-acc-token" },
      });

      req.body = { refreshToken: "old-refresh-token" };

      await refreshTokenHandler(req, res);

      expect(refreshTokenService).toHaveBeenCalledWith("old-refresh-token");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ accessToken: "new-acc-token" });
    });

    test("🚫 error => defined status code (401, 403, etc.)", async () => {
      refreshTokenService.mockRejectedValue({
        status: 401,
        message: "Invalid refresh token",
      });

      await refreshTokenHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid refresh token" });
    });

    test("🚫 error => fallback 500", async () => {
      refreshTokenService.mockRejectedValue(new Error("Refresh error"));

      await refreshTokenHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Refresh error" });
    });
  });

  describe("authorize", () => {
    test("✅ should authorize user successfully (200)", async () => {
      authorizeService.mockResolvedValue({
        status: 200,
        response: { user: { id: "auth-user" } },
      });

      req.headers.authorization = "Bearer test-auth-token";

      await authController.authorize(req, res);

      expect(authorizeService).toHaveBeenCalledWith("Bearer test-auth-token");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ user: { id: "auth-user" } });
    });

    test("🚫 error => defined status code => e.g. 401, 403 etc", async () => {
      authorizeService.mockRejectedValue({
        status: 401,
        message: "Unauthorized, token required",
      });

      await authController.authorize(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Unauthorized, token required",
      });
    });

    test("🚫 error => fallback 500", async () => {
      authorizeService.mockRejectedValue(new Error("Authorize error"));

      await authController.authorize(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Authorize error" });
    });
  });
});
