import { body, param } from "express-validator";

// Validation for updating user
export const updateUserValidationRules = [
  body("firstName").optional().notEmpty().withMessage("First name cannot be empty"),
  body("lastName").optional().notEmpty().withMessage("Last name cannot be empty"),
  body("email").optional().isEmail().withMessage("Invalid email format"),
  body("role").optional().isIn(["ROLE_EMPLOYEE", "ROLE_MANAGER", "ROLE_ADMIN"]).withMessage("Invalid role"),
  body("isVerified").optional().isBoolean().withMessage("isVerified must be a boolean"),
];

// Validation for deleting user
export const deleteUserValidationRules = [
  param("id").isUUID().withMessage("Invalid user ID format"),
];
