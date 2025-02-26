import { body, param } from "express-validator";

// UUID validation with custom messages
const isUUID = (field) =>
  param(field).isUUID().withMessage(`${field} must be a valid UUID`);

export const getStageByIdValidation = [isUUID("id")];
export const deleteStageValidation = [isUUID("id")];

export const createStageValidation = [
  body("name")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Stage name is required"),
  body("position")
    .isInt({ min: 0 })
    .withMessage("Position must be a positive integer"),
  body("color").optional().isHexColor().withMessage("Invalid color format"),
  body("projectId").isUUID().withMessage("Project ID must be a valid UUID"),
];

export const updateStageValidation = [
  isUUID("id"),
  body("name")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Invalid name"),
  body("position")
    .isInt({ min: 0 })
    .notEmpty()
    .withMessage("Position must be a positive integer"),
  body("color").notEmpty().isHexColor().withMessage("Invalid color format"),
];

export const patchStageValidation = [
  isUUID("id"),
  body("name")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Invalid name"),
  body("position")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Position must be a positive integer"),
  body("color").optional().isHexColor().withMessage("Invalid color format"),
];
