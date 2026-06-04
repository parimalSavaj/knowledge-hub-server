import { IDatabaseService } from '../../../shared/services/interfaces/database.service.interface';
import { IRefreshTokensRepository } from './refresh-tokens.repository.interface';

export class RefreshTokensRepository implements IRefreshTokensRepository {
  private readonly TABLE = 'refresh_tokens';

  constructor(private readonly db: IDatabaseService) {}
}
