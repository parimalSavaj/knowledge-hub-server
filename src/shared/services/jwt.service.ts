import jwt, { JsonWebTokenError, TokenExpiredError, SignOptions } from "jsonwebtoken";
import { config } from "../config";
import { UnauthorizedError } from "../core/api-error";
import { IJwtService } from "./interfaces/jwt.service.interface";

export class JwtService implements IJwtService {
  private static instance: JwtService | null = null;

  private constructor() {}

  static getInstance(): JwtService {
    if (!JwtService.instance) {
      JwtService.instance = new JwtService();
    }
    return JwtService.instance;
  }

  signAccessToken(payload: object): string {
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn as SignOptions["expiresIn"],
    });
  }

  signRefreshToken(payload: object): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as SignOptions["expiresIn"],
    });
  }

  verifyAccessToken<T = unknown>(token: string): T {
    try {
      return jwt.verify(token, config.jwt.accessSecret) as T;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedError("Access token expired");
      }
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedError("Invalid access token");
      }
      throw new UnauthorizedError("Token verification failed");
    }
  }

  verifyRefreshToken<T = unknown>(token: string): T {
    try {
      return jwt.verify(token, config.jwt.refreshSecret) as T;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedError("Refresh token expired");
      }
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedError("Invalid refresh token");
      }
      throw new UnauthorizedError("Token verification failed");
    }
  }
}
