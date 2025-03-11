// middleware/auth.middleware.js
import { validateJwt } from "../utils/jwt.js";

/**
 * Middleware to authenticate the user.
 * Validates the JWT token and attaches the user data to the request object.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Next middleware function.
 */
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized, token required" });
    }
    const token = authHeader.split(" ")[1];
    const user = await validateJwt(token);
    if (!user) {
      return res.status(403).json({ error: "Forbidden, invalid user" });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};
