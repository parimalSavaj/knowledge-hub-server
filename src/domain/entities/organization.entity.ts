export class OrganizationEntity {
  private constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _slug: string,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
    private readonly _deletedAt: Date | null,
  ) {
    this.validate();
  }

  // --- Invariant Validation ---
  private validate(): void {
    // No cross-field invariants yet - add domain rules here when needed
  }

  // --- Slug Generation ---
  /**
   * Generates a URL-safe slug from a base name with a random suffix to avoid collisions.
   * Lives here because slug format is a domain rule for organizations.
   */
  static generateSlug(baseName: string): string {
    const base = baseName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const suffix = Math.random().toString(36).substring(2, 8);
    return `${base}-${suffix}`;
  }

  // --- Factory: create a personal workspace for a newly registered user ---
  /**
   * Encapsulates the naming convention for personal workspaces.
   * Change the name rule here and it propagates to every use case automatically.
   */
  static createPersonalWorkspace(props: { id: string; ownerName: string }): OrganizationEntity {
    const now = new Date();
    return new OrganizationEntity(
      props.id,
      `${props.ownerName}'s Workspace`,
      OrganizationEntity.generateSlug(props.ownerName),
      now,
      now,
      null,
    );
  }

  // --- Getters ---
  get id(): string {
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
}
