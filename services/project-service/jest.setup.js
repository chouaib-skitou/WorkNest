// jest.setup.js
import dotenv from "dotenv";
dotenv.config({ path: process.env.NODE_ENV === "test" ? ".env.test" : ".env" });

import { prisma } from "./config/database.js";

if (typeof beforeAll === "function") {
  beforeAll(async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    await prisma.$connect();
  });

  afterAll(async () => {
    if (console.log.mockRestore) console.log.mockRestore();
    if (console.error.mockRestore) console.error.mockRestore();
    if (console.warn.mockRestore) console.warn.mockRestore();
    await prisma.$disconnect();
  });
} else {
  console.log("Not running under Jest; skipping test setup.");
}
