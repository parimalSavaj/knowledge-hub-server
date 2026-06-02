import { Router, Request, Response, NextFunction } from "express";
import { ApiResponse } from "../../shared/core/api-response";
import { ApiError } from "../../shared/core/api-error";
import { HTTP_STATUS } from "../../shared/constants/status-code.constants";
import { ROUTES } from "../../shared/constants/route.constants";
import { ILoggerService } from "../../shared/services/logger.service";

export class HealthRoutes {
  private router: Router;
  private logger: ILoggerService;

  constructor(logger: ILoggerService) {
    this.router = Router();
    this.logger = logger;
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.get(ROUTES.HEALTH.ROOT, (_req: Request, res: Response) => {
      this.logger.info("Health check requested");
      const data = { timestamp: new Date().toISOString() };
      res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, data, "Server is running"));
    });

    this.router.get(ROUTES.HEALTH.ERROR, (_req: Request, _res: Response, next: NextFunction) => {
      this.logger.error("Test error route triggered");
      try {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, "This is a test bad request error!", [
          "INVALID_TEST_INPUT",
        ]);
      } catch (error) {
        next(error);
      }
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}
