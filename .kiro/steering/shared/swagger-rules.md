---
description: Rules for Swagger/OpenAPI documentation (schemas, paths, docs per feature module)
inclusion: fileMatch
fileMatchPattern: "src/shared/services/swagger/**"
---

# Swagger / OpenAPI Documentation Rules

## Location

All API documentation lives in `src/shared/services/swagger/` — programmatically defined, no JSDoc annotations in route files.

## Structure

```
src/shared/services/swagger/
├── docs/                          # Path definitions — one file per feature module
│   ├── <feature>.docs.ts          # Endpoint paths for that module
│   └── index.ts                   # Merges all feature docs into swaggerPaths
├── schemas/                       # Request/response schemas — one file per feature module
│   ├── <feature>.schemas.ts       # Request + response schemas for that module
│   └── index.ts                   # Merges all feature schemas into featureSchemas
├── swagger.schemas.ts             # Shared schemas (ApiResponse, ApiError) + merges feature schemas
├── swagger.config.ts              # OpenAPI config — references swaggerPaths + swaggerSchemas
├── swagger.service.interface.ts   # ISwaggerService interface
└── swagger.service.ts             # Singleton service (calls swagger-jsdoc)
```

## Docs Files — `docs/<feature>.docs.ts`

Each feature module gets one docs file that exports all endpoint definitions for that module.

```ts
export const <feature>Docs: Record<string, Record<string, unknown>> = {
  "/<prefix>/<endpoint>": {
    <method>: {
      tags: ["<TagName>"],
      summary: "<Short description>",
      description: "<Detailed description>",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/<RequestSchema>" },
          },
        },
      },
      responses: {
        <statusCode>: {
          description: "<What this status means>",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/<ResponseSchema>" },
                    },
                  },
                ],
              },
            },
          },
        },
        <errorStatusCode>: {
          description: "<Error description>",
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
```

### Docs File Rules

- File naming: `<feature>.docs.ts` (e.g., `auth.docs.ts`, `users.docs.ts`).
- Export name: `<feature>Docs` (e.g., `authDocs`, `usersDocs`).
- One file per feature module — all endpoints for that module live in the same file.
- Path keys match the URL after the base path (e.g., `"/auth/login"`, `"/users/:id"`).
- Use `$ref` to reference schemas — never inline the full schema in path definitions.
- Wrap success response data in `allOf` with `ApiResponse` + data schema.
- Error responses always reference `ApiError` schema.
- Tags group endpoints by feature — tag name matches the module (e.g., `"Auth"`, `"Users"`).
- Protected endpoints must include a `security` field: `security: [{ bearerAuth: [] }]`.

## Index — `docs/index.ts`

Merges all feature doc files into a single `swaggerPaths` export.

```ts
import { healthDocs } from "./health.docs";
import { authDocs } from "./auth.docs";

export const swaggerPaths: Record<string, Record<string, unknown>> = {
  ...healthDocs,
  ...authDocs,
};
```

### Index Rules

- Every new feature docs file must be imported and spread here.
- Order: system modules first (health), then feature modules alphabetically.

## Schemas — `schemas/<feature>.schemas.ts`

Feature-specific request/response schemas live in per-module files inside `schemas/`.

```ts
export const <feature>Schemas: Record<string, Record<string, unknown>> = {
  <ActionRequest>: {
    type: "object",
    required: ["<field1>", "<field2>"],
    properties: {
      <field1>: { type: "<type>", example: "<example>" },
      <field2>: { type: "<type>", format: "<format>", example: "<example>" },
    },
  },
  <ActionResponse>: {
    type: "object",
    properties: {
      <field1>: { type: "<type>", example: "<example>" },
      <field2>: { type: "<type>", example: "<example>" },
    },
  },
};
```

### Schemas File Rules

- File naming: `<feature>.schemas.ts` (e.g., `auth.schemas.ts`, `users.schemas.ts`).
- Export name: `<feature>Schemas` (e.g., `authSchemas`, `usersSchemas`).
- One file per feature module — all request/response schemas for that module live in the same file.
- Every new feature schemas file must be imported and spread in `schemas/index.ts`.

## Schemas Index — `schemas/index.ts`

Merges all feature schema files into a single `featureSchemas` export.

```ts
import { authSchemas } from "./auth.schemas";

export const featureSchemas: Record<string, Record<string, unknown>> = {
  ...authSchemas,
};
```

## Shared Schemas — `swagger.schemas.ts`

Contains only shared/global schemas (`ApiResponse`, `ApiError`) that are used across all features. Merges feature schemas from `schemas/index.ts`.

```ts
import { featureSchemas } from "./schemas";

const sharedSchemas: Record<string, Record<string, unknown>> = {
  ApiResponse: { ... },
  ApiError: { ... },
};

export const swaggerSchemas: Record<string, Record<string, unknown>> = {
  ...sharedSchemas,
  ...featureSchemas,
};
```

### Schema Rules

- Schema names use PascalCase: `<Action>Request`, `<Action>Response` (e.g., `LoginRequest`, `LoginResponse`).
- One request schema + one response schema per API endpoint.
- Always include `required` array for request schemas.
- Always include `example` values for every property — makes the Swagger UI interactive and testable.
- Use proper `format` values where applicable: `"email"`, `"password"`, `"uuid"`, `"date-time"`.
- Nested objects are defined inline within the schema — no separate schemas for nested structures unless reused.
- Shared schemas (`ApiResponse`, `ApiError`) are defined once and referenced everywhere.
- Schema properties must match the DTO fields exactly — schemas are the API contract.

## Mandatory Update Rule

**Every time an API endpoint is created or modified, the Swagger documentation MUST be updated in the same change:**

1. **New API endpoint** →
   - Add request + response schemas to `schemas/<feature>.schemas.ts`.
   - Add path definition to `docs/<feature>.docs.ts`.
   - If it's a new module, create both the schemas file and docs file, and register them in their respective `index.ts`.

2. **Modified request/response shape** →
   - Update the corresponding schema in `schemas/<feature>.schemas.ts` to match the new DTO fields.
   - Update the path definition if status codes or descriptions changed.

3. **Deleted API endpoint** →
   - Remove the path from the docs file.
   - Remove the schemas if no other endpoint uses them.

**The Swagger docs are the source of truth for the API contract. They must always reflect the current implementation.**

## Config — `swagger.config.ts`

- References `swaggerPaths` from `docs/index.ts` and `swaggerSchemas` from `swagger.schemas.ts`.
- Sets up OpenAPI 3.0.0 metadata (title, version, description, servers).
- Defines `securitySchemes` for JWT bearer auth.
- Never edit this file when adding endpoints — only when changing global API metadata.

## Import Rules

```
schemas/<feature>.schemas.ts imports:
  → nothing (pure data objects)

schemas/index.ts imports:
  → ./each feature schemas file

docs/<feature>.docs.ts imports:
  → nothing (pure data objects with $ref strings)

docs/index.ts imports:
  → ./each feature docs file

swagger.schemas.ts imports:
  → ./schemas/index              (featureSchemas)

swagger.config.ts imports:
  → ./docs/index               (swaggerPaths)
  → ./swagger.schemas          (swaggerSchemas)
  → shared/config/             (for port/env)
  → shared/constants/          (for ROUTE_PREFIXES)
```
