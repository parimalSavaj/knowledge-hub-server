import { Router, Request, Response, NextFunction } from "express";
import { ApiResponse } from "../shared/core/api-response";
import { ApiError } from "../shared/core/api-error";
import { HTTP_STATUS } from "../shared/constants/status-code.constants";
import { ILoggerService } from "../shared/services/logger.service";

/**
 * @openapi
 * tags:
 *   name: Health
 *   description: Server health check endpoints
 */

export class HealthRoutes {
  private router: Router;
  private logger: ILoggerService;

  constructor(logger: ILoggerService) {
    this.router = Router();
    this.logger = logger;
    this.setupRoutes();
  }

  private setupRoutes() {
    /**
     * @openapi
     * /health:
     *   get:
     *     tags: [Health]
     *     summary: Check server health
     *     responses:
     *       200:
     *         description: Server is running
     */
    this.router.get("/", (_req: Request, res: Response) => {
      this.logger.info("Health check requested");
      const data = { timestamp: new Date().toISOString() };
      res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, data, "Server is running"));
    });

    /**
     * @openapi
     * /health/error:
     *   get:
     *     tags: [Health]
     *     summary: Test error handling
     *     responses:
     *       400:
     *         description: Test bad request error
     */
    this.router.get("/error", (_req: Request, _res: Response, next: NextFunction) => {
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
