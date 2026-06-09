import { PoolClient } from 'pg';
import { IDatabaseService } from '../../../shared/services/database/database.service.interface';
import { OrgMembership } from '../../../domain/value-objects/org-membership.value-object';
import { IOrgMembersRepository } from './org-members.repository.interface';

export class OrgMembersRepository implements IOrgMembersRepository {
  private readonly TABLE = 'org_members';

  constructor(private readonly db: IDatabaseService) {}

  async create(membership: OrgMembership, client?: PoolClient): Promise<void> {
    const sql = `
      INSERT INTO ${this.TABLE} (id, user_id, organization_id, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const params = [
      membership.id,
      membership.userId,
      membership.organizationId,
      membership.role,
      membership.createdAt,
      membership.updatedAt,
    ];

    if (client) {
      await client.query(sql, params);
    } else {
      await this.db.insert(sql, params);
    }
  }
}
