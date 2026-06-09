-- Migration: create-org-members-table
-- Created at: 2026-06-03T10:21:49.000Z

CREATE TABLE IF NOT EXISTS org_members (
  id              UUID PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role            VARCHAR(50) NOT NULL DEFAULT 'member'
                    CONSTRAINT org_members_role_check
                    CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ NULL
);

-- A user can only be an active member of an org once
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_members_user_org_active
  ON org_members (user_id, organization_id)
  WHERE deleted_at IS NULL;

-- FK indexes for join performance
CREATE INDEX IF NOT EXISTS idx_org_members_user_id
  ON org_members (user_id);

CREATE INDEX IF NOT EXISTS idx_org_members_organization_id
  ON org_members (organization_id);
