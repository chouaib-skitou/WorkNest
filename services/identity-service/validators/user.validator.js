import { body, param } from "express-validator";

// Validation for updating a user
export const updateUserValidationRules = [
  param("id").isUUID().withMessage("Invalid user ID format"),
  
  body("id").not().exists().withMessage("User ID cannot be changed"),
  
  body("firstName").optional().notEmpty().withMessage("First name cannot be empty"),
  body("lastName").optional().notEmpty().withMessage("Last name cannot be empty"),
  body("email").optional().isEmail().withMessage("Invalid email format"),
  body("role").not().exists().withMessage("Cannot change the role manually"),
  body("isVerified").not().exists().withMessage("Cannot manually set verification status"),
  body("password").not().exists().withMessage("Cannot change the password manually"),
];

// Validation for deleting a user
export const deleteUserValidationRules = [
  param("id").isUUID().withMessage("Invalid user ID format"),
];
