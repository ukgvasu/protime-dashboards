#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { dbManager } from '../backend/src/models/database.js';
import { DefectModel } from '../backend/src/models/defect.js';
import { parseISO, differenceInDays } from 'date-fns';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   📥 ProTime Dashboard - MCP Data Import                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

// UTA defects from MCP (board 3097)
const utaDefects = [
  {"id":"2340702","key":"PS-641268","summary":"UTA Upgrade - Imports: Transactions are showing as APPLIED on the WBINT_IMPORT Table instead of ERROR when a transaction shows as an error on the employee basic information override page. ","status":{"name":"Backlog","category":"To Do","color":"default"},"priority":{"name":"P3"},"assignee":{"display_name":"Kevin Bello","name":"kevin.bello@ukg.com","email":"kevin.bello@ukg.com","avatar_url":"https://engjira.int.kronos.com/secure/useravatar?avatarId=19720","key":"JIRAUSER42797"},"labels":["RCA-Type-Defect","UTA-INFOR-Defect","UTAEE25","UTAJOBSKED25","UTAPORT25","UTAUPGRADE25","cust-cheesecake-factory"],"created":"2025-11-12T13:10:31.000-0500","updated":"2026-04-06T15:06:02.000-0400","customfield_10704":{"value":"S3"},"customfield_12501":{"value":null}},
  {"id":"2578752","key":"PS-788511","summary":"UTA UPGRADE - Weekly Timesheet is NOT populating the employee default labor allocation.","status":{"name":"Backlog","category":"To Do","color":"default"},"priority":{"name":"P3"},"assignee":{"display_name":"Tharmen Balasubramaniam","name":"tharmen.bala@ukg.com","email":"tharmen.bala@ukg.com","avatar_url":"https://engjira.int.kronos.com/secure/useravatar?avatarId=19728","key":"JIRAUSER42917"},"labels":["RCA-Type-Defect","UTA-INFOR-Defect","UTAUPGRADE26","UTAWEEKLYTS26","cust-city-of-ann-arbor"],"created":"2026-03-11T10:25:53.000-0400","updated":"2026-04-01T15:47:13.000-0400","customfield_10704":{"value":"S3"},"customfield_12501":{"value":null}},
  {"id":"2558633","key":"PS-775958","summary":"UTA Reports -  Scheduled Reports access error","status":{"name":"Backlog","category":"To Do","color":"default"},"priority":{"name":"P3"},"assignee":{"display_name":"Tharmen Balasubramaniam","name":"tharmen.bala@ukg.com","email":"tharmen.bala@ukg.com","avatar_url":"https://engjira.int.kronos.com/secure/useravatar?avatarId=19728","key":"JIRAUSER42917"},"labels":["RCA-Type-Defect","UTA-INFOR-Defect"],"created":"2026-03-04T12:04:50.000-0500","updated":"2026-04-08T10:42:02.000-0400","customfield_10704":{"value":"S3"},"customfield_12501":{"value":null}},
  {"id":"2508713","key":"PS-743562","summary":"UTA – POST UPGRADE – Task GWI - PST CREWPRO Punch Import Phase 2 Under Job Scheduler Producing Error Since Upgrade","status":{"name":"Backlog","category":"To Do","color":"default"},"priority":{"name":"P3"},"assignee":{"display_name":"Tharmen Balasubramaniam","name":"tharmen.bala@ukg.com","email":"tharmen.bala@ukg.com","avatar_url":"https://engjira.int.kronos.com/secure/useravatar?avatarId=19728","key":"JIRAUSER42917"},"labels":["RCA-Type-Defect","UTA-INFOR-Defect","UTAJOBSKED26","UTAPORT26","UTAUPGRADE26","cust-genesee-wyoming"],"created":"2026-02-10T14:39:49.000-0500","updated":"2026-04-08T10:42:51.000-0400","customfield_10704":{"value":"S3"},"customfield_12501":{"value":null}},
  {"id":"2584661","key":"PS-792110","summary":"Alignment in Time Off Approval view is offset since upgrade","status":{"name":"Backlog","category":"To Do","color":"default"},"priority":{"name":"None"},"assignee":{"display_name":"Unassigned"},"labels":["RCA-Type-Defect","UTA-UKG-Defect","UTAUPGRADE26","cust-jewish-federation-chicago"],"created":"2026-03-13T10:18:39.000-0400","updated":"2026-04-06T15:24:46.000-0400","customfield_10704":{"value":"S4"},"customfield_12501":{"value":null}}
];

