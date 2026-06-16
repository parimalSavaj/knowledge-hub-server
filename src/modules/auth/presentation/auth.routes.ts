import { Router } from 'express';
import { IDatabaseService } from '../../../shared/services/database/database.service.interface';
import { ILoggerService } from '../../../shared/services/logger/logger.service.interface';
import { IHashService } from '../../../shared/services/hash/hash.service.interface';
import { IIdService } from '../../../shared/services/id/id.service.interface';
import { IJwtService } from '../../../shared/services/jwt/jwt.service.interface';
import { ValidationMiddleware } from '../../../shared/middlewares/validate.middleware';
import { AuthFactory } from '../auth.factory';
import { registerBodySchema, loginBodySchema } from './auth.validation';
import { ROUTES } from '../../../shared/constants/route.constants';

export class AuthRoutes {
  private readonly router: Router;
  private readonly controller;

  constructor(
    db: IDatabaseService,
    logger: ILoggerService,
    hashService: IHashService,
    idService: IIdService,
    jwtService: IJwtService,
  ) {
    this.router = Router();
    this.controller = AuthFactory.create(db, logger, hashService, idService, jwtService);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.post(ROUTES.AUTH.REGISTER, ValidationMiddleware.validateBody(registerBodySchema), this.controller.register);
    this.router.post(ROUTES.AUTH.LOGIN, ValidationMiddleware.validateBody(loginBodySchema), this.controller.login);
  }

  getRouter(): Router {
    return this.router;
  }
}
