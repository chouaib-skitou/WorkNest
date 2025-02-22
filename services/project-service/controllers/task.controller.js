import { prisma } from "../config/database.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { 
  createTaskValidation, 
  updateTaskValidation, 
  patchTaskValidation, 
  deleteTaskValidation, 
  getTaskByIdValidation 
} from "../validators/task.validator.js";
import { TaskDTO } from "../dtos/task.dto.js";

/**
 * @desc Get all tasks (with pagination)
 * @route GET /api/tasks
 * @access Public
 */
export const getTasks = async (req, res) => {
  try {
    const parsedPage = parseInt(req.query.page);
    const parsedLimit = parseInt(req.query.limit);
    const page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
    const limit = isNaN(parsedLimit) || parsedLimit < 1 ? 10 : parsedLimit;
    const skip = (page - 1) * limit;

    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        skip,
        take: limit,
        include: { Stage: true, Project: true },
      }),
      prisma.task.count(),
    ]);

    const transformedTasks = tasks.map((task) => new TaskDTO(task));

    res.json({
      data: transformedTasks,
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Get a task by ID
 * @route GET /api/tasks/:id
 * @access Public
 */
export const getTaskById = [
  getTaskByIdValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const task = await prisma.task.findUnique({
        where: { id },
        include: { Stage: true, Project: true },
      });

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.status(200).json(new TaskDTO(task));
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
];

/**
 * @desc Create a new task
 * @route POST /api/tasks
 * @access Public
 */
export const createTask = [
  createTaskValidation,
  validateRequest,
  async (req, res) => {
    try {
      let { title, description, priority, stageId, projectId, assignedTo, images } = req.body;
      const normalizedTitle = title.toLowerCase();

      const task = await prisma.task.create({
        data: { 
          title: normalizedTitle, 
          description, 
          priority, 
          stageId, 
          projectId, 
          assignedTo, 
          images 
        },
        include: { Stage: true, Project: true },
      });

      res.status(201).json({ message: "Task created successfully", task: new TaskDTO(task) });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({ error: "A task with this title already exists for this project" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
];

/**
 * @desc Update a task (PUT)
 * @route PUT /api/tasks/:id
 * @access Public
 */
export const updateTask = [
  updateTaskValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      let { title, description, priority, stageId, assignedTo, images } = req.body;

      const updateData = { description, priority, stageId, assignedTo, images };
      if (title) {
        updateData.title = title.toLowerCase();
      }

      const task = await prisma.task.update({
        where: { id },
        data: updateData,
        include: { Stage: true, Project: true },
      });

      res.status(200).json({ message: "Task updated successfully", task: new TaskDTO(task) });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({ error: "A task with this title already exists for this project" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
];

/**
 * @desc Partially update a task (PATCH)
 * @route PATCH /api/tasks/:id
 * @access Public
 */
export const patchTask = [
  patchTaskValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = {};

      Object.entries(req.body).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[key] = value;
        }
      });

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields provided for update" });
      }

      if (updateData.title) {
        updateData.title = updateData.title.toLowerCase();
      }

      const task = await prisma.task.update({
        where: { id },
        data: updateData,
        include: { Stage: true, Project: true },
      });

      res.status(200).json({ message: "Task updated successfully", task: new TaskDTO(task) });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({ error: "A task with this title already exists for this project" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
];

/**
 * @desc Delete a task
 * @route DELETE /api/tasks/:id
 * @access Public
 */
export const deleteTask = [
  deleteTaskValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.task.delete({ where: { id } });

      res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
];
