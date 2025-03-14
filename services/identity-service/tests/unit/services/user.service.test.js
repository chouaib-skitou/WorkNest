// tests/unit/services/user.service.test.js

import crypto from "crypto";
import { UserDTO, UserBatchDTO } from "../../../dtos/user.dto.js";
import { sendAccountCreationEmail } from "../../../services/email.service.js";
import {
  getAllUsersService,
  getUserByIdService,
  createUserService,
  updateUserService,
  patchUserService,
  deleteUserService,
  getUsersByIdsService,
} from "../../../services/user.service.js";
import { UserRepository } from "../../../repositories/user.repository.js";
import { PasswordResetTokenRepository } from "../../../repositories/passwordResetToken.repository.js";

// Mock the repository calls:
jest.mock("../../../repositories/user.repository.js", () => ({
  UserRepository: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findManyByIds: jest.fn(),
  },
}));

jest.mock("../../../repositories/passwordResetToken.repository.js", () => ({
  PasswordResetTokenRepository: {
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
}));

// Mock email service if used
jest.mock("../../../services/email.service.js", () => ({
  sendAccountCreationEmail: jest.fn(),
}));

describe("User Service Tests", () => {
  let adminUser, managerUser, basicUser;

  beforeEach(() => {
    // Example users with different roles
    adminUser = { id: "admin-id", role: "ROLE_ADMIN" };
    managerUser = { id: "manager-id", role: "ROLE_MANAGER" };
    basicUser = { id: "basic-id", role: "ROLE_EMPLOYEE" };

    jest.clearAllMocks();
  });

  describe("getAllUsersService", () => {
    test("🚫 rejects if user is not manager or admin", async () => {
      await expect(getAllUsersService(basicUser, {})).rejects.toEqual({
        status: 403,
        message: "Access denied: Only admins or managers can list all users",
      });
    });

    test("✅ returns users with pagination for admins", async () => {
      UserRepository.findMany.mockResolvedValue([{ id: "u1", email: "a@b.com" }]);
      UserRepository.count.mockResolvedValue(1);

      const result = await getAllUsersService(adminUser, {});
      expect(UserRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          orderBy: { createdAt: "desc" },
        })
      );
      expect(UserRepository.count).toHaveBeenCalled();
      expect(result).toEqual({
        data: [new UserDTO({ id: "u1", email: "a@b.com" })],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });
    });
    
    test("✅ defaults page=1 if page < 1 and defaults limit=10 if limit < 1", async () => {
      UserRepository.findMany.mockResolvedValue([]);
      UserRepository.count.mockResolvedValue(0);

      // Provide negative or zero to force the if-condition:
      const query = { page: "-5", limit: "0" };

      const result = await getAllUsersService(adminUser, query);

      // Expect it to have forced page=1 and limit=10
      expect(UserRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,   // (1 - 1) * 10
          take: 10,
        })
      );
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    test("✅ defaults limit=10 if limit < 1 in getAllUsersService", async () => {
      // Provide a limit < 1 (e.g. "-2") but a valid page (e.g. "2")
      UserRepository.findMany.mockResolvedValue([]);
      UserRepository.count.mockResolvedValue(0);
    
      const query = { page: "2", limit: "-2" };
    
      const result = await getAllUsersService(adminUser, query);
    
      expect(result.page).toBe(2);  // unchanged
      expect(result.limit).toBe(10); // forced to 10
    
      expect(UserRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (2 - 1)*10
          take: 10,
        })
      );
    });
    
    test("✅ applies query filters (firstName, lastName, email, etc.)", async () => {
      UserRepository.findMany.mockResolvedValue([]);
      UserRepository.count.mockResolvedValue(0);

      await getAllUsersService(adminUser, {
        firstName: "John",
        lastName: "Doe",
        email: "test@example.com",
        role: "ROLE_EMPLOYEE",
        isVerified: "true",
      });
      expect(UserRepository.findMany).toHaveBeenCalledWith({
        where: {
          firstName: { contains: "John", mode: "insensitive" },
          lastName: { contains: "Doe", mode: "insensitive" },
          email: { contains: "test@example.com", mode: "insensitive" },
          role: "ROLE_EMPLOYEE",
          isVerified: true,
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: "desc" },
      });
    });

    test("🚫 rejects with 500 on repository error", async () => {
      UserRepository.findMany.mockRejectedValue(new Error("DB error"));
      await expect(getAllUsersService(adminUser, {})).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });
  });
  
  describe("getUserByIdService", () => {
    test("🚫 rejects if not admin and not same user ID", async () => {
      await expect(getUserByIdService(basicUser, "someone-else-id")).rejects.toEqual({
        status: 403,
        message: "Access denied: You can only view your own profile",
      });
    });

    test("✅ returns user if admin", async () => {
      UserRepository.findUnique.mockResolvedValue({ id: "user-id", email: "test@example.com" });
      const result = await getUserByIdService(adminUser, "user-id");
      expect(result).toEqual(new UserDTO({ id: "user-id", email: "test@example.com" }));
    });

    test("✅ returns user if it's the same user ID", async () => {
      UserRepository.findUnique.mockResolvedValue({
        id: "basic-id",
        email: "test2@example.com",
      });
      const result = await getUserByIdService(basicUser, "basic-id");
      expect(result).toEqual(new UserDTO({ id: "basic-id", email: "test2@example.com" }));
    });

    test("🚫 rejects with 404 if user not found", async () => {
      UserRepository.findUnique.mockResolvedValue(null);
      await expect(getUserByIdService(adminUser, "not-found-id")).rejects.toEqual({
        status: 404,
        message: "User not found",
      });
    });

    test("🚫 rejects with 500 on repo error", async () => {
      UserRepository.findUnique.mockRejectedValue(new Error("DB error"));
      await expect(getUserByIdService(adminUser, "some-id")).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });
  });
  
  describe("createUserService", () => {
    test("🚫 rejects if not admin", async () => {
      await expect(createUserService(basicUser, {})).rejects.toEqual({
        status: 403,
        message: "Access denied: Only admins can create new users",
      });
    });

    test("✅ creates user with isVerified forced to true, sends email", async () => {
      UserRepository.create.mockResolvedValue({ id: "new-user" });
      PasswordResetTokenRepository.deleteMany.mockResolvedValue({ count: 0 });
      PasswordResetTokenRepository.create.mockResolvedValue({ id: "token-id" });

      // Properly mock crypto.randomBytes
      jest.spyOn(crypto, "randomBytes").mockReturnValue(Buffer.from("mockedbytes"));

      const result = await createUserService(adminUser, {
        email: "test@example.com",
      });
      expect(UserRepository.create).toHaveBeenCalledWith({
        email: "test@example.com",
        isVerified: true,
      });
      expect(PasswordResetTokenRepository.deleteMany).toHaveBeenCalledWith({ userId: "new-user" });
      expect(PasswordResetTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "new-user",
          token: expect.any(String),
        })
      );
      expect(sendAccountCreationEmail).toHaveBeenCalled();
      expect(result).toEqual(new UserDTO({ id: "new-user" }));
    });

    test("🚫 rejects with 409 if user email conflict (P2002)", async () => {
      UserRepository.create.mockRejectedValue({ code: "P2002", meta: { target: ["email"] } });
      await expect(
        createUserService(adminUser, { email: "duplicate@example.com" })
      ).rejects.toEqual({
        status: 409,
        message: "A user with that email already exists",
      });
    });

    test("✅ createUserService handles missing email gracefully", async () => {
      // Input data without the email property
      const inputData = { firstName: "John", lastName: "Doe", password: "secret" };
    
      // Mock repository responses
      UserRepository.create.mockResolvedValue({ id: "new-user", firstName: "John", lastName: "Doe" });
      PasswordResetTokenRepository.deleteMany.mockResolvedValue({ count: 0 });
      PasswordResetTokenRepository.create.mockResolvedValue({ id: "token-id" });
    
      // Call the service (adminUser is assumed to be defined in your test setup)
      const result = await createUserService(adminUser, inputData);
    
      // Verify that UserRepository.create was called with the input data unchanged (aside from isVerified: true)
      expect(UserRepository.create).toHaveBeenCalledWith({
        ...inputData,
        isVerified: true,
      });
    
      // And that the service returns a new UserDTO with the mocked user data
      expect(result).toEqual(new UserDTO({ id: "new-user", firstName: "John", lastName: "Doe" }));
    });    

    test("🚫 rejects with 500 on other repo errors", async () => {
      UserRepository.create.mockRejectedValue(new Error("DB error"));
      await expect(createUserService(adminUser, { email: "x" })).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });
  });
  
  describe("updateUserService", () => {
    test("🚫 rejects if not admin", async () => {
      await expect(updateUserService(basicUser, "some-id", {})).rejects.toEqual({
        status: 403,
        message: "Access denied: Only admins can update users",
      });
    });

    test("🚫 rejects with 404 if user not found", async () => {
      UserRepository.findUnique.mockResolvedValue(null);
      await expect(updateUserService(adminUser, "missing-id", {})).rejects.toEqual({
        status: 404,
        message: "User not found",
      });
    });

    test("✅ updates user if admin", async () => {
      UserRepository.findUnique.mockResolvedValue({ id: "existing-id" });
      UserRepository.update.mockResolvedValue({ id: "existing-id", email: "updated@example.com" });
      const result = await updateUserService(adminUser, "existing-id", {
        email: "updated@example.com",
      });
      expect(UserRepository.update).toHaveBeenCalledWith(
        { id: "existing-id" },
        { email: "updated@example.com" }
      );
      expect(result).toEqual(
        new UserDTO({ id: "existing-id", email: "updated@example.com" })
      );
    });

    test("🚫 rejects with 409 if email conflict on update", async () => {
      UserRepository.findUnique.mockResolvedValue({ id: "existing-id" });
      UserRepository.update.mockRejectedValue({ code: "P2002", meta: { target: ["email"] } });
      await expect(
        updateUserService(adminUser, "existing-id", { email: "conflict" })
      ).rejects.toEqual({
        status: 409,
        message: "A user with that email already exists",
      });
    });

    test("🚫 rejects with 500 on other errors", async () => {
      UserRepository.findUnique.mockResolvedValue({ id: "existing-id" });
      UserRepository.update.mockRejectedValue(new Error("DB error"));
      await expect(
        updateUserService(adminUser, "existing-id", { email: "boo" })
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });
  });

  describe("patchUserService", () => {
    test("🚫 rejects with 404 if user not found", async () => {
      UserRepository.findUnique.mockResolvedValue(null);
      await expect(patchUserService(adminUser, "unknown-id", {})).rejects.toEqual({
        status: 404,
        message: "User not found",
      });
    });

    test("🚫 rejects if not admin and not same user ID", async () => {
      UserRepository.findUnique.mockResolvedValue({ id: "someone-else" });
      await expect(patchUserService(basicUser, "someone-else", {})).rejects.toEqual({
        status: 403,
        message: "Access denied: You can only patch your own profile",
      });
    });

    test("🚫 rejects if non-admin tries to patch fields beyond firstName, lastName", async () => {
      UserRepository.findUnique.mockResolvedValue({ id: "basic-id" });
      const patchData = { role: "ROLE_MANAGER" };
      await expect(patchUserService(basicUser, "basic-id", patchData)).rejects.toEqual({
        status: 403,
        message: "Access denied: Only firstName and lastName can be patched",
      });
    });

    test("✅ patches user if admin (any fields)", async () => {
      UserRepository.findUnique.mockResolvedValue({ id: "some-id" });
      UserRepository.update.mockResolvedValue({ id: "some-id", firstName: "NewName" });
      const result = await patchUserService(adminUser, "some-id", {
        firstName: "NewName",
        email: "something@new.com",
      });
      expect(UserRepository.update).toHaveBeenCalledWith(
        { id: "some-id" },
        { firstName: "NewName", email: "something@new.com" }
      );
      expect(result).toEqual(new UserDTO({ id: "some-id", firstName: "NewName" }));
    });

    test("✅ patches user, skipping fields that are undefined", async () => {
      UserRepository.findUnique.mockResolvedValue({ id: "some-id" });
      UserRepository.update.mockResolvedValue({ id: "some-id", lastName: "Smith" });

      const patchData = {
        firstName: undefined,
        lastName: "Smith",
      };

      const result = await patchUserService(adminUser, "some-id", patchData);
      expect(UserRepository.update).toHaveBeenCalledWith(
        { id: "some-id" },
        { lastName: "Smith" }
      );
      expect(result).toEqual(new UserDTO({ id: "some-id", lastName: "Smith" }));
    });

    test("✅ patches user if same user (only firstName, lastName)", async () => {
      UserRepository.findUnique.mockResolvedValue({ id: "basic-id" });
      UserRepository.update.mockResolvedValue({
        id: "basic-id",
        firstName: "Patched",
        lastName: "User",
      });
      const patchData = { firstName: "Patched", lastName: "User" };
      const result = await patchUserService(basicUser, "basic-id", patchData);
      expect(UserRepository.update).toHaveBeenCalledWith(
        { id: "basic-id" },
        { firstName: "Patched", lastName: "User" }
      );
      expect(result).toEqual(new UserDTO({ id: "basic-id", firstName: "Patched", lastName: "User" }));
    });

    test("🚫 rejects with 409 if email conflict on patch", async () => {
      UserRepository.findUnique.mockResolvedValue({ id: "some-id" });
      UserRepository.update.mockRejectedValue({ code: "P2002", meta: { target: ["email"] } });
      await expect(
        patchUserService(adminUser, "some-id", { email: "dup@example.com" })
      ).rejects.toEqual({
        status: 409,
        message: "A user with that email already exists",
      });
    });

    test("🚫 rejects with 500 on other errors", async () => {
      UserRepository.findUnique.mockResolvedValue({ id: "some-id" });
      UserRepository.update.mockRejectedValue(new Error("DB error"));
      await expect(
        patchUserService(adminUser, "some-id", { email: "err@example.com" })
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });
  });

  describe("deleteUserService", () => {
    test("🚫 rejects if not admin", async () => {
      await expect(deleteUserService(basicUser, "any-id")).rejects.toEqual({
        status: 403,
        message: "Access denied: Only admins can delete users",
      });
    });

    test("🚫 rejects with 404 if user not found", async () => {
      UserRepository.findUnique.mockResolvedValue(null);
      await expect(deleteUserService(adminUser, "ghost-id")).rejects.toEqual({
        status: 404,
        message: "User not found",
      });
    });

    test("✅ deletes user if admin", async () => {
      UserRepository.findUnique.mockResolvedValue({ id: "to-delete" });
      UserRepository.delete.mockResolvedValue({ id: "to-delete" });
      const result = await deleteUserService(adminUser, "to-delete");
      expect(UserRepository.delete).toHaveBeenCalledWith({ id: "to-delete" });
      expect(result).toEqual({ message: "User deleted successfully" });
    });

    test("🚫 rejects with 500 on repo error", async () => {
      UserRepository.findUnique.mockResolvedValue({ id: "to-delete" });
      UserRepository.delete.mockRejectedValue(new Error("DB error"));
      await expect(deleteUserService(adminUser, "to-delete")).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });
  });
  
  describe("getUsersByIdsService", () => {
    test("🚫 rejects if no IDs provided", async () => {
      await expect(getUsersByIdsService(adminUser, { ids: [] })).rejects.toEqual({
        status: 400,
        message: "No user ids provided",
      });
    });

    test("✅ returns minimal user info array", async () => {
      UserRepository.findManyByIds.mockResolvedValue([
        { id: "u1", role: "ROLE_EMPLOYEE" },
        { id: "u2", role: "ROLE_MANAGER" },
      ]);
      const result = await getUsersByIdsService(adminUser, { ids: ["u1", "u2"] });
      expect(result).toEqual([
        new UserBatchDTO({ id: "u1", role: "ROLE_EMPLOYEE" }),
        new UserBatchDTO({ id: "u2", role: "ROLE_MANAGER" }),
      ]);
    });

    test("🚫 rejects with 500 on repo error", async () => {
      UserRepository.findManyByIds.mockRejectedValue(new Error("DB error"));
      await expect(getUsersByIdsService(adminUser, { ids: ["x"] })).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });
  });
});
