export type OrganizationRow = {
  id: number;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};
