import { execSync } from "child_process";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" }); // Explicitly load test environment

// Ensure the correct database is used
console.log(`🚀 Using database: ${process.env.DATABASE_URL}`);

// Reset and migrate the test database
console.log("🔄 Resetting and migrating test database...");
execSync("npx prisma migrate reset --force --skip-seed", { stdio: "inherit" });

// Optionally, seed the database (if needed)
console.log("🌱 Seeding test database...");
execSync("npx prisma db seed", { stdio: "inherit" });
