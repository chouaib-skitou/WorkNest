/**
 * tests/unit/services/email.service.test.js
 */
import { sendAccountCreationEmail } from "../../../services/email.service.js";
import { sendMail } from "../../../config/mail.js";

// Mock sendMail so no real email is sent
jest.mock("../../../config/mail.js", () => ({
  sendMail: jest.fn(),
}));

describe("sendAccountCreationEmail (inline HTML version)", () => {
  // We’ll optionally spy on console.error to avoid noisy logs
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FRONTEND_URL = "http://example.com"; // or any fallback
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("✅ sends email with placeholders replaced", async () => {
    // Mock data
    const user = { firstName: "Alice", email: "alice@example.com" };
    const token = "my-reset-token";

    // Mock sendMail to succeed
    sendMail.mockResolvedValue(true);

    // Call your function
    const result = await sendAccountCreationEmail(user, token);

    // Confirm the correct arguments were passed to sendMail
    expect(sendMail).toHaveBeenCalledWith(
      "alice@example.com",                            // recipient
      "Welcome to WorkNest - Set Your Password",       // subject
      expect.stringContaining("Your WorkNest account has been successfully created"), // plain text
      expect.stringContaining("Hello Alice")           // HTML: check placeholder replaced
    );

    // Confirm the correct reset link was inserted in the HTML
    expect(sendMail.mock.calls[0][3]).toContain(
      "http://example.com/reset-password/my-reset-token"
    );

    // Confirm the function returned true on success
    expect(result).toBe(true);
  });

  test("🚫 rethrows error if sendMail fails", async () => {
    // Mock data
    const user = { firstName: "Bob", email: "bob@example.com" };
    const token = "fail-token";

    // Mock sendMail to reject
    sendMail.mockRejectedValue(new Error("SMTP error"));

    // Expect the function to throw
    await expect(sendAccountCreationEmail(user, token)).rejects.toThrow("SMTP error");

    // Confirm it logged the error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error sending account creation email:",
      expect.any(Error)
    );
  });
});
