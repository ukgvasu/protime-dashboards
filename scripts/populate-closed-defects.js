#!/usr/bin/env node

/**
 * Populate closed Portfolio Team 3121 defects from last 90 days
 * For filing noise metric calculation
 *
 * JQL: "Portfolio Team" = 3121 AND type = defect AND status = closed AND resolved >= -90d
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { dbManager } from '../backend/src/models/database.js';
import { DefectModel } from '../backend/src/models/defect.js';
import { parseISO, differenceInDays } from 'date-fns';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Helper function to extract area from labels
function extractArea(labels) {
  if (!labels || labels.length === 0) return 'Other / Uncategorized';

  const labelStr = labels.join(' ').toLowerCase();

  if (labelStr.includes('utamobileapp')) return 'Mobile App';
  if (labelStr.includes('utabal') || labelStr.includes('utaaccrual')) return 'Balances & Accruals';
  if (labelStr.includes('utatimeoff')) return 'Time Off';
  if (labelStr.includes('utadailyts') || labelStr.includes('utaweeklyts')) return 'Timesheets';
  if (labelStr.includes('utasummary')) return 'Period Summary';
  if (labelStr.includes('utajobsked') || labelStr.includes('utasched')) return 'Scheduling';
  if (labelStr.includes('utaport')) return 'Portals';
  if (labelStr.includes('utaalert')) return 'Alerts';
  if (labelStr.includes('utamess')) return 'Messaging';
  if (labelStr.includes('utasplitclock')) return 'Split Clocks';
  if (labelStr.includes('utareport')) return 'Reports';
  if (labelStr.includes('utaupgrade')) return 'Upgrade (General)';

  return 'Other / Uncategorized';
}

function transformIssue(issue) {
  const fields = issue.fields;
  const customers = fields.customfield_10503?.value || [];
  const customerCount = Array.isArray(customers) ? customers.length : 0;

  // Check for RCA-Type-Defect label (case insensitive)
  const labels = fields.labels || [];
  const isCustomerReported = labels.some(l => l.toLowerCase() === 'rca-type-defect');

  const isSecurity = labels.some(l =>
    l.toLowerCase().includes('security') ||
    l.toLowerCase().includes('cve')
  );

  const severity = fields.customfield_10704?.value || 'S4';
  const area = extractArea(labels);

  const now = new Date();
  const created = parseISO(fields.created);
  const updated = parseISO(fields.updated);
  const ageDays = differenceInDays(now, created);

  // Determine resolution_date with fallback
  let resolutionDate = fields.resolutiondate;
  if (!resolutionDate && ['Closed', 'Done', 'Canceled', 'Resolved'].includes(fields.status?.name)) {
    resolutionDate = fields.updated;
  }

  return {
    id: issue.id,
    product: 'uta',
    key: issue.key,
    summary: fields.summary,
    priority: fields.priority?.name || 'None',
    severity: severity,
    status: fields.status?.name || 'Unknown',
    assignee: fields.assignee?.displayName === 'Unassigned' ? null : fields.assignee?.displayName,
    assignee_email: fields.assignee?.emailAddress || null,
    reporter: fields.reporter?.displayName || null,
    labels: labels,
    components: fields.components?.map(c => c.name) || [],
    created_at: fields.created,
    updated_at: fields.updated,
    resolved_at: resolutionDate || null,
    age_days: ageDays,
    is_customer_reported: isCustomerReported,
    is_security: isSecurity,
    jira_url: `https://engjira.int.kronos.com/browse/${issue.key}`,
    raw: issue,
    area: area,
    issue_type: fields.issuetype?.name || null,
    resolution: fields.resolution?.name || null,
    resolution_date: resolutionDate || null,
    customers: customers,
    customer_count: customerCount
  };
}

async function populate() {
  try {
    console.log('🔧 Initializing database...');
    await dbManager.initialize();
    console.log('✅ Database ready\n');

    console.log('📋 This script requires closed defects data from Jira.');
    console.log('⚠️  Current database only has open defects.');
    console.log('\nTo populate filing noise metric, you need to:');
    console.log('1. Query Jira MCP: "Portfolio Team" = 3121 AND type = defect AND status = closed AND resolved >= -90d');
    console.log('2. Add the results to this script as ALL_CLOSED_DEFECTS array');
    console.log('3. Run this script again\n');

    // Placeholder for closed defects data
    const ALL_CLOSED_DEFECTS = [];

    if (ALL_CLOSED_DEFECTS.length === 0) {
      console.log('ℹ️  No closed defects data available yet.');
      console.log('   Use Jira MCP to fetch closed defects and add them to this script.\n');
      return;
    }

    console.log(`Processing ${ALL_CLOSED_DEFECTS.length} closed defects...\n`);

    let noiseCount = 0;
    const noiseResolutions = ['Not a Defect', 'Not a Bug', 'Won\'t Fix', 'Duplicate', 'Cannot Reproduce', 'Working as Expected'];

    for (const issue of ALL_CLOSED_DEFECTS) {
      const defect = transformIssue(issue);

      // Insert or update (will merge with existing data)
      DefectModel.insert(defect);

      if (noiseResolutions.includes(defect.resolution)) {
        noiseCount++;
        console.log(`  📊 Noise: ${defect.key} - ${defect.resolution}`);
      } else {
        console.log(`  ✅ Fixed: ${defect.key} - ${defect.resolution || 'None'}`);
      }
    }

    console.log('\n✅ Closed defects population complete!');
    console.log(`Total closed defects: ${ALL_CLOSED_DEFECTS.length}`);
    console.log(`Filing noise (non-defect resolutions): ${noiseCount}`);
    console.log(`Actual defects fixed: ${ALL_CLOSED_DEFECTS.length - noiseCount}`);

    // Trigger backend reload
    console.log('\n🔄 Attempting to reload backend database...');
    try {
      const response = await fetch('http://localhost:3001/api/db/reload', {
        method: 'POST'
      });
      if (response.ok) {
        console.log('✅ Backend database reloaded successfully');
      } else {
        console.log('⚠️  Backend reload failed (server may not be running)');
      }
    } catch (error) {
      console.log('⚠️  Could not reload backend (server may not be running)');
    }
  } catch (error) {
    console.error('Error during population:', error);
    process.exit(1);
  }
}

populate();
