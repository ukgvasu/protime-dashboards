import express from 'express';
const { Router } = express;
import { DefectModel } from '../models/defect.js';
import { cacheService } from '../services/cache-service.js';

const router = Router();

// GET /api/customer-impact/:product
router.get('/:product', (req, res) => {
  try {
    const { product } = req.params;
    const cacheKey = `customer-impact:${product}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return res.json(cached);

    const defects = DefectModel.getAll(product).filter(d =>
      !['Closed', 'Canceled'].includes(d.status) && d.customer_count > 0
    );

    // Customer summary
    const customerMap = {};
    defects.forEach(d => {
      let customers = [];
      try { customers = JSON.parse(d.customers || '[]'); } catch { customers = []; }
      customers.forEach(c => {
        const name = typeof c === 'string' ? c : (c.name || '');
        if (!name) return;
        if (!customerMap[name]) customerMap[name] = { name, defects: [], count: 0, maxPriority: 'P5' };
        customerMap[name].defects.push(d.key);
        customerMap[name].count++;
        const pMap = { P1: 1, P2: 2, P3: 3, P4: 4, P5: 5 };
        if ((pMap[d.priority] || 5) < (pMap[customerMap[name].maxPriority] || 5)) {
          customerMap[name].maxPriority = d.priority;
        }
      });
    });

    // Build defect lookup for full details
    const defectByKey = {};
    defects.forEach(d => { defectByKey[d.key] = d; });

    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 30)
      .map(c => ({
        ...c,
        defectDetails: c.defects.map(key => {
          const d = defectByKey[key];
          if (!d) return null;
          return {
            key: d.key, summary: d.summary, priority: d.priority, severity: d.severity,
            status: d.status, assignee: d.assignee, age_days: d.age_days,
          };
        }).filter(Boolean),
        defects: c.defects,
      }));

    // All impacted defects with full details (for the full table view)
    const allImpactedDefects = defects.map(d => {
      let customers = [];
      try { customers = JSON.parse(d.customers || '[]'); } catch {}
      return {
        key: d.key, summary: d.summary, priority: d.priority, severity: d.severity,
        status: d.status, assignee: d.assignee, age_days: d.age_days,
        customers: customers.filter(Boolean),
      };
    });

    const bySeverity = {};
    defects.forEach(d => { const s = d.severity || 'Unknown'; bySeverity[s] = (bySeverity[s] || 0) + 1; });

    const result = {
      product,
      totalImpacted: defects.length,
      uniqueCustomers: Object.keys(customerMap).length,
      topCustomers,
      allImpactedDefects,
      byPriority: {
        P1: defects.filter(d => d.priority === 'P1').length,
        P2: defects.filter(d => d.priority === 'P2').length,
        P3: defects.filter(d => d.priority === 'P3').length,
        P4: defects.filter(d => d.priority === 'P4').length,
      },
      bySeverity,
      avgAgeDays: defects.length
        ? Math.round(defects.reduce((s, d) => s + (d.age_days || 0), 0) / defects.length)
        : 0,
      unassigned: defects.filter(d => !d.assignee || d.assignee === 'Unassigned').length,
      updatedAt: new Date().toISOString(),
    };

    cacheService.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
