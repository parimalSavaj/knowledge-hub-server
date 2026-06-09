export type UserRow = {
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
};
