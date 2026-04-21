#!/usr/bin/env node

import { dbManager } from '../backend/src/models/database.js';
import { DefectModel } from '../backend/src/models/defect.js';
import { parseISO, differenceInDays } from 'date-fns';

const SONY_DEFECTS = [
  {
    id: "2644495",
    key: "PS-827721",
    summary: "SONY UTA - TEST-5: Unexplained retros",
    status: { name: "Analysis" },
    issue_type: { name: "Defect" },
    priority: { name: "P3" },
    assignee: { display_name: "Kevin Bello", email: "kevin.bello@ukg.com" },
    reporter: { display_name: "Diana Cheng", email: "diana.cheng@ukg.com" },
    labels: [],
    created: "2026-04-07T14:16:47.000-0400",
    updated: "2026-04-08T12:29:53.000-0400",
    customfield_10503: { value: ["SONY PICTURES ENTERTAINMENT  INC."] },
    customfield_10704: { value: "S3" }
  },
  {
    id: "2636047",
    key: "PS-823394",
    summary: "Test-4 UTA: Color change not carried over from TEST 4 PRO",
    status: { name: "Analysis" },
    issue_type: { name: "Defect" },
    priority: { name: "P3" },
    assignee: { display_name: "Kevin Bello", email: "kevin.bello@ukg.com" },
    reporter: { display_name: "Diana Cheng", email: "diana.cheng@ukg.com" },
    labels: [],
    created: "2026-04-03T12:59:00.000-0400",
    updated: "2026-04-08T10:44:11.000-0400",
    customfield_10503: { value: ["SONY PICTURES ENTERTAINMENT  INC."] },
    customfield_10704: { value: "S3" }
  },
  {
    id: "2636201",
    key: "PS-823376",
    summary: "Sony TEST - Updates links in custom alerts in job scheduler",
    status: { name: "Code Complete" },
    issue_type: { name: "Defect" },
    priority: { name: "P3" },
    assignee: { display_name: "Kevin Bello", email: "kevin.bello@ukg.com" },
    reporter: { display_name: "Diana Cheng", email: "diana.cheng@ukg.com" },
    labels: [],
    created: "2026-04-03T12:23:15.000-0400",
    updated: "2026-04-09T18:24:33.000-0400",
    customfield_10503: { value: ["SONY PICTURES ENTERTAINMENT  INC."] },
    customfield_10704: { value: "S3" }
  },
  {
    id: "2621477",
    key: "PS-814665",
    summary: "UTA TEST 1 & 4 - New custom VAC CORPORATE WAIVER 2026 not accruing correctly",
    status: { name: "Waiting To Accept" },
    issue_type: { name: "Defect" },
    priority: { name: "P3" },
    assignee: { display_name: "Kevin Bello", email: "kevin.bello@ukg.com" },
    reporter: { display_name: "Diana Cheng", email: "diana.cheng@ukg.com" },
    labels: [],
    created: "2026-03-27T16:48:29.000-0400",
    updated: "2026-04-09T14:02:21.000-0400",
    customfield_10503: { value: ["SONY PICTURES ENTERTAINMENT  INC."] },
    customfield_10704: { value: "S3" }
  },
  {
    id: "2614663",
    key: "PS-810452",
    summary: "Test 5 UTA - SPE Employee Straight Time Calculation Task failing",
    status: { name: "Fix in Review" },
    issue_type: { name: "Defect" },
    priority: { name: "P3" },
    assignee: { display_name: "Kevin Bello", email: "kevin.bello@ukg.com" },
    reporter: { display_name: "Diana Cheng", email: "diana.cheng@ukg.com" },
    labels: [],
    created: "2026-03-25T14:19:05.000-0400",
    updated: "2026-04-09T17:13:16.000-0400",
    customfield_10503: { value: ["SONY PICTURES ENTERTAINMENT  INC."] },
    customfield_10704: { value: "S3" }
  }
];

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

  const customersField = jiraIssue.customfield_10503;
  let customers = [];
  if (customersField && customersField.value) {
    customers = Array.isArray(customersField.value) ? customersField.value : [customersField.value];
  }
  const customerCount = customers.length;

  const hasRcaLabel = jiraIssue.labels?.some(l => l.toUpperCase() === 'RCA-TYPE-DEFECT');
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

async function addSonyDefects() {
  try {
    console.log('🔧 Initializing database...');
    await dbManager.initialize();
    console.log('✅ Database ready\n');

    const defects = SONY_DEFECTS.map(transformDefect);

    console.log(`📥 Adding ${defects.length} Sony defects...`);

    defects.forEach(defect => {
      console.log(`   ${defect.key}: ${defect.summary.substring(0, 60)}...`);
    });

    DefectModel.bulkInsert(defects);

    const stats = DefectModel.getStats('uta');

    console.log('\n✅ Sony defects added successfully!');
    console.log(`📊 New UTA total: ${stats.total}\n`);

  } catch (error) {
    console.error('❌ Failed to add Sony defects:', error);
    process.exit(1);
  } finally {
    dbManager.close();
  }
}

addSonyDefects();
