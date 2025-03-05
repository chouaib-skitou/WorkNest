// task.service.js
import { prisma } from "../config/database.js";
import { TaskDTO } from "../dtos/task.dto.js";
import { fetchUsersByIds } from "./helpers/user.enrichment.js";

/**
 * Generate dynamic filter conditions for task queries.
 * @param {Object} query - Query parameters from the request.
 * @returns {Object} - Filter conditions for Prisma query.
 */
const getDynamicFilters = (query) => {
  const filters = {};
  if (query.title) {
    filters.title = { contains: query.title, mode: "insensitive" };
  }
  if (query.priority) {
    filters.priority = query.priority;
  }
  if (query.stageId) {
    filters.stageId = query.stageId;
  }
  if (query.projectId) {
    filters.projectId = query.projectId;
  }
  return filters;
};

/**
 * Generate sorting options for task queries.
 * @param {Object} query - Query parameters from the request.
 * @returns {Object} - Sorting options for Prisma query.
 */
const getSortingOptions = (query) => {
  const allowedFields = ["title", "createdAt", "updatedAt"];
  const sortField = allowedFields.includes(query.sortField)
    ? query.sortField
    : "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
  return { [sortField]: sortOrder };
};

/**
 * Generate role-based filter for GET operations on tasks.
 * ROLE_EMPLOYEE: tasks from projects where employeeIds contains user.id.
 * ROLE_MANAGER: tasks from projects where managerId, createdBy, or employeeIds match user.id.
 * ROLE_ADMIN: no additional filter.
 * @param {Object} user - The user object.
 * @returns {Object} - Filter object for task queries.
 */
const getTaskRoleBasedFilter = (user) => {
  if (user.role === "ROLE_EMPLOYEE") {
    return { Project: { employeeIds: { has: user.id } } };
  } else if (user.role === "ROLE_MANAGER") {
    return {
      OR: [
        { Project: { managerId: user.id } },
        { Project: { createdBy: user.id } },
        { Project: { employeeIds: { has: user.id } } },
      ],
    };
  }
  return {}; // ROLE_ADMIN: no filter.
};

/**
 * Authorize task creation.
 * Only Admins and Managers can create tasks.
 * For Managers, creation is allowed only if they are the project's manager or creator.
 * @param {Object} user - The user creating the task.
 * @param {string} projectId - The project ID associated with the task.
 * @returns {Promise<void>}
 */
const authorizeTaskCreation = async (user, projectId) => {
  if (user.role === "ROLE_ADMIN") {
    console.log(`Admin authorized to create task for project: ${projectId}`);
    return;
  }
  if (user.role === "ROLE_MANAGER") {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return Promise.reject({ status: 404, message: "Project not found" });
    }
    if (project.managerId === user.id || project.createdBy === user.id) {
      console.log(`Manager authorized to create task for project: ${projectId}`);
      return;
    }
    return Promise.reject({
      status: 403,
      message:
        "Access denied: You do not have permission to create a task for this project",
    });
  }
  return Promise.reject({
    status: 403,
    message: "Access denied: Only admins and managers can create tasks",
  });
};

/**
 * Authorize task modification (update or patch) based on user role.
 * ROLE_ADMIN: allowed.
 * ROLE_MANAGER: allowed if they are the project's manager or creator.
 * If a manager is only in the employee list, they may only update the stageId via PATCH.
 * ROLE_EMPLOYEE: allowed to PATCH only the stageId if that is the sole field.
 * @param {Object} user - The user performing the operation.
 * @param {string} id - The task ID.
 * @param {Object} updateData - The update data.
 * @param {string} opType - Operation type ("update" or "patch").
 * @returns {Promise<Object>} - Resolves with the task if authorized.
 */
