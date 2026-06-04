import { IDatabaseService } from '../../../shared/services/interfaces/database.service.interface';
import { IUsersRepository } from './users.repository.interface';

export class UsersRepository implements IUsersRepository {
  private readonly TABLE = 'users';

  constructor(private readonly db: IDatabaseService) {}
}
