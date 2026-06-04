import { OrgRole } from '../enums/org-role.enum';

export class OrgMember {
  private constructor(
    private readonly _userId: number,
    private readonly _userName: string,
    private readonly _userEmail: string,
    private readonly _role: OrgRole,
  ) {}

  static create(userId: number, userName: string, userEmail: string, role: OrgRole): OrgMember {
    return new OrgMember(userId, userName, userEmail, role);
  }

  get userId(): number {
    return this._userId;
  }

  get userName(): string {
    return this._userName;
  }

  get userEmail(): string {
    return this._userEmail;
  }

  get role(): OrgRole {
    return this._role;
  }

  equals(other: OrgMember): boolean {
    return this._userId === other._userId && this._role === other._role;
  }
}
