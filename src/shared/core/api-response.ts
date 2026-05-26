import { HTTP_STATUS } from "../constants/status-code.constants";

export class ApiResponse<T> {
  public statusCode: number;
  public data: T | null;
  public message: string;
  public success: boolean;

  constructor(statusCode: number, data: T | null = null, message: string = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < HTTP_STATUS.BAD_REQUEST;
  }
}
