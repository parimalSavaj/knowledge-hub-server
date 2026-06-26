import { Request } from "express";

export class RefreshRequestDto {
  readonly refreshToken: string;

  private constructor(props: { refreshToken: string }) {
    this.refreshToken = props.refreshToken;
  }

  static fromRequest(req: Request): RefreshRequestDto {
    return new RefreshRequestDto({
      refreshToken: req.refreshToken!,
    });
  }
}

export class RefreshResponseDto {
  accessToken: string;
  refreshToken: string;

  private constructor(props: { accessToken: string; refreshToken: string }) {
    this.accessToken = props.accessToken;
    this.refreshToken = props.refreshToken;
  }

  static toResponse(data: { accessToken: string; refreshToken: string }): RefreshResponseDto {
    return new RefreshResponseDto({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
  }
}
