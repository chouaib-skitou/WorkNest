import { body, param } from "express-validator";

// 🛠 Validation for updating a user
export const updateUserValidationRules = [
  param("id").isUUID().withMessage("Invalid user ID format"), // Ensure the ID in the URL is a valid UUID
  
  body("id").not().exists().withMessage("User ID cannot be changed"), // Prevent changing ID
  
  body("firstName").optional().notEmpty().withMessage("First name cannot be empty"),
  body("lastName").optional().notEmpty().withMessage("Last name cannot be empty"),
  body("email").optional().isEmail().withMessage("Invalid email format"),
  body("role").optional().isIn(["ROLE_EMPLOYEE", "ROLE_MANAGER", "ROLE_ADMIN"]).withMessage("Invalid role"),
  body("isVerified").not().exists().withMessage("Cannot manually set verification status"),

  // Ensure password is not empty when provided
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
    .matches(/\d/).withMessage("Password must contain at least one number")
    .matches(/[\W_]/).withMessage("Password must contain at least one special character"),
];

// 🛠 Validation for deleting a user
export const deleteUserValidationRules = [
  param("id").isUUID().withMessage("Invalid user ID format"),
];
