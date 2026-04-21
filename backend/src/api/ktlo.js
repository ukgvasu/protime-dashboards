import express from 'express';
const { Router } = express;
import { DefectModel } from '../models/defect.js';
import { cacheService } from '../services/cache-service.js';

const router = Router();

// GET /api/ktlo/:product
router.get('/:product', (req, res) => {
  try {
    const { product } = req.params;
    const cacheKey = `ktlo:${product}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return res.json(cached);

    const defects = DefectModel.getAll(product).filter(d =>
      !['Closed', 'Canceled'].includes(d.status)
    );

    // KTLO analysis: classify defects by theme
    const ktloItems = [];
    const securityItems = [];
    const techDebtItems = [];
    const customerItems = [];

    defects.forEach(d => {
      const labels = d.labels ? d.labels.split(',').map(l => l.trim().toLowerCase()) : [];
      if (labels.some(l => ['checkmarx', 'sca', 'cve', 'security', 'sast', 'dast'].includes(l))) {
        securityItems.push(d);
      } else if (labels.some(l => ['tech-debt', 'refactor', 'cleanup'].includes(l))) {
        techDebtItems.push(d);
      } else if (d.is_customer_reported) {
        customerItems.push(d);
      } else {
        ktloItems.push(d);
      }
    });

    const result = {
      product,
      total: defects.length,
      categories: {
        security: { count: securityItems.length, items: securityItems.slice(0, 10) },
        techDebt: { count: techDebtItems.length, items: techDebtItems.slice(0, 10) },
        customerReported: { count: customerItems.length, items: customerItems.slice(0, 10) },
        operational: { count: ktloItems.length, items: ktloItems.slice(0, 10) },
      },
      breakdown: {
        security: securityItems.length,
        techDebt: techDebtItems.length,
        customerReported: customerItems.length,
        operational: ktloItems.length,
      },
      updatedAt: new Date().toISOString(),
    };

    cacheService.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
