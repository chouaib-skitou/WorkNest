import request from "supertest";
import app from "../server.js"; // Ensure this is the correct path to your Express app
import { prisma } from "../config/database.js";

const testUser = {
  firstName: "Test",
  lastName: "User",
  email: "testuser@example.com",
  password: "TestPass123!",
};

beforeAll(async () => {
  await prisma.user.deleteMany(); // Clear all users before running tests
});

afterAll(async () => {
  await prisma.$disconnect();
});

// TODO: correct the concole error

describe("🛂 Auth Routes", () => {
  test("✅ Register a new user", async () => {
    const res = await request(app).post("/auth/register").send(testUser);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message", "User registered successfully. Please verify your email.");
  });

  test("🚫 Prevent duplicate registration", async () => {
    const res = await request(app).post("/auth/register").send(testUser);
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Email already in use");
  });

  test("🚀 Login with verified user", async () => {
    await prisma.user.updateMany({ where: { email: testUser.email }, data: { isVerified: true } });

    const res = await request(app).post("/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
  });

  test("🚫 Prevent login if user is not verified", async () => {
    await prisma.user.updateMany({ where: { email: testUser.email }, data: { isVerified: false } });

    const res = await request(app).post("/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error", "Please verify your email before logging in.");
  });

  test("🚫 Prevent login with wrong credentials", async () => {
    const res = await request(app).post("/auth/login").send({
      email: testUser.email,
      password: "WrongPass!",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error", "Invalid credentials");
  });

  test("🚀 Request password reset", async () => {
    const res = await request(app).post("/auth/reset-password-request").send({ email: testUser.email });
  
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Password reset link sent to your email.");
  });
  
  test("🚫 Prevent password reset for non-existent email", async () => {
    const res = await request(app).post("/auth/reset-password-request").send({ email: "nonexistent@example.com" });
  
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "User with this email does not exist.");
  });
});
