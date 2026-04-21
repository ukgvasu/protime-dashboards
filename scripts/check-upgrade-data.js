#!/usr/bin/env node

import { dbManager } from '../backend/src/models/database.js';
import { DefectModel } from '../backend/src/models/defect.js';

await dbManager.initialize();

const db = dbManager.getDatabase();

// Check upgrade flags
const upgrade25 = db.prepare('SELECT COUNT(*) as count FROM defects WHERE is_upgrade_25 = 1').get();
const upgrade26 = db.prepare('SELECT COUNT(*) as count FROM defects WHERE is_upgrade_26 = 1').get();

console.log('Database upgrade flag counts:');
console.log('  is_upgrade_25:', upgrade25.count);
console.log('  is_upgrade_26:', upgrade26.count);

// Check sample labels
const sample = db.prepare(`
  SELECT key, product, labels
  FROM defects
  WHERE product = 'uta'
  LIMIT 10
`).all();

console.log('\nSample UTA defect labels:');
sample.forEach(d => {
  console.log(`  ${d.key}: ${d.labels || 'no labels'}`);
});

// Check if any labels contain UTAUPGRADE
const utaupgrade = db.prepare(`
  SELECT key, labels
  FROM defects
  WHERE labels LIKE '%UTAUPGRADE%'
  LIMIT 5
`).all();

console.log('\nDefects with UTAUPGRADE in labels:');
if (utaupgrade.length === 0) {
  console.log('  None found');
} else {
  utaupgrade.forEach(d => {
    console.log(`  ${d.key}: ${d.labels}`);
  });
}

db.close();
