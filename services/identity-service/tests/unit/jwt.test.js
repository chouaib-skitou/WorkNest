import { generateToken, generateRefreshToken, verifyToken } from "../../config/jwt.js";
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken");

describe("🔐 JWT Tests", () => {
  const mockPayload = { id: "1", role: "ROLE_ADMIN" };
  const mockToken = "mock.jwt.token";
  const mockRefreshToken = "mock.jwt.refresh.token";

  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test("✅ Should generate an access token", () => {
    jwt.sign.mockReturnValue(mockToken);
    const token = generateToken(mockPayload);
    expect(token).toBe(mockToken);
    expect(jwt.sign).toHaveBeenCalledWith(
      mockPayload,
      process.env.JWT_SECRET,
      expect.objectContaining({ expiresIn: process.env.JWT_EXPIRES_IN })
    );
  });
  
  test("✅ Should generate a refresh token", () => {
    jwt.sign.mockReturnValue(mockRefreshToken);
    const token = generateRefreshToken(mockPayload);
    expect(token).toBe(mockRefreshToken);
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: mockPayload.id }, // Refresh token does not include role
      process.env.JWT_REFRESH_SECRET,
      expect.objectContaining({ expiresIn: process.env.JWT_REFRESH_EXPIRES_IN })
    );
  });
  
  test("✅ Should verify a valid access token", () => {
    jwt.verify.mockReturnValue(mockPayload);
    const decoded = verifyToken(mockToken);
    expect(decoded).toEqual(mockPayload);
    expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
  });
  
  test("✅ Should verify a valid refresh token", () => {
    jwt.verify.mockReturnValue({ id: "1" });
    const decoded = verifyToken(mockRefreshToken, true);
    expect(decoded).toEqual({ id: "1" });
    expect(jwt.verify).toHaveBeenCalledWith(mockRefreshToken, process.env.JWT_REFRESH_SECRET);
  });
  
  test("🚫 Should return null for invalid token", () => {
    jwt.verify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    expect(() => verifyToken(mockToken)).toThrow("Invalid token");
  });

  test("🚫 Should return null for invalid refresh token", () => {
    jwt.verify.mockImplementation(() => {
      throw new Error("Invalid refresh token");
    });

    expect(() => verifyToken(mockRefreshToken, true)).toThrow("Invalid refresh token");
  });
});
