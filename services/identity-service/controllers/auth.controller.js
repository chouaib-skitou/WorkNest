import {
  registerService,
  loginService,
  verifyEmailService,
  resetPasswordRequestService,
  resetPasswordService,
  refreshTokenService,
  authorizeService,
} from "../services/auth.service.js";

import {
  registerValidationRules,
  loginValidationRules,
  refreshTokenRules,
  resetPasswordRequestRules,
  resetPasswordRules,
} from "../validators/auth.validator.js";

import { validateRequest } from "../middleware/validate.middleware.js";

/**
 * Controller for user registration
 * - Applies validation rules
 * - Calls registerService
 */
export const register = [
  registerValidationRules,
  validateRequest,
  async (req, res) => {
    try {
      const result = await registerService(req.body);
      res.status(result.status).json(result.response);
    } catch (error) {
      console.error("Error in register controller:", error);
      const status = error.status || 500;
      res.status(status).json({ error: error.message });
    }
  },
];

/**
 * Controller for user login
 * - Applies validation rules
 * - Calls loginService
 */
export const login = [
  loginValidationRules,
  validateRequest,
  async (req, res) => {
    try {
      const result = await loginService(req.body);
      res.status(result.status).json(result.response);
    } catch (error) {
      console.error("Error in login controller:", error);
      const status = error.status || 500;
      res.status(status).json({ error: error.message });
    }
  },
];

/**
 * Controller for verifying email
 * - No validations needed, it uses URL params
 */
export const verifyEmail = async (req, res) => {
  try {
    const { userId, token } = req.params;
    const result = await verifyEmailService(userId, token);
    if (result.redirect) {
      // If the service indicates a redirect (common pattern)
      return res.redirect(result.redirect);
    }
    res.status(result.status).json(result.response);
  } catch (error) {
    console.error("Error in verifyEmail controller:", error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message });
  }
};

/**
 * Controller for requesting a password reset
 * - Applies validation rules
 * - Calls resetPasswordRequestService
 */
export const resetPasswordRequest = [
  resetPasswordRequestRules,
  validateRequest,
  async (req, res) => {
    try {
      const result = await resetPasswordRequestService(req.body.email);
      res.status(result.status).json(result.response);
    } catch (error) {
      console.error("Error in resetPasswordRequest controller:", error);
      const status = error.status || 500;
      res.status(status).json({ error: error.message });
    }
  },
];

/**
 * Controller for resetting password
 * - Applies validation rules
 * - Calls resetPasswordService
 */
export const resetPassword = [
  resetPasswordRules,
  validateRequest,
  async (req, res) => {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;
      const result = await resetPasswordService(token, newPassword);
      res.status(result.status).json(result.response);
    } catch (error) {
      console.error("Error in resetPassword controller:", error);
      const status = error.status || 500;
      res.status(status).json({ error: error.message });
    }
  },
];

/**
 * Controller for refreshing token
 * - Applies validation rules
 * - Calls refreshTokenService
 */
export const refreshToken = [
  refreshTokenRules,
  validateRequest,
  async (req, res) => {
    try {
      const { refreshToken } = req.body;
      const result = await refreshTokenService(refreshToken);
      res.status(result.status).json(result.response);
    } catch (error) {
      console.error("Error in refreshToken controller:", error);
      const status = error.status || 500;
      res.status(status).json({ error: error.message });
    }
  },
];

/**
 * Controller for authorizing user
 * - No validation rules
 * - Calls authorizeService
 */
export const authorize = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const result = await authorizeService(authHeader);
    res.status(result.status).json(result.response);
  } catch (error) {
    console.error("Error in authorize controller:", error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message });
  }
};
