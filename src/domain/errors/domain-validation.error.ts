export class DomainValidationError extends Error {
  public readonly statusCode: number;
  public readonly success: boolean;
  public readonly data: null;

  constructor(message: string) {
    super(message);
    this.name = "DomainValidationError";
    this.statusCode = 400;
    this.success = false;
    this.data = null;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: this.success,
      message: this.message,
      statusCode: this.statusCode,
      data: this.data,
    };
  }
}
