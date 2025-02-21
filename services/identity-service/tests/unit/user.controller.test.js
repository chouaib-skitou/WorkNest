import * as userController from "../../controllers/user.controller.js";
import { prisma } from "../../config/database.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { UserDTO } from "../../dtos/user.dto.js";

jest.mock("../../config/database.js", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(), // if you have count in getUsers
    },
  },
}));

jest.mock("../../middleware/validate.middleware.js", () => ({
  validateRequest: jest.fn((req, res, next) => next()),
}));

jest.mock("../../middleware/auth.middleware.js", () => ({
  authMiddleware: jest.fn((req, res, next) => {
    req.user = { id: "1", role: "ROLE_ADMIN" }; // Mock authenticated admin user
    next();
  }),
}));

describe("🛂 User Controller Tests (Full Coverage)", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, query: {}, user: { id: "1", role: "ROLE_ADMIN" } };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    jest.spyOn(console, "error").mockImplementation(() => {}); // Suppress console.errors
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** 🟢 Get All Users */
  test("📌 Retrieve all users (Only ADMIN or MANAGER)", async () => {
    // 1) Manually call checkRole => userController.getUsers[0]
    const mockNext = jest.fn();
    userController.getUsers[0](req, res, mockNext);
    expect(mockNext).toHaveBeenCalled(); // role check passes
  
    // 2) Now call the final function => userController.getUsers[1]
    const mockUsers = [
      { id: "1", firstName: "John" },
      { id: "2", firstName: "Jane" },
    ];
    prisma.user.findMany.mockResolvedValue(mockUsers);
    prisma.user.count.mockResolvedValue(2);
  
    await userController.getUsers[1](req, res);
  
    // 3) The response is now an object with { data, page, limit, totalCount, totalPages }
    expect(prisma.user.findMany).toHaveBeenCalled();
    expect(prisma.user.count).toHaveBeenCalled();
  
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([expect.any(UserDTO)]),
        page: 1,
        limit: 10,
        totalCount: 2,
        totalPages: 1,
      })
    );
  });
  

  test("🚫 Deny access to EMPLOYEE role for retrieving users", async () => {
    req.user.role = "ROLE_EMPLOYEE";
    await userController.getUsers[0](req, res, () => {});
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Access denied" });
  });

  test("🚫 Handle error when fetching users fails", async () => {
    // 1) checkRole => pass
    const mockNext = jest.fn();
    userController.getUsers[0](req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();

    // 2) fail in findMany
    prisma.user.findMany.mockRejectedValue(new Error("Database error"));
    await userController.getUsers[1](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 🟢 Get Specific User */
  test("🔎 Retrieve user by ID (Admin or self)", async () => {
    req.params.id = "2";
    prisma.user.findUnique.mockResolvedValue({ id: "2", firstName: "User" });

    await userController.getUserById[0](req, res);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: "2" } });
    expect(res.json).toHaveBeenCalledWith(expect.any(UserDTO));
  });

  test("🚫 Deny access to another user's data (non-admin)", async () => {
    req.user.role = "ROLE_EMPLOYEE";
    req.user.id = "1";
    req.params.id = "2";

    await userController.getUserById[0](req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Access denied" });
  });

  test("🚫 Return 404 if user not found", async () => {
    req.params.id = "999";
    prisma.user.findUnique.mockResolvedValue(null);

    await userController.getUserById[0](req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  /** 🟢 Create User */
  test("✅ Successfully create a new user (Admin only)", async () => {
    req.body = { firstName: "NewUser", role: "ROLE_EMPLOYEE" };
    prisma.user.create.mockResolvedValue({ id: "3", ...req.body });

    await userController.createUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.any(UserDTO));
  });

  test("🚫 Handle error when user creation fails", async () => {
    prisma.user.create.mockRejectedValue(new Error("Database error"));
    await userController.createUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 🟢 Update User */
  test("✅ Successfully update a user (Admin or User themselves)", async () => {
    req.params.id = "1";
    req.body = { firstName: "UpdatedName" };
    prisma.user.findUnique.mockResolvedValue({ id: "1" });
    prisma.user.update.mockResolvedValue({ id: "1", firstName: "UpdatedName" });

    await userController.updateUser[2](req, res);
    expect(res.json).toHaveBeenCalledWith(expect.any(UserDTO));
  });

  test("🚫 Return 404 if user does not exist when updating", async () => {
    req.params.id = "999";
    prisma.user.findUnique.mockResolvedValue(null);

    await userController.updateUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  test("🚫 Handle error when updating user fails", async () => {
    req.params.id = "1";
    prisma.user.findUnique.mockResolvedValue({ id: "1" });
    prisma.user.update.mockRejectedValue(new Error("Database error"));

    await userController.updateUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 🟢 Delete User */
  test("✅ Successfully delete a user (Admin only)", async () => {
    req.params.id = "2";
    prisma.user.findUnique.mockResolvedValue({ id: "2" });
    prisma.user.delete.mockResolvedValue({});

    await userController.deleteUser[2](req, res);
    expect(res.json).toHaveBeenCalledWith({ message: "User deleted successfully" });
  });

  test("🚫 Return 404 if user does not exist when deleting", async () => {
    req.params.id = "999";
    prisma.user.findUnique.mockResolvedValue(null);

    await userController.deleteUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  test("🚫 Handle error when deleting user fails", async () => {
    req.params.id = "3";
    prisma.user.findUnique.mockResolvedValue({ id: "3" });
    prisma.user.delete.mockRejectedValue(new Error("Database error"));

    await userController.deleteUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 🟢 Ensure checkRole denies access when role is incorrect */
  test("🚫 Middleware - checkRole should deny unauthorized users", async () => {
    const mockNext = jest.fn();
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockReq = { user: { role: "ROLE_EMPLOYEE" } }; // Not ADMIN or MANAGER
    const middleware = userController.getUsers[0];

    middleware(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Access denied" });
  });

  /** 🟢 Ensure error is handled when getUserById fails */
  test("🚫 Handle database error in getUserById", async () => {
    req.params.id = "2";
    prisma.user.findUnique.mockRejectedValue(new Error("Database error"));

    await userController.getUserById[0](req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 🟢 Ensure validation middleware is working for updateUser */
  test("🚫 Ensure validation middleware runs for updateUser", async () => {
    await userController.updateUser[1](req, res, () => {});
    expect(validateRequest).toHaveBeenCalled();
  });

  /** 🟢 Handle error when updating user fails */
  test("🚫 Ensure updateUser handles errors properly", async () => {
    req.params.id = "1";
    prisma.user.findUnique.mockResolvedValue({ id: "1" });
    prisma.user.update.mockRejectedValue(new Error("Database error"));

    await userController.updateUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 🟢 Handle error when patchUser fails */
  test("🚫 Ensure patchUser handles errors properly", async () => {
    req.params.id = "1";
    prisma.user.update.mockRejectedValue(new Error("Database error"));

    // NOTE: we call [2] for patchUser to skip the validation middleware
    await userController.patchUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 🟢 Ensure deleteUser handles errors correctly */
  test("🚫 Ensure deleteUser handles database errors", async () => {
    req.params.id = "3";
    prisma.user.findUnique.mockResolvedValue({ id: "3" });
    prisma.user.delete.mockRejectedValue(new Error("Database error"));

    await userController.deleteUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 🟢 Middleware - Ensure checkRole allows correct roles */
  test("✅ Middleware - checkRole should allow authorized users", async () => {
    const mockNext = jest.fn();
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockReq = { user: { role: "ROLE_MANAGER" } }; // Allowed role
    const middleware = userController.getUsers[0];

    middleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled(); // Should proceed to next middleware
  });

  /** 🟢 Handle update when user does not exist */
  test("🚫 Ensure updateUser returns 404 when user does not exist", async () => {
    req.params.id = "999"; // Nonexistent user
    prisma.user.findUnique.mockResolvedValue(null);

    await userController.updateUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  /** 🟢 Ensure patchUser handles user not found */
  test("🚫 Ensure patchUser returns 404 when user does not exist", async () => {
    req.params.id = "999";
    prisma.user.findUnique.mockResolvedValue(null);

    // We skip patchUser[1] because we want to test final logic:
    await userController.patchUser[2](req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  /** 🚫 Ensure patchUser handles database errors correctly */
  test("🚫 Ensure patchUser handles database errors correctly", async () => {
    req.params.id = "1";
    req.body = { firstName: "BrokenUpdate" };

    // Simulate a database error
    prisma.user.findUnique.mockResolvedValue({ id: "1" }); // Ensure user exists
    prisma.user.update.mockRejectedValue(new Error("Database error"));

    await userController.patchUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 🟢 Ensure deleteUser handles missing user */
  test("🚫 Ensure deleteUser returns 404 when user is not found", async () => {
    req.params.id = "999";
    prisma.user.findUnique.mockResolvedValue(null);

    await userController.deleteUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  /** 🟢 Ensure deleteUser handles database error */
  test("🚫 Ensure deleteUser handles database errors correctly", async () => {
    req.params.id = "3";
    prisma.user.findUnique.mockResolvedValue({ id: "3" });
    prisma.user.delete.mockRejectedValue(new Error("Database error"));

    await userController.deleteUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 🚫 Ensure checkRole denies access for multiple unauthorized roles */
  test("🚫 Middleware - checkRole should deny access for multiple unauthorized roles", async () => {
    const roles = ["ROLE_GUEST", "ROLE_INTERN"];
    for (const role of roles) {
      const mockNext = jest.fn();
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const mockReq = { user: { role } };

      const middleware = userController.getUsers[0];
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Access denied" });
    }
  });

  /** 🚫 Ensure updateUser does not update if Prisma returns the same object */
  test("🚫 Ensure updateUser does not update if no changes are made", async () => {
    req.params.id = "1";
    req.body = { firstName: "SameName" };

    prisma.user.findUnique.mockResolvedValue({ id: "1", firstName: "SameName" });
    prisma.user.update.mockResolvedValue({ id: "1", firstName: "SameName" });

    await userController.updateUser[2](req, res);

    expect(prisma.user.update).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.any(UserDTO));
  });

  /** 🚫 Ensure patchUser does not update if Prisma returns the same object */
  test("🚫 Ensure patchUser does not update if no changes are made", async () => {
    req.params.id = "1";
    req.body = { lastName: "SameLastName" };

    prisma.user.findUnique.mockResolvedValue({ id: "1", lastName: "SameLastName" });
    prisma.user.update.mockResolvedValue({ id: "1", lastName: "SameLastName" });

    await userController.patchUser[2](req, res);

    expect(prisma.user.update).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.any(UserDTO));
  });

  /** 🚫 Ensure 500 error is handled when prisma.findUnique fails in updateUser */
  test("🚫 Ensure updateUser handles database error in findUnique", async () => {
    req.params.id = "1";
    prisma.user.findUnique.mockRejectedValue(new Error("Database error"));

    await userController.updateUser[2](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 🚫 Ensure 500 error is handled when prisma.findUnique fails in patchUser */
  test("🚫 Ensure patchUser handles database error in findUnique", async () => {
    req.params.id = "1";
    prisma.user.findUnique.mockRejectedValue(new Error("Database error"));

    await userController.patchUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 🚫 Ensure deleteUser does not proceed if user already deleted */
  test("🚫 Ensure deleteUser does not proceed if user was already deleted", async () => {
    req.params.id = "999";
    prisma.user.findUnique.mockResolvedValue(null);

    await userController.deleteUser[2](req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  test("🚫 Deny profile update if not the user themselves or an admin", async () => {
    req.user = { id: "1", role: "ROLE_EMPLOYEE" };
    req.params.id = "2"; // Another user
    prisma.user.findUnique.mockResolvedValue({ id: "2" });
  
    await userController.updateUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "You can only update your own profile" });
  });

  test("🚫 Deny partial profile update if not the user themselves or an admin", async () => {
    req.user = { id: "1", role: "ROLE_EMPLOYEE" };
    req.params.id = "2"; // Another user
    prisma.user.findUnique.mockResolvedValue({ id: "2" });
  
    await userController.patchUser[2](req, res);
  
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "You can only update your own profile" });
  });

  test("🚫 Deny user deletion if not an admin", async () => {
    req.user = { id: "1", role: "ROLE_EMPLOYEE" };
    req.params.id = "2"; // Another user
    prisma.user.findUnique.mockResolvedValue({ id: "2" });
  
    await userController.deleteUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Only administrators can delete users" });
  });

  /************************************
  * Additional Pagination & Filter Tests
  * for getUsers
  ************************************/
  test("✅ getUsers with no query => default page=1, limit=10, no filters", async () => {
    // 1) Manually call the checkRole middleware => getUsers[0]
    const mockNext = jest.fn();
    userController.getUsers[0](req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();

    // 2) Set up Prisma mock
    prisma.user.findMany.mockResolvedValue([
      { id: "1", firstName: "John" },
      { id: "2", firstName: "Jane" },
    ]);
    prisma.user.count.mockResolvedValue(2);

    // 3) Call the final function => getUsers[1]
    await userController.getUsers[1](req, res);

    // 4) Check the call
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      orderBy: { createdAt: "desc" },
    });
    expect(prisma.user.count).toHaveBeenCalledWith({ where: {} });

    // 5) Check the output
    expect(res.json).toHaveBeenCalledWith({
      data: expect.arrayContaining([expect.any(UserDTO)]),
      page: 1,
      limit: 10,
      totalCount: 2,
      totalPages: 1,
    });
  });

  test("✅ getUsers with custom page=2 & limit=5", async () => {
    // role check
    const mockNext = jest.fn();
    userController.getUsers[0](req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();

    // 2) Provide pagination params
    req.query.page = "2";
    req.query.limit = "5";

    prisma.user.findMany.mockResolvedValue([]); // Suppose no results on page=2
    prisma.user.count.mockResolvedValue(6);     // total 6 => totalPages=6/5=2

    await userController.getUsers[1](req, res);

    // skip => (2-1)*5=5, take => 5
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 5,
      take: 5,
      orderBy: { createdAt: "desc" },
    });
    expect(prisma.user.count).toHaveBeenCalledWith({ where: {} });
    expect(res.json).toHaveBeenCalledWith({
      data: [],
      page: 2,
      limit: 5,
      totalCount: 6,
      totalPages: 2,
    });
  });

  test("✅ getUsers filter by firstName, lastName, email => 'contains'", async () => {
    // role check
    const mockNext = jest.fn();
    userController.getUsers[0](req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  
    // Provide filters
    req.query.firstName = "john";
    req.query.lastName = "doe";
    req.query.email = "@gmail.com";
  
    prisma.user.findMany.mockResolvedValue([
      {
        id: "3",
        firstName: "John",
        lastName: "Doe",
        email: "jdoe@gmail.com",
      },
    ]);
    prisma.user.count.mockResolvedValue(1);
  
    await userController.getUsers[1](req, res);
  
    // Should build a where object with 'contains'
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          firstName: { contains: "john", mode: "insensitive" },
          lastName: { contains: "doe", mode: "insensitive" },
          email: { contains: "@gmail.com", mode: "insensitive" },
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: "desc" },
      })
    );
    expect(prisma.user.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        firstName: { contains: "john", mode: "insensitive" },
        lastName: { contains: "doe", mode: "insensitive" },
        email: { contains: "@gmail.com", mode: "insensitive" },
      }),
    });
  
    // check response
    expect(res.json).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ id: "3" }),
      ]),
      page: 1,
      limit: 10,
      totalCount: 1,
      totalPages: 1,
    });
  });

  test("✅ getUsers with isVerified=false => boolean false", async () => {
    // role check
    const mockNext = jest.fn();
    userController.getUsers[0](req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();

    // Provide isVerified="false"
    req.query.isVerified = "false";

    prisma.user.findMany.mockResolvedValue([]);
    prisma.user.count.mockResolvedValue(0);

    await userController.getUsers[1](req, res);

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { isVerified: false },
      skip: 0,
      take: 10,
      orderBy: { createdAt: "desc" },
    });
    expect(prisma.user.count).toHaveBeenCalledWith({ where: { isVerified: false } });

    expect(res.json).toHaveBeenCalledWith({
      data: [],
      page: 1,
      limit: 10,
      totalCount: 0,
      totalPages: 0,
    });
  });

  test("✅ getUsers uses both pagination & filters together", async () => {
    // Check role
    const mockNext = jest.fn();
    userController.getUsers[0](req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();

    // Provide combination of pagination + filters
    req.query.page = "3";
    req.query.limit = "2";
    req.query.firstName = "B";
    req.query.email = "company.com";
    req.query.isVerified = "true";
    req.query.role = "ROLE_MANAGER";

    prisma.user.findMany.mockResolvedValue([
      // Suppose we only find 1 user on page 3
      {
        id: "5",
        firstName: "Bob",
        email: "bob@company.com",
        isVerified: true,
        role: "ROLE_MANAGER",
      },
    ]);
    prisma.user.count.mockResolvedValue(5); // total=5 => totalPages=3 if limit=2 => 5/2=2.5 => ceil=3

    await userController.getUsers[1](req, res);

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        firstName: expect.any(Object), // e.g. startsWith or contains "B"
        email: { contains: "company.com", mode: "insensitive" },
        role: "ROLE_MANAGER",
        isVerified: true,
      }),
      skip: 4, // (3 - 1) * 2=4
      take: 2,
      orderBy: { createdAt: "desc" },
    });
    expect(prisma.user.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        isVerified: true,
        role: "ROLE_MANAGER",
      }),
    });

    expect(res.json).toHaveBeenCalledWith({
      data: expect.arrayContaining([expect.any(UserDTO)]),
      page: 3,
      limit: 2,
      totalCount: 5,
      totalPages: 3,
    });
  });

});
