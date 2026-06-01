import swaggerJsdoc from "swagger-jsdoc";
import { OAS3Options } from "swagger-jsdoc";
import { config } from "../config";
import { ROUTES } from "../constants/route.constants";

export interface ISwaggerService {
  getSpec(): object;
}

export class SwaggerService implements ISwaggerService {
  private static instance: SwaggerService | null = null;
  private spec: object;

  private constructor() {
    const options: OAS3Options = {
      definition: {
        openapi: "3.0.0",
        info: {
          title: "Knowledge Hub API",
          version: "1.0.0",
          description: "Multi-tenant AI Knowledge Hub — API documentation",
        },
        servers: [
          {
            url: `http://localhost:${config.port}${ROUTES.BASE_PATH}`,
            description: config.isDev ? "Development server" : "Production server",
          },
        ],
        components: {
          schemas: {
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
          },
        },
      },
      apis: ["./src/routes/*.routes.ts"],
    };

    this.spec = swaggerJsdoc(options);
  }

  static getInstance(): SwaggerService {
    if (!SwaggerService.instance) {
      SwaggerService.instance = new SwaggerService();
    }
    return SwaggerService.instance;
  }

  getSpec(): object {
    return this.spec;
  }
}

