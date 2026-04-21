import express from 'express';
const { Router } = express;
import { dbManager } from '../models/database.js';
import { DefectModel } from '../models/defect.js';

const router = Router();

// GET /api/alerts
router.get('/', (req, res) => {
  try {
    const alerts = dbManager.all(
      `SELECT * FROM alerts WHERE status = 'active' ORDER BY created_at DESC LIMIT 50`
    );
    res.json({ alerts, total: alerts.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/alerts/check
router.post('/check', (req, res) => {
  try {
    const triggered = [];

    // Check unassigned high-priority
    const unassignedHigh = DefectModel.getAll('all').filter(d =>
      ['P1', 'P2'].includes(d.priority) &&
      (!d.assignee || d.assignee === 'Unassigned') &&
      !['Closed', 'Canceled'].includes(d.status)
    );

    if (unassignedHigh.length > 0) {
      triggered.push({
        rule_id: 'unassigned-p2-plus',
        rule_name: 'Unassigned P2+',
        message: `${unassignedHigh.length} high-priority defects unassigned`,
        severity: 'warning'
      });
    }

    triggered.forEach(alert => {
      dbManager.run(
        `INSERT INTO alerts (rule_id, rule_name, message, severity) VALUES (?, ?, ?, ?)`,
        [alert.rule_id, alert.rule_name, alert.message, alert.severity]
      );
    });

    dbManager.save();
    res.json({ triggered, total: triggered.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/alerts/:id/resolve
router.put('/:id/resolve', (req, res) => {
  try {
    dbManager.run(
      `UPDATE alerts SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [req.params.id]
    );
    dbManager.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
