-- Migration: create-refresh-tokens-table
-- Created at: 2026-06-03T10:21:56.000Z

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK index
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id
  ON refresh_tokens (user_id);

-- Partial index for active (non-revoked) tokens lookup
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active
  ON refresh_tokens (expires_at)
  WHERE NOT revoked;
