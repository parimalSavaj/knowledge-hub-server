import { PoolClient } from 'pg';
import { OrgMembership } from '../../../domain/value-objects/org-membership.value-object';
import { OrgMemberRow } from './org-members.types';

export interface IOrgMembersRepository {
  findByUserId(userId: string, client?: PoolClient): Promise<OrgMemberRow | null>;
  create(membership: OrgMembership, client?: PoolClient): Promise<void>;
}
