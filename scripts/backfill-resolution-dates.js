#!/usr/bin/env node

import { dbManager } from '../backend/src/models/database.js';

async function backfill() {
  try {
    console.log('🔧 Initializing database...');
    await dbManager.initialize();
    const db = dbManager.getDatabase();

    console.log('\n📊 Analyzing defects without resolution_date...');

    // Check how many defects need backfilling
    const checkStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM defects
      WHERE status IN ('Closed', 'Done', 'Canceled')
        AND resolution_date IS NULL
        AND updated_at IS NOT NULL
    `);
    const checkResult = checkStmt.get();
    console.log(`Found ${checkResult.count} closed defects without resolution_date`);

    if (checkResult.count === 0) {
      console.log('✅ No defects need backfilling!');
      return;
    }

    // Backfill resolution_date using updated_at as best approximation
    console.log('\n🔄 Backfilling resolution_date...');
    const updateStmt = db.prepare(`
      UPDATE defects
      SET resolution_date = updated_at
      WHERE status IN ('Closed', 'Done', 'Canceled')
        AND resolution_date IS NULL
        AND updated_at IS NOT NULL
    `);

    const result = updateStmt.run();
    console.log(`✅ Backfilled ${result.changes} defect resolution dates`);

    // Verify the backfill
    const verifyStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM defects
      WHERE status IN ('Closed', 'Done', 'Canceled')
        AND resolution_date IS NULL
    `);
    const verifyResult = verifyStmt.get();
    console.log(`Remaining defects without resolution_date: ${verifyResult.count}`);

    // Trigger backend reload if server is running
    console.log('\n🔄 Attempting to reload backend database...');
    try {
      const response = await fetch('http://localhost:3001/api/db/reload', {
        method: 'POST'
      });
      if (response.ok) {
        console.log('✅ Backend database reloaded successfully');
      } else {
        console.log('⚠️  Backend reload failed (server may not be running)');
      }
    } catch (error) {
      console.log('⚠️  Could not reload backend (server may not be running)');
    }

    console.log('\n✅ Backfill complete!');
    console.log('\nNext steps:');
    console.log('  1. Run: node scripts/generate-monthly-flow.js');
    console.log('  2. Verify monthly flow chart shows closed defects');

  } catch (error) {
    console.error('❌ Error during backfill:', error);
    process.exit(1);
  }
}

backfill();
