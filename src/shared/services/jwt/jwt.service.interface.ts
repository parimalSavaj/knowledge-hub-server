import { AccessTokenInput, RefreshTokenInput } from './jwt.types';

export interface IJwtService {
  signAccessToken(payload: AccessTokenInput): string;
  signRefreshToken(payload: RefreshTokenInput): string;
  verifyAccessToken<T = unknown>(token: string): T;
  verifyRefreshToken<T = unknown>(token: string): T;
}
