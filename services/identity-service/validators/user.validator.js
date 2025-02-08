import { body, param } from "express-validator";

// Validation for updating a user
export const updateUserValidationRules = (req) => {
  const isAdmin = req.user && req.user.role === "ROLE_ADMIN"; // Check if the user is an admin
  console.log("isAdmin", isAdmin, req.user);

  return [
    param("id").isUUID().withMessage("Invalid user ID format"), // Ensure the ID in the URL is a valid UUID
    
    body("id").not().exists().withMessage("User ID cannot be changed"), // Prevent changing ID
    
    body("firstName").optional().notEmpty().withMessage("First name cannot be empty"),
    body("lastName").optional().notEmpty().withMessage("Last name cannot be empty"),
    body("email").optional().isEmail().withMessage("Invalid email format"),

    // Only allow admins to change roles
    body("role")
      .optional()
      .custom((value, { req }) => {
        if (!isAdmin) {
          throw new Error("Only administrators can change user roles");
        }
        return true;
      })
      .isIn(["ROLE_EMPLOYEE", "ROLE_MANAGER", "ROLE_ADMIN"])
      .withMessage("Invalid role"),

    body("isVerified").not().exists().withMessage("Cannot manually set verification status"),

    // Ensure password is not empty when provided
    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ];
};

// Validation for deleting a user
export const deleteUserValidationRules = [
  param("id").isUUID().withMessage("Invalid user ID format"),
];
