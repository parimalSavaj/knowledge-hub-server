import { OrganizationRow } from '../../infrastructure/repositories/organizations/organizations.types';
import { OrgMember } from '../value-objects/org-member.value-object';

export class OrganizationEntity {
  private _members: OrgMember[] | null = null;

  private constructor(
    private readonly _id: number,
    private readonly _name: string,
    private readonly _slug: string,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
    private readonly _deletedAt: Date | null,
  ) {}

  // --- Factory ---
  static fromRecord(row: OrganizationRow): OrganizationEntity {
    return new OrganizationEntity(
      row.id,
      row.name,
      row.slug,
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

  get slug(): string {
    return this._slug;
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

  get members(): OrgMember[] {
    if (this._members === null) {
      throw new Error('Members not loaded — use a repository method that loads them');
    }
    return this._members;
  }

  // --- Business Methods ---
  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  get hasMembersLoaded(): boolean {
    return this._members !== null;
  }

  setMembers(members: OrgMember[]): void {
    this._members = members;
  }
}
