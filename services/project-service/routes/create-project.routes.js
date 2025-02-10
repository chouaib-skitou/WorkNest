import express from "express";
import { createProject } from "../controllers/create-project.controller.js";
import { create } from "domain";
import { validateRequestProject } from "../middleware/validate.middleware.js";

const router = express.Router();

router.post("/project", createProject);

export default router;
