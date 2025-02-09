import { generateToken, verifyToken } from "../../config/jwt.js";
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken");

describe("JWT Tests", () => {
  const mockPayload = { id: "1", role: "ROLE_ADMIN" };
  const mockToken = "mock.jwt.token";

  test("✅ Should generate a token", () => {
    jwt.sign.mockReturnValue(mockToken);
    const token = generateToken(mockPayload);
    expect(token).toBe(mockToken);
  });

  test("✅ Should verify a valid token", () => {
    jwt.verify.mockReturnValue(mockPayload);
    const decoded = verifyToken(mockToken);
    expect(decoded).toEqual(mockPayload);
  });

  test("🚫 Should throw error for invalid token", () => {
    jwt.verify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    expect(() => verifyToken(mockToken)).toThrow("Invalid token");
  });
});
