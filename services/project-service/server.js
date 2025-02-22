import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import projectRoutes from "./routes/project.routes.js";
// import taskRoutes from "./routes/task.routes.js";
import dotenv from "dotenv";
import { prisma } from "./config/database.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/projects", projectRoutes);
// app.use("/tasks", taskRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
  console.log(`🚀 Project Service running on port ${PORT}`);
  await prisma.$connect();
});
