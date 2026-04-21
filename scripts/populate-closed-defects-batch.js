#!/usr/bin/env node

/**
 * Populate closed Portfolio Team 3121 defects from last 90 days
 * This script contains all 174 closed defects fetched from Jira
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { dbManager } from '../backend/src/models/database.js';
import { DefectModel } from '../backend/src/models/defect.js';
import { parseISO, differenceInDays } from 'date-fns';
import fs from 'fs';

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
  // Jira MCP tool returns flattened structure (not nested under 'fields')
  const customers = issue.customfield_10503?.value || [];
  const customerCount = Array.isArray(customers) ? customers.length : 0;

  // Check for RCA-Type-Defect label (case insensitive)
  const labels = issue.labels || [];
  const isCustomerReported = labels.some(l => l.toLowerCase() === 'rca-type-defect');

  const isSecurity = labels.some(l =>
    l.toLowerCase().includes('security') ||
    l.toLowerCase().includes('cve')
  );

  const severity = issue.customfield_10704?.value || 'S4';
  const area = extractArea(labels);

  const now = new Date();
  const created = parseISO(issue.created);
  const updated = parseISO(issue.updated);
  const ageDays = differenceInDays(now, created);

  // Determine resolution_date with fallback
  let resolutionDate = issue.resolutiondate;
  if (!resolutionDate && ['Closed', 'Done', 'Canceled', 'Resolved'].includes(issue.status?.name)) {
    resolutionDate = issue.updated;
  }

  return {
    id: issue.id,
    product: 'uta',
    key: issue.key,
    summary: issue.summary,
    priority: issue.priority?.name || 'None',
    severity: severity,
    status: issue.status?.name || 'Unknown',
    assignee: issue.assignee?.display_name === 'Unassigned' ? null : issue.assignee?.display_name,
    assignee_email: issue.assignee?.email || null,
    reporter: issue.reporter?.display_name || null,
    labels: labels,
    components: issue.components?.map(c => c.name) || [],
    created_at: issue.created,
    updated_at: issue.updated,
    resolved_at: resolutionDate || null,
    age_days: ageDays,
    is_customer_reported: isCustomerReported,
    is_security: isSecurity,
    jira_url: `https://engjira.int.kronos.com/browse/${issue.key}`,
    raw: issue,
    area: area,
    issue_type: issue.issue_type?.name || null,
    resolution: issue.resolution?.name || null,
    resolution_date: resolutionDate || null,
    customers: customers,
    customer_count: customerCount
  };
}

async function populate() {
  try {
    console.log('🔧 Initializing database...');
    await dbManager.initialize();
    const db = dbManager.getDatabase();
    console.log('✅ Database ready');
    console.log(`   Database path: ${db.dbPath}\n`);

    // Load all 4 data files
    const dataFiles = [
      '/home/iancowpar/.claude/projects/-home-iancowpar/ba3ef518-caf6-4520-9264-c0125f45f8d7/tool-results/toolu_vrtx_01N3ECqBfaKkg3p3WstiU9KK.txt',
      '/home/iancowpar/.claude/projects/-home-iancowpar/ba3ef518-caf6-4520-9264-c0125f45f8d7/tool-results/toolu_vrtx_015try6ytptiU1QBjsMAx1LA.txt',
      '/home/iancowpar/.claude/projects/-home-iancowpar/ba3ef518-caf6-4520-9264-c0125f45f8d7/tool-results/toolu_vrtx_01C7gGB4xAkmTpH6ojSxdBty.txt',
      '/home/iancowpar/.claude/projects/-home-iancowpar/ba3ef518-caf6-4520-9264-c0125f45f8d7/tool-results/toolu_vrtx_01NNYUuqWD8ksZUBB7fG85GL.txt'
    ];

    let allIssues = [];

    console.log('📂 Loading Jira data files...');
    for (const file of dataFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const data = JSON.parse(JSON.parse(content).result);
        allIssues = allIssues.concat(data.issues);
        console.log(`   Loaded ${data.issues.length} issues from ${file.split('/').pop()}`);
      } catch (err) {
        console.error(`   Error loading ${file}:`, err.message);
      }
    }

    console.log(`\n✅ Total issues loaded: ${allIssues.length}`);
    console.log(`\nProcessing ${allIssues.length} closed defects...\n`);

    let noiseCount = 0;
    const noiseResolutions = ['Not a Defect', 'Not a Bug', 'Won\'t Fix', 'Duplicate', 'Cannot Reproduce', 'Working as Expected', 'Not Reproducible', 'No Plans to Fix'];

    // Transform all issues
    const defects = [];
    for (const issue of allIssues) {
      const defect = transformIssue(issue);
      defects.push(defect);

      if (noiseResolutions.includes(defect.resolution)) {
        noiseCount++;
        console.log(`  📊 Noise: ${defect.key} - ${defect.resolution}`);
      } else {
        console.log(`  ✅ Fixed: ${defect.key} - ${defect.resolution || 'None'}`);
      }
    }

    // Insert defects one by one (auto-saves after each)
    console.log('\n💾 Inserting defects into database...');
    try {
      let inserted = 0;
      for (const defect of defects) {
        DefectModel.insert(defect);
        inserted++;
        if (inserted % 50 === 0) {
          console.log(`   Inserted ${inserted}/${defects.length}...`);
        }
      }
      console.log(`✅ All ${inserted} defects inserted`);
    } catch (err) {
      console.error('❌ Insert failed:', err.message);
      console.error(err.stack);
      throw err;
    }

    console.log('\n✅ Closed defects population complete!');
    console.log(`Total closed defects: ${allIssues.length}`);
    console.log(`Filing noise (non-defect resolutions): ${noiseCount}`);
    console.log(`Actual defects fixed: ${allIssues.length - noiseCount}`);
    console.log(`Filing Noise Rate: ${((noiseCount / allIssues.length) * 100).toFixed(1)}%`);

    // Verify data is in memory before closing
    console.log('\n🔍 Verifying data before close...');
    const verifyDb = dbManager.getDatabase();
    const closedInMemory = verifyDb.prepare('SELECT COUNT(*) as count FROM defects WHERE status = ?').get('Closed');
    console.log(`   Closed defects in memory: ${closedInMemory.count}`);

    // Close database to ensure writes are flushed
    console.log('\n💾 Saving database to disk...');
    dbManager.close();
    console.log(`✅ Database saved to ${verifyDb.dbPath}`);

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
