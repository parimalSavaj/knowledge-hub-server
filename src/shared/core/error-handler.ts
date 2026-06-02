import { Request, Response, NextFunction } from "express";
import { ApiError } from "./api-error";
import { HTTP_STATUS } from "../constants/status-code.constants";
import { LoggerService } from "../services/logger.service";
import { config } from "../config";

export class ErrorHandler {
  static handleError(error: unknown, _req: Request, res: Response, _next: NextFunction) {
    const logger = LoggerService.getInstance();

    let payload: {
      success: boolean;
      message: string;
      statusCode: number;
      errors?: string[];
      data: null;
      stack?: string;
    };

    if (error instanceof ApiError) {
      logger.error(error.message, error);
      payload = error.toJSON();
    } else if (error instanceof Error) {
      logger.error("Unhandled error", error);
      payload = {
        success: false,
        message: "Internal Server Error",
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        data: null,
      };
    } else {
      logger.error("Unknown error", undefined, { error });
      payload = {
        success: false,
        message: "Internal Server Error",
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        data: null,
      };
    }

    if (config.isDev) {
      payload.stack = error instanceof Error ? error.stack : undefined;
    }

    res.status(payload.statusCode).json(payload);
  }
}
