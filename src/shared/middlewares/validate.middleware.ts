import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";
import { ValidationError } from "../core/api-error";

export class ValidationMiddleware {
  static validateBody(schema: ZodType) {
    return (req: Request, _res: Response, next: NextFunction): void => {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const errors = ValidationMiddleware.formatErrors(result.error);
        return next(new ValidationError("Validation failed", errors));
      }

      next();
    };
  }

  static validateQuery(schema: ZodType) {
    return (req: Request, _res: Response, next: NextFunction): void => {
      const result = schema.safeParse(req.query);

      if (!result.success) {
        const errors = ValidationMiddleware.formatErrors(result.error);
        return next(new ValidationError("Validation failed", errors));
      }

      next();
    };
  }

  static validateParams(schema: ZodType) {
    return (req: Request, _res: Response, next: NextFunction): void => {
      const result = schema.safeParse(req.params);

      if (!result.success) {
        const errors = ValidationMiddleware.formatErrors(result.error);
        return next(new ValidationError("Validation failed", errors));
      }

      next();
    };
  }

  private static formatErrors(error: ZodError): string[] {
    return error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  }
}
