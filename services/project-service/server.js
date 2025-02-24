import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import { prisma } from "./config/database.js";
import { setupSwagger } from "./docs/swagger.js";
import projectRoutes from "./routes/project.routes.js";
import stageRoutes from "./routes/stage.routes.js";
import taskRoutes from "./routes/task.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;


// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());

// Routes
app.use("/api/projects", projectRoutes);
app.use("/api/stages", stageRoutes);
app.use("/api/tasks", taskRoutes);

// Swagger Documentation
setupSwagger(app);

// Default route
app.get("/", (req, res) => {
  res.send("🚀 Project Service API is running");
});

// Start server
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, async () => {
    console.log(`🚀 Project Service running on http://localhost:${PORT}`);
    await prisma.$connect();
  });
}

export default app;
