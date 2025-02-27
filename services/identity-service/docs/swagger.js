import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Identity Service API",
      version: "1.0.0",
      description: "This API handles authentication and user management for WorkNest",
      contact: {
        name: "API Support",
        email: "support@worknest.com",
        url: "https://worknest.com",
      },
    },
    servers: [
      {
        url: BASE_URL,
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // Ensures routes are documented
};

// Initialize Swagger Docs
const swaggerDocs = swaggerJSDoc(swaggerOptions);

/**
 * @desc Sets up Swagger documentation in the Express app.
 * @param {object} app - The Express application instance.
 */
export function setupSwagger(app) {
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocs, {
      customSiteTitle: "WorkNest - Identity Service", 
    })
  );

  if (process.env.NODE_ENV !== "test") {
    console.log(`📄 Swagger documentation available at: ${BASE_URL}/api/docs`);
  }
}
