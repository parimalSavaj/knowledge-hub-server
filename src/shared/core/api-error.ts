export class ApiError extends Error {
  public statusCode: number;
  public errors: any[];
  public success: boolean;
  public data: null;

  constructor(statusCode: number, message: string = "Something went wrong", errors: any[] = []) {
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
