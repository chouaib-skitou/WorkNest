import { StageRepository } from "../repositories/stage.repository.js";
import { StageDTO } from "../dtos/stage.dto.js";
import { ProjectRepository } from "../repositories/project.repository.js";

/**
 * Generate dynamic filter conditions based on query parameters.
 * @param {Object} query - Query parameters from the request.
 * @returns {Object} - Filter conditions for repository query.
 */
const getDynamicFilters = (query) => {
  const filters = {};
  if (query.name) {
    filters.name = { contains: query.name, mode: "insensitive" };
  }
  if (query.position) {
    filters.position = parseInt(query.position);
  }
  if (query.color) {
    filters.color = { equals: query.color };
  }
  if (query.projectId) {
    filters.projectId = query.projectId;
  }
  return filters;
};

/**
 * Generate sorting options for stage queries.
 * @param {Object} query - Query parameters from the request.
 * @returns {Object} - Sorting options for repository query.
 */
const getSortingOptions = (query) => {
  const allowedFields = ["name", "position"];
  const sortField = allowedFields.includes(query.sortField)
    ? query.sortField
    : "position";
  const sortOrder = query.sortOrder === "desc" ? "desc" : "asc";
  return { [sortField]: sortOrder };
};

/**
 * Generate role-based filter for GET operations on stages.
 * ROLE_EMPLOYEE: stages from projects where employeeIds contains user.id.
 * ROLE_MANAGER: stages from projects where Project.managerId, Project.createdBy, or Project.employeeIds match user.id.
 * ROLE_ADMIN: no additional filter.
 * @param {Object} user - The user object.
 * @returns {Object} - Filter object for stage queries.
 */
