import { PoolClient } from 'pg';
import { UserEntity } from '../../../domain/entities/user.entity';

export interface IUsersRepository {
  findByEmail(email: string, client?: PoolClient): Promise<UserEntity | null>;
  findById(id: string, client?: PoolClient): Promise<UserEntity | null>;
  create(entity: UserEntity, client?: PoolClient): Promise<void>;
}
