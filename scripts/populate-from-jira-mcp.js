#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { dbManager } from '../backend/src/models/database.js';
import { DefectModel } from '../backend/src/models/defect.js';
import { parseISO, differenceInDays } from 'date-fns';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BOARDS_CONFIG = JSON.parse(
  fs.readFileSync(join(__dirname, '../config/jira-boards.json'), 'utf-8')
);

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   📥 ProTime Dashboard - Live Jira MCP Data Import        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

// NOTE: This script requires the Jira MCP data to be pasted in as JSON
// Run this with the jira_search output from the MCP tool

const JIRA_DATA_UTA = null; // Paste UTA data here
const JIRA_DATA_UTM = null; // Paste UTM data here
const JIRA_DATA_WFMC = null; // Paste WFM Classic data here

function classifyArea(labels) {
  if (!labels || labels.length === 0) return 'Other / Uncategorized';

  const labelStr = labels.join(' ').toLowerCase();

  if (labelStr.includes('utaupgrade') || labelStr.includes('upgrade')) return 'Upgrade (General)';
  if (labelStr.includes('utajobsked') || labelStr.includes('scheduling')) return 'Scheduling';
  if (labelStr.includes('utatimeoff') || labelStr.includes('timeoff')) return 'Time Off';
  if (labelStr.includes('utadailyts') || labelStr.includes('utaweeklyts') || labelStr.includes('timesheet')) return 'Timesheets';
  if (labelStr.includes('utamobileapp') || labelStr.includes('mobile')) return 'Mobile App';
  if (labelStr.includes('utabal') || labelStr.includes('balance') || labelStr.includes('entitle')) return 'Balances & Accruals';
  if (labelStr.includes('utaport') || labelStr.includes('portal')) return 'Portals';
  if (labelStr.includes('utareport')) return 'Reports';
  if (labelStr.includes('utaalert')) return 'Alerts';
  if (labelStr.includes('utacustoms')) return 'Customs';

  return 'Other / Uncategorized';
}

function transformDefect(jiraIssue, product) {
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
    product,
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

async function populate() {
  try {
    console.log('🔧 Initializing database...');
    await dbManager.initialize();
    console.log('✅ Database ready\n');

    console.log('⚠️  This script template requires live Jira data.');
    console.log('   Use the Jira MCP search tool to fetch defects and paste the results here.\n');
    console.log('   Example JQL for UTA:');
    console.log('   "Portfolio Team" = 3121 AND (issuetype in (Bug, Defect) OR labels = "RCA-Type-Defect")');
    console.log('   AND NOT labels in (Checkmarx, SCA, bitsight, automation, SAST, DAST)');
    console.log('   AND statusCategory != Done\n');

    // Example: if you have data pasted in
    if (JIRA_DATA_UTA || JIRA_DATA_UTM || JIRA_DATA_WFMC) {
      const allDefects = [];

      if (JIRA_DATA_UTA && JIRA_DATA_UTA.issues) {
        allDefects.push(...JIRA_DATA_UTA.issues.map(d => transformDefect(d, 'uta')));
      }
      if (JIRA_DATA_UTM && JIRA_DATA_UTM.issues) {
        allDefects.push(...JIRA_DATA_UTM.issues.map(d => transformDefect(d, 'utm')));
      }
      if (JIRA_DATA_WFMC && JIRA_DATA_WFMC.issues) {
        allDefects.push(...JIRA_DATA_WFMC.issues.map(d => transformDefect(d, 'wfmClassic')));
      }

      console.log(`📥 Importing ${allDefects.length} defects...\n`);

      DefectModel.bulkInsert(allDefects);

      console.log('✅ Data imported successfully!\n');

      const utaStats = DefectModel.getStats('uta');
      const utmStats = DefectModel.getStats('utm');
      const wfmcStats = DefectModel.getStats('wfmClassic');

      console.log('📊 Summary:');
      console.log(`   UTA: ${utaStats.total} total`);
      console.log(`   UTM: ${utmStats.total} total`);
      console.log(`   WFM Classic: ${wfmcStats.total} total`);
      console.log(`\n🎉 Database populated!\n`);
    } else {
      console.log('ℹ️  No Jira data found. Skipping import.');
      console.log('   Please paste Jira MCP search results into this script.\n');
    }

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    dbManager.close();
  }
}

populate();
