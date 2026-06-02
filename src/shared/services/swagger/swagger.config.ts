import { OAS3Options } from "swagger-jsdoc";
import { config } from "../../config";
import { ROUTE_PREFIXES } from "../../constants/route.constants";
import { swaggerSchemas } from "./swagger.schemas";
import { swaggerPaths } from "./docs";

/**
 * OpenAPI specification options.
 * Paths and schemas are imported from dedicated files.
 */
export const swaggerOptions: OAS3Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Knowledge Hub API",
      version: "1.0.0",
      description: "Multi-tenant AI Knowledge Hub — API documentation",
    },
    servers: [
      {
        url: `http://localhost:${config.port}${ROUTE_PREFIXES.BASE_PATH}`,
        description: config.isDev ? "Development server" : "Production server",
      },
    ],
    paths: swaggerPaths,
    components: {
      schemas: swaggerSchemas,
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [],
};
