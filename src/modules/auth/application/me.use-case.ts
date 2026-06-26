import { IUsersRepository } from "../../../infrastructure/repositories/users/users.repository.interface";
import { IOrgMembersRepository } from "../../../infrastructure/repositories/org-members/org-members.repository.interface";
import { IRefreshTokensRepository } from "../../../infrastructure/repositories/refresh-tokens/refresh-tokens.repository.interface";
import { ILoggerService } from "../../../shared/services/logger/logger.service.interface";
import { UnauthorizedError } from "../../../shared/core/api-error";
import { MeRequestDto, MeResponseDto } from "./dtos/me.dto";

export class MeUseCase {
  constructor(
    private readonly usersRepo: IUsersRepository,
    private readonly orgMembersRepo: IOrgMembersRepository,
    private readonly refreshTokensRepo: IRefreshTokensRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(dto: MeRequestDto): Promise<MeResponseDto> {
    this.logger.info("Auth verification check (me)", { userId: dto.userId });

    // 1. Verify user exists and is active
    const user = await this.usersRepo.findById(dto.userId);
    if (!user) {
      this.logger.warn("Auth check failed - user not found in database", {
        userId: dto.userId,
      });
      throw new UnauthorizedError("User account not found or inactive");
    }

    // 2. Verify organization membership and role match
    const membership = await this.orgMembersRepo.findByUserAndOrgId(
      dto.userId,
      dto.orgId,
    );
    if (!membership) {
      this.logger.warn("Auth check failed - user is not a member of the active organization", {
        userId: dto.userId,
        orgId: dto.orgId,
      });
      throw new UnauthorizedError("User is no longer a member of the active organization");
    }

    if (membership.role !== dto.orgRole) {
      this.logger.warn("Auth check failed - active organization role mismatch", {
        userId: dto.userId,
        orgId: dto.orgId,
        tokenRole: dto.orgRole,
        dbRole: membership.role,
      });
      throw new UnauthorizedError("Organization role has changed. Please re-authenticate.");
    }

    // 3. Verify session is not revoked (has at least one active refresh token)
    const hasActiveSession = await this.refreshTokensRepo.hasActiveSession(dto.userId);
    if (!hasActiveSession) {
      this.logger.warn("Auth check failed - user has no active session", {
        userId: dto.userId,
      });
      throw new UnauthorizedError("Session has been revoked or expired");
    }

    return MeResponseDto.toResponse(dto.userId);
  }
}
