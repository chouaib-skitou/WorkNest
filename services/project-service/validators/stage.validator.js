import { body, param } from "express-validator";

// UUID validation with custom messages
const isUUID = (field) =>
  param(field).isUUID().withMessage(`${field} must be a valid UUID`);

export const getStageByIdValidation = [isUUID("id")];
export const deleteStageValidation = [isUUID("id")];

export const createStageValidation = [
  body("id").not().exists().withMessage("Cannot set stageId manually"),
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
  param("id").isUUID().withMessage("Invalid Stage ID format"),
  body("id").not().exists().withMessage("Stage ID cannot be changed"),
  body("name").isString().trim().notEmpty().withMessage("Invalid name"),
  body("position")
    .isInt({ min: 0 })
    .notEmpty()
    .withMessage("Position must be a positive integer"),
  body("color").notEmpty().isHexColor().withMessage("Invalid color format"),
  body("projectId")
    .notEmpty()
    .isUUID()
    .withMessage("Project ID must be a valid UUID"),
];

export const patchStageValidation = [
  param("id").isUUID().withMessage("Invalid Stage ID format"),
  body("id").not().exists().withMessage("Stage ID cannot be changed"),
  body("name")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Invalid name"),
  body("projectId")
    .optional()
    .notEmpty()
    .isUUID()
    .withMessage("Project ID must be a valid UUID"),
  body("position")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Position must be a positive integer"),
  body("color").optional().isHexColor().withMessage("Invalid color format"),
];
