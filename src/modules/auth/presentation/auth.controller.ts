import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../../../shared/constants/status-code.constants';
import { ApiResponse } from '../../../shared/core/api-response';
import { RegisterUseCase } from '../application/register.use-case';
import { RegisterRequestDto } from '../application/dtos/register.dto';
import { LoginUseCase } from '../application/login.use-case';
import { LoginRequestDto } from '../application/dtos/login.dto';

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = RegisterRequestDto.fromRequest(req);
      const result = await this.registerUseCase.execute(dto);

      res.status(HTTP_STATUS.CREATED).json(
        new ApiResponse(HTTP_STATUS.CREATED, result, 'Registration successful'),
      );
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = LoginRequestDto.fromRequest(req);
      const result = await this.loginUseCase.execute(dto);

      res.status(HTTP_STATUS.OK).json(
        new ApiResponse(HTTP_STATUS.OK, result, 'Login successful'),
      );
    } catch (error) {
      next(error);
    }
  };
}
