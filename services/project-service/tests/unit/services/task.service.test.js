// tests/unit/services/task.service.test.js

jest.mock("../../../repositories/task.repository.js", () => ({
  TaskRepository: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("../../../repositories/project.repository.js", () => ({
  ProjectRepository: {
    findUnique: jest.fn(),
  },
}));

// Mock user enrichment so we can control whether it returns a user object or remains empty
jest.mock("../../../services/helpers/user.enrichment.js", () => ({
  fetchUsersByIds: jest.fn(),
}));

import { TaskRepository } from "../../../repositories/task.repository.js";
import { ProjectRepository } from "../../../repositories/project.repository.js";
import { TaskDTO } from "../../../dtos/task.dto.js";
import {
  getTasksService,
  getTaskByIdService,
  createTaskService,
  updateTaskService,
  patchTaskService,
  deleteTaskService,
  authorizeTaskModification,
} from "../../../services/task.service.js";
import { fetchUsersByIds } from "../../../services/helpers/user.enrichment.js";

describe("🛠 Task Service Tests", () => {
  let adminUser, managerUser, employeeUser, query, mockTask, mockProject;

  beforeEach(() => {
    adminUser = { id: "admin-id", role: "ROLE_ADMIN" };
    managerUser = { id: "manager-id", role: "ROLE_MANAGER" };
    employeeUser = { id: "employee-id", role: "ROLE_EMPLOYEE" };

    // Project used in task relation:
    mockProject = {
      id: "project-uuid",
      createdBy: "manager-id",
      managerId: "manager-id",
      employeeIds: ["employee-id"],
    };

    // Example Task object including its related Project
    mockTask = {
      id: "task-uuid",
      title: "Task Title",
      description: "Task description",
      priority: "HIGH",
      stageId: "stage-uuid",
      projectId: "project-uuid",
      assignedTo: "user-uuid",
      images: ["https://example.com/image.png"],
      createdAt: new Date("2025-02-22T12:00:00Z"),
      updatedAt: new Date("2025-02-23T12:00:00Z"),
      Project: { ...mockProject },
    };

    query = {};

    // By default, return an empty object so 'assignedTo' remains the original string.
    // Tests that specifically want to see the user object can override this.
    fetchUsersByIds.mockResolvedValue({});

    jest.clearAllMocks();
  });

  describe("getTasksService", () => {
    test("✅ returns tasks successfully with default pagination", async () => {
      TaskRepository.findMany.mockResolvedValue([mockTask]);
      TaskRepository.count.mockResolvedValue(1);

      const result = await getTasksService(adminUser, query, "fake-token");

      expect(result).toEqual({
        data: [new TaskDTO(mockTask)],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });
      // Since assignedTo was "user-uuid", we do call fetchUsersByIds, but it returns {}
      // => no override for assignedTo
      expect(fetchUsersByIds).toHaveBeenCalledWith(["user-uuid"], "fake-token");
    });

    test("✅ returns empty data when no tasks found", async () => {
      TaskRepository.findMany.mockResolvedValue([]);
      TaskRepository.count.mockResolvedValue(0);

      const result = await getTasksService(adminUser, query, "fake-token");
      expect(result).toEqual({
        data: [],
        page: 1,
        limit: 10,
        totalCount: 0,
        totalPages: 0,
      });
      // No tasks => no call for assignedTo
      expect(fetchUsersByIds).not.toHaveBeenCalled();
    });

    test("✅ applies dynamic filters correctly", async () => {
      TaskRepository.findMany.mockResolvedValue([mockTask]);
      TaskRepository.count.mockResolvedValue(1);

      const customQuery = {
        title: "Task",
        priority: "HIGH",
        stageId: "stage-uuid",
        projectId: "project-uuid",
      };

      await getTasksService(adminUser, customQuery, "fake-token");

      expect(TaskRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            title: { contains: "Task", mode: "insensitive" },
            priority: "HIGH",
            stageId: "stage-uuid",
            projectId: "project-uuid",
          }),
        })
      );
    });

    test("✅ applies sort options correctly", async () => {
      TaskRepository.findMany.mockResolvedValue([mockTask]);
      TaskRepository.count.mockResolvedValue(1);

      const customQuery = { sortField: "title", sortOrder: "asc" };
      await getTasksService(adminUser, customQuery, "fake-token");

      expect(TaskRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { title: "asc" },
        })
      );
    });

    test("✅ uses provided numeric page and limit", async () => {
      TaskRepository.findMany.mockResolvedValue([mockTask]);
      TaskRepository.count.mockResolvedValue(1);

      const customQuery = { page: "2", limit: "5" };
      const result = await getTasksService(
        adminUser,
        customQuery,
        "fake-token"
      );
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(TaskRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
    });

    test("🚫 rejects with 403 if error code is P2025", async () => {
      TaskRepository.findMany.mockRejectedValue({ code: "P2025" });
      await expect(
        getTasksService(adminUser, query, "fake-token")
      ).rejects.toEqual({
        status: 403,
        message: "Access denied: You do not have permission to view tasks",
      });
    });

    test("🚫 rejects with 500 on generic error", async () => {
      TaskRepository.findMany.mockRejectedValue(new Error("Database error"));
      await expect(
        getTasksService(adminUser, query, "fake-token")
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    test("✅ enforces role-based filter for ROLE_EMPLOYEE", async () => {
      TaskRepository.findMany.mockResolvedValue([mockTask]);
      TaskRepository.count.mockResolvedValue(1);

      await getTasksService(employeeUser, {}, "fake-token");
      expect(TaskRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { Project: { employeeIds: { has: "employee-id" } } },
        })
      );
    });

    test("✅ enforces role-based filter for ROLE_MANAGER", async () => {
      TaskRepository.findMany.mockResolvedValue([mockTask]);
      TaskRepository.count.mockResolvedValue(1);

      await getTasksService(managerUser, {}, "fake-token");
      expect(TaskRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { Project: { managerId: "manager-id" } },
              { Project: { createdBy: "manager-id" } },
              { Project: { employeeIds: { has: "manager-id" } } },
            ],
          },
        })
      );
    });

    test("✅ no additional filter for ROLE_ADMIN", async () => {
      TaskRepository.findMany.mockResolvedValue([mockTask]);
      TaskRepository.count.mockResolvedValue(1);

      await getTasksService(adminUser, {}, "fake-token");
      expect(TaskRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    test("✅ defaults to page=1 if provided page < 1", async () => {
      TaskRepository.findMany.mockResolvedValue([]);
      TaskRepository.count.mockResolvedValue(0);

      const result = await getTasksService(
        adminUser,
        { page: "-5" },
        "fake-token"
      );
      expect(result.page).toBe(1);
    });

    test("✅ defaults to limit=10 if provided limit < 1", async () => {
      TaskRepository.findMany.mockResolvedValue([]);
      TaskRepository.count.mockResolvedValue(0);

      const result = await getTasksService(
        adminUser,
        { limit: "0" },
        "fake-token"
      );
      expect(result.limit).toBe(10);
    });

    test("✅ falls back to sort by createdAt if sortField is invalid", async () => {
      TaskRepository.findMany.mockResolvedValue([]);
      TaskRepository.count.mockResolvedValue(0);

      await getTasksService(
        adminUser,
        { sortField: "invalidField" },
        "fake-token"
      );
      expect(TaskRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
    });

    test("✅ does not call fetchUsersByIds if assignedTo is null", async () => {
      const taskNoAssigned = { ...mockTask, assignedTo: null };
      TaskRepository.findMany.mockResolvedValue([taskNoAssigned]);
      TaskRepository.count.mockResolvedValue(1);

      const result = await getTasksService(adminUser, {}, "fake-token");
      expect(result.data).toHaveLength(1);
      expect(fetchUsersByIds).not.toHaveBeenCalled();
      expect(result.data[0].assignedTo).toBeNull();
    });

    // Additional coverage test: demonstrate that if fetchUsersByIds returns a user object,
    // assignedTo is replaced
    test("✅ returns an enriched assignedTo if fetchUsersByIds returns a user object", async () => {
      TaskRepository.findMany.mockResolvedValue([mockTask]);
      TaskRepository.count.mockResolvedValue(1);
      // Now we actually return a user
      fetchUsersByIds.mockResolvedValue({
        "user-uuid": { id: "user-uuid", name: "Test User" },
      });

      const result = await getTasksService(adminUser, query, "fake-token");
      expect(result.data[0].assignedTo).toEqual({
        id: "user-uuid",
        name: "Test User",
      });
    });
  });

  describe("getTaskByIdService", () => {
    test("✅ returns task successfully if found", async () => {
      TaskRepository.findUnique.mockResolvedValue(mockTask);

      const result = await getTaskByIdService(
        adminUser,
        mockTask.id,
        "fake-token"
      );
      // assignedTo remains "user-uuid" since we return {}
      expect(result).toEqual(new TaskDTO(mockTask));
      // But we do call fetchUsersByIds
      expect(fetchUsersByIds).toHaveBeenCalledWith(["user-uuid"], "fake-token");
    });

    test("🚫 rejects with 404 if task not found", async () => {
      TaskRepository.findUnique.mockResolvedValue(null);
      await expect(
        getTaskByIdService(adminUser, "non-existent-id", "fake-token")
      ).rejects.toEqual({
        status: 404,
        message: "Task not found",
      });
    });

    test("🚫 rejects with 500 on generic error", async () => {
      TaskRepository.findUnique.mockRejectedValue(new Error("Database error"));
      await expect(
        getTaskByIdService(adminUser, mockTask.id, "fake-token")
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    test("✅ does not call fetchUsersByIds if assignedTo is null on getTaskByIdService", async () => {
      const taskNoAssigned = { ...mockTask, assignedTo: null };
      TaskRepository.findUnique.mockResolvedValue(taskNoAssigned);

      const result = await getTaskByIdService(
        adminUser,
        taskNoAssigned.id,
        "fake-token"
      );
      expect(result).toEqual(new TaskDTO(taskNoAssigned));
      expect(fetchUsersByIds).not.toHaveBeenCalled();
    });

    // Coverage for actual enrichment if assignedTo is returned from userMap
    test("✅ returns enriched assignedTo if user found by fetchUsersByIds", async () => {
      TaskRepository.findUnique.mockResolvedValue(mockTask);
      fetchUsersByIds.mockResolvedValue({
        "user-uuid": { id: "user-uuid", name: "Test User" },
      });
      const result = await getTaskByIdService(
        adminUser,
        mockTask.id,
        "fake-token"
      );
      expect(result.assignedTo).toEqual({ id: "user-uuid", name: "Test User" });
    });
  });

  describe("createTaskService", () => {
    test("🚫 rejects with 403 if user is not allowed to create task", async () => {
      await expect(
        createTaskService(employeeUser, { title: "Test" }, "fake-token")
      ).rejects.toEqual({
        status: 403,
        message: "Access denied: Only admins and managers can create tasks",
      });
    });

    test("🚫 rejects with 403 if user has unknown role when creating a task", async () => {
      const unknownRoleUser = { id: "unknown-user", role: "ROLE_UNKNOWN" };

      await expect(
        createTaskService(
          unknownRoleUser,
          { title: "Title", projectId: "proj-123" },
          "fake-token"
        )
      ).rejects.toEqual({
        status: 403,
        message: "Access denied: Only admins and managers can create tasks",
      });
    });

    test("🚫 rejects with 404 if project does not exist (manager)", async () => {
      ProjectRepository.findUnique.mockResolvedValue(null);
      await expect(
        createTaskService(
          { id: "managerX", role: "ROLE_MANAGER" },
          { projectId: "non-existent-proj", title: "Sample" },
          "fake-token"
        )
      ).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });

    test("🚫 rejects with 403 if manager is neither managerId nor createdBy", async () => {
      ProjectRepository.findUnique.mockResolvedValue({
        ...mockProject,
        managerId: "other-manager",
        createdBy: "other-creator",
      });

      await expect(
        createTaskService(
          { id: "some-manager", role: "ROLE_MANAGER" },
          { projectId: mockProject.id, title: "Sample" },
          "fake-token"
        )
      ).rejects.toEqual({
        status: 403,
        message:
          "Access denied: You do not have permission to create a task for this project",
      });
    });

    test("✅ creates task successfully (ADMIN)", async () => {
      TaskRepository.create.mockResolvedValue(mockTask);

      const inputData = {
        title: "New Task",
        description: "Task description",
        priority: "HIGH",
        stageId: mockTask.stageId,
        projectId: mockTask.projectId,
        assignedTo: mockTask.assignedTo,
        images: mockTask.images,
      };
      const result = await createTaskService(
        adminUser,
        inputData,
        "fake-token"
      );

      expect(TaskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "new task",
          description: "Task description",
          projectId: "project-uuid",
        }),
        expect.objectContaining({
          Project: true,
          Stage: true,
        })
      );
      // assignedTo was "user-uuid" but fetchUsersByIds is empty => remains a string
      expect(result).toEqual(new TaskDTO(mockTask));
    });

    test("✅ creates task successfully for ROLE_MANAGER when authorized", async () => {
      ProjectRepository.findUnique.mockResolvedValue(mockProject);
      TaskRepository.create.mockResolvedValue(mockTask);

      const inputData = {
        title: "New Task",
        description: "Task description",
        priority: "HIGH",
        stageId: mockTask.stageId,
        projectId: mockProject.id,
        assignedTo: mockTask.assignedTo,
        images: mockTask.images,
      };
      const result = await createTaskService(
        managerUser,
        inputData,
        "fake-token"
      );
      expect(ProjectRepository.findUnique).toHaveBeenCalledWith({
        where: { id: mockProject.id },
      });
      expect(result).toEqual(new TaskDTO(mockTask));
    });

    test("🚫 rejects with 409 on duplicate title (P2002)", async () => {
      TaskRepository.create.mockRejectedValue({ code: "P2002" });
      await expect(
        createTaskService(
          adminUser,
          { title: "Duplicate", projectId: "project-uuid" },
          "fake-token"
        )
      ).rejects.toEqual({
        status: 409,
        message: "A task with this title already exists for this project",
      });
    });

    test("🚫 rejects with 500 on generic error in createTaskService", async () => {
      TaskRepository.create.mockRejectedValue(new Error("Database error"));
      await expect(
        createTaskService(
          adminUser,
          { title: "Test", projectId: "project-uuid" },
          "fake-token"
        )
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    test("✅ does not call fetchUsersByIds if newTask.assignedTo is null", async () => {
      const taskWithoutAssigned = { ...mockTask, assignedTo: null };
      TaskRepository.create.mockResolvedValue(taskWithoutAssigned);

      const inputData = {
        title: "Some task",
        projectId: mockProject.id,
        assignedTo: null,
      };

      const result = await createTaskService(
        adminUser,
        inputData,
        "fake-token"
      );
      expect(fetchUsersByIds).not.toHaveBeenCalled();
      expect(result.assignedTo).toBeNull();
    });

    // Additional coverage test: assignedTo is replaced with user object if found
    test("✅ creates and enriches assignedTo if fetchUsersByIds returns user", async () => {
      TaskRepository.create.mockResolvedValue(mockTask);
      fetchUsersByIds.mockResolvedValue({
        "user-uuid": { id: "user-uuid", name: "Some Manager" },
      });

      const inputData = {
        title: "Another Task",
        projectId: mockProject.id,
        assignedTo: "user-uuid",
      };
      const result = await createTaskService(
        adminUser,
        inputData,
        "fake-token"
      );
      expect(result.assignedTo).toEqual({
        id: "user-uuid",
        name: "Some Manager",
      });
    });
  });

  describe("updateTaskService", () => {
    beforeEach(() => {
      TaskRepository.findUnique.mockResolvedValue(mockTask);
      TaskRepository.update.mockResolvedValue({
        ...mockTask,
        title: "updated task",
        priority: "LOW",
      });
      // By default, fetchUsersByIds returns {}
      // so assignedTo remains "user-uuid"
    });

    test("🚫 rejects with 403 if manager is neither managerId nor project creator when updating", async () => {
      const projectWithDifferentManager = {
        ...mockProject,
        managerId: "some-other-user",
        createdBy: "some-other-creator",
      };
      const taskWithDifferentProject = {
        ...mockTask,
        Project: projectWithDifferentManager,
      };
      TaskRepository.findUnique.mockResolvedValue(taskWithDifferentProject);

      await expect(
        updateTaskService(
          managerUser,
          mockTask.id,
          { title: "new title" },
          "fake-token"
        )
      ).rejects.toEqual({
        status: 403,
        message:
          "Access denied: You do not have permission to update this task",
      });
    });

    test("✅ allows manager to fully update if they are project.createdBy", async () => {
      const managerCreatedProject = {
        ...mockProject,
        managerId: "someone-else",
        createdBy: managerUser.id,
      };
      const taskInThatProject = { ...mockTask, Project: managerCreatedProject };

      TaskRepository.findUnique.mockResolvedValue(taskInThatProject);
      TaskRepository.update.mockResolvedValue({
        ...taskInThatProject,
        title: "manager-updated",
      });

      const result = await updateTaskService(
        managerUser,
        mockTask.id,
        { title: "MANAGER-UPDATED" },
        "fake-token"
      );

      expect(TaskRepository.update).toHaveBeenCalledWith(
        mockTask.id,
        { title: "manager-updated" },
        { Stage: true, Project: true }
      );
      // assignedTo remains "user-uuid" because fetchUsersByIds = {}
      expect(result).toEqual(
        new TaskDTO({
          ...taskInThatProject,
          title: "manager-updated",
        })
      );
    });

    test("🚫 rejects with 404 if task not found in updateTaskService", async () => {
      TaskRepository.findUnique.mockResolvedValue(null);
      await expect(
        updateTaskService(
          adminUser,
          "non-existent-task",
          { title: "anything" },
          "fake-token"
        )
      ).rejects.toEqual({
        status: 404,
        message: "Task not found",
      });
    });

    test("✅ allows manager to fully update if they are project.managerId", async () => {
      const projectWhereManagerIsId = {
        ...mockProject,
        managerId: managerUser.id,
      };
      const taskManagedByManager = {
        ...mockTask,
        Project: projectWhereManagerIsId,
      };
      TaskRepository.findUnique.mockResolvedValue(taskManagedByManager);
      TaskRepository.update.mockResolvedValue({
        ...taskManagedByManager,
        title: "manager-updated",
      });

      const result = await updateTaskService(
        managerUser,
        mockTask.id,
        { title: "MANAGER-UPDATED" },
        "fake-token"
      );
      expect(result).toEqual(
        new TaskDTO({
          ...taskManagedByManager,
          title: "manager-updated",
        })
      );
    });

    test("🚫 rejects with 403 if employee tries to fully update a task", async () => {
      TaskRepository.findUnique.mockResolvedValue(mockTask);
      await expect(
        updateTaskService(
          employeeUser,
          mockTask.id,
          { title: "new title" },
          "fake-token"
        )
      ).rejects.toEqual({
        status: 403,
        message: "Access denied: Employees can only update the task stage",
      });
    });

    test("🚫 rejects with 403 for unknown role when updating a task", async () => {
      const unknownRoleUser = { id: "unknown-user", role: "ROLE_UNKNOWN" };
      TaskRepository.findUnique.mockResolvedValue(mockTask);

      await expect(
        updateTaskService(
          unknownRoleUser,
          mockTask.id,
          { title: "any" },
          "fake-token"
        )
      ).rejects.toEqual({
        status: 403,
        message:
          "Access denied: You do not have permission to update this task",
      });
    });

    test("✅ updates task successfully and converts title to lowercase", async () => {
      const inputData = { title: "UPDATED TASK", priority: "LOW" };
      const result = await updateTaskService(
        adminUser,
        mockTask.id,
        inputData,
        "fake-token"
      );
      expect(TaskRepository.update).toHaveBeenCalledWith(
        mockTask.id,
        { title: "updated task", priority: "LOW" },
        { Stage: true, Project: true }
      );
      // Because fetchUsersByIds is empty => assignedTo remains "user-uuid"
      expect(result).toEqual(
        new TaskDTO({ ...mockTask, title: "updated task", priority: "LOW" })
      );
    });

    test("🚫 rejects with 409 on duplicate title in updateTaskService", async () => {
      TaskRepository.update.mockRejectedValue({ code: "P2002" });
      await expect(
        updateTaskService(
          adminUser,
          mockTask.id,
          { title: "Duplicate" },
          "fake-token"
        )
      ).rejects.toEqual({
        status: 409,
        message: "A task with this title already exists for this project",
      });
    });

    test("🚫 rejects with 500 on generic error in updateTaskService", async () => {
      TaskRepository.update.mockRejectedValue(new Error("Database error"));
      await expect(
        updateTaskService(
          adminUser,
          mockTask.id,
          { title: "Updated Task" },
          "fake-token"
        )
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    test("✅ does not modify title if not provided in updateTaskService", async () => {
      await updateTaskService(
        adminUser,
        mockTask.id,
        { priority: "MEDIUM" },
        "fake-token"
      );
      expect(TaskRepository.update).toHaveBeenCalledWith(
        mockTask.id,
        { priority: "MEDIUM" },
        { Stage: true, Project: true }
      );
    });

    test("✅ does not call fetchUsersByIds if updatedTask.assignedTo is null", async () => {
      const updatedTaskWithNoAssigned = { ...mockTask, assignedTo: null };
      TaskRepository.update.mockResolvedValue(updatedTaskWithNoAssigned);

      const result = await updateTaskService(
        adminUser,
        mockTask.id,
        { title: "No-Assign" },
        "fake-token"
      );
      expect(fetchUsersByIds).not.toHaveBeenCalled();
      expect(result.assignedTo).toBeNull();
    });

    // Additional coverage test: assignedTo is replaced with user object if found
    test("✅ updates and enriches assignedTo if fetchUsersByIds returns user", async () => {
      // Overwrite default so we get an actual user
      fetchUsersByIds.mockResolvedValue({
        "user-uuid": { id: "user-uuid", name: "Enriched User" },
      });
      TaskRepository.update.mockResolvedValue({
        ...mockTask,
        title: "updated task",
        assignedTo: "user-uuid",
      });
      const result = await updateTaskService(
        adminUser,
        mockTask.id,
        { title: "Updated Task" },
        "fake-token"
      );
      expect(result.assignedTo).toEqual({
        id: "user-uuid",
        name: "Enriched User",
      });
    });
  });

  describe("patchTaskService", () => {
    beforeEach(() => {
      TaskRepository.findUnique.mockResolvedValue(mockTask);
      TaskRepository.update.mockResolvedValue({
        ...mockTask,
        title: "patched task",
      });
      // By default fetchUsersByIds returns {}
    });

    test("🚫 rejects with 403 if manager tries to PATCH multiple fields (not just stageId)", async () => {
      const projectWithManagerAsEmployee = {
        ...mockProject,
        managerId: "another-user",
        createdBy: "another-creator",
        employeeIds: ["manager-id"],
      };
      const taskForThatProject = {
        ...mockTask,
        Project: projectWithManagerAsEmployee,
      };
      TaskRepository.findUnique.mockResolvedValue(taskForThatProject);

      const multiPatch = { stageId: "new-stage", priority: "MEDIUM" };
      await expect(
        patchTaskService(managerUser, mockTask.id, multiPatch, "fake-token")
      ).rejects.toEqual({
        status: 403,
        message:
          "Access denied: You do not have permission to update this task",
      });
    });

    test("🚫 rejects with 403 for any unknown role when patching a task", async () => {
      const unknownRoleUser = { id: "unknown-user", role: "ROLE_UNKNOWN" };

      await expect(
        patchTaskService(
          unknownRoleUser,
          mockTask.id,
          { stageId: "only" },
          "fake-token"
        )
      ).rejects.toEqual({
        status: 403,
        message:
          "Access denied: You do not have permission to update this task",
      });
    });

    test("✅ skips undefined fields when patching (covers else path for 'if (value !== undefined)')", async () => {
      // We'll patch stageId but pass title=undefined
      const partialData = { title: undefined, stageId: "updated-stage" };
      TaskRepository.update.mockResolvedValue({
        ...mockTask,
        stageId: "updated-stage",
        // title remains "Task Title" because it wasn't patched
      });

      const result = await patchTaskService(
        adminUser,
        mockTask.id,
        partialData,
        "fake-token"
      );

      // 'title' was not included in the final update
      expect(TaskRepository.update).toHaveBeenCalledWith(
        mockTask.id,
        { stageId: "updated-stage" },
        { Stage: true, Project: true }
      );
      expect(result.stageId).toEqual("updated-stage");
      expect(result.title).toEqual("Task Title");
    });

    test("✅ patches task successfully and converts title to lowercase", async () => {
      const partialData = { title: "PATCHED TASK" };
      const result = await patchTaskService(
        adminUser,
        mockTask.id,
        partialData,
        "fake-token"
      );
      expect(TaskRepository.update).toHaveBeenCalledWith(
        mockTask.id,
        { title: "patched task" },
        { Stage: true, Project: true }
      );
      // assignedTo remains "user-uuid"
      expect(result).toEqual(
        new TaskDTO({ ...mockTask, title: "patched task" })
      );
    });

    test("🚫 rejects with 404 if task not found in patchTaskService", async () => {
      TaskRepository.findUnique.mockResolvedValue(null);
      await expect(
        patchTaskService(
          adminUser,
          "non-existent-task",
          { stageId: "anything" },
          "fake-token"
        )
      ).rejects.toEqual({
        status: 404,
        message: "Task not found",
      });
    });

    test("✅ allows manager to PATCH if they are project.managerId", async () => {
      const projectManagedByUser = {
        ...mockProject,
        managerId: managerUser.id,
      };
      const taskManagedByManager = {
        ...mockTask,
        Project: projectManagedByUser,
      };
      TaskRepository.findUnique.mockResolvedValue(taskManagedByManager);
      TaskRepository.update.mockResolvedValue({
        ...taskManagedByManager,
        stageId: "patched-stage",
      });

      const result = await patchTaskService(
        managerUser,
        mockTask.id,
        { stageId: "patched-stage" },
        "fake-token"
      );
      expect(result).toEqual(
        new TaskDTO({ ...taskManagedByManager, stageId: "patched-stage" })
      );
    });

    test("✅ allows ROLE_MANAGER to patch task if they are only in employeeIds and only stageId is updated", async () => {
      const projectWithManagerAsEmployee = {
        ...mockProject,
        managerId: "some-other-user",
        createdBy: "some-other-user",
        employeeIds: ["manager-id"],
      };
      const taskInThatProject = {
        ...mockTask,
        Project: projectWithManagerAsEmployee,
      };

      const partialData = { stageId: "new-stage-uuid" };

      TaskRepository.findUnique.mockResolvedValue(taskInThatProject);
      TaskRepository.update.mockResolvedValue({
        ...taskInThatProject,
        stageId: "new-stage-uuid",
      });

      const result = await patchTaskService(
        managerUser,
        mockTask.id,
        partialData,
        "fake-token"
      );
      expect(TaskRepository.update).toHaveBeenCalledWith(
        mockTask.id,
        { stageId: "new-stage-uuid" },
        { Stage: true, Project: true }
      );
      expect(result).toEqual(
        new TaskDTO({
          ...taskInThatProject,
          stageId: "new-stage-uuid",
        })
      );
    });

    test("✅ allows ROLE_EMPLOYEE to patch task if only stageId is updated", async () => {
      const partialData = { stageId: "new-stage-uuid" };
      TaskRepository.update.mockResolvedValue({
        ...mockTask,
        stageId: "new-stage-uuid",
      });
      const result = await patchTaskService(
        employeeUser,
        mockTask.id,
        partialData,
        "fake-token"
      );
      expect(TaskRepository.update).toHaveBeenCalledWith(
        mockTask.id,
        { stageId: "new-stage-uuid" },
        { Stage: true, Project: true }
      );
      expect(result).toEqual(
        new TaskDTO({ ...mockTask, stageId: "new-stage-uuid" })
      );
    });

    test("🚫 rejects for ROLE_EMPLOYEE if patching fields other than stageId", async () => {
      const partialData = { title: "Not Allowed" };
      await expect(
        patchTaskService(employeeUser, mockTask.id, partialData, "fake-token")
      ).rejects.toEqual({
        status: 403,
        message: "Access denied: Employees can only update the task stage",
      });
    });

    test("🚫 rejects with 400 if no valid fields provided in patchTaskService", async () => {
      await expect(
        patchTaskService(adminUser, mockTask.id, {}, "fake-token")
      ).rejects.toEqual({
        status: 400,
        message: "No valid fields provided for update",
      });
    });

    test("🚫 rejects with 409 on duplicate title in patchTaskService", async () => {
      TaskRepository.update.mockRejectedValue({ code: "P2002" });
      await expect(
        patchTaskService(
          adminUser,
          mockTask.id,
          { title: "Duplicate" },
          "fake-token"
        )
      ).rejects.toEqual({
        status: 409,
        message: "A task with this title already exists for this project",
      });
    });

    test("🚫 rejects with 500 on generic error in patchTaskService", async () => {
      TaskRepository.update.mockRejectedValue(new Error("Database error"));
      await expect(
        patchTaskService(
          adminUser,
          mockTask.id,
          { title: "Updated Task" },
          "fake-token"
        )
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    test("✅ does not call fetchUsersByIds if updatedTask.assignedTo is null in patchTaskService", async () => {
      const updatedTaskNoAssigned = { ...mockTask, assignedTo: null };
      TaskRepository.update.mockResolvedValue(updatedTaskNoAssigned);

      const result = await patchTaskService(
        adminUser,
        mockTask.id,
        { title: "just patching" },
        "fake-token"
      );
      expect(fetchUsersByIds).not.toHaveBeenCalled();
      expect(result.assignedTo).toBeNull();
    });

    test("✅ patches and enriches assignedTo if fetchUsersByIds returns user", async () => {
      fetchUsersByIds.mockResolvedValue({
        "user-uuid": { id: "user-uuid", name: "Enriched Patch" },
      });
      TaskRepository.update.mockResolvedValue({
        ...mockTask,
        assignedTo: "user-uuid",
        title: "patched task",
      });
      const result = await patchTaskService(
        adminUser,
        mockTask.id,
        { title: "PATCH IT" },
        "fake-token"
      );
      expect(result.assignedTo).toEqual({
        id: "user-uuid",
        name: "Enriched Patch",
      });
    });
  });

  describe("deleteTaskService", () => {
    test("✅ deletes task successfully (200)", async () => {
      TaskRepository.findUnique.mockResolvedValue(mockTask);
      TaskRepository.delete.mockResolvedValue(mockTask);
      const result = await deleteTaskService(adminUser, mockTask.id);
      expect(TaskRepository.delete).toHaveBeenCalledWith(mockTask.id);
      expect(result).toEqual({
        status: 200,
        message: "Task deleted successfully",
      });
    });

    test("🚫 rejects with 403 if manager is not project creator when deleting", async () => {
      const projectWithDifferentCreator = {
        ...mockProject,
        createdBy: "another-person",
      };
      const taskWithDiffCreator = {
        ...mockTask,
        Project: projectWithDifferentCreator,
      };
      TaskRepository.findUnique.mockResolvedValue(taskWithDiffCreator);

      await expect(deleteTaskService(managerUser, mockTask.id)).rejects.toEqual(
        {
          status: 403,
          message:
            "Access denied: You do not have permission to delete this task",
        }
      );
    });

    test("🚫 rejects with 403 if unknown role tries to delete", async () => {
      const unknownRoleUser = { id: "unknown-user", role: "ROLE_UNKNOWN" };
      TaskRepository.findUnique.mockResolvedValue(mockTask);

      await expect(
        deleteTaskService(unknownRoleUser, mockTask.id)
      ).rejects.toEqual({
        status: 403,
        message:
          "Access denied: You do not have permission to delete this task",
      });
    });

    test("✅ deletes task successfully for manager if they are project creator", async () => {
      const projectCreatedByManager = {
        ...mockProject,
        createdBy: managerUser.id,
        managerId: "some-other-user",
      };
      const taskWithManagerAsCreator = {
        ...mockTask,
        Project: projectCreatedByManager,
      };

      TaskRepository.findUnique.mockResolvedValue(taskWithManagerAsCreator);
      TaskRepository.delete.mockResolvedValue(taskWithManagerAsCreator);

      const result = await deleteTaskService(managerUser, mockTask.id);

      expect(TaskRepository.delete).toHaveBeenCalledWith(mockTask.id);
      expect(result).toEqual({
        status: 200,
        message: "Task deleted successfully",
      });
    });

    test("🚫 rejects with 404 if task not found in deleteTaskService", async () => {
      TaskRepository.findUnique.mockResolvedValue(null);
      await expect(
        deleteTaskService(adminUser, "non-existent-task")
      ).rejects.toEqual({
        status: 404,
        message: "Task not found",
      });
    });

    test("🚫 rejects with 403 if user not authorized to delete task", async () => {
      TaskRepository.findUnique.mockResolvedValue({
        ...mockTask,
        Project: { ...mockTask.Project, createdBy: "another-user" },
      });
      await expect(deleteTaskService(managerUser, mockTask.id)).rejects.toEqual(
        {
          status: 403,
          message:
            "Access denied: You do not have permission to delete this task",
        }
      );
    });

    test("🚫 rejects with 500 on generic error in deleteTaskService", async () => {
      TaskRepository.findUnique.mockResolvedValue(mockTask);
      TaskRepository.delete.mockRejectedValue(new Error("Database error"));
      await expect(deleteTaskService(adminUser, mockTask.id)).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });
  });

  // Direct tests for authorizeTaskModification
  describe("authorizeTaskModification direct tests", () => {
    test("✅ covers default opType = 'update'", async () => {
      TaskRepository.findUnique.mockResolvedValue(mockTask);
      const result = await authorizeTaskModification(adminUser, mockTask.id, {
        priority: "LOW",
      });
      expect(result).toEqual(mockTask); // Should succeed for ROLE_ADMIN
    });

    test("🚫 rejects if task not found (default opType = 'update')", async () => {
      TaskRepository.findUnique.mockResolvedValue(null);
      await expect(
        authorizeTaskModification(adminUser, "non-existent-id", {
          priority: "LOW",
        })
      ).rejects.toEqual({
        status: 404,
        message: "Task not found",
      });
    });

    // Covers the destructuring fallback { managerId, createdBy, employeeIds }
    // if task.Project is undefined
    test("🚫 rejects manager if Project is undefined (covers destructuring fallback)", async () => {
      const noProjectTask = { ...mockTask, Project: undefined };
      TaskRepository.findUnique.mockResolvedValue(noProjectTask);

      await expect(
        authorizeTaskModification(managerUser, noProjectTask.id, {
          priority: "LOW",
        })
      ).rejects.toEqual({
        status: 403,
        message:
          "Access denied: You do not have permission to update this task",
      });
    });
  });
});