export const authorizeTaskModification = async (user, id, updateData, opType = "update") => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { Project: true },
  });
  if (!task) {
    return Promise.reject({ status: 404, message: "Task not found" });
  }
  if (user.role === "ROLE_ADMIN") {
    return task;
  }
  if (user.role === "ROLE_MANAGER") {
    if (task.Project.managerId === user.id || task.Project.createdBy === user.id) {
      return task;
    }
    // Allow managers who are only in the employeeIds to patch the stageId
    if (
      opType === "patch" &&
      Object.keys(updateData).length === 1 &&
      updateData.stageId
    ) {
      return task;
    }
    return Promise.reject({
      status: 403,
      message: "Access denied: You do not have permission to update this task",
    });
  }
  if (user.role === "ROLE_EMPLOYEE") {
    // Allow employees to PATCH only the stageId (and nothing else)
    if (
      opType === "patch" &&
      Object.keys(updateData).length === 1 &&
      updateData.stageId
    ) {
      return task;
    }
    return Promise.reject({
      status: 403,
      message: "Access denied: Employees can only update the task stage",
    });
  }
  return Promise.reject({
    status: 403,
    message: "Access denied: You do not have permission to update this task",
  });
};

/**
 * Authorize task deletion based on user role.
 * ROLE_ADMIN: allowed.
 * ROLE_MANAGER: allowed only if they are the creator of the associated project.
 * @param {Object} user - The user performing the deletion.
 * @param {string} id - The task ID.
 * @returns {Promise<Object>} - Resolves with the task if authorized.
 */
const authorizeTaskDeletion = async (user, id) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { Project: true },
  });
  if (!task) {
    return Promise.reject({ status: 404, message: "Task not found" });
  }
  if (user.role === "ROLE_ADMIN") {
    return task;
  }
  if (user.role === "ROLE_MANAGER" && task.Project.createdBy === user.id) {
    return task;
  }
  return Promise.reject({
    status: 403,
    message: "Access denied: You do not have permission to delete this task",
  });
};

/**
 * Retrieve a paginated list of tasks based on filters, sorting, and role-based authorization.
 * Enriches each task with user details for the assignedTo field using the provided token.
 * @param {Object} user - The user making the request.
 * @param {Object} query - Query parameters for filtering, pagination, and sorting.
 * @param {string} token - JWT token used for fetching user details.
 * @returns {Promise<Object>} - Paginated tasks data.
 */
export const getTasksService = async (user, query, token) => {
  const parsedPage = parseInt(query.page);
  const parsedLimit = parseInt(query.limit);
  const page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const limit = isNaN(parsedLimit) || parsedLimit < 1 ? 10 : parsedLimit;
  const skip = (page - 1) * limit;

  const where = {
    ...getTaskRoleBasedFilter(user),
    ...getDynamicFilters(query),
  };

  const orderBy = getSortingOptions(query);

  try {
    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { Stage: true, Project: true },
      }),
      prisma.task.count({ where }),
    ]);

    if (totalCount === 0) {
      return {
        data: [],
        page,
        limit,
        totalCount: 0,
        totalPages: 0,
      };
    }

    // Enrich each task with the assignedTo user details if available
    for (const task of tasks) {
      if (task.assignedTo) {
        const userMap = await fetchUsersByIds([task.assignedTo], token);
        task.assignedTo = userMap[task.assignedTo] || task.assignedTo;
      }
    }

    return {
      data: tasks.map((task) => new TaskDTO(task)),
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    console.error("Error fetching tasks:", error);
    if (error.code === "P2025") {
      return Promise.reject({
        status: 403,
        message: "Access denied: You do not have permission to view tasks",
      });
    }
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};

/**
 * Retrieve a single task by its ID with associated Stage and Project.
 * Enriches the task with user details for the assignedTo field using the provided token.
 * @param {Object} user - The user making the request.
 * @param {string} id - The task ID.
 * @param {string} token - JWT token used for fetching user details.
 * @returns {Promise<TaskDTO>} - The task data transfer object.
 */
export const getTaskByIdService = async (user, id, token) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: { Stage: true, Project: true },
    });
    if (!task) {
      return Promise.reject({ status: 404, message: "Task not found" });
    }
    if (task.assignedTo) {
      const userMap = await fetchUsersByIds([task.assignedTo], token);
      task.assignedTo = userMap[task.assignedTo] || task.assignedTo;
    }
    return new TaskDTO(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};

/**
 * Create a new task.
 * Only Admins and Managers can create tasks.
 * For Managers, creation is allowed only if they are the project's manager or creator.
 * Enriches the task with user details for the assignedTo field using the provided token.
 * @param {Object} user - The user creating the task.
 * @param {Object} data - The task data.
 * @param {string} token - JWT token used for fetching user details.
 * @returns {Promise<TaskDTO>} - The created task data transfer object.
 */
