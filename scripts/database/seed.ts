import { Pool } from "pg";
import dotenv from "dotenv";
import { seedTestUser } from "./seeds/00001_seed-test-user";

dotenv.config();

async function runSeeds(): Promise<void> {
  // Guard: never run seeds in production
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Cannot run seeds in production!");
    process.exit(1);
  }

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT!, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const client = await pool.connect();

  try {
    console.log("🌱 Running seeds...\n");
    await client.query("BEGIN");

    // Call individual seed functions
    await seedTestUser(client);

    await client.query("COMMIT");
    console.log("✅ Seeds applied successfully!");

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
