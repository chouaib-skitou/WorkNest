import { validationResult } from "express-validator";
import {
  registerValidationRules,
  loginValidationRules,
  refreshTokenRules,
  resetPasswordRequestRules,
  resetPasswordRules,
} from "../../../validators/auth.validator.js";

/**
 * Helper to run an array of validation rules (express-validator) on a mock request.
 * Returns the array of validation errors.
 */
async function runValidatorRules(rules, reqBody) {
  const req = { body: reqBody };
  const errors = [];

  // Run each validator rule
  for (const rule of rules) {
    await rule.run(req);
  }

  // Use express-validator's validationResult to gather errors
  const result = validationResult(req);
  return result.array();
}

describe("Auth Validator Tests (100% coverage)", () => {
  test("🚫 registerValidationRules should fail when required fields are missing", async () => {
    const reqBody = {}; 
    const errors = await runValidatorRules(registerValidationRules, reqBody);
    const messages = errors.map(e => e.msg);
    expect(messages).toEqual(
      expect.arrayContaining([
        "First name is required",
        "Last name is required",
        "Invalid email format",
        "Password must be at least 8 characters long",
      ])
    );
  });

  test("🚫 registerValidationRules should fail if user tries to set isVerified or role", async () => {
    const reqBody = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "TestPass123!",
      isVerified: true,
      role: "admin",
    };
    const errors = await runValidatorRules(registerValidationRules, reqBody);
    const messages = errors.map(e => e.msg);
    expect(messages).toEqual(
      expect.arrayContaining([
        "Cannot manually set verification status",
        "Cannot set the role manually",
      ])
    );
  });

  test("✅ registerValidationRules passes with valid data", async () => {
    const reqBody = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "ValidPass123!",
    };
    const errors = await runValidatorRules(registerValidationRules, reqBody);
    expect(errors.length).toBe(0); // no validation errors
  });

  test("🚫 loginValidationRules should fail when missing fields", async () => {
    const reqBody = { email: "", password: "" };
    const errors = await runValidatorRules(loginValidationRules, reqBody);
    const messages = errors.map(e => e.msg);
    expect(messages).toEqual(
      expect.arrayContaining(["Invalid email format", "Password is required"])
    );
  });

  test("✅ loginValidationRules passes with valid data", async () => {
    const reqBody = { email: "valid@example.com", password: "somePassword" };
    const errors = await runValidatorRules(loginValidationRules, reqBody);
    expect(errors.length).toBe(0);
  });

  test("🚫 refreshTokenRules should fail if refresh token is missing", async () => {
    const reqBody = { refreshToken: "" };
    const errors = await runValidatorRules(refreshTokenRules, reqBody);
    const messages = errors.map(e => e.msg);
    expect(messages).toEqual(["Refresh token is required"]);
  });

  test("✅ refreshTokenRules passes with valid refreshToken", async () => {
    const reqBody = { refreshToken: "someValidToken" };
    const errors = await runValidatorRules(refreshTokenRules, reqBody);
    expect(errors.length).toBe(0);
  });

  test("🚫 resetPasswordRequestRules fails if invalid email", async () => {
    const reqBody = { email: "notEmail" };
    const errors = await runValidatorRules(resetPasswordRequestRules, reqBody);
    expect(errors[0].msg).toBe("Invalid email format");
  });

  test("✅ resetPasswordRequestRules passes with valid email", async () => {
    const reqBody = { email: "valid@example.com" };
    const errors = await runValidatorRules(resetPasswordRequestRules, reqBody);
    expect(errors.length).toBe(0);
  });

  test("🚫 resetPasswordRules fails if confirmNewPassword is missing", async () => {
    const reqBody = {
      newPassword: "ValidPass123!",
      confirmNewPassword: "",
    };
    const errors = await runValidatorRules(resetPasswordRules, reqBody);
    const messages = errors.map(e => e.msg);
    expect(messages).toContain("Confirm password is required");
  });

  test("🚫 resetPasswordRules fails if passwords do not match", async () => {
    const reqBody = {
      newPassword: "ValidPass123!",
      confirmNewPassword: "DifferentPass123!",
    };
    const errors = await runValidatorRules(resetPasswordRules, reqBody);
    const messages = errors.map(e => e.msg);
    expect(messages).toContain("Passwords do not match");
  });

  test("✅ resetPasswordRules passes when newPassword is strong and confirmNewPassword matches", async () => {
    const reqBody = {
      newPassword: "ValidPass123!",
      confirmNewPassword: "ValidPass123!",
    };
    const errors = await runValidatorRules(resetPasswordRules, reqBody);
    expect(errors.length).toBe(0);
  });
});
