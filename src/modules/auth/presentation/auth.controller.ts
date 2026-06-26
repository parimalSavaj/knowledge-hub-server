import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../../../shared/constants/status-code.constants";
import { ApiResponse } from "../../../shared/core/api-response";
import { config } from "../../../shared/config";
import { RegisterUseCase } from "../application/register.use-case";
import { RegisterRequestDto } from "../application/dtos/register.dto";
import { LoginUseCase } from "../application/login.use-case";
import { LoginRequestDto } from "../application/dtos/login.dto";
import { RefreshUseCase } from "../application/refresh.use-case";
import { RefreshRequestDto } from "../application/dtos/refresh.dto";
import { MeUseCase } from "../application/me.use-case";
import { MeRequestDto } from "../application/dtos/me.dto";
import { LogoutUseCase } from "../application/logout.use-case";
import { LogoutRequestDto } from "../application/dtos/logout.dto";

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly meUseCase: MeUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = RegisterRequestDto.fromRequest(req);
      const result = await this.registerUseCase.execute(dto);

      res
        .status(HTTP_STATUS.CREATED)
        .json(new ApiResponse(HTTP_STATUS.CREATED, result, "Registration successful"));
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = LoginRequestDto.fromRequest(req);
      const response = await this.loginUseCase.execute(dto);

      res.cookie("refreshToken", response.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: config.jwt.refreshExpiresInMs,
      });

      res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, response, "Login successful"));
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = RefreshRequestDto.fromRequest(req);
      const response = await this.refreshUseCase.execute(dto);

      res.cookie("refreshToken", response.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: config.jwt.refreshExpiresInMs,
      });

      res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse(HTTP_STATUS.OK, response, "Token refreshed successfully"));
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = MeRequestDto.fromRequest(req);
      const result = await this.meUseCase.execute(dto);

      res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse(HTTP_STATUS.OK, result, "Auth verification check successful"));
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = LogoutRequestDto.fromRequest(req);
      await this.logoutUseCase.execute(dto);

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse(HTTP_STATUS.OK, null, "Logout successful"));
    } catch (error) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      next(error);
    }
  };
}
