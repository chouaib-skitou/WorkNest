// tests/unit/repositories/verificationToken.repository.test.js

import { prisma } from "../../../config/database.js";
import { VerificationTokenRepository } from "../../../repositories/verificationToken.repository.js";

jest.mock("../../../config/database.js", () => ({
  prisma: {
    verificationToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("VerificationTokenRepository Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("create calls prisma.verificationToken.create", async () => {
    prisma.verificationToken.create.mockResolvedValue({ id: "vtoken-1" });
    const data = { userId: "u1", token: "abc", expiresAt: new Date() };
    const result = await VerificationTokenRepository.create(data);
    expect(prisma.verificationToken.create).toHaveBeenCalledWith({ data });
    expect(result).toEqual({ id: "vtoken-1" });
  });

  test("findFirst calls prisma.verificationToken.findFirst", async () => {
    prisma.verificationToken.findFirst.mockResolvedValue({ id: "vtoken-2" });
    const result = await VerificationTokenRepository.findFirst({ token: "abc" });
    expect(prisma.verificationToken.findFirst).toHaveBeenCalledWith({
      where: { token: "abc" },
      include: { user: true },
    });
    expect(result).toEqual({ id: "vtoken-2" });
  });

  test("delete calls prisma.verificationToken.delete", async () => {
    prisma.verificationToken.delete.mockResolvedValue({ id: "vtoken-3" });
    const result = await VerificationTokenRepository.delete({ id: "vtoken-3" });
    expect(prisma.verificationToken.delete).toHaveBeenCalledWith({ where: { id: "vtoken-3" } });
    expect(result).toEqual({ id: "vtoken-3" });
  });
});
