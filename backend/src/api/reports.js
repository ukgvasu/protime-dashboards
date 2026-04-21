import express from 'express';
const { Router } = express;
import { differenceInDays } from 'date-fns';
import { DefectModel } from '../models/defect.js';
import { SnapshotModel } from '../models/snapshot.js';
import { cacheService } from '../services/cache-service.js';

const router = Router();

const PRODUCTS = ['uta', 'utm', 'wfmClassic'];

// GET /api/reports/leadership
router.get('/leadership', (req, res) => {
  try {
    const cached = cacheService.get('leadership');
    if (cached) return res.json(cached);

    const allDefectsRaw = DefectModel.getAll('all');
    const allDefects = allDefectsRaw.filter(d =>
      d.status !== 'Closed' &&
      d.status !== 'Canceled' &&
      (d.is_customer_reported === 1 || d.is_customer_reported === true)
    );

    const now = new Date();
    const daysSinceUpdate = (defect) => {
      if (!defect.updated_at) return defect.age_days || 0;
      return differenceInDays(now, new Date(defect.updated_at));
    };

    const totalOpenDefects = allDefects.length;
    const totalOpenCustomerFacing = allDefects.filter(d => d.customer_count > 0).length;
    const p1p2 = allDefects.filter(d => ['P1', 'P2'].includes(d.priority)).length;
    const highSeverityCustomer = allDefects.filter(d => ['S1', 'S2'].includes(d.severity) && d.customer_count > 0).length;
    const highSeverityInternal = allDefects.filter(d => ['S1', 'S2'].includes(d.severity) && d.customer_count === 0).length;
    const stale = allDefects.filter(d => daysSinceUpdate(d) >= 30).length;

    // Product breakdown
    const productHealth = {};
    for (const product of PRODUCTS) {
      const stats = DefectModel.getCustomerFacingStats(product);
      productHealth[product] = stats;
    }

    // Customer-reported volume by product
    const customerVolume = PRODUCTS.map(product => ({
      product,
      count: allDefects.filter(d => d.product === product).length
    }));

    // Portfolio distribution by priority
    const byPriority = {};
    allDefects.forEach(d => {
      const p = d.priority || 'Unknown';
      byPriority[p] = (byPriority[p] || 0) + 1;
    });

    const result = {
      totalOpenDefects,
      totalOpenCustomerFacing,
      p1p2,
      highSeverityCustomer,
      highSeverityInternal,
      stale,
      productHealth,
      customerVolume,
      byPriority,
      updatedAt: new Date().toISOString(),
    };

    cacheService.set('leadership', result);
    res.json(result);
  } catch (error) {
    console.error('Leadership report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/security
router.get('/security', (req, res) => {
  try {
    const cached = cacheService.get('security');
    if (cached) return res.json(cached);

    const defects = DefectModel.getSecurityDefects();

    const bySeverity = {};
    const byProduct = {};
    const byLabel = {};

    defects.forEach(d => {
      const s = d.severity || 'Unknown';
      bySeverity[s] = (bySeverity[s] || 0) + 1;

      byProduct[d.product] = (byProduct[d.product] || 0) + 1;

      const labels = d.labels ? d.labels.split(',') : [];
      labels.forEach(l => {
        const label = l.trim().toLowerCase();
        if (['checkmarx', 'sca', 'sast', 'dast', 'cve', 'security', 'bitsight'].includes(label)) {
          byLabel[label] = (byLabel[label] || 0) + 1;
        }
      });
    });

    const result = {
      total: defects.length,
      critical: defects.filter(d => ['S1', 'S2'].includes(d.severity)).length,
      defects: defects.slice(0, 50),
      bySeverity,
      byProduct,
      byLabel,
      updatedAt: new Date().toISOString(),
    };

    cacheService.set('security', result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/history/:product
router.get('/history/:product', (req, res) => {
  try {
    const { product } = req.params;
    const months = parseInt(req.query.months) || 6;
    const monthlyFlow = DefectModel.getMonthlyFlow(product, months);
    const recent = SnapshotModel.getRecent(product, 30);
    res.json({ monthlyFlow, recent, product });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
