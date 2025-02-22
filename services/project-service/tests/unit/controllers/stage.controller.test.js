import * as stageController from "../../../controllers/stage.controller.js";
import { prisma } from "../../../config/database.js";
import { StageDTO } from "../../../dtos/stage.dto.js";

jest.mock("../../../config/database.js", () => ({
  prisma: {
    stage: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe("🛠 Stage Controller Tests", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, headers: {}, query: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  const stageData = {
    id: "0343d921-39a3-4d70-bb2e-1c2782741bc3",
    name: "Design Phase",
    position: 1,
    color: "#FF5733",
    projectId: "6ca55721-cf0b-419f-8c7d-266cc6432956",
    tasks: [],
  };

  test("✅ Get all stages (200) - Success with pagination", async () => {
    prisma.stage.findMany.mockResolvedValue([stageData]);
    prisma.stage.count.mockResolvedValue(1);

    req.query.page = "1";
    req.query.limit = "10";

    await stageController.getStages(req, res);

    expect(res.json).toHaveBeenCalledWith({
      data: [new StageDTO(stageData)],
      page: 1,
      limit: 10,
      totalCount: 1,
      totalPages: 1,
    });
  });

  test("✅ Get all stages (200) - No stages found", async () => {
    prisma.stage.findMany.mockResolvedValue([]);
    prisma.stage.count.mockResolvedValue(0);

    await stageController.getStages(req, res);

    expect(res.json).toHaveBeenCalledWith({
      data: [],
      page: 1,
      limit: 10,
      totalCount: 0,
      totalPages: 0,
    });
  });

  test("🚫 Get all stages - Internal Server Error (500)", async () => {
    prisma.stage.findMany.mockRejectedValue(new Error("Database error"));

    await stageController.getStages(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  test("✅ Get stage by ID (200)", async () => {
    req.params.id = stageData.id;
    prisma.stage.findUnique.mockResolvedValue(stageData);

    await stageController.getStageById[2](req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(new StageDTO(stageData));
  });

  test("🚫 Get stage by ID - Not Found (404)", async () => {
    req.params.id = stageData.id;
    prisma.stage.findUnique.mockResolvedValue(null);

    await stageController.getStageById[2](req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Stage not found" });
  });

  test("🚫 Get stage by ID - Internal Server Error (500)", async () => {
    req.params.id = stageData.id;
    prisma.stage.findUnique.mockRejectedValue(new Error("Database error"));

    await stageController.getStageById[2](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  test("✅ Create a stage (201)", async () => {
    req.body = {
      name: "Design Phase",
      position: 1,
      color: "#FF5733",
      projectId: stageData.projectId,
    };

    prisma.stage.create.mockResolvedValue(stageData);

    await stageController.createStage[2](req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Stage created successfully",
      stage: new StageDTO(stageData),
    });
  });

  test("🚫 Create stage - Duplicate Name (409)", async () => {
    req.body = {
      name: "Design Phase",
      position: 1,
      color: "#FF5733",
      projectId: stageData.projectId,
    };

    prisma.stage.create.mockRejectedValue({ code: "P2002" });

    await stageController.createStage[2](req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: "A stage with this name already exists for this project",
    });
  });

  test("🚫 Create stage - Internal Server Error (500)", async () => {
    prisma.stage.create.mockRejectedValue(new Error("Database error"));

    await stageController.createStage[2](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  test("✅ Update stage (200)", async () => {
    req.params.id = stageData.id;
    req.body = { name: "Updated Phase", position: 2 };

    prisma.stage.update.mockResolvedValue({
      ...stageData,
      name: "Updated Phase",
      position: 2,
    });

    await stageController.updateStage[2](req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Stage updated successfully",
      stage: new StageDTO({ ...stageData, name: "Updated Phase", position: 2 }),
    });
  });

  test("🚫 Update stage - Internal Server Error (500)", async () => {
    prisma.stage.update.mockRejectedValue(new Error("Database error"));

    await stageController.updateStage[2](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  test("✅ Delete stage (200)", async () => {
    req.params.id = stageData.id;
    prisma.stage.delete.mockResolvedValue({});

    await stageController.deleteStage[2](req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Stage deleted successfully",
    });
  });

  test("🚫 Delete stage - Internal Server Error (500)", async () => {
    req.params.id = stageData.id;
    prisma.stage.delete.mockRejectedValue(new Error("Database error"));

    await stageController.deleteStage[2](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  test("🚫 Create stage - Duplicate Name (409)", async () => {
    req.body = {
      name: "Design Phase",
      position: 1,
      color: "#FF5733",
      projectId: "6ca55721-cf0b-419f-8c7d-266cc6432956",
    };

    prisma.stage.create.mockRejectedValue({ code: "P2002" });

    await stageController.createStage[2](req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: "A stage with this name already exists for this project",
    });
  });

  test("✅ Patch stage - Ignore undefined values", async () => {
    req.params.id = "0343d921-39a3-4d70-bb2e-1c2782741bc3";
    req.body = { position: 2, color: undefined }; // `color` is undefined and should be ignored

    prisma.stage.update.mockResolvedValue({
      ...stageData,
      position: 2,
    });

    await stageController.patchStage[2](req, res);

    expect(prisma.stage.update).toHaveBeenCalledWith({
      where: { id: req.params.id },
      data: { position: 2 }, // `color` should NOT be in data
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Stage updated successfully",
      stage: new StageDTO({ ...stageData, position: 2 }),
    });
  });

  test("🚫 Patch stage - No valid fields provided (400)", async () => {
    req.params.id = "0343d921-39a3-4d70-bb2e-1c2782741bc3";
    req.body = {}; // No fields provided

    await stageController.patchStage[2](req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "No valid fields provided for update",
    });
  });

  test("✅ Patch stage - Convert name to lowercase", async () => {
    req.params.id = stageData.id;
    req.body = { name: "DESIGN PHASE" }; // Uppercase input

    prisma.stage.update.mockResolvedValue({
      ...stageData,
      name: "design phase", // Should be converted
    });

    await stageController.patchStage[2](req, res);

    expect(prisma.stage.update).toHaveBeenCalledWith({
      where: { id: req.params.id },
      data: { name: "design phase" }, // Converted to lowercase
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Stage updated successfully",
      stage: new StageDTO({ ...stageData, name: "design phase" }),
    });
  });

  test("✅ Update stage (200)", async () => {
    req.params.id = stageData.id;
    req.body = { name: "Updated Stage", position: 3 };

    prisma.stage.update.mockResolvedValue({
      ...stageData,
      name: "updated stage",
      position: 3,
    });

    await stageController.updateStage[2](req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Stage updated successfully",
      stage: new StageDTO({ ...stageData, name: "updated stage", position: 3 }),
    });
  });

  test("🚫 Update stage - Internal Server Error (500)", async () => {
    req.params.id = stageData.id;
    req.body = { name: "Updated Stage" };

    prisma.stage.update.mockRejectedValue(new Error("Database error"));

    await stageController.updateStage[2](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  test("🚫 Update stage - Duplicate Name (409)", async () => {
    req.params.id = stageData.id;
    req.body = { name: "Existing Stage Name" };

    prisma.stage.update.mockRejectedValue({ code: "P2002" });

    await stageController.updateStage[2](req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: "A stage with this name already exists for this project",
    });
  });

  test("🚫 Patch stage - Duplicate Name (409)", async () => {
    req.params.id = stageData.id;
    req.body = { name: "Existing Stage Name" };

    prisma.stage.update.mockRejectedValue({ code: "P2002" });

    await stageController.patchStage[2](req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: "A stage with this name already exists for this project",
    });
  });

  test("🚫 Patch stage - Internal Server Error (500)", async () => {
    req.params.id = stageData.id;
    req.body = { name: "Updated Stage Name" };

    prisma.stage.update.mockRejectedValue(new Error("Database error"));

    await stageController.patchStage[2](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
