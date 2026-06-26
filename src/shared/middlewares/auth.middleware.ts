import { Request, Response, NextFunction } from "express";
import { IJwtService } from "../services/jwt/jwt.service.interface";
import { UnauthorizedError } from "../core/api-error";
import { AuthenticatedUser } from "../services/jwt/jwt.types";

export class AuthMiddleware {
  static authenticate(jwtService: IJwtService) {
    return (req: Request, _res: Response, next: NextFunction): void => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new UnauthorizedError("Access token is required"));
      }

      const token = authHeader.split(" ")[1];

      try {
        const decoded = jwtService.verifyAccessToken<AuthenticatedUser>(token);
        req.user = decoded;
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static extractRefreshToken(req: Request, _res: Response, next: NextFunction): void {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return next(new UnauthorizedError("Refresh token is required"));
    }

    req.refreshToken = token;
    next();
  }
}
