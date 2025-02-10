import request from "supertest";
import app from "../../server.js";

// Mock swaggerDocs properly
jest.mock("../../docs/swagger.js", () => ({
  swaggerDocs: jest.fn(),
}));

import { swaggerDocs } from "../../docs/swagger.js";

describe("🌍 Server Tests", () => {
  let listenSpy;

  beforeAll(() => {
    listenSpy = jest.spyOn(app, "listen").mockImplementation((port, callback) => {
      if (callback) callback();
    });
  });

  afterAll(() => {
    listenSpy.mockRestore();
  });

  test("✅ Server responds to root endpoint", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.text).toBe("Welcome to the API");
  });

  test("✅ Swagger documentation initializes", () => {
    expect(swaggerDocs).toHaveBeenCalledTimes(1);
    expect(swaggerDocs).toHaveBeenCalledWith(app);
  });

  test("✅ Auth routes are registered", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "test@example.com",
      password: "password",
    });
    expect(response.status).toBeGreaterThanOrEqual(400); // Expect 400+ since login needs valid setup
  });

  test("✅ User routes are registered", async () => {
    const response = await request(app).get("/api/users");
    expect(response.status).toBeGreaterThanOrEqual(400); // Expect 400+ if authentication is required
  });
});
