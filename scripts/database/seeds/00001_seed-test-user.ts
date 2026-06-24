import { PoolClient } from "pg";
import bcrypt from "bcrypt";
import crypto from "crypto";

export async function seedTestUser(client: PoolClient): Promise<void> {
  const rawPassword = process.env.SEED_PASSWORD || "Password123!";
  const passwordHash = await bcrypt.hash(rawPassword, 12);
  
  // Seed Organization
  const orgName = "Default Organization";
  const orgSlug = "default-organization";
  
  const orgRes = await client.query("SELECT id FROM organizations WHERE slug = $1 AND deleted_at IS NULL", [orgSlug]);
  let orgId: string;
  if (orgRes.rows.length === 0) {
    orgId = crypto.randomUUID();
    await client.query("INSERT INTO organizations (id, name, slug) VALUES ($1, $2, $3)", [orgId, orgName, orgSlug]);
  } else {
    orgId = orgRes.rows[0].id;
  }

  // Seed User
  const userName = "Test User";
  const userEmail = "test@example.com";
  
  const userRes = await client.query("SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL", [userEmail]);
  let userId: string;
  if (userRes.rows.length === 0) {
    userId = crypto.randomUUID();
    await client.query(
      "INSERT INTO users (id, name, email, password, auth_provider) VALUES ($1, $2, $3, $4, $5)",
      [userId, userName, userEmail, passwordHash, "local"]
    );
  } else {
    userId = userRes.rows[0].id;
  }

  // Seed Org Membership
  const memberRes = await client.query("SELECT 1 FROM org_members WHERE user_id = $1 AND organization_id = $2", [userId, orgId]);
  if (memberRes.rows.length === 0) {
    await client.query("INSERT INTO org_members (user_id, organization_id, role) VALUES ($1, $2, $3)", [userId, orgId, "owner"]);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚀 DEV ENVIRONMENT SEEDED CREDENTIALS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Email:    test@example.com`);
  console.log(`Password: ${rawPassword}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}
