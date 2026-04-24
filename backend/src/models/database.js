import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, '../../../database/protime.db');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.SQL = null;
  }

  async initialize() {
    this.SQL = await initSqlJs();
    if (existsSync(DB_PATH)) {
      const fileBuffer = readFileSync(DB_PATH);
      this.db = new this.SQL.Database(fileBuffer);
    } else {
      this.db = new this.SQL.Database();
    }
    this._createSchema();
    console.log('✅ Database initialized');
  }

  save() {
    if (this.db) {
      const data = this.db.export();
      writeFileSync(DB_PATH, Buffer.from(data));
    }
  }

  close() {
    this.save();
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  reload() {
    if (this.db) this.db.close();
    const fileBuffer = readFileSync(DB_PATH);
    this.db = new this.SQL.Database(fileBuffer);
    console.log('✅ Database reloaded');
  }

  // Run a statement that modifies data (INSERT/UPDATE/DELETE/CREATE)
  run(sql, params = []) {
    this.db.run(sql, params);
  }

  // Run a query and return all rows as objects
  all(sql, params = []) {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  // Run a query and return first row
  get(sql, params = []) {
    const rows = this.all(sql, params);
    return rows[0] || null;
  }

  // Execute multi-statement SQL
  exec(sql) {
    this.db.exec(sql);
  }

  _createSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS defects (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL,
        product TEXT NOT NULL,
        summary TEXT,
        status TEXT,
        priority TEXT,
        severity TEXT,
        assignee TEXT,
        reporter TEXT,
        area TEXT,
        labels TEXT,
        customer_count INTEGER DEFAULT 0,
        customers TEXT,
        is_customer_reported INTEGER DEFAULT 0,
        age_days INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT,
        resolution_date TEXT,
        resolution TEXT,
        issue_type TEXT,
        raw_json TEXT,
        is_upgrade_25 BOOLEAN DEFAULT 0,
        is_upgrade_26 BOOLEAN DEFAULT 0,
        resolution_time_days INTEGER DEFAULT NULL,
        synced_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product TEXT NOT NULL,
        date TEXT NOT NULL,
        total_open INTEGER DEFAULT 0,
        opened_today INTEGER DEFAULT 0,
        closed_today INTEGER DEFAULT 0,
        p1_count INTEGER DEFAULT 0,
        p2_count INTEGER DEFAULT 0,
        customer_facing INTEGER DEFAULT 0,
        snapshot_data TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS monthly_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product TEXT NOT NULL,
        month TEXT NOT NULL,
        opened_count INTEGER DEFAULT 0,
        closed_count INTEGER DEFAULT 0,
        net_change INTEGER DEFAULT 0,
        snapshot_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_id TEXT,
        rule_name TEXT,
        message TEXT,
        severity TEXT,
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        resolved_at TEXT
      );

      CREATE TABLE IF NOT EXISTS sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product TEXT,
        status TEXT,
        records_synced INTEGER DEFAULT 0,
        error_message TEXT,
        started_at TEXT,
        completed_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_defects_product ON defects(product);
      CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);
      CREATE INDEX IF NOT EXISTS idx_defects_priority ON defects(priority);
      CREATE INDEX IF NOT EXISTS idx_defects_is_customer_reported ON defects(is_customer_reported);
    `);

    // Migrations: add columns that may be missing from older database files
    const migrations = [
      `ALTER TABLE defects ADD COLUMN synced_at TEXT DEFAULT CURRENT_TIMESTAMP`,
    ];
    for (const sql of migrations) {
      try { this.db.run(sql); } catch { /* column already exists */ }
    }

    this.save();
  }
}

export const dbManager = new DatabaseManager();
