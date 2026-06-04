import { OrgRole } from '../enums/org-role.enum';

export class UserMembership {
  private constructor(
    private readonly _orgId: number,
    private readonly _orgName: string,
    private readonly _orgSlug: string,
    private readonly _role: OrgRole,
  ) {}

  static create(orgId: number, orgName: string, orgSlug: string, role: OrgRole): UserMembership {
    return new UserMembership(orgId, orgName, orgSlug, role);
  }

  get orgId(): number {
    return this._orgId;
  }

  get orgName(): string {
    return this._orgName;
  }

  get orgSlug(): string {
    return this._orgSlug;
  }

  get role(): OrgRole {
    return this._role;
  }

  equals(other: UserMembership): boolean {
    return this._orgId === other._orgId && this._role === other._role;
  }
}
