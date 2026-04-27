import axios from 'axios';
import { differenceInDays, parseISO } from 'date-fns';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL || 'https://engjira.int.kronos.com';

// Read PAT lazily so dotenv has time to populate process.env
function getJiraClient() {
  return axios.create({
    baseURL: JIRA_BASE_URL,
    headers: {
      'Authorization': `Bearer ${process.env.JIRA_PAT}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: 30000,
  });
}

// Keep a cached client but recreate if PAT changes (e.g. after dotenv loads)
let _client = null;
let _clientPat = null;
function jiraClient() {
  const pat = process.env.JIRA_PAT;
  if (!_client || pat !== _clientPat) {
    _client = getJiraClient();
    _clientPat = pat;
  }
  return _client;
}

const DEFAULT_FIELDS = [
  'summary', 'status', 'priority', 'assignee', 'reporter', 'created', 'updated',
  'resolutiondate', 'resolution', 'issuetype', 'labels', 'components',
  'customfield_10704', // severity
  'customfield_10503', // impacted customers
  'customfield_22500', // portfolio team
  'customfield_25700', // deployment version
];

export async function fetchIssues(jql, maxResults = 500, fields = null) {
  const allIssues = [];
  let startAt = 0;
  const pageSize = 100;

  while (true) {
    const response = await jiraClient().post('/rest/api/2/search', {
      jql,
      maxResults: pageSize,
      startAt,
      fields: fields || DEFAULT_FIELDS,
    });

    const issues = response.data.issues || [];
    allIssues.push(...issues);

    if (allIssues.length >= response.data.total || issues.length < pageSize || allIssues.length >= maxResults) break;
    startAt += pageSize;
  }

  return allIssues;
}

export async function fetchBoardIssues(boardId, jql) {
  try {
    const response = await jiraClient().get(`/rest/agile/1.0/board/${boardId}/issue`, {
      params: { jql, maxResults: 100, fields: 'summary,status,priority,labels,components,issuetype' }
    });
    return response.data.issues || [];
  } catch {
    return [];
  }
}

export async function fetchSprintIssues(boardId) {
  try {
    const sprintRes = await jiraClient().get(`/rest/agile/1.0/board/${boardId}/sprint`, {
      params: { state: 'active' }
    });
    const sprints = sprintRes.data.values || [];
    if (!sprints.length) return [];

    const sprintId = sprints[0].id;
    const issuesRes = await jiraClient().get(`/rest/agile/1.0/sprint/${sprintId}/issue`, {
      params: { maxResults: 200, fields: 'summary,labels,components,issuetype,priority' }
    });
    return issuesRes.data.issues || [];
  } catch {
    return [];
  }
}

export function transformIssue(issue, product) {
  const fields = issue.fields || {};
  const createdDate = fields.created ? parseISO(fields.created) : new Date();
  const now = new Date();
  const ageDays = differenceInDays(now, createdDate);

  // Severity from customfield_10704
  const severity = fields.customfield_10704?.value || fields.customfield_10704 || null;

  // Customers from customfield_10503
  let customers = [];
  let customerCount = 0;
  try {
    const rawCustomers = fields.customfield_10503;
    if (Array.isArray(rawCustomers)) {
      customers = rawCustomers.map(c => typeof c === 'string' ? c : (c.value || c.name || c.displayName || ''));
      customerCount = customers.filter(Boolean).length;
    } else if (typeof rawCustomers === 'string' && rawCustomers.trim()) {
      customers = [rawCustomers];
      customerCount = 1;
    }
  } catch { /* ignore */ }

  // Labels
  const labels = fields.labels || [];
  const labelsStr = labels.join(',');

  // Customer-reported = has RCA-Type-Defect label
  const isCustomerReported = labels.some(l =>
    l.toUpperCase() === 'RCA-TYPE-DEFECT' || l.toUpperCase() === 'RCA-TYPE-DEFECT'
  );

  // Upgrade flags
  const isUpgrade25 = labels.some(l => l.toUpperCase().includes('UTAUPGRADE25'));
  const isUpgrade26 = labels.some(l => l.toUpperCase().includes('UTAUPGRADE26'));

  // Resolution time
  let resolutionTimeDays = null;
  if (fields.resolutiondate && fields.created) {
    const resolvedDate = parseISO(fields.resolutiondate);
    resolutionTimeDays = differenceInDays(resolvedDate, createdDate);
    if (resolutionTimeDays < 0) resolutionTimeDays = 0;
  }

  // Area from components or first label
  const area = fields.components?.[0]?.name || labels.find(l => !l.startsWith('RCA')) || 'Unknown';

  return {
    id: issue.id,
    key: issue.key,
    product,
    summary: fields.summary || '',
    status: fields.status?.name || 'Unknown',
    priority: fields.priority?.name || 'Unknown',
    severity: severity ? String(severity) : null,
    assignee: fields.assignee?.displayName || null,
    reporter: fields.reporter?.displayName || null,
    area,
    labels: labelsStr,
    customer_count: customerCount,
    customers,
    is_customer_reported: isCustomerReported,
    age_days: ageDays,
    created_at: fields.created,
    updated_at: fields.updated,
    resolution_date: fields.resolutiondate || null,
    resolution: fields.resolution?.name || null,
    issue_type: fields.issuetype?.name || 'Unknown',
    raw: { id: issue.id, key: issue.key, fields },
    is_upgrade_25: isUpgrade25,
    is_upgrade_26: isUpgrade26,
    resolution_time_days: resolutionTimeDays,
  };
}
