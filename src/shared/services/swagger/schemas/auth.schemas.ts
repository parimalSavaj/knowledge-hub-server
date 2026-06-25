export const authSchemas: Record<string, Record<string, unknown>> = {
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
  LoginRequest: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email", example: "jane@example.com" },
      password: { type: "string", format: "password", minLength: 8, example: "Secret123!" },
    },
  },
  LoginResponse: {
    type: "object",
    properties: {
      accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
      refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
      user: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            format: "uuid",
            example: "550e8400-e29b-41d4-a716-446655440000",
          },
          name: { type: "string", example: "Jane Doe" },
          email: { type: "string", format: "email", example: "jane@example.com" },
        },
      },
    },
  },
  RefreshRequest: {
    type: "object",
    required: ["refreshToken"],
    properties: {
      refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
    },
  },
  RefreshResponse: {
    type: "object",
    properties: {
      accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
      refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
    },
  },
  MeResponse: {
    type: "object",
    properties: {
      active: { type: "boolean", example: true },
    },
  },
};

