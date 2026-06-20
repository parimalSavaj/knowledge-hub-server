export type OrgMemberRow = {
  user_id: string;
  organization_id: string;
  role: string;
  joined_at: Date;
  last_active_at: Date | null;
};
