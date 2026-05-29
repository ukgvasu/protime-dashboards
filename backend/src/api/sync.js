import express from 'express';
const { Router } = express;
import { fetchIssues, transformIssue } from '../services/jira-service.js';
import { DefectModel } from '../models/defect.js';
import { SnapshotModel } from '../models/snapshot.js';
import { dbManager } from '../models/database.js';
import { cacheService } from '../services/cache-service.js';
import { format } from 'date-fns';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

let BOARDS_CONFIG;
try {
  BOARDS_CONFIG = JSON.parse(fs.readFileSync(join(__dirname, '../../../config/jira-boards.json'), 'utf-8'));
} catch { BOARDS_CONFIG = { boards: {} }; }

let lastSyncStatus = { status: 'never', completedAt: null, recordsSynced: 0 };

async function syncProduct(product, createSnapshot = false) {
  const boardConfig = BOARDS_CONFIG.boards?.[product];
  if (!boardConfig) throw new Error(`No board config for product: ${product}`);

  console.log(`🔄 Syncing ${product}...`);
  const startedAt = new Date().toISOString();

  try {
    const issues = await fetchIssues(boardConfig.jql);
    console.log(`  Fetched ${issues.length} issues for ${product}`);

    for (const issue of issues) {
      const defect = transformIssue(issue, product);
      DefectModel.insert(defect);
    }

    // Mark any DB records that are no longer in Jira's open list as Closed.
    // The board JQL filters statusCategory != Done, so when an issue gets closed in Jira
    // it drops off the list and the DB entry keeps a stale open status indefinitely.
    const openKeys = new Set(issues.map(i => i.key));
    const dbDefects = DefectModel.getAll(product);
    const staleOpen = dbDefects.filter(d =>
      !['Closed', 'Canceled'].includes(d.status) && !openKeys.has(d.key)
    );
    if (staleOpen.length > 0) {
      console.log(`  Marking ${staleOpen.length} stale-open records as Closed for ${product}`);
      for (const d of staleOpen) {
        DefectModel.markClosed(d.key);
      }
    }

    if (createSnapshot) {
      SnapshotModel.insert({
        product,
        date: format(new Date(), 'yyyy-MM-dd'),
        total_open: issues.length,
        opened_today: 0,
        closed_today: 0,
        p1_count: issues.filter(i => i.fields?.priority?.name === 'P1').length,
        p2_count: issues.filter(i => i.fields?.priority?.name === 'P2').length,
        customer_facing: issues.filter(i =>
          (i.fields?.labels || []).some(l => l.toUpperCase() === 'RCA-TYPE-DEFECT')
        ).length,
      });
    }

    dbManager.save();
    cacheService.invalidate(`stats:${product}`);
    cacheService.invalidate(`ktlo:${product}`);
    cacheService.invalidate(`insights:${product}`);
    cacheService.invalidate(`customer-impact:${product}`);
    cacheService.invalidate('leadership');
    cacheService.invalidate(`upgrade-tracker:${product}`);

    dbManager.run(
      `INSERT INTO sync_log (product, status, records_synced, started_at, completed_at) VALUES (?, 'success', ?, ?, ?)`,
      [product, issues.length, startedAt, new Date().toISOString()]
    );
    dbManager.save();

    console.log(`  ✅ ${product} sync complete (${issues.length} records)`);
    return { product, count: issues.length };
  } catch (error) {
    console.error(`  ❌ ${product} sync failed:`, error.message);
    dbManager.run(
      `INSERT INTO sync_log (product, status, records_synced, error_message, started_at, completed_at) VALUES (?, 'error', 0, ?, ?, ?)`,
      [product, error.message, startedAt, new Date().toISOString()]
    );
    dbManager.save();
    throw error;
  }
}

// POST /api/sync
router.post('/', async (req, res) => {
  try {
    const { product = 'all', createSnapshot = false } = req.body;
    const products = product === 'all' ? Object.keys(BOARDS_CONFIG.boards || {}) : [product];

    res.json({ message: 'Sync started', products });

    let totalRecords = 0;
    for (const p of products) {
      try {
        const result = await syncProduct(p, createSnapshot);
        totalRecords += result.count;
      } catch (err) {
        console.error(`Sync failed for ${p}:`, err.message);
      }
    }

    cacheService.invalidate('upgrade-tracker:');
    cacheService.invalidate('security');
    lastSyncStatus = { status: 'success', completedAt: new Date().toISOString(), recordsSynced: totalRecords };
  } catch (error) {
    console.error('Sync error:', error);
    lastSyncStatus = { status: 'error', completedAt: new Date().toISOString(), error: error.message };
  }
});

// GET /api/sync/status
router.get('/status', (req, res) => {
  const lastLog = dbManager.get('SELECT * FROM sync_log ORDER BY id DESC LIMIT 1');
  res.json({ ...lastSyncStatus, lastLog });
});

export { syncProduct };
export default router;
