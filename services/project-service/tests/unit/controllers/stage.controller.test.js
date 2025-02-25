// stage.controller.test.js

import * as stageController from "../../../controllers/stage.controller.js";
import {
  getStagesService,
  getStageByIdService,
  createStageService,
  updateStageService,
  patchStageService,
  deleteStageService,
} from "../../../services/stage.service.js";

jest.mock("../../../services/stage.service.js");

describe("🛠 Stage Controller Tests", () => {
  // eslint-disable-next-line no-unused-vars
  let req, res, next;
  const mockStage = {
    id: "111e2227-e33b-44d3-a555-526614174000",
    name: "Planning",
    description: "Stage for initial planning",
    createdBy: "user-id-1",
    projectId: "project-id-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: "user-id", role: "ROLE_ADMIN" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
    console.warn.mockRestore();
    console.log.mockRestore();
  });

  describe("getStages", () => {
    test("✅ should return stages successfully (200)", async () => {
      getStagesService.mockResolvedValue({
        data: [mockStage],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });

      await stageController.getStages(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: [mockStage],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });
    });

    test("🚫 should handle internal server error (500) when error.status is undefined", async () => {
      getStagesService.mockRejectedValue(new Error("Database error"));

      await stageController.getStages(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
  });

  describe("getStageById", () => {
    test("✅ should return a stage by ID successfully (200)", async () => {
      req.params.id = mockStage.id;
      getStageByIdService.mockResolvedValue(mockStage);

      // getStageById is an array with middlewares + the handler, invoke the handler last
      await stageController.getStageById[2](req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockStage);
    });

    test("🚫 should return 404 when stage is not found", async () => {
      req.params.id = "non-existent-id";
      getStageByIdService.mockResolvedValue(null);

      await stageController.getStageById[2](req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Stage not found" });
    });

    test("🚫 should handle internal server error (500) when error.status is undefined", async () => {
      req.params.id = mockStage.id;
      getStageByIdService.mockRejectedValue(new Error("Database error"));

      await stageController.getStageById[2](req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
  });

  describe("createStage", () => {
    test("✅ should create a stage successfully (201)", async () => {
      req.body = { name: "Design", description: "Design phase" };
      createStageService.mockResolvedValue(mockStage);

      await stageController.createStage[2](req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Stage created successfully",
        stage: mockStage,
      });
    });

    test("🚫 should handle conflict error (409) on create", async () => {
      req.body = { name: "Duplicate Stage", description: "Duplicate" };
      createStageService.mockRejectedValue({
        status: 409,
        message: "Stage with this name already exists",
      });

      await stageController.createStage[2](req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "Stage with this name already exists",
      });
    });

    test("🚫 should handle internal server error (500) when error.status is undefined", async () => {
      req.body = { name: "Stage 1", description: "Sample" };
      createStageService.mockRejectedValue(new Error("Database error"));

      await stageController.createStage[2](req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
  });

  describe("updateStage", () => {
    test("✅ should update a stage successfully (200)", async () => {
      req.params.id = mockStage.id;
      req.body = { name: "Updated Name" };
      updateStageService.mockResolvedValue(mockStage);

      await stageController.updateStage[2](req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Stage updated successfully",
        stage: mockStage,
      });
    });

    test("🚫 should handle conflict error (409) on update", async () => {
      updateStageService.mockRejectedValue({
        status: 409,
        message: "Stage with this name already exists",
      });

      await stageController.updateStage[2](req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "Stage with this name already exists",
      });
    });

    test("🚫 should handle internal server error (500) when error.status is undefined", async () => {
      updateStageService.mockRejectedValue(new Error("Database error"));

      await stageController.updateStage[2](req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
  });

  describe("patchStage", () => {
    test("✅ should patch a stage successfully (200)", async () => {
      req.params.id = mockStage.id;
      req.body = { description: "New partial description" };
      patchStageService.mockResolvedValue(mockStage);

      await stageController.patchStage[2](req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Stage updated successfully",
        stage: mockStage,
      });
    });

    test("🚫 should handle conflict error (409) on patch", async () => {
      patchStageService.mockRejectedValue({
        status: 409,
        message: "Stage with this name already exists",
      });

      await stageController.patchStage[2](req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "Stage with this name already exists",
      });
    });

    test("🚫 should handle internal server error (500) when error.status is undefined", async () => {
      patchStageService.mockRejectedValue(new Error("Database error"));

      await stageController.patchStage[2](req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
  });

  describe("deleteStage", () => {
    test("✅ should delete a stage successfully (200)", async () => {
      req.params.id = mockStage.id;
      deleteStageService.mockResolvedValue({ message: "Stage deleted successfully" });

      await stageController.deleteStage[2](req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Stage deleted successfully" });
    });

    test("🚫 should handle internal server error (500) when error.status is undefined", async () => {
      deleteStageService.mockRejectedValue(new Error("Database error"));

      await stageController.deleteStage[2](req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
  });
});
