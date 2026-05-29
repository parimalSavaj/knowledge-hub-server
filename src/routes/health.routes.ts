import { Router, Request, Response, NextFunction } from "express";
import { ApiResponse } from "../shared/core/api-response";
import { ApiError } from "../shared/core/api-error";
import { HTTP_STATUS } from "../shared/constants/status-code.constants";

export class HealthRoutes {
  private router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.get("/", (_req: Request, res: Response) => {
      const data = { timestamp: new Date().toISOString() };
      res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, data, "Server is running"));
    });

    // Test route for throwing errors
    this.router.get("/error", (_req: Request, _res: Response, next: NextFunction) => {
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
