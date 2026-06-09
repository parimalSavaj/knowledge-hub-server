import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../../../shared/constants/status-code.constants';
import { ApiResponse } from '../../../shared/core/api-response';
import { RegisterUseCase } from '../application/register.use-case';
import { RegisterRequestDto } from '../application/dtos/register.dto';

export class AuthController {
  constructor(private readonly registerUseCase: RegisterUseCase) {}

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
}
