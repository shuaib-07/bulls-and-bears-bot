// Reapply idempotent schema additions without resetting the saved simulation.
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { neon } = require("@neondatabase/serverless");
require("dotenv").config({ path: ".env.local", quiet: true });
require("dotenv").config({ quiet: true });

async function run() {
  const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  assert.ok(url, "Database connection is not configured");
  const sql = neon(url);
  const migration = readFileSync("src/lib/db/migration.ts", "utf8").match(/export const migrationSql = `([\s\S]*?)`;/)[1];
  const additions = [...migration.matchAll(/ALTER TABLE (\w+) ADD COLUMN IF NOT EXISTS (\w+)/g)].map((match) => `${match[1]}.${match[2]}`);
  const before = await sql`SELECT revision::text, simulation_id::text, md5(simulation_snapshot::text) AS snapshot_hash FROM game_state WHERE id=1`;
  await sql.transaction(migration.split(";").map((statement) => statement.trim()).filter(Boolean).map((statement) => sql.query(statement)));
  const columns = await sql`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public'`;
  const present = new Set(columns.map((column) => `${column.table_name}.${column.column_name}`));
  assert.ok(additions.every((column) => present.has(column)), "Migration columns are missing");
  const after = await sql`SELECT revision::text, simulation_id::text, md5(simulation_snapshot::text) AS snapshot_hash FROM game_state WHERE id=1`;
  assert.deepEqual(after, before, "The saved simulation changed during schema verification");
  console.log(`Neon migrations verified: all ${additions.length} schema additions are present. The saved simulation was preserved.`);
}

run().catch((error) => { console.error("Migration verification failed:", error.name); process.exitCode = 1; });
