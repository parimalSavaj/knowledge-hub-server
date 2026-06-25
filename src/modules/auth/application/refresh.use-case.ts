import { IRefreshTokensRepository } from "../../../infrastructure/repositories/refresh-tokens/refresh-tokens.repository.interface";
import { IOrgMembersRepository } from "../../../infrastructure/repositories/org-members/org-members.repository.interface";
import { IUsersRepository } from "../../../infrastructure/repositories/users/users.repository.interface";
import { IDatabaseService } from "../../../shared/services/database/database.service.interface";
import { IJwtService } from "../../../shared/services/jwt/jwt.service.interface";
import { IIdService } from "../../../shared/services/id/id.service.interface";
import { ILoggerService } from "../../../shared/services/logger/logger.service.interface";
import { RefreshTokenPayload } from "../../../shared/services/jwt/jwt.types";
import { OrgRole } from "../../../domain/enums/org-role.enum";
import { UnauthorizedError, InternalError } from "../../../shared/core/api-error";
import { RefreshRequestDto, RefreshResponseDto } from "./dtos/refresh.dto";
import { config } from "../../../shared/config";

export class RefreshUseCase {
  constructor(
    private readonly refreshTokensRepo: IRefreshTokensRepository,
    private readonly orgMembersRepo: IOrgMembersRepository,
    private readonly usersRepo: IUsersRepository,
    private readonly db: IDatabaseService,
    private readonly jwtService: IJwtService,
    private readonly idService: IIdService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(dto: RefreshRequestDto): Promise<RefreshResponseDto> {
    this.logger.info("Token refresh attempt");

    if (!dto.refreshToken) {
      throw new UnauthorizedError("Refresh token is required");
    }

    // 1. Verify the refresh token JWT signature
    const payload = this.jwtService.verifyRefreshToken<RefreshTokenPayload>(dto.refreshToken);

    // 2. Find the token in DB
    const storedToken = await this.refreshTokensRepo.findByToken(dto.refreshToken);
    if (!storedToken) {
      this.logger.warn("Refresh failed - token not found in DB", { userId: payload.userId });
      throw new UnauthorizedError("Invalid refresh token");
    }

    // 3. Check if revoked
    if (storedToken.revoked) {
      this.logger.warn("Refresh failed - token already revoked (possible reuse attack)", {
        userId: payload.userId,
        tokenId: storedToken.id,
      });
      throw new UnauthorizedError("Invalid refresh token");
    }

    // 4. Check if expired in DB
    if (new Date() > new Date(storedToken.expires_at)) {
      this.logger.warn("Refresh failed - token expired", {
        userId: payload.userId,
        tokenId: storedToken.id,
      });
      throw new UnauthorizedError("Refresh token expired");
    }

    // 5. Fetch user (for email in access token payload)
    const user = await this.usersRepo.findById(payload.userId);
    if (!user) {
      this.logger.warn("Refresh failed - user not found", { userId: payload.userId });
      throw new UnauthorizedError("Invalid refresh token");
    }

    // 6. Fetch user's org membership for new access token
    const membership = await this.orgMembersRepo.findByUserAndOrgId(payload.userId, payload.orgId);
    if (!membership) {
      this.logger.error("Refresh failed - user has no membership in the token organization", null, {
        userId: payload.userId,
        orgId: payload.orgId,
      });
      throw new UnauthorizedError("Invalid refresh token");
    }

    // 7. Sign new tokens
    const newAccessToken = this.jwtService.signAccessToken({
      userId: payload.userId,
      email: user.email,
      orgId: membership.organization_id,
      orgRole: membership.role as OrgRole,
    });

    const newRefreshToken = this.jwtService.signRefreshToken({
      userId: payload.userId,
      orgId: payload.orgId,
    });

    // 8. Transaction: revoke old token + store new token atomically
    const newTokenId = this.idService.generate();
    const expiresAt = new Date(Date.now() + config.jwt.refreshExpiresInMs);

    const client = await this.db.getClient();
    try {
      await client.query("BEGIN");

      await this.refreshTokensRepo.revoke(storedToken.id, client);
      await this.refreshTokensRepo.create(
        {
          id: newTokenId,
          userId: payload.userId,
          token: newRefreshToken,
          expiresAt,
        },
        client,
      );

      await this.orgMembersRepo.updateLastActiveAt(payload.userId, payload.orgId, client);

      await client.query("COMMIT");
      this.logger.info("Token refresh successful", { userId: payload.userId });
    } catch (error) {
      await client.query("ROLLBACK");
      this.logger.error("Token refresh transaction failed", error, { userId: payload.userId });
      throw new InternalError("Token refresh failed - please try again");
    } finally {
      client.release();
    }

    // 9. Return new tokens
    return RefreshResponseDto.toResponse({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  }
}
