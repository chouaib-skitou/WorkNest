import { body } from "express-validator";

// Validation for user registration
export const registerValidationRules = [
  body("firstName").notEmpty().withMessage("First name is required"),
  body("lastName").notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("Invalid email format"),
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
    .matches(/\d/).withMessage("Password must contain at least one number")
    .matches(/[\W_]/).withMessage("Password must contain at least one special character"),
  body("isVerified").not().exists().withMessage("Cannot manually set verification status"),
  body("role").not().exists().withMessage("Cannot set the role manually"),
];

// Validation for user login
export const loginValidationRules = [
  body("email").isEmail().withMessage("Invalid email format"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Validation for refreshToken
export const refreshTokenRules = [
  body("refreshToken").notEmpty().withMessage("Refresh token is required"),
];

// Validation for requesting a password reset
export const resetPasswordRequestRules = [
  body("email").isEmail().withMessage("Invalid email format"),
];

// Validation for resetting the password
export const resetPasswordRules = [
  body("newPassword")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
    .matches(/\d/).withMessage("Password must contain at least one number")
    .matches(/[\W_]/).withMessage("Password must contain at least one special character"),
  
  body("confirmNewPassword")
    .custom((value, { req }) => {
      if (!value) {
        throw new Error("Confirm password is required");
      }
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

