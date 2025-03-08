import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import { setupSwagger } from "./docs/swagger.js"; 
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import fs from "fs";

dotenv.config();

process.env.JWT_SECRET = fs.readFileSync("./config/jwt/JWT_SECRET", "utf8").trim();
process.env.JWT_REFRESH_SECRET = fs.readFileSync("./config/jwt/JWT_REFRESH_SECRET", "utf8").trim();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Initialize Swagger documentation
setupSwagger(app);

app.get("/", (req, res) => {
  res.send("Welcome to the API");
});


// Start server
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}


export default app;
