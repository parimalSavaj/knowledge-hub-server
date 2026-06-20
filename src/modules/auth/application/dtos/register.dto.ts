import { Request } from "express";

export class RegisterRequestDto {
  name: string;
  email: string;
  password: string;

  private constructor(props: { name: string; email: string; password: string }) {
    this.name = props.name;
    this.email = props.email;
    this.password = props.password;
  }

  static fromRequest(req: Request): RegisterRequestDto {
    return new RegisterRequestDto({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });
  }
}

export class RegisterResponseDto {
  userId: string;
  name: string;
  email: string;

  private constructor(props: { userId: string; name: string; email: string }) {
    this.userId = props.userId;
    this.name = props.name;
    this.email = props.email;
  }

  static fromEntities(user: { id: string; name: string; email: string }): RegisterResponseDto {
    return new RegisterResponseDto({
      userId: user.id,
      name: user.name,
      email: user.email,
    });
  }
}
