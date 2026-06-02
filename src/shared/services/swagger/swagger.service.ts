import swaggerJsdoc from "swagger-jsdoc";
import { swaggerOptions } from "./swagger.config";
import { ISwaggerService } from "../interfaces/swagger.service.interface";

export class SwaggerService implements ISwaggerService {
  private static instance: SwaggerService | null = null;
  private spec: object;

  private constructor() {
    this.spec = swaggerJsdoc(swaggerOptions);
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
