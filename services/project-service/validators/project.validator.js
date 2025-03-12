import { body, param } from "express-validator";

const validStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED"];
const validPriorities = ["LOW", "MEDIUM", "HIGH"];

// Validator for creating a project (Required fields must be present)
export const createProjectValidation = [
  body("id").not().exists().withMessage("Cannot set Project ID manually"),
  body("name")
    .notEmpty()
    .withMessage("Project name is required")
    .isString()
    .withMessage("Project name must be a string"),

  body("description")
    .notEmpty()
    .withMessage("Project description is required")
    .isString()
    .withMessage("Project description must be a string"),

    body("image")
    .optional()
    .custom((value) => {
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error("Image must be a valid URL");
      }
    }),

  body("documents.*")
    .optional()
    .custom((value) => {
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error("Each document must be a valid URL");
      }
    }),

    body("documents.*")
    .optional()
    .custom((value) => {
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error("Each document must be a valid URL");
      }
    }),

  body("createdBy").not().exists().withMessage("Cannot set createdBy manually"),

  body("managerId")
    .optional()
    .isString()
    .withMessage("Manager ID must be a string"),

  body("employeeIds")
    .optional()
    .isArray()
    .withMessage("Employee IDs must be an array of user IDs"),

  body("employeeIds.*")
    .optional()
    .isString()
    .withMessage("Each employee ID must be a string"),

  // Due Date - Now required in Prisma
  body("dueDate")
    .notEmpty()
    .withMessage("Due date is required")
    .isISO8601()
    .withMessage(
      "Due date must be a valid ISO 8601 date (YYYY-MM-DDT00:00:00.000Z)"
    )
    .custom((value) => {
      const regex = /^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/;
      if (!regex.test(value)) {
        throw new Error(
          "Due date must be in the format YYYY-MM-DDT00:00:00.000Z"
        );
      }
      return true;
    }),

  body("status")
    .optional()
    .isString()
    .withMessage("Status must be a string")
    .isIn(validStatuses)
    .withMessage(`Status must be one of: ${validStatuses.join(", ")}`),

  body("priority")
    .optional()
    .isString()
    .withMessage("Priority must be a string")
    .isIn(validPriorities)
    .withMessage(`Priority must be one of: ${validPriorities.join(", ")}`),
];

// Validator for updating a project using PUT (All fields must be provided)
export const updateProjectValidation = [
  param("id").isUUID().withMessage("Invalid Project ID format"),
  body("id").not().exists().withMessage("Project ID cannot be changed"),

  body("name")
    .notEmpty()
    .withMessage("Project name is required")
    .isString()
    .withMessage("Project name must be a string"),

  body("description")
    .notEmpty()
    .withMessage("Project description is required")
    .isString()
    .withMessage("Project description must be a string"),

    body("image")
    .optional()
    .custom((value) => {
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error("Image must be a valid URL");
      }
    }),

  body("documents.*")
    .optional()
    .custom((value) => {
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error("Each document must be a valid URL");
      }
    }),

  body("documents.*")
    .optional()
    .custom((value) => {
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error("Each document must be a valid URL");
      }
    }),

  body("managerId")
    .optional()
    .isString()
    .withMessage("Manager ID must be a string"),

  body("createdBy").not().exists().withMessage("Cannot set createdBy manually"),

  body("employeeIds")
    .optional()
    .isArray()
    .withMessage("Employee IDs must be an array of user IDs"),

  body("employeeIds.*")
    .optional()
    .isString()
    .withMessage("Each employee ID must be a string"),

  // Due Date - Now required
  body("dueDate")
    .notEmpty()
    .withMessage("Due date is required")
    .isISO8601()
    .withMessage(
      "Due date must be a valid ISO 8601 date (YYYY-MM-DDT00:00:00.000Z)"
    )
    .custom((value) => {
      const regex = /^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/;
      if (!regex.test(value)) {
        throw new Error(
          "Due date must be in the format YYYY-MM-DDT00:00:00.000Z"
        );
      }
      return true;
    }),

  body("status")
    .optional()
    .isString()
    .withMessage("Status must be a string")
    .isIn(validStatuses)
    .withMessage(`Status must be one of: ${validStatuses.join(", ")}`),

  body("priority")
    .optional()
    .isString()
    .withMessage("Priority must be a string")
    .isIn(validPriorities)
    .withMessage(`Priority must be one of: ${validPriorities.join(", ")}`),
];

// Validator for partially updating a project using PATCH (Only provided fields will be updated)
export const patchProjectValidation = [
  param("id").isUUID().withMessage("Invalid Project ID format"),
  body("id").not().exists().withMessage("Project ID cannot be changed"),

  body("name")
    .optional()
    .notEmpty()
    .withMessage("Project name cannot be empty")
    .isString()
    .withMessage("Project name must be a string"),

  body("description")
    .optional()
    .notEmpty()
    .withMessage("Project description cannot be empty")
    .isString()
    .withMessage("Project description must be a string"),

    body("image")
    .optional()
    .custom((value) => {
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error("Image must be a valid URL");
      }
    }),

  body("documents.*")
    .optional()
    .custom((value) => {
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error("Each document must be a valid URL");
      }
    }),

    body("documents.*")
    .optional()
    .custom((value) => {
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error("Each document must be a valid URL");
      }
    }),

  body("managerId")
    .optional()
    .isString()
    .withMessage("Manager ID must be a string"),

  body("createdBy").not().exists().withMessage("Cannot set createdBy manually"),

  body("employeeIds")
    .optional()
    .isArray()
    .withMessage("Employee IDs must be an array of user IDs"),

  body("employeeIds.*")
    .optional()
    .isString()
    .withMessage("Each employee ID must be a string"),

  // Due Date - Required in Prisma but optional in PATCH
  body("dueDate")
    .optional()
    .notEmpty()
    .withMessage("Due date cannot be empty")
    .isISO8601()
    .withMessage(
      "Due date must be a valid ISO 8601 date (YYYY-MM-DDT00:00:00.000Z)"
    )
    .custom((value) => {
      const regex = /^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/;
      if (!regex.test(value)) {
        throw new Error(
          "Due date must be in the format YYYY-MM-DDT00:00:00.000Z"
        );
      }
      return true;
    }),

  body("status")
    .optional()
    .notEmpty()
    .withMessage("Status cannot be empty")
    .isString()
    .withMessage("Status must be a string")
    .isIn(validStatuses)
    .withMessage(`Status must be one of: ${validStatuses.join(", ")}`),

  body("priority")
    .optional()
    .notEmpty()
    .withMessage("Priority cannot be empty")
    .isString()
    .withMessage("Priority must be a string")
    .isIn(validPriorities)
    .withMessage(`Priority must be one of: ${validPriorities.join(", ")}`),
];

// Validator for deleting a project
export const deleteProjectValidation = [
  param("id").isUUID().withMessage("Invalid project ID format"),
];
