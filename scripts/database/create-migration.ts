import fs from "fs";
import path from "path";

const MIGRATIONS_DIR = path.join(__dirname, "..", "..", "migrations");

const name = process.argv[2];

if (!name) {
  console.error("Usage: npm run db:create-migration <migration-name>");
  console.error("Example: npm run db:create-migration create-users-table");
  process.exit(1);
}

// Generate timestamp-based prefix (YYYYMMDDHHmmss)
const now = new Date();
const timestamp = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, "0"),
  String(now.getDate()).padStart(2, "0"),
  String(now.getHours()).padStart(2, "0"),
  String(now.getMinutes()).padStart(2, "0"),
  String(now.getSeconds()).padStart(2, "0"),
].join("");

const fileName = `${timestamp}_${name}.sql`;
const filePath = path.join(MIGRATIONS_DIR, fileName);

fs.writeFileSync(
  filePath,
  `-- Migration: ${name}
-- Created at: ${now.toISOString()}
--
-- Guidelines:
--   - Wrap destructive or multi-step changes in BEGIN/COMMIT
--   - Use IF NOT EXISTS / IF EXISTS for idempotency
--   - Use TIMESTAMPTZ (not TIMESTAMP) for all timestamp columns
--   - Add indexes for every FK column and any column used in WHERE/ORDER BY
--   - Add CHECK constraints for columns with a fixed set of valid values
--   - One concern per migration file — don't combine unrelated changes

`,
);

console.log(`✅ Created migration: migrations/${fileName}`);
