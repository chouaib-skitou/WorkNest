// tests/unit/repositories/passwordResetToken.repository.test.js

import { prisma } from "../../../config/database.js";
import { PasswordResetTokenRepository } from "../../../repositories/passwordResetToken.repository.js";

jest.mock("../../../config/database.js", () => ({
  prisma: {
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

describe("PasswordResetTokenRepository Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("create calls prisma.passwordResetToken.create", async () => {
    prisma.passwordResetToken.create.mockResolvedValue({ id: "prtoken-1" });
    const data = { userId: "u1", token: "xyz", expiresAt: new Date() };
    const result = await PasswordResetTokenRepository.create(data);
    expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({ data });
    expect(result).toEqual({ id: "prtoken-1" });
  });

  test("findUnique calls prisma.passwordResetToken.findUnique", async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({ id: "prtoken-2" });
    const result = await PasswordResetTokenRepository.findUnique({ token: "xyz" });
    expect(prisma.passwordResetToken.findUnique).toHaveBeenCalledWith({ where: { token: "xyz" } });
    expect(result).toEqual({ id: "prtoken-2" });
  });

  test("delete calls prisma.passwordResetToken.delete", async () => {
    prisma.passwordResetToken.delete.mockResolvedValue({ id: "prtoken-3" });
    const result = await PasswordResetTokenRepository.delete({ token: "xyz" });
    expect(prisma.passwordResetToken.delete).toHaveBeenCalledWith({ where: { token: "xyz" } });
    expect(result).toEqual({ id: "prtoken-3" });
  });

  test("deleteMany calls prisma.passwordResetToken.deleteMany", async () => {
    prisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 5 });
    const result = await PasswordResetTokenRepository.deleteMany({ userId: "u1" });
    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
    expect(result.count).toBe(5);
  });
});
