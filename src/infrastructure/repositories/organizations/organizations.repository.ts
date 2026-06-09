import { PoolClient } from 'pg';
import { IDatabaseService } from '../../../shared/services/database/database.service.interface';
import { OrganizationEntity } from '../../../domain/entities/organization.entity';
import { IOrganizationsRepository } from './organizations.repository.interface';

export class OrganizationsRepository implements IOrganizationsRepository {
  private readonly TABLE = 'organizations';

  constructor(private readonly db: IDatabaseService) {}

  async create(entity: OrganizationEntity, client?: PoolClient): Promise<void> {
    const sql = `
      INSERT INTO ${this.TABLE} (id, name, slug, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
    `;
    const params = [entity.id, entity.name, entity.slug, entity.createdAt, entity.updatedAt];

    if (client) {
      await client.query(sql, params);
    } else {
      await this.db.insert(sql, params);
    }
  }
}
