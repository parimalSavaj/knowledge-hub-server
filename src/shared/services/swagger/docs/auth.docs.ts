export const authDocs: Record<string, Record<string, unknown>> = {
  "/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a new user",
      description:
        "Creates a new user account along with a personal organization. Returns the created user details on success.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RegisterRequest" },
          },
        },
      },
      responses: {
        201: {
          description: "Registration successful",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/RegisterResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
        409: {
          description: "Email already in use",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
      },
    },
  },
  "/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Login with email and password",
      description:
        "Authenticates a user with email and password. Returns an access token and refresh token in the JSON response body, and also sets a secure HttpOnly refresh token cookie on the client.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Login successful",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/LoginResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
        401: {
          description: "Invalid email or password",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
      },
    },
  },
  "/auth/refresh": {
    post: {
      tags: ["Auth"],
      summary: "Refresh access token",
      description:
        "Exchanges a valid refresh token (read from HttpOnly cookies or fallback request body) for a new access token and a rotated refresh token (both set in cookies and returned in the JSON body).",
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RefreshRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Token refreshed successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/RefreshResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
        401: {
          description: "Invalid or expired refresh token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
      },
    },
  },
  "/auth/me": {
    get: {
      tags: ["Auth"],
      summary: "Verify authentication status",
      description: "Checks if the current session and token are active and valid.",
      security: [
        {
          bearerAuth: [],
        },
      ],
      responses: {
        200: {
          description: "Auth verification check successful",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/MeResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Unauthorized - Access token is missing, invalid, or expired, or session revoked",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
      },
    },
  },
  "/auth/logout": {
    post: {
      tags: ["Auth"],
      summary: "Logout user",
      description: "Revokes the active refresh token session in the database and clears the browser's HttpOnly refresh token cookie.",
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LogoutRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Logout successful",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { type: "object", nullable: true, example: null },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Invalid or expired refresh token",
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
