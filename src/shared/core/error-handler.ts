import { Request, Response, NextFunction } from "express";
import { ApiError } from "./api-error";
import { HTTP_STATUS } from "../constants/status-code.constants";

export class ErrorHandler {
  static handleError(error: any, _req: Request, res: Response, _next: NextFunction) {
    console.error("[GlobalErrorHandler]", error);

    let payload: any;

    if (error instanceof ApiError) {
      payload = error.toJSON();
    } else {
      payload = {
        success: false,
        message: error.message || "Internal Server Error",
        statusCode: error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
      };
    }

    if (process.env.NODE_ENV === "development") {
      payload.error = error.stack;
    }

    res.status(payload.statusCode).json(payload);
  }
}
