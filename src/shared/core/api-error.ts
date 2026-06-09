import { HTTP_STATUS } from "../constants/status-code.constants";

export class ApiError extends Error {
  public statusCode: number;
  public errors: string[];
  public success: boolean;
  public data: null;

  constructor(statusCode: number, message: string = "Something went wrong", errors: string[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: this.success,
      message: this.message,
      statusCode: this.statusCode,
      errors: this.errors.length > 0 ? this.errors : undefined,
      data: this.data,
    };
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = "Resource not found") {
    super(HTTP_STATUS.NOT_FOUND, message);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string = "Validation failed", errors: string[] = []) {
    super(HTTP_STATUS.BAD_REQUEST, message, errors);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = "Resource already exists") {
    super(HTTP_STATUS.CONFLICT, message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = "Unauthorized") {
    super(HTTP_STATUS.UNAUTHORIZED, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = "Forbidden") {
    super(HTTP_STATUS.FORBIDDEN, message);
  }
}

export class InternalError extends ApiError {
  constructor(message: string = "Internal server error") {
    super(HTTP_STATUS.INTERNAL_SERVER_ERROR, message);
  }
}
