import { IDatabaseService } from '../../shared/services/database/database.service.interface';
import { ILoggerService } from '../../shared/services/logger/logger.service.interface';
import { IHashService } from '../../shared/services/hash/hash.service.interface';
import { IIdService } from '../../shared/services/id/id.service.interface';
import { UsersRepository } from '../../infrastructure/repositories/users/users.repository';
import { OrganizationsRepository } from '../../infrastructure/repositories/organizations/organizations.repository';
import { OrgMembersRepository } from '../../infrastructure/repositories/org-members/org-members.repository';
import { RegisterUseCase } from './application/register.use-case';
import { AuthController } from './presentation/auth.controller';

export class AuthFactory {
  static create(
    db: IDatabaseService,
    logger: ILoggerService,
    hashService: IHashService,
    idService: IIdService,
  ): AuthController {
    const usersRepo = new UsersRepository(db);
    const orgsRepo = new OrganizationsRepository(db);
    const orgMembersRepo = new OrgMembersRepository(db);

    const registerUseCase = new RegisterUseCase(
      usersRepo,
      orgsRepo,
      orgMembersRepo,
      db,
      hashService,
      idService,
      logger,
    );

    return new AuthController(registerUseCase);
  }
}
