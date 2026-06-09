/**
 * Shared OpenAPI component schemas.
 * Add new schemas here as the API grows.
 */
export const swaggerSchemas: Record<string, Record<string, unknown>> = {
  RegisterRequest: {
    type: "object",
    required: ["name", "email", "password"],
    properties: {
      name: { type: "string", example: "Jane Doe" },
      email: { type: "string", format: "email", example: "jane@example.com" },
      password: { type: "string", format: "password", minLength: 8, example: "Secret123!" },
    },
  },
  RegisterResponse: {
    type: "object",
    properties: {
      userId: { type: "string", example: "usr_01jwxyz" },
      name: { type: "string", example: "Jane Doe" },
      email: { type: "string", example: "jane@example.com" },
    },
  },
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