const getStageRoleBasedFilter = (user) => {
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
 * Authorize stage modification (update or patch) based on user role.
 * ROLE_ADMIN: allowed.
 * ROLE_MANAGER: allowed if the related Project's managerId or createdBy matches user.id.
 * @param {Object} user - The user performing the operation.
 * @param {string} id - The stage ID.
 * @param {Object} logConfig - Custom logging messages.
 * @returns {Promise<Object>} - Resolves with the stage if authorized.
 */
const authorizeStageModification = async (user, id, logConfig) => {
  const stage = await StageRepository.findUnique({
    where: { id },
    include: { Project: true },
  });
  if (!stage) {
    return Promise.reject({ status: 404, message: "Stage not found" });
  }
  if (user.role === "ROLE_ADMIN") {
    console.log(logConfig.adminLog.replace("{id}", id));
    return stage;
  }
  if (
    user.role === "ROLE_MANAGER" &&
    (stage.Project.managerId === user.id || stage.Project.createdBy === user.id)
  ) {
    console.log(logConfig.managerLog.replace("{id}", id));
    return stage;
  }
  console.warn(logConfig.unauthorizedLog.replace("{id}", id));
  return Promise.reject({
    status: 403,
    message: logConfig.unauthorizedMessage,
  });
};

/**
 * Authorize stage deletion based on user role.
 * ROLE_ADMIN: allowed.
 * ROLE_MANAGER: allowed only if the related Project was created by the user.
 * @param {Object} user - The user performing the deletion.
 * @param {string} id - The stage ID.
 * @returns {Promise<Object>} - Resolves with the stage if authorized.
 */
const authorizeStageDeletion = async (user, id) => {
  const stage = await StageRepository.findUnique({
    where: { id },
    include: { Project: true },
  });
  if (!stage) {
    return Promise.reject({ status: 404, message: "Stage not found" });
  }
  if (user.role === "ROLE_ADMIN") {
    console.log(`✅ Admin deleting stage: ${id}`);
    return stage;
  }
  if (user.role === "ROLE_MANAGER" && stage.Project.createdBy === user.id) {
    console.log(`Manager deleting stage they created: ${id}`);
    return stage;
  }
  console.warn(`Access denied: User not authorized to delete stage ${id}`);
  return Promise.reject({
    status: 403,
    message: "Access denied: You do not have permission to delete this stage",
  });
};

/**
 * Authorize stage creation based on user role.
 * ROLE_ADMIN: allowed.
 * ROLE_MANAGER: allowed if the related Project's managerId or createdBy matches user.id.
 * @param {Object} user - The user creating the stage.
 * @param {string} projectId - The project ID for which the stage is being created.
 * @returns {Promise<void>} - Resolves if authorized, otherwise rejects with an error.
 */
const authorizeStageCreation = async (user, projectId) => {
  // First, check if the project exists for ALL roles
  const project = await ProjectRepository.findUnique({
    where: { id: projectId }
  });
  
  if (!project) {
    return Promise.reject({ status: 404, message: "Project not found" });
  }

  if (user.role === "ROLE_ADMIN") {
    console.log(`Admin authorized to create stage for project: ${projectId}`);
    return;
  } else if (user.role === "ROLE_MANAGER") {
    if (project.managerId === user.id || project.createdBy === user.id) {
      console.log(`Manager authorized to create stage for project: ${projectId}`);
      return;
    } else {
      return Promise.reject({
        status: 403,
        message: "Access denied: You do not have permission to create a stage for this project"
      });
    }
  } else {
    return Promise.reject({
      status: 403,
      message: "Access denied: Only admins and managers can create stages"
    });
  }
};

/**
 * Retrieve a paginated list of stages based on filters, sorting, and role-based authorization.
 * @param {Object} user - The user making the request.
 * @param {Object} query - Query parameters for filtering, pagination, and sorting.
 * @returns {Promise<Object>} - Paginated stages data.
 */
export const getStagesService = async (user, query) => {
  const parsedPage = parseInt(query.page);
  const parsedLimit = parseInt(query.limit);
  const page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const limit = isNaN(parsedLimit) || parsedLimit < 1 ? 10 : parsedLimit;
  const skip = (page - 1) * limit;

  const where = {
    ...getStageRoleBasedFilter(user),
    ...getDynamicFilters(query),
  };

  const orderBy = getSortingOptions(query);

  try {
    const [stages, totalCount] = await Promise.all([
      StageRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { tasks: true, Project: true },
      }),
      StageRepository.count({ where }),
    ]);

    if (totalCount === 0) {
      console.warn("No stages found with filters:", where);
      return {
        data: [],
        page,
        limit,
        totalCount: 0,
        totalPages: 0,
      };
    }

    return {
      data: stages.map((stage) => new StageDTO(stage)),
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    console.error("Error fetching stages:", error);
    if (error.code === "P2025") {
      return Promise.reject({
        status: 403,
        message: "Access denied: You do not have permission to view stages",
      });
    }
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};

/**
 * Retrieve a single stage by its ID with associated tasks.
 * @param {Object} user - The user making the request.
 * @param {string} id - The stage ID.
 * @returns {Promise<StageDTO>} - The stage data transfer object.
 */
export const getStageByIdService = async (user, id) => {
  try {
    const where = { id, ...getStageRoleBasedFilter(user) };
    console.log("🔍 Debug: Stage role-based filter", where);

    // Use findMany and take the first result (if any)
    const stage = await StageRepository.findMany({
      where,
      include: { tasks: true, Project: true },
    }).then((results) => results[0] || null);

    if (!stage) {
      console.log("Debug: No stage found with filters", where);
      const existingStage = await StageRepository.findUnique({
        where: { id },
        select: { id: true },
      });
      if (existingStage) {
        console.warn("Access denied: User does not have permission");
        return Promise.reject({
          status: 403,
          message:
            "Access denied: You do not have permission to view this stage",
        });
      } else {
        console.warn("Stage not found in database");
        return Promise.reject({ status: 404, message: "Stage not found" });
      }
    }

    return new StageDTO(stage);
  } catch (error) {
    console.error("Error fetching stage:", error);
    return Promise.reject(error);
  }
};

/**
 * Create a new stage.
 * Only Admins and Managers can create stages.
 * For managers, creation is allowed only if they are the project's manager or creator.
 * @param {Object} user - The user creating the stage.
 * @param {Object} data - The stage data.
 * @returns {Promise<StageDTO>} - The created stage data transfer object.
 */
export const createStageService = async (user, data) => {
  try {
    await authorizeStageCreation(user, data.projectId);
    const stageData = {
      ...data,
      name: data.name.toLowerCase(),
    };
    const newStage = await StageRepository.create(stageData, {
      tasks: true,
      Project: true,
    });
    return new StageDTO(newStage);
  } catch (error) {
    console.error("Error creating stage:", error);
    if (error && error.status) {
      return Promise.reject(error);
    }
    if (error.code === "P2002") {
      return Promise.reject({
        status: 409,
        message: "A stage with this name already exists for this project",
      });
    }
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};

/**
 * Fully update a stage.
 * - Admins can update all stages.
 * - Managers can update stages if they are the project's manager or creator.
 * @param {Object} user - The user updating the stage.
 * @param {string} id - The stage ID.
 * @param {Object} data - The updated stage data.
 * @returns {Promise<StageDTO>} - The updated stage data transfer object.
 */
export const updateStageService = async (user, id, data) => {
  try {
    const logConfig = {
      adminLog: "Admin updating stage: {id}",
      managerLog: "Manager updating stage they manage or created: {id}",
      unauthorizedLog:
        "Access denied: User not authorized to update stage {id}",
      unauthorizedMessage:
        "Access denied: You do not have permission to update this stage",
    };

    await authorizeStageModification(user, id, logConfig);
    const updateData = { ...data };
    if (updateData.name) updateData.name = updateData.name.toLowerCase();
    const updatedStage = await StageRepository.update(id, updateData, {
      tasks: true,
      Project: true,
    });
    return new StageDTO(updatedStage);
  } catch (error) {
    console.error("Error updating stage:", error);
    if (error && error.status) {
      return Promise.reject(error);
    }
    if (error.code === "P2002") {
      return Promise.reject({
        status: 409,
        message: "A stage with this name already exists for this project",
      });
    }
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};

/**
 * Partially update a stage.
 * - Admins can update all stages.
 * - Managers can update a stage if they are the project's manager or creator.
 * @param {Object} user - The user updating the stage.
 * @param {string} id - The stage ID.
 * @param {Object} data - The partial stage data to update.
 * @returns {Promise<StageDTO>} - The updated stage data transfer object.
 */
export const patchStageService = async (user, id, data) => {
  try {
    const logConfig = {
      adminLog: "Admin updating stage: {id}",
      managerLog: "Manager updating stage they manage or created: {id}",
      unauthorizedLog:
        "Access denied: User not authorized to update stage {id}",
      unauthorizedMessage:
        "Access denied: You do not have permission to update this stage",
    };

    await authorizeStageModification(user, id, logConfig);

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
    if (updateData.name) {
      updateData.name = updateData.name.toLowerCase();
    }
    const updatedStage = await StageRepository.update(id, updateData, {
      tasks: true,
      Project: true,
    });
    return new StageDTO(updatedStage);
  } catch (error) {
    console.error("Error updating stage:", error);
    if (error && error.status) {
      return Promise.reject(error);
    }
    if (error.code === "P2002") {
      return Promise.reject({
        status: 409,
        message: "A stage with this name already exists for this project",
      });
    }
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};

/**
 * Delete a stage.
 * - Admins can delete any stage.
 * - Managers can delete a stage only if they are the creator of the associated project.
 * @param {Object} user - The user deleting the stage.
 * @param {string} id - The stage ID.
 * @returns {Promise<Object>} - An object with status and a success message.
 */
export const deleteStageService = async (user, id) => {
  try {
    await authorizeStageDeletion(user, id);
    await StageRepository.delete(id);
    return { status: 200, message: "Stage deleted successfully" };
  } catch (error) {
    console.error("Error deleting stage:", error);
    if (error && error.status) {
      return Promise.reject(error);
    }
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};
