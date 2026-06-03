-- Migration: create-users-table
-- Created at: 2026-06-03T10:21:38.000Z

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  password        VARCHAR(255) NULL,
  avatar_url      TEXT NULL,
  auth_provider   VARCHAR(50) NOT NULL DEFAULT 'local'
                    CONSTRAINT users_auth_provider_check
                    CHECK (auth_provider IN ('local', 'google')),
  provider_id     VARCHAR(255) NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ NULL
);

-- Partial unique index so deleted users don't block email reuse
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_active
  ON users (email)
  WHERE deleted_at IS NULL;

-- Unique index on provider + provider_id for OAuth lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider_active
  ON users (auth_provider, provider_id)
  WHERE deleted_at IS NULL AND provider_id IS NOT NULL;