// UTM defects from MCP (board 3057)
const utmDefects = [
  {"id":"2485215","key":"PS-728936","summary":"Timesheet record not calculating","status":{"name":"Backlog","category":"To Do","color":"default"},"priority":{"name":"None"},"assignee":{"display_name":"Raul Villanueva Sotolongo","name":"raul.sotolongo@ukg.com","email":"raul.sotolongo@ukg.com","avatar_url":"https://engjira.int.kronos.com/secure/useravatar?ownerId=JIRAUSER53823&avatarId=62309","key":"JIRAUSER53823"},"labels":["RCA-Type-Defect"],"created":"2026-01-30T13:44:56.000-0500","updated":"2026-04-07T17:35:07.000-0400","customfield_10704":{"value":"S3"},"customfield_12501":{"value":null},"customfield_10503":{"value":["GREATER REGIONAL MEDICAL CENTER"]}}
];

// WFM Classic defects from MCP (board 3106) - first 15
const wfmcDefects = [
  {"id":"2551722","key":"PS-770653","summary":"When selecting 2026 dates, the new policies display but the PTO salaried policy is getting the \"The date range you have specified is invalid for the selected policy\" because the back end is still fetching the 2025 policy","status":{"name":"Fix in Review","category":"In Progress","color":"inprogress"},"priority":{"name":"P3"},"assignee":{"display_name":"Anoosha Somepally","name":"anoosha.somepally@ukg.com","email":"anoosha.somepally@ukg.com","avatar_url":"https://engjira.int.kronos.com/secure/useravatar?avatarId=10122","key":"anoosha.somepally@kronos.com"},"labels":["RCA-Type-Defect","WFMC-Release-26.6.0"],"created":"2026-03-02T09:41:24.000-0500","updated":"2026-04-08T02:59:12.000-0400","customfield_12501":{"value":null}},
  {"id":"2552416","key":"PS-770956","summary":" A WIT import for Merit Increase made a historical change on the Job History, which then impacted the pay rate passed to UKG WFM and creating pending historical changes for pay.","status":{"name":"In Dev","category":"In Progress","color":"inprogress"},"priority":{"name":"P3"},"assignee":{"display_name":"Anoosha Somepally","name":"anoosha.somepally@ukg.com","email":"anoosha.somepally@ukg.com","avatar_url":"https://engjira.int.kronos.com/secure/useravatar?avatarId=10122","key":"anoosha.somepally@kronos.com"},"labels":["RCA-Type-Defect","READY_FOR_DEV"],"created":"2026-03-02T12:47:12.000-0500","updated":"2026-04-08T10:10:24.000-0400","customfield_10704":{"value":"S3"},"customfield_12501":{"value":null},"customfield_10503":{"value":["FREDERICK HEALTH INC.","SHAKOPEE MDEWAKANTON SIOUX COMMUNITY"]}},
  {"id":"2652589","key":"PS-836482","summary":"punch entries with the wrong dates","status":{"name":"Waiting To Accept","category":"In Progress","color":"inprogress"},"priority":{"name":"P3"},"assignee":{"display_name":"Anoosha Somepally","name":"anoosha.somepally@ukg.com","email":"anoosha.somepally@ukg.com","avatar_url":"https://engjira.int.kronos.com/secure/useravatar?avatarId=10122","key":"anoosha.somepally@kronos.com"},"labels":["RCA-DC-TOR","RCA-Environment-Prod","RCA-Type-Defect","WFMC-TA-Angular14"],"created":"2026-04-09T11:53:48.000-0400","updated":"2026-04-09T22:04:24.000-0400","customfield_10704":{"value":"S1"},"customfield_12501":{"value":null},"customfield_10503":{"value":["TRANSCANADA TURBINES LTD"]}},
  {"id":"2615047","key":"PS-810716","summary":"Time Classic is currently unable to fully load the team timesheets for the following Timesheet Configuration Group: Punching Employees Pay Group: Biweekly 2","status":{"name":"In Dev","category":"In Progress","color":"inprogress"},"priority":{"name":"P3"},"assignee":{"display_name":"Arjit Gautam","name":"arjit.gautam@ukg.com","email":"arjit.gautam@ukg.com","avatar_url":"https://engjira.int.kronos.com/secure/useravatar?ownerId=JIRAUSER48309&avatarId=41726","key":"JIRAUSER48309"},"labels":["RCA-Type-Defect"],"created":"2026-03-25T15:31:26.000-0400","updated":"2026-04-08T22:42:51.000-0400","customfield_10704":{"value":"S3"},"customfield_12501":{"value":null},"customfield_10503":{"value":["MARINEMAX  INC."]}},
  {"id":"2602329","key":"PS-802780","summary":"Time classic WFM- cannot submit a timesheet","status":{"name":"Analysis","category":"To Do","color":"default"},"priority":{"name":"P3"},"assignee":{"display_name":"Divyam Patel","name":"divyam.patel@ukg.com","email":"divyam.patel@ukg.com","avatar_url":"https://engjira.int.kronos.com/secure/useravatar?ownerId=JIRAUSER78002&avatarId=70102","key":"JIRAUSER78002"},"labels":["RCA-DC-TOR","RCA-Environment-Prod","RCA-Type-Defect"],"created":"2026-03-20T19:10:45.000-0400","updated":"2026-04-09T10:46:32.000-0400","customfield_10704":{"value":"S3"},"customfield_12501":{"value":null},"customfield_10503":{"value":["BentallGreenOak (Canada) Limited Partnership"]}},
  {"id":"2649007","key":"PS-831432","summary":"Missing Labour Types","status":{"name":"Waiting To Accept","category":"In Progress","color":"inprogress"},"priority":{"name":"P3"},"assignee":{"display_name":"Divyam Patel","name":"divyam.patel@ukg.com","email":"divyam.patel@ukg.com","avatar_url":"https://engjira.int.kronos.com/secure/useravatar?ownerId=JIRAUSER78002&avatarId=70102","key":"JIRAUSER78002"},"labels":["RCA-DC-TOR","RCA-Environment-Prod","RCA-Type-Defect","WFMC-TA-Angular14"],"created":"2026-04-08T11:53:40.000-0400","updated":"2026-04-09T22:05:11.000-0400","customfield_10704":{"value":"S3"},"customfield_12501":{"value":null},"customfield_10503":{"value":["TRANSCANADA TURBINES LTD","TRISUMMIT UTILITIES, INC."]}},
  {"id":"2649341","key":"PS-831648","summary":"Unable to navigate from TA to RPT in TOR PROD for tenant ALL5000AWWL","status":{"name":"Waiting To Accept","category":"In Progress","color":"inprogress"},"priority":{"name":"P2"},"assignee":{"display_name":"Divyam Patel","name":"divyam.patel@ukg.com","email":"divyam.patel@ukg.com","avatar_url":"https://engjira.int.kronos.com/secure/useravatar?ownerId=JIRAUSER78002&avatarId=70102","key":"JIRAUSER78002"},"labels":["RCA-DC-TOR","RCA-Environment-Prod","RCA-Type-Defect","WFMC-TA-Angular14"],"created":"2026-04-08T13:07:49.000-0400","updated":"2026-04-09T22:04:47.000-0400","customfield_10704":{"value":"S1"},"customfield_12501":{"value":null},"customfield_10503":{"value":null}},
  {"id":"2653129","key":"PS-836606","summary":"Exceptions/Error Pop-up Failing to Close after Resolving Exceptions/Errors","status":{"name":"In Test","category":"In Progress","color":"inprogress"},"priority":{"name":"P3"},"assignee":{"display_name":"Divyam Patel","name":"divyam.patel@ukg.com","email":"divyam.patel@ukg.com","avatar_url":"https://engjira.int.kronos.com/secure/useravatar?ownerId=JIRAUSER78002&avatarId=70102","key":"JIRAUSER78002"},"labels":["RCA-DC-TOR","RCA-Environment-Prod","RCA-Type-Defect","WFMC-TA-Angular14"],"created":"2026-04-09T13:12:03.000-0400","updated":"2026-04-09T22:05:21.000-0400","customfield_10704":{"value":"S3"},"customfield_12501":{"value":null},"customfield_10503":{"value":["C.P. LOEWEN ENTERPRISES LTD"]}},
  {"id":"2653822","key":"PS-837841","summary":"Time Classic defaults (Timesheet Configuration and Pay Group) are incorrect, and the system resets to the current timesheet when navigating employees instead of retaining the selected prior week.","status":{"name":"Analysis","category":"To Do","color":"default"},"priority":{"name":"P3"},"assignee":{"display_name":"Divyam Patel","name":"divyam.patel@ukg.com","email":"divyam.patel@ukg.com","avatar_url":"https://engjira.int.kronos.com/secure/useravatar?ownerId=JIRAUSER78002&avatarId=70102","key":"JIRAUSER78002"},"labels":["RCA-DC-TOR","RCA-Environment-Prod","RCA-Type-Defect","WFMC-TA-Angular14"],"created":"2026-04-09T16:32:11.000-0400","updated":"2026-04-09T22:23:48.000-0400","customfield_10704":{"value":"S3"},"customfield_12501":{"value":null},"customfield_10503":{"value":["AGRICORP"]}},
  {"id":"2601916","key":"PS-802516","summary":"EEs Sick Front loaded balances are not matching the T&B report","status":{"name":"Analysis","category":"To Do","color":"default"},"priority":{"name":"P3"},"assignee":{"display_name":"Joshi Akanksha","name":"joshi.akanksha@ukg.com","email":"joshi.akanksha@ukg.com","avatar_url":"https://engjira.int.kronos.com/secure/useravatar?avatarId=10122","key":"JIRAUSER72930"},"labels":["RCA-DC-ATL","RCA-Environment-Prod","RCA-Type-Defect"],"created":"2026-03-20T14:21:41.000-0400","updated":"2026-04-08T05:43:28.000-0400","customfield_10704":{"value":"S3"},"customfield_12501":{"value":null},"customfield_10503":{"value":["ESLER COMPANIES, LLC"]}},
  {"id":"2552820","key":"PS-771247","summary":"Accrual is not prorating correctly in the first year for one employee (Kimberly Foster, EE# 101328) under the Corporate Office Holiday policy","status":{"name":"In Test","category":"In Progress","color":"inprogress"},"priority":{"name":"P3"},"assignee":{"display_name":"Joshi Akanksha","name":"joshi.akanksha@ukg.com","email":"joshi.akanksha@ukg.com","avatar_url":"https://engjira.int.kronos.com/secure/useravatar?avatarId=10122","key":"JIRAUSER72930"},"labels":["RCA-DC-ATL","RCA-Environment-Prod","RCA-Type-Defect","WFMC-Release-26.6.0"],"created":"2026-03-02T15:41:37.000-0500","updated":"2026-04-08T11:01:28.000-0400","customfield_10704":{"value":"S3"},"customfield_12501":{"value":null},"customfield_10503":{"value":["ROCKY BRANDS INC."]}},
  {"id":"2504889","key":"PS-741689","summary":"WFMC Branding Update -  Remove old logo from Direct login screen","status":{"name":"Waiting To Accept","category":"In Progress","color":"inprogress"},"priority":{"name":"P3"},"assignee":{"display_name":"Saumya Prabhakar","name":"saumya.prabhakar@ukg.com","email":"saumya.prabhakar@ukg.com","avatar_url":"https://engjira.int.kronos.com/secure/useravatar?ownerId=JIRAUSER71043&avatarId=51716","key":"JIRAUSER71043"},"labels":["RCA-DC-PLAS","RCA-Environment-Prod","RCA-Type-Defect","RCA-type-UI","WFMC-Release-26.6.0"],"created":"2026-02-09T14:55:04.000-0500","updated":"2026-04-08T10:10:39.000-0400","customfield_10704":{"value":"S3"},"customfield_12501":{"value":null},"customfield_10503":{"value":["RENAISSANCE LEARNING  INC."]}},
  {"id":"2585470","key":"PS-792633","summary":"Employees Unpaid Time Off Hourly remaining balance is showing 40.00 on the paystub but they no longer qualify and doesn't have a balance. Ex Alexandria Henry","status":{"name":"Analysis","category":"To Do","color":"default"},"priority":{"name":"P4"},"assignee":{"display_name":"Swati Aggarwal","name":"swati.aggarwal@ukg.com","email":"swati.aggarwal@ukg.com","avatar_url":"https://engjira.int.kronos.com/secure/useravatar?avatarId=10122","key":"JIRAUSER85318"},"labels":["RCA-ATL-PROD","RCA-Environment-Prod","RCA-Type-Defect"],"created":"2026-03-13T16:47:46.000-0400","updated":"2026-04-08T07:01:02.000-0400","customfield_10704":{"value":"S3"},"customfield_12501":{"value":null},"customfield_10503":{"value":["GLOBAL LENDING SERVICES LLC"]}},
  {"id":"2627351","key":"PS-817907","summary":"EE Chris Horton has negative Sick balance of -5.98 but the policy is set as minimum balance 0","status":{"name":"Analysis","category":"To Do","color":"default"},"priority":{"name":"P3"},"assignee":{"display_name":"Tiruveedi Devisree","name":"tiruveedi.devisree@ukg.com","email":"tiruveedi.devisree@ukg.com","avatar_url":"https://engjira.int.kronos.com/secure/useravatar?avatarId=10122","key":"JIRAUSER71728"},"labels":["RCA-DC-ATL","RCA-Environment-Prod","RCA-Type-Defect"],"created":"2026-03-31T12:15:13.000-0400","updated":"2026-04-08T06:08:48.000-0400","customfield_10704":{"value":"S3"},"customfield_12501":{"value":null},"customfield_10503":{"value":["ESLER COMPANIES, LLC"]}},
  {"id":"2639836","key":"PS-825230","summary":"SWARM - Accruals Note Pausing During Probationary Period","status":{"name":"Analysis","category":"To Do","color":"default"},"priority":{"name":"P3"},"assignee":{"display_name":"Unassigned"},"labels":["RCA-DC-PLAS","RCA-Environment-Prod","RCA-TYPE-DEFECT"],"created":"2026-04-06T12:20:14.000-0400","updated":"2026-04-09T19:31:03.000-0400","customfield_10704":{"value":"S3"},"customfield_12501":{"value":null},"customfield_10503":{"value":["CITY OF ENGLEWOOD"]}}
];

