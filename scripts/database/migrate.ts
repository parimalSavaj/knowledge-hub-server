import fs from "fs";
import path from "path";
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
// Step 3: Run migrations
// ─────────────────────────────────────────────
const MIGRATIONS_DIR = path.join(__dirname, "..", "..", "migrations");

async function runMigrations(): Promise<void> {
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

  // Step 3 — run migrations
  const client = await pool.connect();

  try {
    console.log("🚀 Running migrations...\n");

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    // Bootstrap: ensure migrations tracking table exists
    const bootstrapFile = files.find((f) => f.includes("create-migrations-table"));
    if (bootstrapFile) {
      const bootstrapSQL = fs.readFileSync(path.join(MIGRATIONS_DIR, bootstrapFile), "utf-8");
      await client.query(bootstrapSQL);
    }

    // Get already executed migrations
    const result = await client.query<{ name: string }>(
      "SELECT name FROM migrations ORDER BY id"
    );
    const executed = new Set(result.rows.map((row) => row.name));

    // Run pending migrations
    let migrated = 0;
    for (const file of files) {
      if (executed.has(file)) continue;

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`  ✅ ${file}`);
        migrated++;
      } catch (error) {
        await client.query("ROLLBACK");
        console.error(`  ❌ ${file} — FAILED`);
        throw error;
      }
    }

    if (migrated === 0) {
      console.log("  No pending migrations");
    } else {
      console.log(`\n✅ Applied ${migrated} migration(s)`);
    }
  } catch (error) {
    console.error("\n❌ Migration runner failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
