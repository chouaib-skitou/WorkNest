/**
 * tests/unit/services/email.service.test.js
 */
import {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendAccountCreationEmail,
} from "../../../services/email.service.js";
import { sendMail } from "../../../config/mail.js";

// Mock sendMail so no real email is sent
jest.mock("../../../config/mail.js", () => ({
  sendMail: jest.fn(),
}));

describe("Email Service Tests", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FRONTEND_URL = "http://example.com"; // fallback
    process.env.BASE_URL = "http://example.com";      // for verification link
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
  
  describe("sendVerificationEmail", () => {
    test("✅ sends verification email with placeholders replaced", async () => {
      const user = { firstName: "Alice", id: "u1", email: "alice@example.com" };
      const token = "verify-token-123";
      sendMail.mockResolvedValue(true);

      await sendVerificationEmail(user, token);

      expect(sendMail).toHaveBeenCalledWith(
        "alice@example.com",
        "Welcome to WorkNest - Verify Your Email",
        expect.stringContaining("Hello Alice"), // plain text
        expect.stringContaining("verify-token-123") // HTML link
      );
    });

    test("🚫 rethrows error if sendMail fails", async () => {
      const user = { firstName: "Bob", id: "u2", email: "bob@example.com" };
      sendMail.mockRejectedValue(new Error("SMTP error"));

      await expect(
        sendVerificationEmail(user, "some-token")
      ).rejects.toThrow("SMTP error");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error sending verification email:",
        expect.any(Error)
      );
    });
  });
  
  describe("sendResetPasswordEmail", () => {
    test("✅ sends reset password email", async () => {
      const user = { firstName: "Carol", id: "u3", email: "carol@example.com" };
      const token = "reset-token-999";
      sendMail.mockResolvedValue(true);

      await sendResetPasswordEmail(user, token);

      expect(sendMail).toHaveBeenCalledWith(
        "carol@example.com",
        "WorkNest - Reset Your Password",
        expect.stringContaining("reset your password"),
        expect.stringContaining("reset-token-999")
      );
    });

    test("🚫 rethrows error if sendMail fails", async () => {
      const user = { firstName: "Dan", id: "u4", email: "dan@example.com" };
      sendMail.mockRejectedValue(new Error("SMTP meltdown"));

      await expect(
        sendResetPasswordEmail(user, "tok-abc")
      ).rejects.toThrow("SMTP meltdown");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error sending reset password email:",
        expect.any(Error)
      );
    });
  });
  
  describe("sendAccountCreationEmail", () => {
    test("✅ sends email with placeholders replaced", async () => {
      const user = { firstName: "Eve", email: "eve@example.com" };
      const token = "my-reset-token";

      // Mock sendMail to succeed
      sendMail.mockResolvedValue(true);

      const result = await sendAccountCreationEmail(user, token);

      // Check that sendMail was called with correct subject/text/html
      expect(sendMail).toHaveBeenCalledWith(
        "eve@example.com",
        "Welcome to WorkNest - Set Your Password",
        expect.stringContaining("Your WorkNest account has been successfully created"),
        expect.stringContaining("Hello Eve") // HTML snippet
      );

      // Check link
      expect(sendMail.mock.calls[0][3]).toContain(
        "http://example.com/reset-password/my-reset-token"
      );

      expect(result).toBe(true);
    });

    test("🚫 rethrows error if sendMail fails", async () => {
      const user = { firstName: "Frank", email: "frank@example.com" };
      const token = "fail-token";

      sendMail.mockRejectedValue(new Error("SMTP error"));

      await expect(sendAccountCreationEmail(user, token)).rejects.toThrow("SMTP error");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error sending account creation email:",
        expect.any(Error)
      );
    });
  });
});
