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
  'customfield_10704', // severity
  'customfield_22500', // portfolio team
  'customfield_25700', // deployment version
  'customfield_10905', // business epic (if it exists)
  'customfield_10903', // health status (common field ID)
  'customfield_10904', // health check
  'customfield_10001', // story points / SWAG option 1
  'customfield_10002', // story points / SWAG option 2
  'customfield_10000', // story points / SWAG option 3
  'customfield_10087', // story points / SWAG option 4
  'customfield_10088', // story points / SWAG option 5
  'progress',
  'duedate',
  'issuelinks'
];

function getHealthStatus(fields) {
  // Check for explicit health field
  const healthField = fields.customfield_10903 || fields.customfield_10904;
  if (healthField) {
    if (typeof healthField === 'object' && healthField.value) {
      return healthField.value;
    }
    if (typeof healthField === 'string') {
      return healthField;
    }
  }

  // Fall back to status-based health determination
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

function extractSWAG(fields, issueKey) {
  // SWAG field ID is customfield_18302 (from swag-actuals.js)
  if (fields.customfield_18302) {
    const val = parseFloat(fields.customfield_18302);
    if (!isNaN(val)) {
      return val;
    }
  }

  // customfield_18302 not found, return 0
  return 0;
}

function transformEpic(issue, index) {
  const fields = issue.fields || {};
  const assignee = fields.assignee;
  const healthStatus = getHealthStatus(fields);
  const swag = extractSWAG(fields, issue.key);

  // Log first epic's field names for debugging
  if (index === 0) {
    console.log(`[transformEpic] First epic (${issue.key}) field keys:`, Object.keys(fields).sort());
  }

  return {
    key: issue.key,
    name: fields.summary || '',
    status: fields.status?.name || 'To Do',
    owner: assignee?.displayName || null,
    health: healthStatus,
    progress: Math.round((fields.customfield_10905?.progress || 0) * 100),
    dueDate: fields.duedate || null,
    swag: swag
  };
}

// Fetch and sum story points from child issues
async function getChildStoriesTotal(epicKey) {
  try {
    // Try different field names for Epic Link
    let childIssues = [];
    const childJqlOptions = [
      `"Epic Link" = "${epicKey}"`,
      `epicLink = "${epicKey}"`,
      `parent = "${epicKey}"`
    ];

    for (const childJql of childJqlOptions) {
      try {
        const comprehensiveFields = [
          'key', 'summary',
          'customfield_10001', 'customfield_10002', 'customfield_10000', 'customfield_10003', 'customfield_10004',
          'customfield_10087', 'customfield_10088', 'customfield_10089', 'customfield_10090', 'customfield_10091',
          'customfield_20000', 'customfield_20001', 'customfield_20002', 'customfield_20003', 'customfield_20004',
          'customfield_50000', 'customfield_50001', 'customfield_50002', 'customfield_50003', 'customfield_50004'
        ];
        childIssues = await fetchIssues(childJql, 500, comprehensiveFields);
        if (childIssues.length > 0) {
          console.log(`[getChildStoriesTotal] Found ${childIssues.length} issues for ${epicKey} using: ${childJql}`);
          break;
        }
      } catch (err) {
        // Try next option
        continue;
      }
    }

    let totalSWAG = 0;
    for (const issue of childIssues) {
      const swag = extractSWAG(issue.fields || {}, issue.key);
      totalSWAG += swag;
    }

    return totalSWAG;
  } catch (err) {
    console.error(`Error fetching child issues for ${epicKey}:`, err.message);
    return 0;
  }
}

// GET /api/fy27/:product - Get FY27 H1 Business Epics for a product
router.get('/:product', async (req, res) => {
  try {
    const { product } = req.params;
    const teamName = PRODUCT_TEAM_MAP[product];

    if (!teamName) {
      return res.status(400).json({
        error: `Invalid product: ${product}. Must be one of: ${Object.keys(PRODUCT_TEAM_MAP).join(', ')}`
      });
    }

    const cacheKey = `fy27:${product}:h1`;
    const cached = cacheService.get(cacheKey);
    if (cached) return res.json(cached);

    // JQL Query: type = "Business epic" AND "Portfolio Team Name" in (product) AND summary ~ "FY27 H1"
    // For WFM Classic, search by summary with "WFM Classic" specifically
    let jql = `type = "Business epic" AND "Portfolio Team Name" in ("${teamName}") AND summary ~ "FY27 H1"`;
    if (product === 'wfmClassic') {
      jql = `type = "Business epic" AND summary ~ "WFM Classic" AND summary ~ "FY27 H1"`;
    }

    console.log(`[fy27/${product}] Fetching Business Epics with JQL:`, jql);

    // Request fields including SWAG field (customfield_18302)
    const comprehensiveFields = [
      'key', 'summary', 'status', 'assignee', 'priority', 'progress', 'duedate', 'issuelinks',
      'customfield_18302', // SWAG field
      'customfield_10905', // health status
      'customfield_10903', 'customfield_10904',
      'customfield_22500', 'customfield_22201', // portfolio team (different field for WFM Classic)
      'customfield_25700'
    ];

    const issues = await fetchIssues(jql, 500, comprehensiveFields);

    console.log(`[fy27/${product}] Found ${issues.length} Business Epics`);

    // Log first epic's fields for debugging
    if (issues.length > 0) {
      console.log(`[fy27/${product}] First epic fields:`, Object.keys(issues[0].fields || {}));
      console.log(`[fy27/${product}] First epic (EP-${issues[0].key}):`, JSON.stringify(issues[0], null, 2).substring(0, 500));
    }

    let epics = issues.map((issue, index) => transformEpic(issue, index)).sort((a, b) => {
      // Sort by status priority: At Risk first, then In Progress, then On Track, then others
      const statusOrder = { 'At Risk': 0, 'In Progress': 1, 'On Track': 2 };
      const orderA = statusOrder[a.status] ?? 999;
      const orderB = statusOrder[b.status] ?? 999;
      return orderA - orderB;
    });

    const stats = {
      totalEpics: epics.length,
      completedEpics: epics.filter(e => e.status === 'Done' || e.status === 'Completed').length,
      atRiskEpics: epics.filter(e => e.status === 'At Risk').length,
      plannedSWAG: epics.reduce((sum, e) => sum + (e.swag || 0), 0)
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
    console.error(`[fy27/${req.params.product}] error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Debug endpoint to inspect specific epic fields
router.get('/debug/:epicKey', async (req, res) => {
  try {
    const { epicKey } = req.params;
    const jql = `key = "${epicKey}"`;

    // Generate all custom field IDs from 10000 to 30000 to ensure we catch the SWAG field
    const comprehensiveFields = ['key', 'summary', 'status', 'assignee', 'priority', 'progress', 'duedate', 'issuelinks'];
    for (let i = 10000; i <= 30000; i++) {
      comprehensiveFields.push(`customfield_${i}`);
    }

    const issues = await fetchIssues(jql, 1, comprehensiveFields);

    if (issues.length === 0) {
      return res.json({ error: 'Epic not found' });
    }

    const issue = issues[0];
    const fields = issue.fields || {};

    // Return all fields with their values, including numeric ones
    const fieldDebug = {};
    const numericFields = [];

    for (const [key, value] of Object.entries(fields)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (typeof value === 'object' && value.value !== undefined) {
        fieldDebug[key] = value.value;
        if (typeof value.value === 'number' && value.value === 64) {
          numericFields.push({ field: key, value: value.value, type: 'object' });
        }
      } else if (typeof value === 'number') {
        fieldDebug[key] = value;
        if (value === 64) {
          numericFields.push({ field: key, value: value, type: 'number' });
        }
      } else if (typeof value === 'string') {
        fieldDebug[key] = value;
        if (!isNaN(value) && Number(value) === 64) {
          numericFields.push({ field: key, value: Number(value), type: 'string' });
        }
      }
    }

    // Return full raw issue for inspection
    res.json({
      key: epicKey,
      issueType: issue.fields?.issuetype?.name,
      portfolioTeam: issue.fields?.customfield_22500,
      summary: issue.fields?.summary,
      customfield_18302: issue.fields?.customfield_18302,
      fieldsFound: Object.keys(fields).length,
      fieldsWithValue64: numericFields,
      // Show raw field keys to identify the SWAG field
      fieldKeys: Object.keys(fields),
      // Return first few fields as example
      sample: Object.fromEntries(Object.entries(fields).slice(0, 20))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
