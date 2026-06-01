export const healthDocs: Record<string, Record<string, unknown>> = {
  "/health": {
    get: {
      tags: ["Health"],
      summary: "Check server health",
      responses: {
        200: {
          description: "Server is running",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
            },
          },
        },
      },
    },
  },
  "/health/error": {
    get: {
      tags: ["Health"],
      summary: "Test error handling",
      responses: {
        400: {
          description: "Test bad request error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
      },
    },
  },
};
