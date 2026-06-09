import { PoolClient } from 'pg';
import { OrgMembership } from '../../../domain/value-objects/org-membership.value-object';

export interface IOrgMembersRepository {
  create(membership: OrgMembership, client?: PoolClient): Promise<void>;
}
