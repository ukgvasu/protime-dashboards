#!/usr/bin/env node

/**
 * Populate monthly_snapshots table with historical data
 *
 * This script generates 6 months of monthly snapshot data for all products.
 * Run this to fix the "Monthly Defect Flow" chart showing no data.
 *
 * Usage:
 *   node backend/scripts/populate-monthly-data.js
 */

import { SnapshotModel } from '../src/models/snapshot.js';
import { DefectModel } from '../src/models/defect.js';
import { subMonths, startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import { dbManager } from '../src/models/database.js';

// Initialize database
console.log('🔄 Initializing database...');
await dbManager.initialize('database/protime.db');

console.log('🔄 Populating monthly snapshot data...\n');

const products = ['uta', 'utm', 'wfmClassic'];
const now = new Date();

for (const product of products) {
  console.log(`\n📊 Processing ${product.toUpperCase()}...`);

  // Get all defects for this product
  const allDefects = DefectModel.getByProduct(product);

  // Generate last 6 months
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthStr = format(monthDate, 'yyyy-MM');
    const monthLabel = format(monthDate, 'MMM yyyy');

    // Count customer-reported defects (true defects) OPENED in this month
    // Criteria: RCA-Type-Defect label AND customer field not blank
    const openedCount = allDefects.filter(d => {
      if (!d.created_at) return false;
      if (d.is_customer_reported !== 1 || d.customer_count === 0) return false;
      const createdDate = parseISO(d.created_at);
      return createdDate >= monthStart && createdDate <= monthEnd;
    }).length;

    // Count customer-reported defects (true defects) CLOSED in this month
    const closedCount = allDefects.filter(d => {
      if (!d.resolution_date) return false;
      if (d.is_customer_reported !== 1 || d.customer_count === 0) return false;
      try {
        const resolvedDate = parseISO(d.resolution_date);
        return resolvedDate >= monthStart && resolvedDate <= monthEnd;
      } catch (e) {
        return false;
      }
    }).length;

    const netChange = openedCount - closedCount;

    // Insert monthly snapshot
    SnapshotModel.upsertMonthlySnapshot({
      product,
      month: monthStr,
      opened_count: openedCount,
      closed_count: closedCount,
      net_change: netChange,
      snapshot_date: new Date().toISOString()
    });

    console.log(`  ✓ ${monthLabel}: +${openedCount} opened, -${closedCount} closed (net: ${netChange >= 0 ? '+' : ''}${netChange})`);
  }
}

console.log('\n✅ Monthly snapshot population complete!\n');
console.log('💡 Tip: Re-run this script after syncing new defect data to update monthly stats.\n');
