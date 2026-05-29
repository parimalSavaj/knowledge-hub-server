import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// ─────────────────────────────────────────────
// Step 1: Validate required env variables
// ─────────────────────────────────────────────
const REQUIRED_ENV_VARS = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"];

function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error("\nCreate a .env file from .env.example and fill in all database values.");
    process.exit(1);
  }
}

// ─────────────────────────────────────────────
// Step 2: Verify database connection
// ─────────────────────────────────────────────
async function verifyConnection(pool: Pool): Promise<void> {
  let client;
  try {
    client = await pool.connect();
    await client.query("SELECT 1");
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { code?: string };

    if (err.code === "ECONNREFUSED") {
      console.error(`❌ Could not connect to PostgreSQL at ${process.env.DB_HOST}:${process.env.DB_PORT}`);
      console.error("   Make sure PostgreSQL is running and the host/port are correct.");
    } else if (err.code === "3D000") {
      console.error(`❌ Database '${process.env.DB_NAME}' does not exist.`);
      console.error(`   Create it first: CREATE DATABASE "${process.env.DB_NAME}";`);
    } else if (err.code === "28P01") {
      console.error(`❌ Authentication failed for user '${process.env.DB_USER}'.`);
      console.error("   Check DB_USER and DB_PASSWORD in your .env file.");
    } else {
      console.error("❌ Database connection failed:", err.message);
    }

    process.exit(1);
  } finally {
    client?.release();
  }
}

// ─────────────────────────────────────────────
// Step 3: Run seeds
// ─────────────────────────────────────────────
async function runSeeds(): Promise<void> {
  // Guard: never run seeds in production
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Cannot run seeds in production!");
    process.exit(1);
  }

  // Step 1 — env check
  validateEnv();

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT!, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // Step 2 — connection check
  console.log(`\n🔌 Connecting to database '${process.env.DB_NAME}'...`);
  await verifyConnection(pool);
  console.log("✅ Connected\n");

  // Step 3 — run seeds
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
