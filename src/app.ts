import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { HealthRoutes } from "./modules/system/health.routes";
import { ErrorHandler } from "./shared/core/error-handler";
import { ROUTE_PREFIXES } from "./shared/constants/route.constants";
import { HTTP_STATUS } from "./shared/constants/status-code.constants";
import { ILoggerService } from "./shared/services/interfaces/logger.service.interface";
import { IDatabaseService } from "./shared/services/interfaces/database.service.interface";
import { ISwaggerService } from "./shared/services/interfaces/swagger.service.interface";
import { IJwtService } from "./shared/services/interfaces/jwt.service.interface";

export class App {
  private app: Application;
  private healthRoutes!: HealthRoutes;
  private logger: ILoggerService;
  private database: IDatabaseService;
  private swaggerService: ISwaggerService;
  private jwtService: IJwtService;

  private constructor(
    logger: ILoggerService,
    database: IDatabaseService,
    swaggerService: ISwaggerService,
    jwtService: IJwtService,
  ) {
    this.app = express();
    this.logger = logger;
    this.database = database;
    this.swaggerService = swaggerService;
    this.jwtService = jwtService;

    this.initializeRouteInstances();
    this.initializeMiddleware();
    this.initializePublicRoutes();
    this.initializeProtectedRoutes();
    this.initializeErrorHandling();
  }

  public static create(
    logger: ILoggerService,
    database: IDatabaseService,
    swaggerService: ISwaggerService,
    jwtService: IJwtService,
  ): App {
    return new App(logger, database, swaggerService, jwtService);
  }

  private initializeRouteInstances() {
    this.healthRoutes = new HealthRoutes(this.logger);
  }

  private initializePublicRoutes() {
    // API docs — served before helmet so CSP doesn't block Swagger UI assets
    this.app.use(
      ROUTE_PREFIXES.BASE_PATH + ROUTE_PREFIXES.DOCS,
      swaggerUi.serve,
      swaggerUi.setup(this.swaggerService.getSpec(), {
        customSiteTitle: "Knowledge Hub API Docs",
      }),
    );

    this.app.use(ROUTE_PREFIXES.BASE_PATH + ROUTE_PREFIXES.HEALTH, this.healthRoutes.getRouter());
  }

  private initializeMiddleware() {
    // Security middleware
    this.app.use(helmet());

    // CORS
    this.app.use(cors());

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private initializeProtectedRoutes() {
    // Feature module routes that require authentication go here
  }

  private initializeErrorHandling() {
    // 404 catch-all
    this.app.use("*", (_req: Request, res: Response) => {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Route not found",
      });
    });

    // Global error handler
    this.app.use(ErrorHandler.handleError);
  }

  public getApp(): Application {
    return this.app;
  }
}
