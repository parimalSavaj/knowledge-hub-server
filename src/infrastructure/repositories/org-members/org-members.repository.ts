import { PoolClient } from 'pg';
import { IDatabaseService } from '../../../shared/services/database/database.service.interface';
import { OrgMembership } from '../../../domain/value-objects/org-membership.value-object';
import { IOrgMembersRepository } from './org-members.repository.interface';
import { OrgMemberRow } from './org-members.types';

export class OrgMembersRepository implements IOrgMembersRepository {
  private readonly TABLE = 'org_members';

  constructor(private readonly db: IDatabaseService) {}

  async findByUserId(userId: string, client?: PoolClient): Promise<OrgMemberRow | null> {
    const sql = `SELECT * FROM ${this.TABLE} WHERE user_id = $1 LIMIT 1`;
    const params = [userId];

    const row = client
      ? (await client.query<OrgMemberRow>(sql, params)).rows[0] ?? null
      : await this.db.selectOne<OrgMemberRow>(sql, params);

    return row;
  }

  async create(membership: OrgMembership, client?: PoolClient): Promise<void> {
    const sql = `
      INSERT INTO ${this.TABLE} (user_id, organization_id, role, joined_at)
      VALUES ($1, $2, $3, $4)
    `;
    const params = [
      membership.userId,
      membership.organizationId,
      membership.role,
      membership.joinedAt,
    ];

    if (client) {
      await client.query(sql, params);
    } else {
      await this.db.insert(sql, params);
    }
  }
}
