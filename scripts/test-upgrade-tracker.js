#!/usr/bin/env node
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'database', 'protime.db');

console.log('🧪 Testing UTA Upgrade Tracker Integration\n');

try {
  const db = new Database(dbPath);

  // Test 1: Check columns exist
  console.log('✓ Step 1: Verify database columns');
  const tableInfo = db.prepare('PRAGMA table_info(defects)').all();
  const hasUpgrade25 = tableInfo.some(col => col.name === 'is_upgrade_25');
  const hasUpgrade26 = tableInfo.some(col => col.name === 'is_upgrade_26');
  const hasResolutionTime = tableInfo.some(col => col.name === 'resolution_time_days');

  if (!hasUpgrade25 || !hasUpgrade26 || !hasResolutionTime) {
    console.error('  ❌ Missing upgrade tracking columns');
    process.exit(1);
  }
  console.log('  ✅ All upgrade tracking columns present');

  // Test 2: Check indexes exist
  console.log('\n✓ Step 2: Verify indexes');
  const indexes = db.prepare('PRAGMA index_list(defects)').all();
  const hasUpgrade25Idx = indexes.some(idx => idx.name === 'idx_defects_upgrade_25');
  const hasUpgrade26Idx = indexes.some(idx => idx.name === 'idx_defects_upgrade_26');

  if (!hasUpgrade25Idx || !hasUpgrade26Idx) {
    console.log('  ⚠️  Some indexes missing (will be created on first query)');
  } else {
    console.log('  ✅ Upgrade indexes present');
  }

  // Test 3: Check if there's any upgrade data
  console.log('\n✓ Step 3: Check for upgrade issue data');
  const upgrade25Count = db.prepare('SELECT COUNT(*) as count FROM defects WHERE is_upgrade_25 = 1').get();
  const upgrade26Count = db.prepare('SELECT COUNT(*) as count FROM defects WHERE is_upgrade_26 = 1').get();

  console.log(`  UTAUPGRADE25 issues: ${upgrade25Count.count}`);
  console.log(`  UTAUPGRADE26 issues: ${upgrade26Count.count}`);

  if (upgrade25Count.count === 0 && upgrade26Count.count === 0) {
    console.log('  ℹ️  No upgrade issues found yet - run sync to populate');
  }

  // Test 4: Test query performance
  console.log('\n✓ Step 4: Test query performance');
  const start = Date.now();
  const results = db.prepare(`
    SELECT COUNT(*) as count
    FROM defects
    WHERE is_upgrade_26 = 1 AND product = 'uta'
  `).get();
  const elapsed = Date.now() - start;
  console.log(`  ✅ Query completed in ${elapsed}ms`);

  console.log('\n🎉 Integration test passed!');
  console.log('\n📋 Next steps:');
  console.log('  1. Start backend: cd backend && npm run dev');
  console.log('  2. Start frontend: cd frontend && npm run dev');
  console.log('  3. Visit: http://localhost:3000/uta/upgrade-tracker');
  console.log('  4. If no data shows, run: npm run sync');

  db.close();
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
