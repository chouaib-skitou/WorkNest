import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";
import { generateToken, generateRefreshToken } from "../config/jwt.js";
import { sendMail } from "../config/mail.js";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

export const register = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return res.status(400).json({ error: "Email already in use" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { firstName, lastName, email, password: hashedPassword },
  });

  const verificationToken = crypto.randomBytes(32).toString("hex");
  await sendMail(
    user.email,
    "Verify Your Email",
    `Click here to verify your email: ${process.env.FRONTEND_URL}/auth/verify-email/${user.id}/${verificationToken}`,
    `<a href="${process.env.FRONTEND_URL}/auth/verify-email/${user.id}/${verificationToken}">Verify Email</a>`
  );

  res.status(201).json({ message: "User registered. Please verify your email." });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const accessToken = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  res.json({ accessToken, refreshToken });
};

export const verifyEmail = async (req, res) => {
  const { userId } = req.params;
  await prisma.user.update({ where: { id: userId }, data: { isVerified: true } });
  res.redirect(`${process.env.FRONTEND_URL}/login`);
};
