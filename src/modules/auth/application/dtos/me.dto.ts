import { Request } from "express";
import { AuthenticatedUser } from "../../../../shared/services/jwt/jwt.types";

export class MeRequestDto {
  readonly userId: string;
  readonly email: string;
  readonly orgId: string;
  readonly orgRole: string;

  private constructor(user: AuthenticatedUser) {
    this.userId = user.userId;
    this.email = user.email;
    this.orgId = user.orgId;
    this.orgRole = user.orgRole;
  }

  static fromRequest(req: Request): MeRequestDto {
    if (!req.user) {
      throw new Error("User not authenticated in request context");
    }
    return new MeRequestDto(req.user);
  }
}

export class MeResponseDto {
  readonly active: boolean;

  private constructor(props: { active: boolean }) {
    this.active = props.active;
  }

  static toResponse(): MeResponseDto {
    return new MeResponseDto({ active: true });
  }
}
