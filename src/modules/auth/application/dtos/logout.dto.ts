import { Request } from "express";

export class LogoutRequestDto {
  readonly refreshToken: string;

  private constructor(props: { refreshToken: string }) {
    this.refreshToken = props.refreshToken;
  }

  static fromRequest(req: Request): LogoutRequestDto {
    const token = req.cookies?.refreshToken || req.body?.refreshToken || "";
    return new LogoutRequestDto({
      refreshToken: token,
    });
  }
}
