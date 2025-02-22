import { body } from "express-validator";

export const createStageValidation = [
  body("name").notEmpty().withMessage("Stage name is required"),
  body("position").isInt().withMessage("Position must be an integer"),
  body("color").optional().isHexColor().withMessage("Color must be a valid hex color"),
  body("projectId").notEmpty().withMessage("Project ID is required"),
];
