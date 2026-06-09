import { OrgRole } from '../enums/org-role.enum';

/**
 * Represents the membership of a user in an organization — their role within it.
 * Private constructor — only UserEntity.joinOrganization() is authorised to create this.
 * Calling new OrgMembership() anywhere else is a compile error.
 */
export class OrgMembership {
  private constructor(
    readonly id: string,
    readonly userId: string,
    readonly organizationId: string,
    readonly role: OrgRole,
    readonly createdAt: Date,
    readonly updatedAt: Date,
    private readonly _deletedAt: Date | null,
  ) {
    this.validate();
  }

  // --- Invariant Validation ---
  private validate(): void {
    // No cross-field invariants yet — add domain rules here when needed
  }

  static create(props: {
    id: string;
    userId: string;
    organizationId: string;
    role: OrgRole;
  }): OrgMembership {
    const now = new Date();
    return new OrgMembership(
      props.id,
      props.userId,
      props.organizationId,
      props.role,
      now,
      now,
      null,
    );
  }
}
