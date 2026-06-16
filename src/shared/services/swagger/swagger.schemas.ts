import { featureSchemas } from "./schemas";

/**
 * Shared OpenAPI component schemas (used across all features).
 * Feature-specific schemas live in schemas/<feature>.schemas.ts
 */
const sharedSchemas: Record<string, Record<string, unknown>> = {
  ApiResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: { type: "string", example: "Success" },
      data: {},
    },
  },
  ApiError: {
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      statusCode: { type: "integer", example: 400 },
      message: { type: "string", example: "Something went wrong" },
      errors: {
        type: "array",
        items: {},
        example: ["INVALID_INPUT"],
      },
      data: { nullable: true, example: null },
    },
  },
};

export const swaggerSchemas: Record<string, Record<string, unknown>> = {
  ...sharedSchemas,
  ...featureSchemas,
};
