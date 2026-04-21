import express from 'express';
const { Router } = express;
import { DefectModel } from '../models/defect.js';
import { cacheService } from '../services/cache-service.js';

const router = Router();

// GET /api/insights/:product
router.get('/:product', (req, res) => {
  try {
    const { product } = req.params;
    const cacheKey = `insights:${product}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return res.json(cached);

    const defects = DefectModel.getAll(product).filter(d =>
      !['Closed', 'Canceled'].includes(d.status)
    );

    const insights = [];

    // High unassigned
    const unassigned = defects.filter(d => !d.assignee || d.assignee === 'Unassigned');
    if (unassigned.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Unassigned Defects',
        message: `${unassigned.length} defects are unassigned and need attention`,
        count: unassigned.length,
      });
    }

    // Aging defects
    const aging = defects.filter(d => (d.age_days || 0) > 90);
    if (aging.length > 0) {
      insights.push({
        type: 'danger',
        title: 'Aging Defects',
        message: `${aging.length} defects are more than 90 days old`,
        count: aging.length,
      });
    }

    // High priority concentration
    const p1 = defects.filter(d => d.priority === 'P1');
    if (p1.length > 5) {
      insights.push({
        type: 'danger',
        title: 'High P1 Count',
        message: `${p1.length} P1 defects require immediate attention`,
        count: p1.length,
      });
    }

    // Customer impact
    const customerFacing = defects.filter(d => d.customer_count > 0);
    if (customerFacing.length > 0) {
      insights.push({
        type: 'info',
        title: 'Customer Impact',
        message: `${customerFacing.length} defects are impacting customers`,
        count: customerFacing.length,
      });
    }

    const result = { product, insights, total: defects.length, updatedAt: new Date().toISOString() };
    cacheService.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
