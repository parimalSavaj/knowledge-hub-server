import { OrgRole } from "../../../domain/enums/org-role.enum";

// What you provide when signing an access token
export type AccessTokenInput = {
  userId: string;
  email: string;
  orgId: string;
  orgRole: OrgRole;
};

// Full decoded shape returned by jwt.verify — includes JWT standard claims
export type JwtPayload = AccessTokenInput & {
  iat: number;
  exp: number;
};

// What you provide when signing a refresh token
export type RefreshTokenInput = {
  userId: string;
};

// Full decoded shape returned by jwt.verify for refresh tokens
export type RefreshTokenPayload = RefreshTokenInput & {
  iat: number;
  exp: number;
};

export type AuthenticatedUser = {
  userId: string;
  email: string;
  orgId: string;
  orgRole: OrgRole;
};
