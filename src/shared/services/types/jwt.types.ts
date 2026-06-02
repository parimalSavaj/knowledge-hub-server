import { OrgRole } from "../../../domain/enums/org-role.enum";

export type JwtPayload = {
  userId: number;
  email: string;
  orgId: number;
  orgRole: OrgRole;
  iat?: number;
  exp?: number;
};

export type RefreshTokenPayload = {
  userId: number;
};

export type AuthenticatedUser = {
  userId: number;
  email: string;
  orgId: number;
  orgRole: OrgRole;
};
