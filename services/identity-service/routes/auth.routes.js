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
 * /api/auth/register:
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
 *         description: User registered successfully; verification email sent.
 *       400:
 *         description: Missing or invalid request body.
 *       409:
 *         description: Email already in use.
 *       500:
 *         description: User was created, but verification email failed or other server error.
 */
router.post("/register", register);

/**
 * @swagger
 * /api/auth/login:
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
 *         description: Login successful, JWT tokens returned.
 *       400:
 *         description: Missing or invalid request body.
 *       401:
 *         description: Unauthorized, incorrect credentials.
 *       403:
 *         description: Forbidden, user not verified.
 *       500:
 *         description: Internal server error.
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/verify-email/{token}:
 *   get:
 *     summary: Verify email
 *     description: Verifies a user's email address using a verification token.
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification token
 *     responses:
 *       200:
 *         description: Email verified (if no redirect).
 *       302:
 *         description: Email verified, and user is redirected to login page.
 *       400:
 *         description: Invalid or missing path parameters.
 *       500:
 *         description: Internal server error.
 */
router.get("/verify-email/:token", verifyEmail);

/**
 * @swagger
 * /api/auth/reset-password-request:
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
 *       400:
 *         description: Missing or invalid request body.
 *       404:
 *         description: User with this email does not exist.
 *       500:
 *         description: Failed to send reset password email or other server error.
 */
router.post("/reset-password-request", resetPasswordRequest);

/**
 * @swagger
 * /api/auth/reset-password/{token}:
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
 *                 description: Must be at least 8 chars, with uppercase, lowercase, number, and special character.
 *               confirmNewPassword:
 *                 type: string
 *                 format: password
 *                 description: Must match the new password.
 *     responses:
 *       200:
 *         description: Password successfully reset.
 *       400:
 *         description: Missing or invalid request body, or invalid/expired reset token.
 *       500:
 *         description: Internal server error.
 */
router.post("/reset-password/:token", resetPassword);

/**
 * @swagger
 * /api/auth/refresh:
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
 *         description: Missing or invalid request body (no refresh token).
 *       401:
 *         description: Invalid or expired refresh token.
 *       403:
 *         description: User not verified.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.post("/refresh", refreshToken);

/**
 * @swagger
 * /api/auth/authorize:
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
 *       500:
 *         description: Internal server error.
 */
router.get("/authorize", authorize);

export default router;
