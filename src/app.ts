import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { HealthRoutes } from "./routes/health.routes";
import { ErrorHandler } from "./shared/core/error-handler";
import { ROUTES } from "./shared/constants/route.constants";
import { HTTP_STATUS } from "./shared/constants/status-code.constants";

export class App {
  private app: Application;
  private healthRoutes!: HealthRoutes;

  private constructor() {
    this.app = express();
    
    this.initializeRouteInstances();
    this.initializePublicRoutes();
    this.initializeMiddleware();
    this.initializeProtectedRoutes();
    this.initializeErrorHandling();
  }

  public static create(): App {
    return new App();
  }

  private initializeRouteInstances() {
    this.healthRoutes = new HealthRoutes();
  }

  private initializePublicRoutes() {
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
    this.app.use("*", (req: Request, res: Response) => {
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
