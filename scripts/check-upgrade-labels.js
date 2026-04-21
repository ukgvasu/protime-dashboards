#!/usr/bin/env node

import { dbManager } from '../backend/src/models/database.js';

await dbManager.initialize();
const db = dbManager.getDatabase();

// Check total UTA defects
const totalUTA = db.prepare('SELECT COUNT(*) as count FROM defects WHERE product = ?').get('uta');
console.log(`Total UTA defects in database: ${totalUTA.count}`);

// Check upgrade flags
const upgrade25Count = db.prepare('SELECT COUNT(*) as count FROM defects WHERE is_upgrade_25 = 1').get();
const upgrade26Count = db.prepare('SELECT COUNT(*) as count FROM defects WHERE is_upgrade_26 = 1').get();

console.log(`\nUpgrade flags:`);
console.log(`  is_upgrade_25: ${upgrade25Count.count}`);
console.log(`  is_upgrade_26: ${upgrade26Count.count}`);

// Check labels that contain UTAUPGRADE
const labelsContaining25 = db.prepare(`
  SELECT COUNT(*) as count
  FROM defects
  WHERE product = 'uta' AND labels LIKE '%UTAUPGRADE25%'
`).get();

const labelsContaining26 = db.prepare(`
  SELECT COUNT(*) as count
  FROM defects
  WHERE product = 'uta' AND labels LIKE '%UTAUPGRADE26%'
`).get();

console.log(`\nLabels containing UTAUPGRADE:`);
console.log(`  UTAUPGRADE25 in labels: ${labelsContaining25.count}`);
console.log(`  UTAUPGRADE26 in labels: ${labelsContaining26.count}`);

// Show sample of defects with upgrade labels
const sampleWith25 = db.prepare(`
  SELECT key, labels, is_upgrade_25
  FROM defects
  WHERE product = 'uta' AND labels LIKE '%UTAUPGRADE25%'
  LIMIT 5
`).all();

const sampleWith26 = db.prepare(`
  SELECT key, labels, is_upgrade_26
  FROM defects
  WHERE product = 'uta' AND labels LIKE '%UTAUPGRADE26%'
  LIMIT 5
`).all();

console.log(`\nSample UTAUPGRADE25 issues:`);
sampleWith25.forEach(d => {
  console.log(`  ${d.key}: flag=${d.is_upgrade_25}, labels=${d.labels}`);
});

console.log(`\nSample UTAUPGRADE26 issues:`);
sampleWith26.forEach(d => {
  console.log(`  ${d.key}: flag=${d.is_upgrade_26}, labels=${d.labels}`);
});

db.close();
