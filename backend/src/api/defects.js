import express from 'express';
const { Router } = express;
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { DefectModel } from '../models/defect.js';
import { cacheService } from '../services/cache-service.js';

const router = Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

let BOARDS_CONFIG;
try {
  BOARDS_CONFIG = JSON.parse(fs.readFileSync(join(__dirname, '../../../config/jira-boards.json'), 'utf-8'));
} catch { BOARDS_CONFIG = { boards: {} }; }

// GET /api/defects/:product
router.get('/:product', (req, res) => {
  try {
    const { product } = req.params;
    const { status, priority, assignee, search } = req.query;
    let defects = DefectModel.getAll(product);

    if (status) defects = defects.filter(d => d.status === status);
    if (priority) defects = defects.filter(d => d.priority === priority);
    if (assignee) defects = defects.filter(d => d.assignee === assignee);
    if (search) {
      const q = search.toLowerCase();
      defects = defects.filter(d =>
        (d.key || '').toLowerCase().includes(q) ||
        (d.summary || '').toLowerCase().includes(q)
      );
    }

    res.json({ defects, total: defects.length });
  } catch (error) {
    console.error('Error fetching defects:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/defects/:product/stats
router.get('/:product/stats', (req, res) => {
  try {
    const cacheKey = `stats:${req.params.product}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return res.json(cached);

    const stats = DefectModel.getStats(req.params.product);
    cacheService.set(cacheKey, stats);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/defects/:product/by-category/:category
router.get('/:product/by-category/:category', (req, res) => {
  try {
    const defects = DefectModel.getByCategory(req.params.product, req.params.category);
    res.json({ defects, total: defects.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/defects/:product/top-customers
router.get('/:product/top-customers', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const customers = DefectModel.getTopCustomers(req.params.product, limit);
    res.json({ customers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/defects/:product/key-themes
router.get('/:product/key-themes', async (req, res) => {
  try {
    const { product } = req.params;
    const boardConfig = BOARDS_CONFIG.boards?.[product];
    if (!boardConfig) return res.json({ themes: [], message: 'No board config for product' });

    const cacheKey = `key-themes:${product}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return res.json(cached);

    // Return placeholder - sprint data comes from live Jira
    const result = { themes: [], sprintSize: 0, message: 'No active sprint data available' };
    cacheService.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message, themes: [] });
  }
});

// GET /api/defects/:product/upgrade-tracker
router.get('/:product/upgrade-tracker', (req, res) => {
  try {
    const { product } = req.params;
    if (product !== 'uta') return res.status(400).json({ error: 'Upgrade tracker only available for UTA' });

    const cacheKey = `upgrade-tracker:${product}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return res.json(cached);

    const upgrade25Issues = DefectModel.getUpgradeIssues('UTAUPGRADE25');
    const upgrade26Issues = DefectModel.getUpgradeIssues('UTAUPGRADE26');
    const trueDefects = DefectModel.getTrueDefects();
    const baselineIssues = DefectModel.getBaselineIssues('3121');

    const upgrade25 = DefectModel.calculateResolutionMetrics(upgrade25Issues);
    const upgrade26 = DefectModel.calculateResolutionMetrics(upgrade26Issues);

    const allUpgrade = [...upgrade25Issues, ...upgrade26Issues];
    const trueDefectCount = trueDefects.length;
    const trueDefectRate = allUpgrade.length > 0
      ? ((trueDefectCount / allUpgrade.length) * 100).toFixed(1)
      : 0;

    const baseline = DefectModel.calculateResolutionMetrics(baselineIssues);

    // Aging issues - top 10 oldest open
    const agingIssues = allUpgrade
      .filter(i => !['Closed', 'Resolved', 'Done'].includes(i.status))
      .sort((a, b) => (b.age_days || 0) - (a.age_days || 0))
      .slice(0, 10)
      .map(i => ({
        key: i.key,
        summary: i.summary,
        age_days: i.age_days,
        priority: i.priority,
        severity: i.severity,
        assignee: i.assignee,
        status: i.status,
        labels: i.labels || '',
        jira_url: `${process.env.JIRA_BASE_URL}/browse/${i.key}`
      }));

    // Resolution breakdown
    const resolutionBreakdown = {};
    allUpgrade
      .filter(i => i.resolution)
      .forEach(i => {
        resolutionBreakdown[i.resolution] = (resolutionBreakdown[i.resolution] || 0) + 1;
      });

    // Top impacted customers — from upgrade issues only
    const upgradeCustomerMap = {};
    allUpgrade
      .filter(i => !['Closed', 'Canceled'].includes(i.status) && i.customer_count > 0)
      .forEach(i => {
        let customers = [];
        try { customers = JSON.parse(i.customers || '[]'); } catch { customers = []; }
        customers.forEach(c => {
          const name = typeof c === 'string' ? c : (c.name || '');
          if (!name) return;
          if (!upgradeCustomerMap[name]) upgradeCustomerMap[name] = { name, count: 0 };
          upgradeCustomerMap[name].count++;
        });
      });
    const topCustomers = Object.values(upgradeCustomerMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const result = {
      upgrade25,
      upgrade26,
      true_defects: {
        total: trueDefectCount,
        defect_rate: parseFloat(trueDefectRate),
        avg_resolution_days: upgrade25.avg_resolution_days,
        median_resolution_days: upgrade25.median_resolution_days,
      },
      baseline: {
        total: baseline.total,
        avg_resolution_days: baseline.avg_resolution_days,
      },
      aging_issues: agingIssues,
      resolution_breakdown: resolutionBreakdown,
      top_customers: topCustomers,
      unique_impacted_customers: Object.keys(upgradeCustomerMap).length,
      generated_at: new Date().toISOString(),
    };

    cacheService.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Upgrade tracker error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
