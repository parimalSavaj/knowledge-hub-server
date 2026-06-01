import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { HealthRoutes } from "./routes/health.routes";
import { ErrorHandler } from "./shared/core/error-handler";
import { ROUTES } from "./shared/constants/route.constants";
import { HTTP_STATUS } from "./shared/constants/status-code.constants";
import { ILoggerService } from "./shared/services/logger.service";
import { IDatabaseService } from "./shared/services/database.service";
import { ISwaggerService } from "./shared/services/swagger.service";

export class App {
  private app: Application;
  private healthRoutes!: HealthRoutes;
  private logger: ILoggerService;
  private database: IDatabaseService;
  private swaggerService: ISwaggerService;

  private constructor(
    logger: ILoggerService,
    database: IDatabaseService,
    swaggerService: ISwaggerService,
  ) {
    this.app = express();
    this.logger = logger;
    this.database = database;
    this.swaggerService = swaggerService;

    this.initializeRouteInstances();
    this.initializePublicRoutes();
    this.initializeMiddleware();
    this.initializeProtectedRoutes();
    this.initializeErrorHandling();
  }

  public static create(
    logger: ILoggerService,
    database: IDatabaseService,
    swaggerService: ISwaggerService,
  ): App {
    return new App(logger, database, swaggerService);
  }

  private initializeRouteInstances() {
    this.healthRoutes = new HealthRoutes(this.logger);
  }

  private initializePublicRoutes() {
    // API docs — served before helmet so CSP doesn't block Swagger UI assets
    this.app.use(
      ROUTES.BASE_PATH + ROUTES.DOCS,
      swaggerUi.serve,
      swaggerUi.setup(this.swaggerService.getSpec(), {
        customSiteTitle: "Knowledge Hub API Docs",
      }),
    );

    this.app.use(ROUTES.BASE_PATH + ROUTES.HEALTH, this.healthRoutes.getRouter());
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
    // Mount protected routes here
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
