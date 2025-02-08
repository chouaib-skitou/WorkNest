import { authMiddleware } from "../../middleware/auth.middleware.js";
import { verifyToken } from "../../config/jwt.js";
import { prisma } from "../../config/database.js";

jest.mock("../../config/jwt.js", () => ({
  verifyToken: jest.fn(),
}));

jest.mock("../../config/database.js", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe("🛂 Auth Middleware Tests", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test("✅ Allows access with valid token and existing user", async () => {
    req.headers.authorization = "Bearer validToken";
    verifyToken.mockReturnValue({ id: "1" });
    prisma.user.findUnique.mockResolvedValue({ id: "1", name: "John Doe" });

    await authMiddleware(req, res, next);

    expect(req.user).toEqual({ id: "1", name: "John Doe" });
    expect(next).toHaveBeenCalled();
  });

  test("🚫 Rejects access without token", async () => {
    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  test("🚫 Rejects access with invalid token", async () => {
    req.headers.authorization = "Bearer invalidToken";
    verifyToken.mockImplementation(() => { throw new Error("Invalid token"); });

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
  });

  test("🚫 Rejects access with malformed authorization header", async () => {
    req.headers.authorization = "InvalidHeader";

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  test("🚫 Rejects access when user is not found in database", async () => {
    req.headers.authorization = "Bearer validToken";
    verifyToken.mockReturnValue({ id: "1" });
    prisma.user.findUnique.mockResolvedValue(null);

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });
});
