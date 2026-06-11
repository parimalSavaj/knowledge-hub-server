import { AuthProvider } from '../enums/auth-provider.enum';
import { OrgMembership } from '../value-objects/org-membership.value-object';
import { OrgRole } from '../enums/org-role.enum';
import { DomainValidationError } from '../errors/domain-validation.error';

export class UserEntity {
  /**
   * The membership this user holds in an organization.
   * Populated by calling joinOrganization() — never set externally.
   */
  private _membership: OrgMembership | null = null;

  private constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _email: string,
    private readonly _password: string | null,
    private readonly _avatarUrl: string | null,
    private readonly _authProvider: AuthProvider,
    private readonly _providerId: string | null,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
    private readonly _deletedAt: Date | null,
  ) {
    this.validate();
  }

  // --- Invariant Validation ---
  private validate(): void {
    if (this._authProvider === AuthProvider.LOCAL && !this._password) {
      throw new DomainValidationError('Local auth user must have a password');
    }

    if (this._authProvider === AuthProvider.GOOGLE && !this._providerId) {
      throw new DomainValidationError('Google auth user must have a provider ID');
    }

    if (!this._password && !this._providerId) {
      throw new DomainValidationError('User must have either a password or a provider ID');
    }
  }

  // --- Factory: create new entity (use case calls this) ---
  static create(props: {
    id: string;
    name: string;
    email: string;
    password?: string | null;
    avatarUrl?: string | null;
    authProvider: AuthProvider;
    providerId?: string | null;
  }): UserEntity {
    const now = new Date();
    return new UserEntity(
      props.id,
      props.name,
      props.email,
      props.password ?? null,
      props.avatarUrl ?? null,
      props.authProvider,
      props.providerId ?? null,
      now,
      now,
      null,
    );
  }

  // --- Factory: reconstruct from DB row (repository calls this) ---
  static fromRecord(row: {
    id: string;
    name: string;
    email: string;
    password: string | null;
    avatar_url: string | null;
    auth_provider: string;
    provider_id: string | null;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
  }): UserEntity {
    return new UserEntity(
      row.id,
      row.name,
      row.email,
      row.password,
      row.avatar_url,
      row.auth_provider as AuthProvider,
      row.provider_id,
      row.created_at,
      row.updated_at,
      row.deleted_at,
    );
  }

  // --- Getters ---
  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email;
  }

  get password(): string | null {
    return this._password;
  }

  get authProvider(): AuthProvider {
    return this._authProvider;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get membership(): OrgMembership {
    if (this._membership === null) {
      throw new Error('No membership assigned — call joinOrganization() first');
    }
    return this._membership;
  }

  // --- Business Methods ---

  /**
   * Assigns this user to an organization with a given role.
   * Directly instantiates OrgMembership — no intermediate factory call.
   */
  joinOrganization(props: { organizationId: string; role: OrgRole }): void {
    this._membership = OrgMembership.create({
      userId: this._id,
      organizationId: props.organizationId,
      role: props.role,
    });
  }
}
