#!/usr/bin/env node

/**
 * Database migration runner
 * Runs SQL migration files against the ProTime database using sql.js
 */

import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = path.join(__dirname, '../database/protime.db');
const MIGRATIONS_DIR = path.join(__dirname, '../database/migrations');

async function runMigration(migrationFile) {
  console.log(`\n📦 Running migration: ${migrationFile}`);

  // Initialize sql.js
  const SQL = await initSqlJs();

  // Load existing database
  if (!fs.existsSync(DB_PATH)) {
    console.error(`❌ Database not found at: ${DB_PATH}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);

  const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  try {
    // Execute the migration SQL
    db.exec(sql);

    // Save the database
    fs.writeFileSync(DB_PATH, Buffer.from(db.export()));

    console.log(`✅ Migration completed: ${migrationFile}`);
  } catch (error) {
    console.error(`❌ Migration failed: ${migrationFile}`);
    console.error(error.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Main execution
async function main() {
  const migrationArg = process.argv[2];

  if (migrationArg) {
    await runMigration(migrationArg);
  } else {
    // Run all migrations in order
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration(s)`);
    for (const file of files) {
      await runMigration(file);
    }
  }

  console.log('\n✨ All migrations complete!\n');
}

main().catch(error => {
  console.error('Migration error:', error);
  process.exit(1);
});
