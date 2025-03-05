/**
 * tests/unit/services/user.service.test.js
 */

import { prisma } from "../../../config/database.js";
import {
  getAllUsersService,
  getUserByIdService,
  createUserService,
  updateUserService,
  patchUserService,
  deleteUserService,
  getUsersByIdsService,
} from "../../../services/user.service.js";
import { UserDTO, UserBatchDTO } from "../../../dtos/user.dto.js";
import { sendAccountCreationEmail } from "../../../services/email.service.js";

// Mock all Prisma calls for user and passwordResetToken
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
    passwordResetToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock email service
jest.mock("../../../services/email.service.js", () => ({
  sendAccountCreationEmail: jest.fn(),
}));

describe("🧪 User Service Tests", () => {
  let adminUser;
  let managerUser;
  let employeeUser;
  let defaultQuery;
  let mockUser;

  beforeEach(() => {
    adminUser = { id: "admin-123", role: "ROLE_ADMIN" };
    managerUser = { id: "manager-123", role: "ROLE_MANAGER" };
    employeeUser = { id: "employee-123", role: "ROLE_EMPLOYEE" };
    defaultQuery = {};
    mockUser = {
      id: "user-id-1",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      role: "ROLE_EMPLOYEE",
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.clearAllMocks();
  });

  //
  // 1) getAllUsersService
  //
  describe("getAllUsersService", () => {
    test("✅ returns users successfully (ROLE_ADMIN or ROLE_MANAGER)", async () => {
      // Mock data
      prisma.user.findMany.mockResolvedValue([mockUser]);
      prisma.user.count.mockResolvedValue(1);

      const result = await getAllUsersService(adminUser, defaultQuery);

      expect(result).toEqual({
        data: [new UserDTO(mockUser)],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          where: {},
        })
      );
    });

    test("✅ does NOT fall back to limit=10 when limit >= 1", async () => {
    prisma.user.findMany.mockResolvedValue([mockUser]);
    prisma.user.count.mockResolvedValue(1);
    
    // Provide a valid limit of 3 so we confirm it does NOT get overwritten to 10
    const query = { page: "1", limit: "3" };
    const result = await getAllUsersService(adminUser, query);
    
    expect(result.limit).toBe(3); // This is the key check
    expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 3 }) // i.e., the final limit is indeed 3
    );
    });

    test("✅ sets limit=10 if limit < 1", async () => {
    prisma.user.findMany.mockResolvedValue([mockUser]);
    prisma.user.count.mockResolvedValue(1);
    
    // Provide a negative or zero limit to trigger the 'limit < 1' path
    const query = { page: "2", limit: "-5" };
    const result = await getAllUsersService(adminUser, query);
    
    // Expect that the service forced limit to 10
    expect(result.limit).toBe(10);
    expect(result.page).toBe(2);
    // Also confirm the underlying call used take=10
    expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
    );
    });
      
      

    test("✅ applies pagination & query filters (firstName, lastName, etc.)", async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);
      prisma.user.count.mockResolvedValue(1);

      const query = {
        page: "2",
        limit: "5",
        firstName: "john",
        lastName: "doe",
        email: "john@example.com",
        role: "ROLE_EMPLOYEE",
        isVerified: "true",
      };

      const result = await getAllUsersService(managerUser, query);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // because page=2, limit=5
          take: 5,
          where: expect.objectContaining({
            firstName: { contains: "john", mode: "insensitive" },
            lastName: { contains: "doe", mode: "insensitive" },
            email: { contains: "john@example.com", mode: "insensitive" },
            role: "ROLE_EMPLOYEE",
            isVerified: true,
          }),
        })
      );
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });

    test("🚫 rejects with 403 if user role is neither ADMIN nor MANAGER", async () => {
      await expect(
        getAllUsersService(employeeUser, defaultQuery)
      ).rejects.toEqual({
        status: 403,
        message: "Access denied: Only admins or managers can list all users",
      });
    });

    test("🚫 rejects with 500 on unknown error", async () => {
      const error = new Error("Database error");
      prisma.user.findMany.mockRejectedValue(error);

      await expect(getAllUsersService(adminUser, defaultQuery)).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });
  });

  //
  // 2) getUserByIdService
  //
  describe("getUserByIdService", () => {
    test("✅ returns user if requested by admin", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await getUserByIdService(adminUser, mockUser.id);
      expect(result).toEqual(new UserDTO(mockUser));
    });

    test("✅ returns user if requested by the user themself", async () => {
      const selfUser = { ...mockUser, id: "self-id" };
      prisma.user.findUnique.mockResolvedValue(selfUser);

      const callingUser = { id: "self-id", role: "ROLE_EMPLOYEE" };
      const result = await getUserByIdService(callingUser, "self-id");
      expect(result).toEqual(new UserDTO(selfUser));
    });

    test("🚫 rejects with 403 if a user tries to get someone else’s info", async () => {
      await expect(
        getUserByIdService(employeeUser, "other-id")
      ).rejects.toEqual({
        status: 403,
        message: "Access denied: You can only view your own profile",
      });
    });

    test("🚫 rejects with 404 if user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(getUserByIdService(adminUser, "missing-id")).rejects.toEqual(
        {
          status: 404,
          message: "User not found",
        }
      );
    });

    test("🚫 rejects with 500 on unknown error", async () => {
      const error = new Error("Database error");
      prisma.user.findUnique.mockRejectedValue(error);

      await expect(getUserByIdService(adminUser, mockUser.id)).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });
  });

  //
  // 3) createUserService
  //
  describe("createUserService", () => {
    test("✅ creates user if admin (201) + sends email", async () => {
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.passwordResetToken.deleteMany.mockResolvedValue({});
      prisma.passwordResetToken.create.mockResolvedValue({});

      const result = await createUserService(adminUser, {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "Passw0rd!",
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            password: "Passw0rd!",
            isVerified: true,
          },
        })
      );
      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUser.id,
          token: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });
      expect(sendAccountCreationEmail).toHaveBeenCalledWith(
        mockUser,
        expect.any(String) // the reset token
      );
      expect(result).toEqual(new UserDTO(mockUser));
    });

    test("🚫 rejects with 403 if non-admin tries to create user", async () => {
      await expect(
        createUserService(employeeUser, {
          firstName: "Jane",
          lastName: "Employee",
        })
      ).rejects.toEqual({
        status: 403,
        message: "Access denied: Only admins can create new users",
      });
    });

    test("🚫 rejects with 409 if email already taken (P2002 on email)", async () => {
      prisma.user.create.mockRejectedValue({
        code: "P2002",
        meta: { target: ["email"] },
      });

      await expect(
        createUserService(adminUser, { email: "duplicate@example.com" })
      ).rejects.toEqual({
        status: 409,
        message: "A user with that email already exists",
      });
    });

    test("🚫 rejects with 500 on unknown error", async () => {
      const error = new Error("Database fail");
      prisma.user.create.mockRejectedValue(error);

      await expect(
        createUserService(adminUser, { email: "test@example.com" })
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });
  });

  //
  // 4) updateUserService
  //
  describe("updateUserService", () => {
    test("✅ updates user if admin", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        firstName: "UpdatedName",
      });

      const result = await updateUserService(adminUser, mockUser.id, {
        firstName: "UpdatedName",
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { firstName: "UpdatedName" },
      });
      expect(result).toEqual(
        new UserDTO({ ...mockUser, firstName: "UpdatedName" })
      );
    });

    test("🚫 rejects with 403 if user is not admin", async () => {
      await expect(
        updateUserService(managerUser, mockUser.id, { firstName: "Nope" })
      ).rejects.toEqual({
        status: 403,
        message: "Access denied: Only admins can update users",
      });
    });

    test("🚫 rejects with 404 if user does not exist", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        updateUserService(adminUser, "missing-user", {})
      ).rejects.toEqual({
        status: 404,
        message: "User not found",
      });
    });

    test("🚫 rejects with 409 if email conflicts (P2002 on email)", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockRejectedValue({
        code: "P2002",
        meta: { target: ["email"] },
      });

      await expect(
        updateUserService(adminUser, mockUser.id, { email: "conflict@x.com" })
      ).rejects.toEqual({
        status: 409,
        message: "A user with that email already exists",
      });
    });

    test("🚫 rejects with 500 on unknown error", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockRejectedValue(new Error("DB error"));

      await expect(
        updateUserService(adminUser, mockUser.id, {})
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });
  });

  //
  // 5) patchUserService
  //
  describe("patchUserService", () => {
    // test("✅ patches user if admin (can patch any field)", async () => {
    //     prisma.user.findUnique.mockResolvedValue(mockUser);
    //     // Only updating lastName in the resolved object:
    //     prisma.user.update.mockResolvedValue({ ...mockUser, lastName: "Patched" });
      
    //     const result = await patchUserService(adminUser, mockUser.id, {
    //       lastName: "Patched",
    //       email: "patch@example.com", // Admin can patch email as well
    //     });
      
    //     // The test expects the final result to have email=patch@example.com
    //     expect(result).toEqual(
    //       new UserDTO({ ...mockUser, lastName: "Patched", email: "patch@example.com" })
    //     );
    //   });
      

    test("✅ patches user if self (only firstName/lastName)", async () => {
        prisma.user.findUnique.mockResolvedValue({ ...mockUser, id: "self-id" });
        prisma.user.update.mockResolvedValue({
          ...mockUser,
          id: "self-id",
          firstName: "MyNewName",
        });
      
        const selfUser = { id: "self-id", role: "ROLE_EMPLOYEE" };
        
        // Only patch firstName or lastName – no password or other fields:
        const result = await patchUserService(selfUser, "self-id", {
          firstName: "MyNewName",
        });
      
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: "self-id" },
          data: { firstName: "MyNewName" },
        });
        expect(result).toEqual(
          new UserDTO({ ...mockUser, id: "self-id", firstName: "MyNewName" })
        );
      });
      

    test("🚫 rejects with 404 if user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        patchUserService(adminUser, "missing", {})
      ).rejects.toEqual({
        status: 404,
        message: "User not found",
      });
    });

    test("🚫 rejects with 403 if normal user tries to patch another user’s data", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      await expect(
        patchUserService(employeeUser, "another-user", { firstName: "Nope" })
      ).rejects.toEqual({
        status: 403,
        message: "Access denied: You can only patch your own profile",
      });
    });

    test("🚫 rejects if normal user tries to patch disallowed fields", async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, id: "employee-123" });
      await expect(
        patchUserService(employeeUser, "employee-123", {
          email: "new@example.com", // not allowed for normal user
          firstName: "Still ignored",
        })
      ).rejects.toEqual({
        status: 403,
        message: "Access denied: Only firstName and lastName can be patched",
      });
    });

    test("🚫 conflicts if email is taken (P2002)", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockRejectedValue({
        code: "P2002",
        meta: { target: ["email"] },
      });

      await expect(
        patchUserService(adminUser, mockUser.id, { email: "conflict@x.com" })
      ).rejects.toEqual({
        status: 409,
        message: "A user with that email already exists",
      });
    });

    test("🚫 rejects with 500 on unknown error", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockRejectedValue(new Error("Patch DB error"));

      await expect(
        patchUserService(adminUser, mockUser.id, { lastName: "X" })
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });
  });

  //
  // 6) deleteUserService
  //
  describe("deleteUserService", () => {
    test("✅ deletes user if admin", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.delete.mockResolvedValue({});

      const result = await deleteUserService(adminUser, mockUser.id);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).toEqual({ message: "User deleted successfully" });
    });

    test("🚫 rejects with 403 if not admin", async () => {
      await expect(
        deleteUserService(managerUser, mockUser.id)
      ).rejects.toEqual({
        status: 403,
        message: "Access denied: Only admins can delete users",
      });
    });

    test("🚫 rejects with 404 if user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        deleteUserService(adminUser, "missing-id")
      ).rejects.toEqual({
        status: 404,
        message: "User not found",
      });
    });

    test("🚫 rejects with 500 on unknown error", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.delete.mockRejectedValue(new Error("Delete error"));

      await expect(
        deleteUserService(adminUser, mockUser.id)
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });
  });

  //
  // 7) getUsersByIdsService
  //
  describe("getUsersByIdsService", () => {
    test("✅ returns minimal user info array", async () => {
      const body = { ids: ["id-1", "id-2"] };
      prisma.user.findMany.mockResolvedValue([
        { id: "id-1", firstName: "Alice", lastName: "Smith", role: "ROLE_MANAGER" },
        { id: "id-2", firstName: "Bob", lastName: "Jones", role: "ROLE_EMPLOYEE" },
      ]);

      const result = await getUsersByIdsService(adminUser, body);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: ["id-1", "id-2"] } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });
      expect(result).toEqual([
        new UserBatchDTO({
          id: "id-1",
          firstName: "Alice",
          lastName: "Smith",
          role: "ROLE_MANAGER",
        }),
        new UserBatchDTO({
          id: "id-2",
          firstName: "Bob",
          lastName: "Jones",
          role: "ROLE_EMPLOYEE",
        }),
      ]);
    });

    test("🚫 rejects with 400 if no IDs provided", async () => {
      const body = { ids: [] };
      await expect(getUsersByIdsService(adminUser, body)).rejects.toEqual({
        status: 400,
        message: "No user ids provided",
      });
    });

    test("🚫 rejects with 500 on unknown error", async () => {
      prisma.user.findMany.mockRejectedValue(new Error("Batch DB error"));
      await expect(
        getUsersByIdsService(adminUser, { ids: ["any"] })
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    test("✅ role check is optional, but we can keep them open to any user", async () => {
      // If you wanted to block employees from using batch, you'd check for role inside getUsersByIdsService
      prisma.user.findMany.mockResolvedValue([]);
      const result = await getUsersByIdsService(employeeUser, { ids: ["id-1"] });
      expect(result).toEqual([]);
    });
  });

  //
  // 8) Additional Branch / Edge Cases
  //
  describe("Additional Edge Cases", () => {
    test("getAllUsersService => page < 1 => page forced to 1", async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);
      prisma.user.count.mockResolvedValue(1);

      const query = { page: "-2", limit: "5" };
      const result = await getAllUsersService(adminUser, query);
      expect(result.page).toBe(1); // forced to 1
    });

    test("getAllUsersService => limit < 1 => forced to 10", async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);
      prisma.user.count.mockResolvedValue(1);

      const query = { page: "2", limit: "0" };
      const result = await getAllUsersService(adminUser, query);
      expect(result.limit).toBe(10);
    });

    test("createUserService => ensures isVerified is forced to true", async () => {
      prisma.user.create.mockResolvedValue({ ...mockUser, isVerified: true });
      prisma.passwordResetToken.deleteMany.mockResolvedValue({});
      prisma.passwordResetToken.create.mockResolvedValue({});
      const userData = {
        firstName: "Forcing",
        lastName: "Verified",
        email: "force@example.com",
        password: "Passw0rd!",
        isVerified: false, // we pass false but service sets it to true
      };
      await createUserService(adminUser, userData);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isVerified: true,
        }),
      });
    });

    test("patchUserService => filters out undefined fields only", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, firstName: "OnlyThis" });

      const patchData = {
        firstName: "OnlyThis",
        lastName: undefined, // do not set
      };
      await patchUserService(adminUser, mockUser.id, patchData);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { firstName: "OnlyThis" },
      });
    });

    test("patchUserService => normal user tries to patch both lastName and an invalid field => rejects", async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, id: employeeUser.id });
      await expect(
        patchUserService(
          employeeUser,
          employeeUser.id,
          { lastName: "Ok", email: "NoWay" } // email is not allowed for normal user
        )
      ).rejects.toEqual({
        status: 403,
        message: "Access denied: Only firstName and lastName can be patched",
      });
    });
  });
});
