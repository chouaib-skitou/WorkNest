import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5001;
const BASE_URL = `http://localhost:${PORT}`;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Project Service API",
      description:
        "API documentation for managing projects and tasks within WorkNest",
      version: "1.0.0",
      contact: {
        name: "WorkNest Team",
        email: "support@worknest.com",
      },
    },
    servers: [
      {
        url: BASE_URL,
        description: "Development Server",
      },
    ],
  },
  apis: ["./routes/*.js"], // Scans all route files for Swagger comments
};

// Initialize Swagger Docs
const swaggerDocs = swaggerJsDoc(swaggerOptions);

/**
 * @desc Sets up Swagger documentation in the Express app.
 * @param {object} app - The Express application instance.
 */
export const setupSwagger = (app) => {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  if (process.env.NODE_ENV !== "test") {
    console.log("📚 Swagger Docs available at: http://localhost:5001/api/docs");
  }
};
