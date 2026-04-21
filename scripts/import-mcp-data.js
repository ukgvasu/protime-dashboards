#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { dbManager } from '../backend/src/models/database.js';
import { DefectModel } from '../backend/src/models/defect.js';
import { SnapshotModel } from '../backend/src/models/snapshot.js';
import { differenceInDays, parseISO } from 'date-fns';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load MCP-fetched data
const dataPath = join(__dirname, 'mcp-defects.json');
const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   📥 Import MCP-Fetched Defects                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

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
    id: issue.key, // Use key as ID for now
    product,
    key: issue.key,
    summary: issue.summary,
    priority: issue.priority?.name || 'None',
    severity: extractSeverity(labels),
    status: issue.status?.name || 'Unknown',
    assignee: assigneeName,
    assignee_email: assigneeEmail,
    reporter: null, // Not available in MCP data
    labels: labels,
    components: [], // Not available in MCP data
    created_at: created.toISOString(),
    updated_at: parseISO(issue.updated).toISOString(),
    resolved_at: null, // Not available for open defects
    age_days: ageDays,
    is_customer_reported: isCustomerReported(labels) ? 1 : 0,
    is_security: isSecurityDefect(labels, issue.summary) ? 1 : 0,
    jira_url: `https://engjira.int.kronos.com/browse/${issue.key}`,
    raw: issue
  };
}

async function importData() {
  try {
    // Initialize database
    console.log('🔧 Initializing database...');
    await dbManager.initialize();
    console.log('✅ Database ready\n');

    for (const [productKey, data] of Object.entries(rawData)) {
      console.log(`📦 Processing ${productKey.toUpperCase()}...`);

      const defects = data.issues.map(issue => transformDefect(issue, productKey));
      console.log(`   Found ${defects.length} defects`);

      console.log(`💾 Saving to database...`);
      DefectModel.bulkInsert(defects);

      const stats = DefectModel.getStats(productKey);
      console.log(`   Stats: ${stats.total} total, P1:${stats.p1} P2:${stats.p2}, Unassigned:${stats.unassigned}`);

      console.log(`📸 Creating snapshot...`);
      SnapshotModel.create(productKey, stats);

      console.log(`✅ ${productKey.toUpperCase()} import complete\n`);
    }

    const totalDefects = Object.values(rawData).reduce((sum, data) => sum + data.issues.length, 0);
    console.log(`\n✅ Total: ${totalDefects} defects imported across all products\n`);
    console.log(`🎉 Import complete! You can now start the API server.\n`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    dbManager.close();
  }
}

importData();
