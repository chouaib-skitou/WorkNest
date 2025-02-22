import express from "express";
import { createProject, getProjects } from "../controllers/project.controller.js";
// import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", createProject);
router.get("/", getProjects);

export default router;
