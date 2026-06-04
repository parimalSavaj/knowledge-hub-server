import { UserRow } from '../../infrastructure/repositories/users/users.types';
import { AuthProvider } from '../enums/auth-provider.enum';
import { UserMembership } from '../value-objects/user-membership.value-object';

export class UserEntity {
  private _memberships: UserMembership[] | null = null;

  private constructor(
    private readonly _id: number,
    private readonly _name: string,
    private readonly _email: string,
    private readonly _password: string | null,
    private readonly _avatarUrl: string | null,
    private readonly _authProvider: AuthProvider,
    private readonly _providerId: string | null,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
    private readonly _deletedAt: Date | null,
  ) {}

  // --- Factory ---
  static fromRecord(row: UserRow): UserEntity {
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
  get id(): number {
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

  get avatarUrl(): string | null {
    return this._avatarUrl;
  }

  get authProvider(): AuthProvider {
    return this._authProvider;
  }

  get providerId(): string | null {
    return this._providerId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  get memberships(): UserMembership[] {
    if (this._memberships === null) {
      throw new Error('Memberships not loaded — use a repository method that loads them');
    }
    return this._memberships;
  }

  // --- Business Methods ---
  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  get isOAuthUser(): boolean {
    return this._authProvider !== AuthProvider.LOCAL;
  }

  get hasMembershipsLoaded(): boolean {
    return this._memberships !== null;
  }

  setMemberships(memberships: UserMembership[]): void {
    this._memberships = memberships;
  }
}
