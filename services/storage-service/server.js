import express from "express";
import storageRoutes from "./routes/storage.routes.js";
import { setupSwagger } from "./docs/swagger.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Setup Swagger documentation
setupSwagger(app);

// Mount storage routes under /api
app.use("/api", storageRoutes);

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Storage service running on port ${PORT} at http://localhost:${PORT}`);
});
