import { verifyToken } from "../config/jwt.js";

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  // eslint-disable-next-line no-unused-vars
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};
