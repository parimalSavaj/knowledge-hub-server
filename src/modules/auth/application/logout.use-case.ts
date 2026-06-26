import { IRefreshTokensRepository } from "../../../infrastructure/repositories/refresh-tokens/refresh-tokens.repository.interface";
import { IJwtService } from "../../../shared/services/jwt/jwt.service.interface";
import { ILoggerService } from "../../../shared/services/logger/logger.service.interface";
import { RefreshTokenPayload } from "../../../shared/services/jwt/jwt.types";
import { UnauthorizedError } from "../../../shared/core/api-error";
import { LogoutRequestDto } from "./dtos/logout.dto";

export class LogoutUseCase {
  constructor(
    private readonly refreshTokensRepo: IRefreshTokensRepository,
    private readonly jwtService: IJwtService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(dto: LogoutRequestDto): Promise<void> {
    this.logger.info("Logout attempt");

    // 1. Verify the refresh token JWT signature
    const payload = this.jwtService.verifyRefreshToken<RefreshTokenPayload>(dto.refreshToken);

    // 2. Find the token in DB
    const storedToken = await this.refreshTokensRepo.findByToken(dto.refreshToken);
    if (!storedToken) {
      this.logger.warn("Logout failed - token not found in DB", { userId: payload.userId });
      throw new UnauthorizedError("Invalid refresh token");
    }

    // 3. Revoke the token
    if (!storedToken.revoked) {
      await this.refreshTokensRepo.revoke(storedToken.id);
      this.logger.info("Token revoked successfully on logout", {
        userId: payload.userId,
        tokenId: storedToken.id,
      });
    } else {
      this.logger.info("Token was already revoked", {
        userId: payload.userId,
        tokenId: storedToken.id,
      });
    }
  }
}
