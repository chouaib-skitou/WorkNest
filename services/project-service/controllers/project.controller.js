/**
 * Project Controller Module
 * Handles incoming requests related to projects and delegates operations to the project service.
 */

import { validateRequest } from "../middleware/validate.middleware.js";
import {
  createProjectValidation,
  updateProjectValidation,
  patchProjectValidation,
  deleteProjectValidation,
} from "../validators/project.validator.js";
import {
  getProjectsService,
  getProjectByIdService,
  createProjectService,
  updateProjectService,
  patchProjectService,
  deleteProjectService,
} from "../services/project.service.js";

/**
 * Get all projects with optional filters, pagination, and sorting.
 * @route GET /api/projects
 * @access Protected
 */
export const getProjects = async (req, res) => {
  try {
    const projects = await getProjectsService(
      req.user,
      req.query,
      req.headers.authorization.split(" ")[1]
    );
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Get a single project by ID with its associated stages and tasks.
 * @route GET /api/projects/:id
 * @access Protected
 */
export const getProjectById = async (req, res) => {
  try {
    const project = await getProjectByIdService(
      req.user,
      req.params.id,
      req.headers.authorization.split(" ")[1]
    );
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.status(200).json(project);
  } catch (error) {
    console.error("Error fetching project by ID:", error);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Create a new project. Accessible only by admins and managers.
 * @route POST /api/projects
 * @access Protected
 */
export const createProject = [
  createProjectValidation,
  validateRequest,
  async (req, res) => {
    try {
      const project = await createProjectService(
        req.user,
        req.body,
        req.headers.authorization.split(" ")[1]
      );
      res.status(201).json(project);
    } catch (error) {
      console.error("❌ Error creating project:", error);
      const statusCode = error.status || 500;
      res.status(statusCode).json({ error: error.message });
    }
  },
];

/**
 * Fully update a project. Accessible by admins or managers who manage or created the project.
 * @route PUT /api/projects/:id
 * @access Protected
 */
export const updateProject = [
  updateProjectValidation,
  validateRequest,
  async (req, res) => {
    try {
      const project = await updateProjectService(
        req.user,
        req.params.id,
        req.body,
        req.headers.authorization.split(" ")[1]
      );
      res.status(200).json(project);
    } catch (error) {
      console.error("❌ Error updating project:", error);
      const statusCode = error.status || 500;
      res.status(statusCode).json({ error: error.message });
    }
  },
];

/**
 * Partially update a project. Accessible by admins or managers who manage or created the project.
 * @route PATCH /api/projects/:id
 * @access Protected
 */
export const patchProject = [
  patchProjectValidation,
  validateRequest,
  async (req, res) => {
    try {
      const project = await patchProjectService(
        req.user,
        req.params.id,
        req.body,
        req.headers.authorization.split(" ")[1]
      );
      res.status(200).json(project);
    } catch (error) {
      console.error("❌ Error patching project:", error);
      const statusCode = error.status || 500;
      res.status(statusCode).json({ error: error.message });
    }
  },
];

/**
 * Delete a project. Accessible by admins or managers who created the project.
 * @route DELETE /api/projects/:id
 * @access Protected
 */
export const deleteProject = [
  deleteProjectValidation,
  validateRequest,
  async (req, res) => {
    try {
      const response = await deleteProjectService(req.user, req.params.id);
      res.status(200).json(response);
    } catch (error) {
      console.error("❌ Error deleting project:", error);
      const statusCode = error.status || 500;
      res.status(statusCode).json({ error: error.message });
    }
  },
];
