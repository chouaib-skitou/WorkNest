// tests/unit/repositories/user.repository.test.js

import { prisma } from "../../../config/database.js";
import { UserRepository } from "../../../repositories/user.repository.js";

// Mock the Prisma client
jest.mock("../../../config/database.js", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("UserRepository Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("findMany calls prisma.user.findMany", async () => {
    prisma.user.findMany.mockResolvedValue([]);
    const params = { where: { email: "test" }, skip: 0, take: 10, orderBy: { createdAt: "desc" } };
    const result = await UserRepository.findMany(params);
    expect(prisma.user.findMany).toHaveBeenCalledWith(params);
    expect(result).toEqual([]);
  });

  test("count calls prisma.user.count", async () => {
    prisma.user.count.mockResolvedValue(42);
    const result = await UserRepository.count({ email: "test" });
    expect(prisma.user.count).toHaveBeenCalledWith({ where: { email: "test" } });
    expect(result).toBe(42);
  });

  test("findUnique calls prisma.user.findUnique", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "123" });
    const result = await UserRepository.findUnique({ id: "123" });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: "123" } });
    expect(result).toEqual({ id: "123" });
  });

  test("create calls prisma.user.create", async () => {
    prisma.user.create.mockResolvedValue({ id: "new-user" });
    const result = await UserRepository.create({ email: "test@example.com" });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { email: "test@example.com" },
    });
    expect(result).toEqual({ id: "new-user" });
  });

  test("update calls prisma.user.update", async () => {
    prisma.user.update.mockResolvedValue({ id: "updated-user" });
    const result = await UserRepository.update({ id: "some-id" }, { firstName: "John" });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "some-id" },
      data: { firstName: "John" },
    });
    expect(result).toEqual({ id: "updated-user" });
  });

  test("delete calls prisma.user.delete", async () => {
    prisma.user.delete.mockResolvedValue({ id: "deleted-user" });
    const result = await UserRepository.delete({ id: "some-id" });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "some-id" } });
    expect(result).toEqual({ id: "deleted-user" });
  });

  test("findManyByIds calls prisma.user.findMany with in[]", async () => {
    prisma.user.findMany.mockResolvedValue([{ id: "u1" }, { id: "u2" }]);
    const result = await UserRepository.findManyByIds(["u1", "u2"]);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["u1", "u2"] } },
      select: { id: true, firstName: true, lastName: true, role: true },
    });
    expect(result).toEqual([{ id: "u1" }, { id: "u2" }]);
  });
});
