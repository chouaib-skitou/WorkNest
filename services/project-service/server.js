import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import { swaggerDocs } from "./docs/swagger.js"; // Ensure this path is correct
import projectCreateRoutes from "./routes/create-project.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());

// Routes
app.use("/project", projectCreateRoutes);

// Initialize Swagger documentation
swaggerDocs(app);

app.get("/", (req, res) => {
  res.send("Welcome to the Project API");
});


// Start server
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}


export default app;
