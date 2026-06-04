export type OrgMemberRow = {
  id: number;
  user_id: number;
  organization_id: number;
  role: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};
