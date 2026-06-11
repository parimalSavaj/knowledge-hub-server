import { OrgRole } from '../enums/org-role.enum';

/**
 * Represents the membership of a user in an organization — their role within it.
 * Value object: no ID, immutable, defined by userId + organizationId + role.
 * Private constructor — only UserEntity.joinOrganization() is authorised to create this.
 */
export class OrgMembership {
  private constructor(
    private readonly _userId: string,
    private readonly _organizationId: string,
    private readonly _role: OrgRole,
    private readonly _joinedAt: Date,
  ) {
    this.validate();
  }

  // --- Invariant Validation ---
  private validate(): void {
    // No cross-field invariants yet — add domain rules here when needed
  }

  static create(props: {
    userId: string;
    organizationId: string;
    role: OrgRole;
  }): OrgMembership {
    return new OrgMembership(
      props.userId,
      props.organizationId,
      props.role,
      new Date(),
    );
  }

  // --- Getters ---
  get userId(): string {
    return this._userId;
  }

  get organizationId(): string {
    return this._organizationId;
  }

  get role(): OrgRole {
    return this._role;
  }

  get joinedAt(): Date {
    return this._joinedAt;
  }

  // --- Equality: same user in same org = same membership ---
  equals(other: OrgMembership): boolean {
    return this._userId === other._userId && this._organizationId === other._organizationId;
  }
}
