#!/usr/bin/env node

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { parseISO, differenceInDays } from 'date-fns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '../database/protime.db');
const SCHEMA_PATH = join(__dirname, '../database/schema.sql');

console.log('🔧 Rebuilding database from scratch...\n');

// Create database and load schema
const db = new Database(DB_PATH);
const schema = readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);
console.log('✅ Database schema created\n');

// Sample defect data structure (you'll need to fetch this via MCP in Claude)
// For now, creating empty database so app can start
console.log('📊 Database ready for data import');
console.log('   Next step: Use Jira MCP tool to fetch defects and import\n');

db.close();
console.log('✅ Database rebuild complete!');
