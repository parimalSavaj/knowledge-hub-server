import { IUsersRepository } from "../../../infrastructure/repositories/users/users.repository.interface";
import { IOrgMembersRepository } from "../../../infrastructure/repositories/org-members/org-members.repository.interface";
import { IRefreshTokensRepository } from "../../../infrastructure/repositories/refresh-tokens/refresh-tokens.repository.interface";
import { IHashService } from "../../../shared/services/hash/hash.service.interface";
import { IJwtService } from "../../../shared/services/jwt/jwt.service.interface";
import { IIdService } from "../../../shared/services/id/id.service.interface";
import { ILoggerService } from "../../../shared/services/logger/logger.service.interface";
import { OrgRole } from "../../../domain/enums/org-role.enum";
import { UnauthorizedError, InternalError } from "../../../shared/core/api-error";
import { LoginRequestDto, LoginResponseDto } from "./dtos/login.dto";

export class LoginUseCase {
  constructor(
    private readonly usersRepo: IUsersRepository,
    private readonly orgMembersRepo: IOrgMembersRepository,
    private readonly refreshTokensRepo: IRefreshTokensRepository,
    private readonly hashService: IHashService,
    private readonly jwtService: IJwtService,
    private readonly idService: IIdService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(dto: LoginRequestDto): Promise<LoginResponseDto> {
    this.logger.info("Login attempt", { email: dto.email });

    // 1. Find user by email
    const user = await this.usersRepo.findByEmail(dto.email);
    if (!user) {
      this.logger.warn("Login failed - user not found", { email: dto.email });
      throw new UnauthorizedError("Invalid email or password");
    }

    // 2. Verify password
    if (!user.password) {
      this.logger.warn("Login failed - user has no password (OAuth account)", { email: dto.email });
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordValid = await this.hashService.compare(dto.password, user.password);
    if (!isPasswordValid) {
      this.logger.warn("Login failed - invalid password", { email: dto.email });
      throw new UnauthorizedError("Invalid email or password");
    }

    // 3. Fetch user's org membership for access token payload
    const membership = await this.orgMembersRepo.findByUserId(user.id);
    if (!membership) {
      this.logger.error("Login failed - user has no organization membership", null, {
        userId: user.id,
      });
      throw new InternalError("Account configuration error - please contact support");
    }

    // Update last active organization timestamp
    try {
      await this.orgMembersRepo.updateLastActiveAt(user.id, membership.organization_id);
    } catch (error) {
      this.logger.error('Failed to update last active organization timestamp', error, { userId: user.id, orgId: membership.organization_id });
    }

    // 4. Sign tokens
    const accessToken = this.jwtService.signAccessToken({
      userId: user.id,
      email: user.email,
      orgId: membership.organization_id,
      orgRole: membership.role as OrgRole,
    });

    const refreshToken = this.jwtService.signRefreshToken({
      userId: user.id,
      orgId: membership.organization_id,
    });

    // 5. Store refresh token in DB
    const refreshTokenId = this.idService.generate();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    try {
      await this.refreshTokensRepo.create({
        id: refreshTokenId,
        userId: user.id,
        token: refreshToken,
        expiresAt,
      });
    } catch (error) {
      this.logger.error("Failed to store refresh token", error, { userId: user.id });
      throw new InternalError("Login failed - please try again");
    }

    this.logger.info("Login successful", { userId: user.id, email: user.email });

    // 6. Return response
    return LoginResponseDto.fromEntities({
      accessToken,
      refreshToken,
      user,
    });
  }
}