export const createTaskService = async (user, data, token) => {
  try {
    await authorizeTaskCreation(user, data.projectId);
    const taskData = {
      ...data,
      title: data.title.toLowerCase(),
    };
    const newTask = await prisma.task.create({
      data: taskData,
      include: { Stage: true, Project: true },
    });
    if (newTask.assignedTo) {
      const userMap = await fetchUsersByIds([newTask.assignedTo], token);
      newTask.assignedTo = userMap[newTask.assignedTo] || newTask.assignedTo;
    }
    return new TaskDTO(newTask);
  } catch (error) {
    console.error("Error creating task:", error);
    if (error && error.status) {
      return Promise.reject(error);
    }
    if (error.code === "P2002") {
      return Promise.reject({
        status: 409,
        message: "A task with this title already exists for this project",
      });
    }
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};

/**
 * Fully update a task.
 * - Admins can update all tasks.
 * - Managers can update tasks if they are the project's manager or creator.
 * Enriches the task with user details for the assignedTo field using the provided token.
 * @param {Object} user - The user updating the task.
 * @param {string} id - The task ID.
 * @param {Object} data - The updated task data.
 * @param {string} token - JWT token used for fetching user details.
 * @returns {Promise<TaskDTO>} - The updated task data transfer object.
 */
export const updateTaskService = async (user, id, data, token) => {
  try {
    await authorizeTaskModification(user, id, data, "update");
    const updateData = { ...data };
    if (updateData.title) updateData.title = updateData.title.toLowerCase();
    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: { Stage: true, Project: true },
    });
    if (updatedTask.assignedTo) {
      const userMap = await fetchUsersByIds([updatedTask.assignedTo], token);
      updatedTask.assignedTo = userMap[updatedTask.assignedTo] || updatedTask.assignedTo;
    }
    return new TaskDTO(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    if (error && error.status) {
      return Promise.reject(error);
    }
    if (error.code === "P2002") {
      return Promise.reject({
        status: 409,
        message: "A task with this title already exists for this project",
      });
    }
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};

/**
 * Partially update a task.
 * - Admins can update all tasks.
 * - Managers can update a task if they are the project's manager or creator.
 *   If a manager is only in the employee list, they may only update the stageId.
 * - Employees can update the stageId only.
 * Enriches the task with user details for the assignedTo field using the provided token.
 * @param {Object} user - The user updating the task.
 * @param {string} id - The task ID.
 * @param {Object} data - The partial task data to update.
 * @param {string} token - JWT token used for fetching user details.
 * @returns {Promise<TaskDTO>} - The updated task data transfer object.
 */
export const patchTaskService = async (user, id, data, token) => {
  try {
    await authorizeTaskModification(user, id, data, "patch");
    const updateData = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) updateData[key] = value;
    });
    if (Object.keys(updateData).length === 0) {
      return Promise.reject({
        status: 400,
        message: "No valid fields provided for update",
      });
    }
    if (updateData.title) {
      updateData.title = updateData.title.toLowerCase();
    }
    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: { Stage: true, Project: true },
    });
    if (updatedTask.assignedTo) {
      const userMap = await fetchUsersByIds([updatedTask.assignedTo], token);
      updatedTask.assignedTo = userMap[updatedTask.assignedTo] || updatedTask.assignedTo;
    }
    return new TaskDTO(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    if (error && error.status) {
      return Promise.reject(error);
    }
    if (error.code === "P2002") {
      return Promise.reject({
        status: 409,
        message: "A task with this title already exists for this project",
      });
    }
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};

/**
 * Delete a task.
 * - Admins can delete any task.
 * - Managers can delete a task only if they are the creator of the associated project.
 * @param {Object} user - The user deleting the task.
 * @param {string} id - The task ID.
 * @returns {Promise<Object>} - An object with status and a success message.
 */
export const deleteTaskService = async (user, id) => {
  try {
    await authorizeTaskDeletion(user, id);
    await prisma.task.delete({ where: { id } });
    return { status: 200, message: "Task deleted successfully" };
  } catch (error) {
    console.error("Error deleting task:", error);
    if (error && error.status) {
      return Promise.reject(error);
    }
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};
