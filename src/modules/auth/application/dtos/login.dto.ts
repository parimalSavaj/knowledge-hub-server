import { Request } from "express";

export class LoginRequestDto {
  email: string;
  password: string;

  private constructor(props: { email: string; password: string }) {
    this.email = props.email;
    this.password = props.password;
  }

  static fromRequest(req: Request): LoginRequestDto {
    return new LoginRequestDto({
      email: req.body.email,
      password: req.body.password,
    });
  }
}

export class LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: { userId: string; name: string; email: string };

  private constructor(props: {
    accessToken: string;
    refreshToken: string;
    user: { userId: string; name: string; email: string };
  }) {
    this.accessToken = props.accessToken;
    this.refreshToken = props.refreshToken;
    this.user = props.user;
  }

  static fromEntities(data: {
    accessToken: string;
    refreshToken: string;
    user: { id: string; name: string; email: string };
  }): LoginResponseDto {
    return new LoginResponseDto({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: {
        userId: data.user.id,
        name: data.user.name,
        email: data.user.email,
      },
    });
  }
}
