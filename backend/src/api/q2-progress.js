import express from 'express';
const { Router } = express;
import { fetchIssues } from '../services/jira-service.js';
import { cacheService } from '../services/cache-service.js';

const router = Router();

// Map product names to Jira Portfolio Team values
const PRODUCT_TEAM_MAP = {
  uta: 'UTA',
  utm: 'UTM',
  wfmClassic: 'WFM Classic'
};

// Field mappings for common Jira custom fields
const FIELDS = [
  'key',
  'summary',
  'status',
  'assignee',
  'priority',
  'customfield_10704', // severity
  'customfield_22500', // portfolio team
  'customfield_10903', // health status
  'progress',
  'duedate',
  'resolutiondate',
  'created',
  'updated',
  'issuelinks'
];

function getEpicHealth(fields) {
  const healthField = fields.customfield_10903;
  if (healthField) {
    if (typeof healthField === 'object' && healthField.value) {
      return healthField.value;
    }
    if (typeof healthField === 'string') {
      return healthField;
    }
  }

  const status = fields.status?.name || '';
  const statusLower = status.toLowerCase();

  if (statusLower.includes('at risk') || statusLower.includes('blocked')) {
    return 'At Risk';
  } else if (statusLower.includes('committed') || statusLower.includes('in progress')) {
    return 'On Track';
  } else if (statusLower.includes('done') || statusLower.includes('completed')) {
    return 'Healthy';
  }

  return 'Funnel';
}

function transformEpic(issue) {
  const fields = issue.fields || {};
  const assignee = fields.assignee;

  return {
    key: issue.key,
    name: fields.summary || '',
    status: fields.status?.name || 'To Do',
    health: getEpicHealth(fields),
    owner: assignee?.displayName || null,
    priority: fields.priority?.name || null,
    progress: Math.round((fields.progress?.progress || 0) * 100),
    dueDate: fields.duedate || null,
    resolutionDate: fields.resolutiondate || null,
    created: fields.created || null,
    issueCount: fields.issuelinks?.length || 0
  };
}

// GET /api/q2-progress/:product - Get Q2 Development Progress Epics
router.get('/:product', async (req, res) => {
  try {
    const { product } = req.params;
    const teamName = PRODUCT_TEAM_MAP[product];

    if (!teamName) {
      return res.status(400).json({
        error: `Invalid product: ${product}. Must be one of: ${Object.keys(PRODUCT_TEAM_MAP).join(', ')}`
      });
    }

    const cacheKey = `q2-progress:${product}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return res.json(cached);

    // JQL Query: type = "Epic" AND "Portfolio Team Name" in (product) AND summary ~ "Q2"
    const jql = `type = "Epic" AND "Portfolio Team Name" in ("${teamName}") AND summary ~ "Q2" AND created >= -90d ORDER BY priority DESC, created DESC`;

    console.log(`[q2-progress/${product}] Fetching Epics with JQL:`, jql);

    const issues = await fetchIssues(jql, 500, FIELDS);

    console.log(`[q2-progress/${product}] Found ${issues.length} Epics`);

    const epics = issues.map(transformEpic).sort((a, b) => {
      // Sort by health priority: At Risk first, then Funnel, then On Track, then Healthy
      const healthOrder = { 'At Risk': 0, 'Funnel': 1, 'On Track': 2, 'Healthy': 3 };
      const orderA = healthOrder[a.health] ?? 999;
      const orderB = healthOrder[b.health] ?? 999;
      if (orderA !== orderB) return orderA - orderB;

      // Then by progress (lower progress first)
      return (a.progress || 0) - (b.progress || 0);
    });

    const stats = {
      totalEpics: epics.length,
      atRiskEpics: epics.filter(e => e.health === 'At Risk').length,
      onTrackEpics: epics.filter(e => e.health === 'On Track').length,
      healthyEpics: epics.filter(e => e.health === 'Healthy').length,
      plannedSWAG: 0
    };

    const result = {
      product,
      team: teamName,
      epics,
      stats
    };

    // Cache for 5 minutes
    cacheService.set(cacheKey, result, 300);

    res.json(result);
  } catch (err) {
    console.error(`[q2-progress/${req.params.product}] error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
