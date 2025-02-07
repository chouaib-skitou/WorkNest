import express from "express";
import {
  register,
  login,
  verifyEmail,
  resetPasswordRequest,
  resetPassword,
} from "../controllers/auth.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Authentication and user management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account and sends an email verification link.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: User registered successfully, verification email sent.
 *       400:
 *         description: Invalid input data.
 */
router.post("/register", register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticates a user and returns a JWT token.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful, JWT token returned.
 *       401:
 *         description: Unauthorized, incorrect credentials.
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/verify-email/{userId}/{token}:
 *   get:
 *     summary: Verify email
 *     description: Verifies a user's email address.
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification token
 *     responses:
 *       200:
 *         description: Email verified successfully.
 *       400:
 *         description: Invalid or expired token.
 */
router.get("/verify-email/:userId/:token", verifyEmail);

/**
 * @swagger
 * /auth/reset-password-request:
 *   post:
 *     summary: Request password reset
 *     description: Sends a password reset email if the user exists.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent if user exists.
 */
router.post("/reset-password-request", resetPasswordRequest);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Reset password
 *     description: Resets a user's password using a valid reset token.
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *               - confirmNewPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *               confirmNewPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password successfully reset.
 *       400:
 *         description: Invalid or expired token, or passwords do not match.
 */
router.post("/reset-password/:token", resetPassword);

export default router;
