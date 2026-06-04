export type RefreshTokenRow = {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  revoked: boolean;
  created_at: Date;
};
