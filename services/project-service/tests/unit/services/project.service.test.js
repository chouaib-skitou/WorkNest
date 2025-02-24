import {
    getProjectsService,
    getProjectByIdService,
    createProjectService,
    updateProjectService,
    patchProjectService,
    deleteProjectService,
  } from "../../../services/project.service.js";
  import { prisma } from "../../../config/database.js";
  import { ProjectDTO } from "../../../dtos/project.dto.js";
  
  jest.mock("../../../config/database.js", () => ({
    prisma: {
      project: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    },
  }));
  
  describe("🛠 Project Service Tests", () => {
    let user,
      mockEmployeeUser,
      mockManagerUser,
      query,
      mockProject;
  
    beforeEach(() => {
      user = { id: "admin-id", role: "ROLE_ADMIN" }; // Admin user
      mockEmployeeUser = { id: "employee-id", role: "ROLE_EMPLOYEE" }; // Employee user
      mockManagerUser = { id: "manager-id", role: "ROLE_MANAGER" }; // Manager user
  
      query = {};
  
      mockProject = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "WorkNest Platform",
        description: "A project management platform",
        createdBy: "user-id-1",
        managerId: "manager-id-1",
        employeeIds: ["employee-id"],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
  
      jest.clearAllMocks();
    });
  
    test("✅ Get all projects - Success", async () => {
      prisma.project.findMany.mockResolvedValue([mockProject]);
      prisma.project.count.mockResolvedValue(1);
  
      const result = await getProjectsService(user, query);
  
      expect(result).toEqual({
        data: [new ProjectDTO(mockProject)],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });
    });
    
    test("🚫 Get all projects - Internal Server Error", async () => {
      prisma.project.findMany.mockRejectedValue(new Error("Database error"));
  
      await expect(getProjectsService(user, query)).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });
  
    test("✅ Get all projects - ROLE_EMPLOYEE only sees their projects", async () => {
      prisma.project.findMany.mockResolvedValue([mockProject]);
      prisma.project.count.mockResolvedValue(1);
  
      const result = await getProjectsService(mockEmployeeUser, {});
      expect(result).toEqual({
        data: [new ProjectDTO(mockProject)],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });
  
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { employeeIds: { has: "employee-id" } },
        })
      );
    });
    
    test("✅ Get all projects - ROLE_MANAGER sees managed and assigned projects", async () => {
      prisma.project.findMany.mockResolvedValue([mockProject]);
      prisma.project.count.mockResolvedValue(1);
  
      const result = await getProjectsService(mockManagerUser, {});
      expect(result).toEqual({
        data: [new ProjectDTO(mockProject)],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });
  
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { managerId: "manager-id" },
              { employeeIds: { has: "manager-id" } },
            ],
          },
        })
      );
    });
  

    test("✅ Get all projects - Name filter applied", async () => {
      prisma.project.findMany.mockResolvedValue([mockProject]);
      prisma.project.count.mockResolvedValue(1);
  
      const result = await getProjectsService(user, { name: "WorkNest" });
      expect(result).toEqual({
        data: [new ProjectDTO(mockProject)],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });
  
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: "WorkNest", mode: "insensitive" },
          }),
        })
      );
    });

    test("✅ Get all projects - Description filter applied", async () => {
      prisma.project.findMany.mockResolvedValue([mockProject]);
      prisma.project.count.mockResolvedValue(1);
  
      const result = await getProjectsService(user, {
        description: "management",
      });
      expect(result).toEqual({
        data: [new ProjectDTO(mockProject)],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });
  
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            description: { contains: "management", mode: "insensitive" },
          }),
        })
      );
    });

  
    test("✅ Get all projects - invalid createdAt is ignored", async () => {
      prisma.project.findMany.mockResolvedValue([mockProject]);
      prisma.project.count.mockResolvedValue(1);
  
      const result = await getProjectsService(user, { createdAt: "not-a-date" });
      expect(result).toEqual({
        data: [new ProjectDTO(mockProject)],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });
      
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            createdAt: expect.any(Object),
          }),
        })
      );
    });
  
    test("✅ Get all projects - custom sort field (valid)", async () => {
      prisma.project.findMany.mockResolvedValue([mockProject]);
      prisma.project.count.mockResolvedValue(1);
  
      const result = await getProjectsService(user, {
        sortField: "name",
        sortOrder: "asc",
      });
      expect(result).toEqual({
        data: [new ProjectDTO(mockProject)],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });
  
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: "asc" },
        })
      );
    });

    test("✅ Get all projects - unknown sort field defaults to createdAt", async () => {
      prisma.project.findMany.mockResolvedValue([mockProject]);
      prisma.project.count.mockResolvedValue(1);
  
      const result = await getProjectsService(user, {
        sortField: "invalidField",
        sortOrder: "desc",
      });
      expect(result).toEqual({
        data: [new ProjectDTO(mockProject)],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });
  
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
    });
  
    test("✅ Get project by ID - Success", async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
  
      const result = await getProjectByIdService(mockProject.id);
      expect(result).toEqual(new ProjectDTO(mockProject));
    });
  
    test("🚫 Get project by ID - Not Found", async () => {
      prisma.project.findUnique.mockResolvedValue(null);
  
      await expect(getProjectByIdService("invalid-id")).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });
  
    test("🚫 Get project by ID - Internal Server Error", async () => {
      prisma.project.findUnique.mockRejectedValue(new Error("Database error"));
  
      await expect(getProjectByIdService(mockProject.id)).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });
  
    test("✅ Create project - Success", async () => {
      prisma.project.create.mockResolvedValue(mockProject);
  
      const result = await createProjectService({
        name: "New Project",
        description: "A new project",
      });
  
      expect(result).toEqual(new ProjectDTO(mockProject));
    });
    
    test("🚫 Create project - Duplicate Name (409)", async () => {
      prisma.project.create.mockRejectedValue({ code: "P2002" });
  
      await expect(
        createProjectService({ name: "Duplicate Project" })
      ).rejects.toEqual({
        status: 409,
        message: "A project with this name already exists",
      });
    });
    
    test("🚫 Create project - Internal Server Error", async () => {
      prisma.project.create.mockRejectedValue(new Error("Database error"));
  
      await expect(
        createProjectService({ name: "Some Project" })
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    test("✅ Update project - Success", async () => {
      prisma.project.update.mockResolvedValue(mockProject);
  
      const result = await updateProjectService(mockProject.id, {
        name: "Updated Project",
      });
      expect(result).toEqual(new ProjectDTO(mockProject));
    });
  
    test("🚫 Update project - Duplicate Name (409)", async () => {
      prisma.project.update.mockRejectedValue({ code: "P2002" });
  
      await expect(
        updateProjectService(mockProject.id, { name: "Duplicate Name" })
      ).rejects.toEqual({
        status: 409,
        message: "A project with this name already exists",
      });
    });
  
    test("🚫 Update project - Not Found (404)", async () => {
      prisma.project.update.mockRejectedValue({ code: "P2025" });
  
      await expect(
        updateProjectService("invalid-id", { name: "Some Project" })
      ).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });
    
    test("🚫 Update project - Internal Server Error", async () => {
      prisma.project.update.mockRejectedValue(new Error("Database error"));
  
      await expect(
        updateProjectService(mockProject.id, { name: "Updated Project" })
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });
  
    test("✅ Patch project - Success", async () => {
      prisma.project.update.mockResolvedValue(mockProject);
  
      const result = await patchProjectService(mockProject.id, {
        description: "Updated description",
      });
      expect(result).toEqual(new ProjectDTO(mockProject));
    });
  
    test("🚫 Patch project - No valid fields provided (400)", async () => {
      await expect(patchProjectService(mockProject.id, {})).rejects.toEqual({
        status: 400,
        message: "No valid fields provided for update",
      });
    });
  
    test("✅ Delete project - Success", async () => {
      prisma.project.delete.mockResolvedValue({});
  
      await expect(deleteProjectService(mockProject.id)).resolves.not.toThrow();
    });
  
    test("🚫 Delete project - Not Found (404)", async () => {
      prisma.project.delete.mockRejectedValue({ code: "P2025" });
  
      await expect(deleteProjectService("invalid-id")).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });
  
    test("🚫 Delete project - Internal Server Error", async () => {
      prisma.project.delete.mockRejectedValue(new Error("Database error"));
  
      await expect(deleteProjectService(mockProject.id)).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });
    test("✅ Update project - Name is converted to lowercase", async () => {
        const inputData = { name: "UPPERCASE", description: "desc" };
        const expectedData = { name: "uppercase", description: "desc" };
        prisma.project.update.mockResolvedValueOnce({ ...mockProject, ...expectedData });
        const result = await updateProjectService(mockProject.id, inputData);
        
        expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: mockProject.id },
        data: expectedData,
        });
        expect(result).toEqual(new ProjectDTO({ ...mockProject, ...expectedData }));
    });

  test("✅ Patch project - Name is converted to lowercase and undefined fields are filtered out", async () => {
    const inputData = { name: "MiXeDcAsE", description: undefined, extra: "value" };
    const expectedData = { name: "mixedcase", extra: "value" };
    prisma.project.update.mockResolvedValueOnce({ ...mockProject, ...expectedData });
    const result = await patchProjectService(mockProject.id, inputData);
    
    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: mockProject.id },
      data: expectedData,
    });
    expect(result).toEqual(new ProjectDTO({ ...mockProject, ...expectedData }));
  });
  
    test("✅ Get all projects - CreatedAt filter applied", async () => {
        prisma.project.findMany.mockResolvedValue([mockProject]);
        prisma.project.count.mockResolvedValue(1);
        const dateStr = "2025-02-01";
        const queryWithDate = { createdAt: dateStr };
        const date = new Date(dateStr);
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
    
        const result = await getProjectsService(user, queryWithDate);
        expect(result).toEqual({
        data: [new ProjectDTO(mockProject)],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
        });
        expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
            where: expect.objectContaining({
            createdAt: { gte: startOfDay, lte: endOfDay },
            }),
        })
        );
    });
  
  test("✅ Update project - Name is converted to lowercase", async () => {
    const inputData = { name: "UPPERCASE", description: "desc" };
    // Expected data should have name lowercased
    const expectedData = { name: "uppercase", description: "desc" };
    prisma.project.update.mockResolvedValueOnce({ ...mockProject, ...expectedData });
    
    const result = await updateProjectService(mockProject.id, inputData);
    
    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: mockProject.id },
      data: expectedData,
    });
    expect(result).toEqual(new ProjectDTO({ ...mockProject, ...expectedData }));
  });
  
  test("✅ Patch project - Name is converted to lowercase and undefined fields are filtered out", async () => {
    const inputData = { name: "MiXeDcAsE", description: undefined, extra: "value" };
    const expectedData = { name: "mixedcase", extra: "value" };
    prisma.project.update.mockResolvedValueOnce({ ...mockProject, ...expectedData });
    
    const result = await patchProjectService(mockProject.id, inputData);
    
    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: mockProject.id },
      data: expectedData,
    });
    expect(result).toEqual(new ProjectDTO({ ...mockProject, ...expectedData }));
  });
  
  test("🚫 Patch project - Duplicate Name (P2002)", async () => {
    prisma.project.update.mockRejectedValueOnce({ code: "P2002" });
    await expect(
      patchProjectService(mockProject.id, { name: "Duplicate", extra: "value" })
    ).rejects.toEqual({
      status: 409,
      message: "A project with this name already exists",
    });
  });

  test("🚫 Patch project - Not Found (P2025)", async () => {
    prisma.project.update.mockRejectedValueOnce({ code: "P2025" });
    await expect(
      patchProjectService(mockProject.id, { name: "Nonexistent", extra: "value" })
    ).rejects.toEqual({
      status: 404,
      message: "Project not found",
    });
  });

  test("🚫 Patch project - Generic error", async () => {
    prisma.project.update.mockRejectedValueOnce(new Error("Database error"));
    await expect(
      patchProjectService(mockProject.id, { name: "Test", extra: "value" })
    ).rejects.toEqual({
      status: 500,
      message: "Internal server error",
    });
  });

  test("✅ Update project - No name provided (branch not taken)", async () => {
    const inputData = { description: "Some description", employeeIds: ["e1"] };
    prisma.project.update.mockResolvedValueOnce({ ...mockProject, ...inputData });
    
    const result = await updateProjectService(mockProject.id, inputData);
    
    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: mockProject.id },
      data: inputData,
    });
    expect(result).toEqual(new ProjectDTO({ ...mockProject, ...inputData }));
  });
  });
  