function transformDefect(jiraIssue, product) {
  const now = new Date();
  const created = parseISO(jiraIssue.created);
  const updated = parseISO(jiraIssue.updated);
  const ageDays = differenceInDays(now, created);

  // Extract customers from customfield_10503
  const customers = jiraIssue.customfield_10503?.value || [];
  const customerCount = Array.isArray(customers) ? customers.length : 0;

  // Check for RCA-Type-Defect label
  const hasRcaLabel = jiraIssue.labels?.some(l =>
    l.toUpperCase() === 'RCA-TYPE-DEFECT' || l.toUpperCase() === 'RCA-TYPE-DEFECT'
  );

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
    reporter: null,
    labels: jiraIssue.labels || [],
    components: [],
    created_at: jiraIssue.created,
    updated_at: jiraIssue.updated,
    resolved_at: null,
    age_days: ageDays,
    is_customer_reported: hasRcaLabel ? 1 : 0,
    is_security: 0,
    jira_url: `https://engjira.int.kronos.com/browse/${jiraIssue.key}`,
    raw: jiraIssue,
    area: null,
    issue_type: 'Bug',
    resolution: null,
    resolution_date: null,
    customers: customers,
    customer_count: customerCount
  };
}

async function populate() {
  try {
    console.log('🔧 Initializing database...');
    await dbManager.initialize();
    console.log('✅ Database ready\n');

    const allDefects = [
      ...utaDefects.map(d => transformDefect(d, 'uta')),
      ...utmDefects.map(d => transformDefect(d, 'utm')),
      ...wfmcDefects.map(d => transformDefect(d, 'wfmClassic'))
    ];

    console.log(`📥 Importing ${allDefects.length} defects...`);
    console.log(`   UTA: ${utaDefects.length}`);
    console.log(`   UTM: ${utmDefects.length}`);
    console.log(`   WFM Classic: ${wfmcDefects.length}\n`);

    DefectModel.bulkInsert(allDefects);

    console.log('✅ Data imported successfully!\n');

    // Show summary
    const utaStats = DefectModel.getStats('uta');
    const utmStats = DefectModel.getStats('utm');
    const wfmcStats = DefectModel.getStats('wfmClassic');

    console.log('📊 Summary:');
    console.log(`   UTA: ${utaStats.total} total, P1:${utaStats.p1} P2:${utaStats.p2}, Customer-facing:${utaStats.customer_reported}`);
    console.log(`   UTM: ${utmStats.total} total, P1:${utmStats.p1} P2:${utmStats.p2}, Customer-facing:${utmStats.customer_reported}`);
    console.log(`   WFM Classic: ${wfmcStats.total} total, P1:${wfmcStats.p1} P2:${wfmcStats.p2}, Customer-facing:${wfmcStats.customer_reported}`);
    console.log(`\n🎉 Database populated! Refresh the dashboard to see live data.\n`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    dbManager.close();
  }
}

populate();
