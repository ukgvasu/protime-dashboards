#!/usr/bin/env node

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { dbManager } from '../backend/src/models/database.js';
import { jiraService } from '../backend/src/services/jira-service.js';
import { DefectModel } from '../backend/src/models/defect.js';
import { SnapshotModel } from '../backend/src/models/snapshot.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from backend
dotenv.config({ path: join(__dirname, '../backend/.env') });

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   📥 ProTime Dashboard - Initial Data Sync                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

async function initialSync() {
  try {
    // Initialize database
    console.log('🔧 Initializing database...');
    await dbManager.initialize();
    console.log('✅ Database ready\n');

    // Sync all products
    const products = ['uta', 'utm', 'wfmClassic'];
    const results = {};

    for (const product of products) {
      console.log(`📡 Fetching ${product.toUpperCase()} defects from Jira...`);

      try {
        const defects = await jiraService.getDefects(product);
        console.log(`   Found ${defects.length} defects`);

        console.log(`💾 Saving to database...`);
        DefectModel.bulkInsert(defects);

        const stats = DefectModel.getStats(product);
        console.log(`   Stats: ${stats.total} total, P1:${stats.p1} P2:${stats.p2}, Unassigned:${stats.unassigned}`);

        // Create initial snapshot
        console.log(`📸 Creating snapshot...`);
        SnapshotModel.create(product, stats);

        results[product] = {
          count: defects.length,
          stats
        };

        console.log(`✅ ${product.toUpperCase()} sync complete\n`);
      } catch (error) {
        console.error(`❌ Failed to sync ${product}:`, error.message);
        results[product] = { error: error.message };
      }
    }

    // Print summary
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║   📊 SYNC SUMMARY                                         ║
╚═══════════════════════════════════════════════════════════╝
`);

    for (const [product, result] of Object.entries(results)) {
      if (result.error) {
        console.log(`   ${product.toUpperCase()}: ❌ ${result.error}`);
      } else {
        console.log(`   ${product.toUpperCase()}: ${result.count} defects synced`);
      }
    }

    const totalDefects = Object.values(results)
      .filter(r => !r.error)
      .reduce((sum, r) => sum + r.count, 0);

    console.log(`\n   ✅ Total: ${totalDefects} defects across all products`);
    console.log(`\n🎉 Initial sync complete! You can now start the API server.\n`);

  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  } finally {
    dbManager.close();
  }
}

// Run
initialSync();
