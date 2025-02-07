import { authMiddleware } from "../../middleware/auth.middleware.js";
import { verifyToken } from "../../config/jwt.js";

jest.mock("../../config/jwt.js", () => ({
  verifyToken: jest.fn(),
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("✅ Allows access with valid token", () => {
    req.headers.authorization = "Bearer validToken";
    verifyToken.mockReturnValue({ id: 1 });

    authMiddleware(req, res, next);

    expect(req.user).toEqual({ id: 1 });
    expect(next).toHaveBeenCalled();
  });

  test("🚫 Rejects access without token", () => {
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  test("🚫 Rejects access with invalid token", () => {
    req.headers.authorization = "Bearer invalidToken";
    verifyToken.mockImplementation(() => { throw new Error("Invalid token"); });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
  });

  test("🚫 Rejects access with malformed authorization header", () => {
    req.headers.authorization = "InvalidHeader";

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });
});
