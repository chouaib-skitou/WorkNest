// tests/unit/repositories/stage.repository.test.js
jest.mock("../../../config/database.js", () => ({
  prisma: {
    stage: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from "../../../config/database.js";
import { StageRepository } from "../../../repositories/stage.repository.js";

describe("StageRepository Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("findUnique calls prisma.stage.findUnique with correct options", async () => {
    prisma.stage.findUnique.mockResolvedValue({ id: "stage-1" });
    const options = { where: { id: "stage-1" } };
    const result = await StageRepository.findUnique(options);
    expect(prisma.stage.findUnique).toHaveBeenCalledWith(options);
    expect(result).toEqual({ id: "stage-1" });
  });

  test("findMany calls prisma.stage.findMany with correct options", async () => {
    prisma.stage.findMany.mockResolvedValue([
      { id: "stage-1" },
      { id: "stage-2" },
    ]);
    const options = { where: { projectId: "proj-123" } };
    const result = await StageRepository.findMany(options);
    expect(prisma.stage.findMany).toHaveBeenCalledWith(options);
    expect(result).toEqual([{ id: "stage-1" }, { id: "stage-2" }]);
  });

  test("count calls prisma.stage.count with correct options", async () => {
    prisma.stage.count.mockResolvedValue(3);
    const options = { where: { projectId: "proj-123" } };
    const result = await StageRepository.count(options);
    expect(prisma.stage.count).toHaveBeenCalledWith(options);
    expect(result).toBe(3);
  });

  test("create calls prisma.stage.create with data and include when provided", async () => {
    prisma.stage.create.mockResolvedValue({
      id: "new-stage",
      name: "Demo Stage",
    });
    const data = { name: "Demo Stage" };
    const include = { project: true };
    const result = await StageRepository.create(data, include);
    expect(prisma.stage.create).toHaveBeenCalledWith({
      data,
      include,
    });
    expect(result).toEqual({ id: "new-stage", name: "Demo Stage" });
  });

  test("create calls prisma.stage.create with data only when include is not provided", async () => {
    prisma.stage.create.mockResolvedValue({
      id: "new-stage",
      name: "Demo Stage",
    });
    const data = { name: "Demo Stage" };
    const result = await StageRepository.create(data);
    expect(prisma.stage.create).toHaveBeenCalledWith({
      data,
    });
    expect(result).toEqual({ id: "new-stage", name: "Demo Stage" });
  });

  test("update calls prisma.stage.update with correct where, data, and include when provided", async () => {
    prisma.stage.update.mockResolvedValue({
      id: "stage-1",
      name: "Updated Stage",
    });
    const result = await StageRepository.update(
      "stage-1",
      { name: "Updated Stage" },
      { project: true }
    );
    expect(prisma.stage.update).toHaveBeenCalledWith({
      where: { id: "stage-1" },
      data: { name: "Updated Stage" },
      include: { project: true },
    });
    expect(result).toEqual({ id: "stage-1", name: "Updated Stage" });
  });

  test("update calls prisma.stage.update with correct where and data when include is not provided", async () => {
    prisma.stage.update.mockResolvedValue({
      id: "stage-1",
      name: "Updated Stage",
    });
    const result = await StageRepository.update("stage-1", {
      name: "Updated Stage",
    });
    expect(prisma.stage.update).toHaveBeenCalledWith({
      where: { id: "stage-1" },
      data: { name: "Updated Stage" },
    });
    expect(result).toEqual({ id: "stage-1", name: "Updated Stage" });
  });

  test("delete calls prisma.stage.delete with correct where", async () => {
    prisma.stage.delete.mockResolvedValue({ id: "stage-1" });
    const result = await StageRepository.delete("stage-1");
    expect(prisma.stage.delete).toHaveBeenCalledWith({
      where: { id: "stage-1" },
    });
    expect(result).toEqual({ id: "stage-1" });
  });
});
