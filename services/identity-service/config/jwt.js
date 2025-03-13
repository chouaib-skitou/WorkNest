import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

export const generateToken = (user) => {
  console.log("JWT_SECRET", process.env.JWT_SECRET);
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

export const generateRefreshToken = (user) => {
  console.log("JWT_REFRESH_SECRET", process.env.JWT_REFRESH_SECRET);
  return jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });
};

export const verifyToken = (token, isRefreshToken = false) => {
  console.log("verifyToken --------------------------");
  console.log("JWT_SECRET", process.env.JWT_SECRET);
  console.log("JWT_REFRESH_SECRET", process.env.JWT_REFRESH_SECRET);
  const secret = isRefreshToken ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;
    return jwt.verify(token, secret);
};
