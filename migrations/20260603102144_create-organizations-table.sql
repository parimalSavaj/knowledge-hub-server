-- Migration: create-organizations-table
-- Created at: 2026-06-03T10:21:44.000Z

CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ NULL
);

-- Partial unique index so deleted orgs don't block slug reuse
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug_active
  ON organizations (slug)
  WHERE deleted_at IS NULL;
