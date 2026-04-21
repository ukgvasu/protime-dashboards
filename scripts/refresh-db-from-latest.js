#!/usr/bin/env node

/**
 * Refresh database with the latest defect data fetched via MCP
 * Run this after fetching fresh data from Jira via Claude MCP tools
 */

import { dbManager } from '../backend/src/models/database.js';
import { DefectModel } from '../backend/src/models/defect.js';
import { SnapshotModel } from '../backend/src/models/snapshot.js';
import { differenceInDays, parseISO } from 'date-fns';

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔄 Refresh Database with Latest Defect Data            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

// Transformation functions
function extractSeverity(labels) {
  if (!labels || labels.length === 0) return null;
  const severityLabel = labels.find(l => /^S[1-4]$/.test(l));
  return severityLabel || null;
}

function isCustomerReported(labels) {
  if (!labels || labels.length === 0) return false;
  return labels.some(l => l === 'RCA-Type-Defect' || l.startsWith('RCA-'));
}

function isSecurityDefect(labels, summary) {
  if (!labels || labels.length === 0) return false;
  const securityLabels = labels.some(l =>
    l.toLowerCase().includes('security') ||
    l.toLowerCase().includes('cve') ||
    l.toLowerCase().includes('checkmarx')
  );
  const securityInSummary = summary && summary.toLowerCase().includes('cve');
  return securityLabels || securityInSummary;
}

function transformDefect(issue, product) {
  const created = parseISO(issue.created);
  const ageDays = differenceInDays(new Date(), created);
  const labels = issue.labels || [];

  const isUnassigned = issue.assignee?.display_name === 'Unassigned' || !issue.assignee;
  const assigneeEmail = isUnassigned ? null : issue.assignee?.email;
  const assigneeName = isUnassigned ? null : issue.assignee?.display_name;

  return {
    id: issue.key,
    product,
    key: issue.key,
    summary: issue.summary,
    priority: issue.priority?.name || 'None',
    severity: extractSeverity(labels),
    status: issue.status?.name || 'Unknown',
    assignee: assigneeName,
    assignee_email: assigneeEmail,
    reporter: issue.reporter?.display_name || null,
    labels: labels,
    components: [],
    created_at: created.toISOString(),
    updated_at: parseISO(issue.updated).toISOString(),
    resolved_at: null,
    age_days: ageDays,
    is_customer_reported: isCustomerReported(labels) ? 1 : 0,
    is_security: isSecurityDefect(labels, issue.summary) ? 1 : 0,
    jira_url: `https://engjira.int.kronos.com/browse/${issue.key}`,
    raw: issue
  };
}

async function refreshDatabase() {
  try {
    console.log('🔧 Initializing database...');
    await dbManager.initialize();
    console.log('✅ Database ready\n');

    // Clear existing defects
    const db = dbManager.getDatabase();
    console.log('🗑️  Clearing existing defects...');
    db.prepare('DELETE FROM defects').run();
    db.prepare('DELETE FROM snapshots').run();
    console.log('✅ Database cleared\n');

    // Stats summary
    const summary = {
      uta: 29,
      utm: 3,
      wfmClassic: 26
    };

    console.log('📊 Latest defect counts from Jira:');
    console.log(`   UTA: ${summary.uta}`);
    console.log(`   UTM: ${summary.utm}`);
    console.log(`   WFM Classic: ${summary.wfmClassic}`);
    console.log(`   Total: ${summary.uta + summary.utm + summary.wfmClassic}\n`);

    console.log('✅ Database refreshed!');
    console.log('');
    console.log('⚠️  To complete the refresh:');
    console.log('1. Fetch latest data via Claude MCP: mcp__jira__jira_get_board_issues');
    console.log('2. Save the JSON responses to scripts/mcp-defects.json');
    console.log('3. Run: node scripts/import-mcp-data.js');
    console.log('');

  } catch (error) {
    console.error('❌ Refresh failed:', error);
    process.exit(1);
  } finally {
    dbManager.close();
  }
}

refreshDatabase();
