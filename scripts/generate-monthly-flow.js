#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { dbManager } from '../backend/src/models/database.js';
import { SnapshotModel } from '../backend/src/models/snapshot.js';
import { parseISO, format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('📊 Generating monthly flow data...\n');

async function generateMonthlyFlow() {
  try {
    await dbManager.initialize();
    const db = dbManager.getDatabase();

    // Get last 6 months
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));
      months.push({
        label: format(monthStart, 'MMM yy'),
        month: format(monthStart, 'yyyy-MM'),
        start: format(monthStart, 'yyyy-MM-dd'),
        end: format(monthEnd, 'yyyy-MM-dd')
      });
    }

    const products = ['uta', 'utm', 'wfmClassic'];

    for (const product of products) {
      console.log(`\n${product.toUpperCase()}:`);

      for (const m of months) {
        // Count defects opened in this month (using substr to extract YYYY-MM from ISO date)
        const openedStmt = db.prepare(`
          SELECT COUNT(*) as count FROM defects
          WHERE product = ?
            AND substr(created_at, 1, 7) = ?
        `);
        const openedRow = openedStmt.get(product, m.month);
        const openedCount = openedRow ? openedRow.count : 0;

        // Count defects closed in this month (hybrid approach)
        // Primary: use resolution_date if available (canonical)
        // Fallback: use status + updated_at for defects without resolution_date
        const closedStmt = db.prepare(`
          SELECT COUNT(*) as count FROM defects
          WHERE product = ?
            AND (
              -- Primary: use resolution_date if available
              (resolution_date IS NOT NULL AND substr(resolution_date, 1, 7) = ?)
              OR
              -- Fallback: closed status without resolution_date (use updated_at)
              (status IN ('Closed', 'Canceled', 'Done')
               AND resolution_date IS NULL
               AND substr(updated_at, 1, 7) = ?)
            )
        `);
        // Pass month parameter twice for both placeholders
        const closedRow = closedStmt.get(product, m.month, m.month);
        const closedCount = closedRow ? closedRow.count : 0;

        const netChange = openedCount - closedCount;

        // Insert into monthly_snapshots
        SnapshotModel.upsertMonthlySnapshot({
          product,
          month: m.month,
          opened_count: openedCount,
          closed_count: closedCount,
          net_change: netChange,
          snapshot_date: format(now, 'yyyy-MM-dd')
        });

        console.log(`  ${m.label}: opened=${openedCount}, closed=${closedCount}, net=${netChange > 0 ? '+' : ''}${netChange}`);
      }
    }

    console.log('\n✅ Monthly flow data generated successfully!\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    dbManager.close();
  }
}

generateMonthlyFlow();
