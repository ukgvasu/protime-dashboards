#!/usr/bin/env node

/**
 * Refresh UTA defects from Jira using MCP search results
 *
 * This script expects you to:
 * 1. Run the Jira MCP search with the UTA board JQL
 * 2. Paste the results below as JIRA_RESULTS
 * 3. Run this script to populate the database
 */

import { dbManager } from '../backend/src/models/database.js';
import { DefectModel } from '../backend/src/models/defect.js';
import { parseISO, differenceInDays } from 'date-fns';

console.log('⚠️  This script requires fresh Jira MCP search results');
console.log('   Run this JQL query:');
console.log('   "Portfolio Team" = 3121 AND (issuetype in (Bug, Defect) OR labels = "RCA-Type-Defect")');
console.log('   AND NOT labels in (Checkmarx, SCA, bitsight, automation, SAST, DAST)');
console.log('   AND statusCategory != Done');
console.log('   ');
console.log('   Then paste the results as JIRA_RESULTS below and run this script again.\n');

// PASTE JIRA MCP SEARCH RESULTS HERE
const JIRA_RESULTS = null;

if (!JIRA_RESULTS || !JIRA_RESULTS.issues || JIRA_RESULTS.issues.length === 0) {
  console.log('❌ No Jira data provided. Please paste the MCP search results into this script.');
  process.exit(1);
}

function classifyArea(labels) {
  if (!labels || labels.length === 0) return 'Other / Uncategorized';

  const labelStr = labels.join(' ').toLowerCase();

  if (labelStr.includes('utaupgrade') || labelStr.includes('upgrade')) return 'Upgrade';
  if (labelStr.includes('utajobsked') || labelStr.includes('scheduling')) return 'Scheduling';
  if (labelStr.includes('utatimeoff') || labelStr.includes('timeoff')) return 'Time Off';
  if (labelStr.includes('utadailyts') || labelStr.includes('utaweeklyts') || labelStr.includes('timesheet')) return 'Timesheets';
  if (labelStr.includes('utamobileapp') || labelStr.includes('mobile')) return 'Mobile App';
  if (labelStr.includes('utabal') || labelStr.includes('balance') || labelStr.includes('entitle')) return 'Balances';
  if (labelStr.includes('utaport') || labelStr.includes('portal')) return 'Portals';
  if (labelStr.includes('utareport')) return 'Reports';
  if (labelStr.includes('utaalert')) return 'Alerts';
  if (labelStr.includes('utacustoms')) return 'Customs';

  return 'Other / Uncategorized';
}

function transformDefect(jiraIssue) {
  const now = new Date();
  const created = parseISO(jiraIssue.created);
  const updated = parseISO(jiraIssue.updated);
  const ageDays = differenceInDays(now, created);

  // Extract customers from customfield_10503
  const customersField = jiraIssue.customfield_10503;
  let customers = [];
  if (customersField && customersField.value) {
    customers = Array.isArray(customersField.value) ? customersField.value : [customersField.value];
  }
  const customerCount = customers.length;

  // Check for RCA-Type-Defect label
  const hasRcaLabel = jiraIssue.labels?.some(l =>
    l.toUpperCase() === 'RCA-TYPE-DEFECT'
  );

  // Classify area from labels
  const area = classifyArea(jiraIssue.labels);

  return {
    id: jiraIssue.id,
    product: 'uta',
    key: jiraIssue.key,
    summary: jiraIssue.summary,
    priority: jiraIssue.priority?.name || 'None',
    severity: jiraIssue.customfield_10704?.value || null,
    status: jiraIssue.status?.name || 'Unknown',
    assignee: jiraIssue.assignee?.display_name || null,
    assignee_email: jiraIssue.assignee?.email || null,
    reporter: jiraIssue.reporter?.display_name || null,
    labels: jiraIssue.labels || [],
    components: jiraIssue.components || [],
    created_at: jiraIssue.created,
    updated_at: jiraIssue.updated,
    resolved_at: jiraIssue.resolutiondate || null,
    age_days: ageDays,
    is_customer_reported: hasRcaLabel ? 1 : 0,
    is_security: 0,
    jira_url: `https://engjira.int.kronos.com/browse/${jiraIssue.key}`,
    raw: jiraIssue,
    area,
    issue_type: jiraIssue.issue_type?.name || 'Bug',
    resolution: jiraIssue.resolution || null,
    resolution_date: jiraIssue.resolutiondate || null,
    customers: customers,
    customer_count: customerCount
  };
}

async function refresh() {
  try {
    console.log('🔧 Initializing database...');
    await dbManager.initialize();
    console.log('✅ Database ready\n');

    const defects = JIRA_RESULTS.issues.map(transformDefect);

    console.log(`📥 Refreshing UTA with ${defects.length} defects from Jira...`);
    console.log(`   Total from Jira: ${JIRA_RESULTS.total}\n`);

    // Delete existing UTA data
    DefectModel.deleteByProduct('uta');

    // Insert fresh data
    DefectModel.bulkInsert(defects);

    const stats = DefectModel.getStats('uta');

    console.log('✅ UTA data refreshed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Total: ${stats.total}`);
    console.log(`   P1: ${stats.p1}, P2: ${stats.p2}`);
    console.log(`   Customer-facing: ${stats.customer_impacting}`);
    console.log(`\n🎉 Database updated!\n`);

  } catch (error) {
    console.error('❌ Refresh failed:', error);
    process.exit(1);
  } finally {
    dbManager.close();
  }
}

refresh();
