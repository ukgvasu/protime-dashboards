import express from 'express';
const { Router } = express;
import { differenceInDays } from 'date-fns';
import { DefectModel } from '../models/defect.js';
import { SnapshotModel } from '../models/snapshot.js';
import { cacheService } from '../services/cache-service.js';
import { fetchIssues } from '../services/jira-service.js';

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

const SECURITY_JQL =
  'reporter = svc_DevSecOps_RW and component in ("WFM Classic", UTA, UTM) and status not in (Closed, Canceled)';

// Standard fields for security issues
const SECURITY_FIELDS = [
  'summary', 'status', 'priority', 'assignee', 'labels', 'components',
  'customfield_10704', // severity
];

const COMPONENT_TO_PRODUCT = { 'UTA': 'uta', 'UTM': 'utm', 'WFM Classic': 'wfmClassic' };
const PRODUCT_LABELS  = { uta: 'UTA', utm: 'UTM', wfmClassic: 'WFM Classic' };

function extractProduct(fields) {
  const components = fields.components || [];
  if (components.length > 0) {
    const componentName = components[0].name || components[0];
    return COMPONENT_TO_PRODUCT[componentName] || 'other';
  }
  return 'other';
}

// GET /api/reports/security
router.get('/security', async (req, res) => {
  try {
    const cached = cacheService.get('security');
    if (cached) return res.json(cached);

    let rawIssues = [];
    try {
      rawIssues = await fetchIssues(SECURITY_JQL, 500, SECURITY_FIELDS);
    } catch (jqlError) {
      console.warn('Security JQL query failed, returning empty results:', jqlError.message);
      rawIssues = [];
    }

    const defects = rawIssues.map(issue => {
      const fields = issue.fields || {};
      const severityRaw = fields.customfield_10704;
      const severity = severityRaw?.value || (typeof severityRaw === 'string' ? severityRaw : null);
      const product = extractProduct(fields);
      return {
        key: issue.key,
        summary: fields.summary || '',
        status: fields.status?.name || 'Unknown',
        priority: fields.priority?.name || 'Unknown',
        severity: severity || null,
        assignee: fields.assignee?.displayName || null,
        product,
        tveSubmitted: (fields.labels || []).some(l => l.toUpperCase().includes('TVE-SUBMITTED')),
      };
    });

    const bySeverity = {};
    const bySecurityClassification = {};
    const byProduct = {};

    defects.forEach(d => {
      const s = d.severity || 'Unknown';
      bySeverity[s] = (bySeverity[s] || 0) + 1;

      const sc = d.securityClass || 'Unclassified';
      bySecurityClassification[sc] = (bySecurityClassification[sc] || 0) + 1;

      byProduct[d.product] = (byProduct[d.product] || 0) + 1;
    });

    const result = {
      total: defects.length,
      critical: defects.filter(d => ['S1', 'S2'].includes(d.severity)).length,
      defects,
      bySeverity,
      bySecurityClassification,
      byProduct,
      updatedAt: new Date().toISOString(),
    };

    cacheService.set('security', result);
    res.json(result);
  } catch (error) {
    console.error('Security report error:', error);
    res.status(500).json({ error: error.message });
  }
});

const SECURITY_UTA_JQL = 'reporter = svc_DevSecOps_RW and component = UTA and status not in (Closed, Canceled)';
const SECURITY_UTM_JQL = 'reporter = svc_DevSecOps_RW and component = UTM and status not in (Closed, Canceled)';
const SECURITY_WFM_JQL = 'reporter = svc_DevSecOps_RW and component = "WFM Classic" and status not in (Closed, Canceled)';

async function buildProductSecurityResult(jql) {
  let defects = [];
  try {
    const rawIssues = await fetchIssues(jql, 500, SECURITY_FIELDS);
    defects = rawIssues.map(issue => {
      const fields = issue.fields || {};
      const severityRaw = fields.customfield_10704;
      const severity = severityRaw?.value || (typeof severityRaw === 'string' ? severityRaw : null);
      return {
        key: issue.key,
        summary: fields.summary || '',
        status: fields.status?.name || 'Unknown',
        priority: fields.priority?.name || 'Unknown',
        severity: severity || null,
        assignee: fields.assignee?.displayName || null,
        tveSubmitted: (fields.labels || []).some(l => l.toUpperCase().includes('TVE-SUBMITTED')),
      };
    });
  } catch (err) {
    console.warn('Security product JQL query failed, returning empty results:', err.message);
    defects = [];
  }

  const bySeverity = {};
  defects.forEach(d => {
    const s = d.severity || 'Unknown';
    bySeverity[s] = (bySeverity[s] || 0) + 1;
  });
  return {
    total: defects.length,
    critical: defects.filter(d => ['S1', 'S2'].includes(d.severity)).length,
    defects,
    bySeverity,
    updatedAt: new Date().toISOString(),
  };
}

function makeProductSecurityRoute(cacheKey, jql, label) {
  return async (req, res) => {
    try {
      const cached = cacheService.get(cacheKey);
      if (cached) return res.json(cached);
      const result = await buildProductSecurityResult(jql);
      cacheService.set(cacheKey, result);
      res.json(result);
    } catch (error) {
      console.error(`Security ${label} report error:`, error);
      res.status(500).json({ error: error.message });
    }
  };
}

// GET /api/reports/security/uta
router.get('/security/uta',        makeProductSecurityRoute('security_uta', SECURITY_UTA_JQL, 'UTA'));
// GET /api/reports/security/utm
router.get('/security/utm',        makeProductSecurityRoute('security_utm', SECURITY_UTM_JQL, 'UTM'));
// GET /api/reports/security/wfm-classic
router.get('/security/wfm-classic',makeProductSecurityRoute('security_wfm', SECURITY_WFM_JQL, 'WFM Classic'));

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
