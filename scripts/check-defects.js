#!/usr/bin/env node

import { dbManager } from '../backend/src/models/database.js';

async function checkDefects() {
  await dbManager.initialize();
  const db = dbManager.getDatabase();

  const total = db.prepare('SELECT COUNT(*) as count FROM defects WHERE product = ?').get('uta');
  const withCustomers = db.prepare('SELECT COUNT(*) as count FROM defects WHERE product = ? AND customer_count > 0').get('uta');
  const withoutCustomers = db.prepare('SELECT COUNT(*) as count FROM defects WHERE product = ? AND customer_count = 0').get('uta');

  const statuses = db.prepare('SELECT status, COUNT(*) as count FROM defects WHERE product = ? GROUP BY status ORDER BY count DESC').all('uta');

  console.log('Database Defect Counts:');
  console.log('Total:', total.count);
  console.log('With customers:', withCustomers.count);
  console.log('Without customers (internal):', withoutCustomers.count);
  console.log('\nStatus breakdown:');
  statuses.forEach(s => console.log(`  ${s.status}: ${s.count}`));
}

checkDefects();
