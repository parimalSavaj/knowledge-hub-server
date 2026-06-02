export interface IJwtService {
  signAccessToken(payload: object): string;
  signRefreshToken(payload: object): string;
  verifyAccessToken<T = unknown>(token: string): T;
  verifyRefreshToken<T = unknown>(token: string): T;
}
