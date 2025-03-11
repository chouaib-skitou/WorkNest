// tests/unit/repositories/task.repository.test.js
jest.mock("../../../config/database.js", () => ({
  prisma: {
    task: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from "../../../config/database.js";
import { TaskRepository } from "../../../repositories/task.repository.js";

describe("TaskRepository Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("findMany calls prisma.task.findMany with correct options", async () => {
    prisma.task.findMany.mockResolvedValue([{ id: "test" }]);
    const options = { where: { projectId: "proj-123" } };
    const result = await TaskRepository.findMany(options);
    expect(prisma.task.findMany).toHaveBeenCalledWith(options);
    expect(result).toEqual([{ id: "test" }]);
  });

  test("count calls prisma.task.count with correct options", async () => {
    prisma.task.count.mockResolvedValue(42);
    const options = { where: { projectId: "proj-123" } };
    const result = await TaskRepository.count(options);
    expect(prisma.task.count).toHaveBeenCalledWith(options);
    expect(result).toBe(42);
  });

  test("findUnique calls prisma.task.findUnique with correct options", async () => {
    prisma.task.findUnique.mockResolvedValue(null);
    const options = { where: { id: "task-xyz" } };
    await TaskRepository.findUnique(options);
    expect(prisma.task.findUnique).toHaveBeenCalledWith(options);
  });

  test("create calls prisma.task.create with data and include when provided", async () => {
    prisma.task.create.mockResolvedValue({ id: "new-task", title: "demo" });
    const data = { title: "demo" };
    const include = { Project: true };
    const result = await TaskRepository.create(data, include);
    expect(prisma.task.create).toHaveBeenCalledWith({
      data,
      include,
    });
    expect(result).toEqual({ id: "new-task", title: "demo" });
  });

  test("create calls prisma.task.create with data only when include is not provided", async () => {
    prisma.task.create.mockResolvedValue({ id: "new-task", title: "demo" });
    const data = { title: "demo" };
    const result = await TaskRepository.create(data);
    expect(prisma.task.create).toHaveBeenCalledWith({
      data,
    });
    expect(result).toEqual({ id: "new-task", title: "demo" });
  });

  test("update calls prisma.task.update with correct where, data, and include when provided", async () => {
    prisma.task.update.mockResolvedValue({ id: "task-xyz", title: "updated" });
    const result = await TaskRepository.update(
      "task-xyz",
      { title: "updated" },
      { Stage: true }
    );
    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: "task-xyz" },
      data: { title: "updated" },
      include: { Stage: true },
    });
    expect(result).toEqual({ id: "task-xyz", title: "updated" });
  });

  test("update calls prisma.task.update with correct where and data when include is not provided", async () => {
    prisma.task.update.mockResolvedValue({ id: "task-xyz", title: "updated" });
    const result = await TaskRepository.update("task-xyz", {
      title: "updated",
    });
    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: "task-xyz" },
      data: { title: "updated" },
    });
    expect(result).toEqual({ id: "task-xyz", title: "updated" });
  });

  test("delete calls prisma.task.delete with correct where", async () => {
    prisma.task.delete.mockResolvedValue({ id: "deleted-task" });
    const result = await TaskRepository.delete("deleted-task");
    expect(prisma.task.delete).toHaveBeenCalledWith({
      where: { id: "deleted-task" },
    });
    expect(result).toEqual({ id: "deleted-task" });
  });
});
