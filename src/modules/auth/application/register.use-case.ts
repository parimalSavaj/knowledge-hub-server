import { IUsersRepository } from '../../../infrastructure/repositories/users/users.repository.interface';
import { IOrganizationsRepository } from '../../../infrastructure/repositories/organizations/organizations.repository.interface';
import { IOrgMembersRepository } from '../../../infrastructure/repositories/org-members/org-members.repository.interface';
import { IDatabaseService } from '../../../shared/services/database/database.service.interface';
import { IHashService } from '../../../shared/services/hash/hash.service.interface';
import { IIdService } from '../../../shared/services/id/id.service.interface';
import { ILoggerService } from '../../../shared/services/logger/logger.service.interface';
import { ConflictError, InternalError } from '../../../shared/core/api-error';
import { OrgRole } from '../../../domain/enums/org-role.enum';
import { AuthProvider } from '../../../domain/enums/auth-provider.enum';
import { UserEntity } from '../../../domain/entities/user.entity';
import { OrganizationEntity } from '../../../domain/entities/organization.entity';
import { RegisterRequestDto, RegisterResponseDto } from './dtos/register.dto';

export class RegisterUseCase {
  constructor(
    private readonly usersRepo: IUsersRepository,
    private readonly orgsRepo: IOrganizationsRepository,
    private readonly orgMembersRepo: IOrgMembersRepository,
    private readonly db: IDatabaseService,
    private readonly hashService: IHashService,
    private readonly idService: IIdService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(dto: RegisterRequestDto): Promise<RegisterResponseDto> {
    this.logger.info('Register attempt', { email: dto.email });

    const existingUser = await this.usersRepo.findByEmail(dto.email);
    if (existingUser) {
      this.logger.warn('Registration failed — email already exists', { email: dto.email });
      throw new ConflictError('Email already registered');
    }

    const hashedPassword = await this.hashService.hash(dto.password);

    // Build domain objects — naming and slug rules live on the entities
    const userEntity = UserEntity.create({
      id: this.idService.generate(),
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      authProvider: AuthProvider.LOCAL,
    });

    const orgEntity = OrganizationEntity.createPersonalWorkspace({
      id: this.idService.generate(),
      ownerName: dto.name,
    });

    // Membership VO is created inside the entity — use case never touches OrgMembership directly
    userEntity.joinOrganization({
      id: this.idService.generate(),
      organizationId: orgEntity.id,
      role: OrgRole.OWNER,
    });

    // Transaction: create user + organization + org_member atomically
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      await this.usersRepo.create(userEntity, client);
      await this.orgsRepo.create(orgEntity, client);
      await this.orgMembersRepo.create(userEntity.membership, client);

      await client.query('COMMIT');
      this.logger.info('User registered successfully', {
        userId: userEntity.id,
        orgId: orgEntity.id,
        email: dto.email,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Registration transaction failed', error, { email: dto.email });
      throw new InternalError('Registration failed — please try again');
    } finally {
      client.release();
    }

    // Response is built from the already-in-memory entities — no extra DB call needed
    return RegisterResponseDto.fromEntities(userEntity);
  }
}
