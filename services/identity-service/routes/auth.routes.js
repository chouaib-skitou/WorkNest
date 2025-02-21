import express from "express";
import {
  register,
  login,
  verifyEmail,
  resetPasswordRequest,
  resetPassword,
  refreshToken,
  authorize,
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
 *     description: Creates a new user account and sends an email verification link. Users cannot manually set role or verification status.
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
 *       409:
 *         description: Email already in use.
 */
router.post("/register", register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticates a user and returns a JWT token. User must be verified before logging in.
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
 *       400:
 *         description: Missing required fields.
 *       401:
 *         description: Unauthorized, incorrect credentials.
 *       403:
 *         description: Forbidden, user not verified.
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/verify-email/{userId}/{token}:
 *   get:
 *     summary: Verify email
 *     description: Verifies a user's email address using a verification token.
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
 *       404:
 *         description: User with this email does not exist.
 */
router.post("/reset-password-request", resetPasswordRequest);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Reset password
 *     description: Resets a user's password using a valid reset token. Passwords must meet security requirements.
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
 *                 description: Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character.
 *               confirmNewPassword:
 *                 type: string
 *                 format: password
 *                 description: Must match the new password.
 *     responses:
 *       200:
 *         description: Password successfully reset.
 *       400:
 *         description: Invalid or expired token, or passwords do not match.
 */
router.post("/reset-password/:token", resetPassword);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Generates a new access token if the provided refresh token is valid.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token generated successfully.
 *       400:
 *         description: Bad request, missing refresh token.
 *       401:
 *         description: Unauthorized, invalid or expired refresh token.
 *       403:
 *         description: Forbidden, user not verified.
 *       404:
 *         description: User not found.
 */
router.post("/refresh", refreshToken);

/**
 * @swagger
 * /auth/authorize:
 *   get:
 *     summary: Validate token and return user data
 *     description: Checks if the provided JWT token is valid and returns the authenticated user's details.
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid, user data returned.
 *       400:
 *         description: Invalid or expired token.
 *       401:
 *         description: Unauthorized, token required.
 *       403:
 *         description: User is not verified.
 *       404:
 *         description: User not found.
 */
router.get("/authorize", authorize);

export default router;
