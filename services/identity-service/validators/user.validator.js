import { body, param } from "express-validator";

const validRoles = ["ROLE_EMPLOYEE", "ROLE_MANAGER", "ROLE_ADMIN"];


// Validator for creating a user (Required fields must be present)
export const createUserValidationRules = [
  // First name is required and must be a non-empty string
  body("firstName")
    .notEmpty()
    .withMessage("First name is required")
    .isString()
    .withMessage("First name must be a string"),

  // Last name is required and must be a non-empty string
  body("lastName")
    .notEmpty()
    .withMessage("Last name is required")
    .isString()
    .withMessage("Last name must be a string"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
    .matches(/\d/).withMessage("Password must contain at least one number")
    .matches(/[\W_]/).withMessage("Password must contain at least one special character"),
  body("id").not().exists().withMessage("User ID cannot be set manually"),
  body("role")
    .optional()
    .isIn(validRoles)
    .withMessage(`Invalid role value. Valid roles: ${validRoles.join(", ")}`),
  body("isVerified")
    .not()
    .exists()
    .withMessage("Cannot set verification status manually"),
];

// Validator for updating a user using PUT (All fields must be validated)
export const updateUserValidationRules = [
  param("id").isUUID().withMessage("Invalid user ID format"),
  body("id").not().exists().withMessage("User ID cannot be changed"),
  body("firstName")
    .optional()
    .notEmpty()
    .withMessage("First name cannot be empty")
    .isString()
    .withMessage("First name must be a string"),
  body("lastName")
    .optional()
    .notEmpty()
    .withMessage("Last name cannot be empty")
    .isString()
    .withMessage("Last name must be a string"),
  body("email")
    .optional()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  body("role")
    .optional()
    .isIn(validRoles)
    .withMessage(`Invalid role value. Valid roles: ${validRoles.join(", ")}`),
  body("isVerified")
    .not()
    .exists()
    .withMessage("Cannot manually set verification status"),
  body("password")
    .not()
    .exists()
    .withMessage("Cannot change the password manually"),
];

// Validator for partially updating a user using PATCH (Only provided fields will be updated)
export const patchUserValidationRules = [
  param("id").isUUID().withMessage("Invalid user ID format"),
  body("firstName")
    .optional()
    .notEmpty()
    .withMessage("First name cannot be empty")
    .isString()
    .withMessage("First name must be a string"),
  body("lastName")
    .optional()
    .notEmpty()
    .withMessage("Last name cannot be empty")
    .isString()
    .withMessage("Last name must be a string"),
  body("email")
    .optional()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  body("id").not().exists().withMessage("User ID cannot be changed"),
  body("role")
    .optional()
    .isIn(validRoles)
    .withMessage(`Invalid role value. Valid roles: ${validRoles.join(", ")}`),
  body("isVerified")
    .not()
    .exists()
    .withMessage("Cannot manually set verification status"),
  body("password")
    .not()
    .exists()
    .withMessage("Cannot change the password manually"),
];

// Validator for deleting a user
export const deleteUserValidationRules = [
  // Validate the URL parameter id as a UUID
  param("id").isUUID().withMessage("Invalid user ID format"),
];
