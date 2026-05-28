import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "knowledge_hub",
});

async function runSeeds(): Promise<void> {
  // Guard: never run seeds in production
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Cannot run seeds in production!");
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    console.log("🌱 Running seeds...\n");

    await client.query("BEGIN");

    // ──────────────────────────────────────────────
    // Add your seed queries below
    // ──────────────────────────────────────────────

    // Example:
    // await client.query(`
    //   INSERT INTO users (name, email)
    //   VALUES ('Test User', 'test@example.com')
    //   ON CONFLICT (email) DO NOTHING;
    // `);

    await client.query("COMMIT");
    console.log("✅ Seeds applied successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeeds();
