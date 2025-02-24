import { validateJwt } from "../utils/jwt.js";

/**
 * Middleware to authenticate user and attach user info to request
 */
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized, token required" });
    }

    const token = authHeader.split(" ")[1];

    // Validate JWT and get user details
    const user = await validateJwt(token);

    if (!user) {
      return res.status(403).json({ error: "Forbidden, invalid user" });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};
