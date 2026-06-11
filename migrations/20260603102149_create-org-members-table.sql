-- Migration: create-org-members-table
-- Created at: 2026-06-03T10:21:49.000Z

CREATE TABLE IF NOT EXISTS org_members (
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role            VARCHAR(50) NOT NULL DEFAULT 'member'
                    CONSTRAINT org_members_role_check
                    CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, organization_id)
);

-- FK indexes for join performance
CREATE INDEX IF NOT EXISTS idx_org_members_organization_id
  ON org_members (organization_id);
