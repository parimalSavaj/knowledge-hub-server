import fs from "fs";
import path from "path";
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

const MIGRATIONS_DIR = path.join(__dirname, "..", "..", "migrations");

async function runMigrations(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log("🚀 Running migrations...\n");

    // Ensure migrations table exists (bootstrap)
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const bootstrapFile = files.find((f) =>
      f.includes("create-migrations-table")
    );
    if (bootstrapFile) {
      const bootstrapSQL = fs.readFileSync(
        path.join(MIGRATIONS_DIR, bootstrapFile),
        "utf-8"
      );
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
      if (executed.has(file)) {
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, "utf-8");

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
