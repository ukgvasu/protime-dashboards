#!/usr/bin/env node

/**
 * Populate ALL Portfolio Team 3121 defects (both customer-impacting AND internal)
 *
 * Query: "Portfolio Team" = 3121 AND issuetype in (Bug, Defect) AND statusCategory != Done
 *
 * This includes:
 * - Customer-impacting defects (customfield_10503 has value)
 * - Internal defects (customfield_10503 is null)
 * - Security defects (CVE, BitSight, etc.)
 * - Code defects
 * - Infrastructure defects
 *
 * Excludes:
 * - CM- tickets (Change tickets for upgrade scheduling)
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { dbManager } from '../backend/src/models/database.js';
import { DefectModel } from '../backend/src/models/defect.js';
import { parseISO, differenceInDays } from 'date-fns';

const __dirname = dirname(fileURLToPath(import.meta.url));

// All Portfolio Team 3121 defects from Jira (Bug/Defect types only, excluding CM- change tickets)
const ALL_DEFECTS = [
  {
    "id": "2055239",
    "key": "TO-27834",
    "summary": "Report - Timesheet Override - secondary team security issue",
    "status": { "name": "In Dev", "category": "In Progress", "color": "inprogress" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "None" },
    "assignee": { "display_name": "Unassigned" },
    "reporter": { "display_name": "Hao Ren", "name": "hao.ren@ukg.com", "email": "hao.ren@ukg.com" },
    "created": "2025-06-02T16:43:33.000-0400",
    "updated": "2026-03-25T11:18:56.000-0400",
    "customfield_10503": { "value": null },
    "customfield_10704": { "value": "S4" }
  },
  {
    "id": "1468285",
    "key": "TO-10605",
    "summary": "UTA- Custom SONY SICK Entitlement not granting as designed.",
    "status": { "name": "In Test", "category": "In Progress", "color": "inprogress" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P4" },
    "assignee": { "display_name": "Radek Jadczak", "name": "radek.jadczak@ukg.com", "email": "radek.jadczak@ukg.com" },
    "reporter": { "display_name": "Donna Foster", "name": "donna.foster@ukg.com", "email": "donna.foster@ukg.com" },
    "labels": ["UTA-CUSTOMS-MAINTENANCE", "UTACUSTOMS24", "UTAENTITLE24", "UTA_Case", "UTA_Customs"],
    "created": "2024-04-12T12:51:24.000-0400",
    "updated": "2026-04-08T10:44:53.000-0400",
    "customfield_10503": { "value": ["SONY PICTURES ENTERTAINMENT  INC."] },
    "customfield_10704": { "value": "S4" }
  },
  {
    "id": "2653627",
    "key": "PS-837705",
    "summary": "UTA – POST UPGRADE – WBINT_IMPORT: Import is timing out when trying to import employee records (Similar to PS-815975)",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P2" },
    "assignee": { "display_name": "Yendris Arce Fernandez", "name": "yendris.arce@ukg.com", "email": "yendris.arce@ukg.com" },
    "reporter": { "display_name": "Michelle Navarro", "name": "michelle.navarro@ukg.com", "email": "michelle.navarro@ukg.com" },
    "labels": ["UTAPORT26", "UTAUPGRADE26"],
    "created": "2026-04-09T15:35:52.000-0400",
    "updated": "2026-04-09T17:29:30.000-0400",
    "customfield_10503": { "value": ["KILPATRICK TOWNSEND & STOCKTON LLP"] },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2653134",
    "key": "PS-836615",
    "summary": "UTA - Timesheet: Work Detail is landing on the following day when punches cross midnight.",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P4" },
    "assignee": { "display_name": "Unassigned" },
    "reporter": { "display_name": "Theraune Seville", "name": "theraune.seville@ukg.com", "email": "theraune.seville@ukg.com" },
    "labels": ["UTADAILYTS26"],
    "created": "2026-04-09T13:18:22.000-0400",
    "updated": "2026-04-09T13:48:42.000-0400",
    "customfield_10503": { "value": ["ESSENDANT MANAGEMENT SERVICES LLC"] },
    "customfield_10704": { "value": "S4" }
  },
  {
    "id": "2652864",
    "key": "PS-836407",
    "summary": "UTA Post Upgrade – Clock Import: Punch import is failing with message: Identifier Type has an invalid value [O]. It should be B for badge, N for name, or I for id as of 04/08/2026.",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P2" },
    "assignee": { "display_name": "Mark Zhang", "name": "mark.zhang@ukg.com", "email": "mark.zhang@ukg.com" },
    "reporter": { "display_name": "Theraune Seville", "name": "theraune.seville@ukg.com", "email": "theraune.seville@ukg.com" },
    "labels": ["UTAPORT26", "UTASYSADMIN26", "UTAUPGRADE26"],
    "created": "2026-04-09T11:39:17.000-0400",
    "updated": "2026-04-09T11:47:31.000-0400",
    "customfield_10503": { "value": ["Global Tungsten & Powders Corp."] },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2652910",
    "key": "PS-836324",
    "summary": "UTA – Employee Lookup: When searching for an employee, the drop-down times out, errors or takes a long time to show the results.",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P2" },
    "assignee": { "display_name": "Kevin Bello", "name": "kevin.bello@ukg.com", "email": "kevin.bello@ukg.com" },
    "reporter": { "display_name": "Theraune Seville", "name": "theraune.seville@ukg.com", "email": "theraune.seville@ukg.com" },
    "labels": ["UTADAILYTS26"],
    "created": "2026-04-09T11:14:26.000-0400",
    "updated": "2026-04-09T15:37:46.000-0400",
    "customfield_10503": { "value": ["ACE PARKING MANAGEMENT, INC"] },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2652320",
    "key": "PS-835607",
    "summary": "UTA error - A system error has occurred. Message: org/apache/jsp/usg_005fwidget/clock_jsp$1Params. Please contact system admin for support using the following reference ID: 36544",
    "status": { "name": "Waiting To Accept", "category": "In Progress", "color": "inprogress" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P2" },
    "assignee": { "display_name": "Shrey Khanna", "name": "shrey.khanna@ukg.com", "email": "shrey.khanna@ukg.com" },
    "reporter": { "display_name": "Reyad Mohammed", "name": "reyad.mohammed@ukg.com", "email": "reyad.mohammed@ukg.com" },
    "created": "2026-04-09T08:29:38.000-0400",
    "updated": "2026-04-10T01:30:22.000-0400",
    "customfield_10503": { "value": ["BAKER, DONELSON, BEARMAN, CALDWELL & BERKOWITZ, P.C."] },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2649597",
    "key": "PS-832126",
    "summary": "UTA Post Upgrade – Supervisor Summary: Sup. Summary is showing You do not have access to authorize the period for select employees for all Supervisors.",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Kevin Bello", "name": "kevin.bello@ukg.com", "email": "kevin.bello@ukg.com" },
    "reporter": { "display_name": "Diana Cheng", "name": "diana.cheng@ukg.com", "email": "diana.cheng@ukg.com" },
    "labels": ["UTAUPGRADE26"],
    "created": "2026-04-08T16:28:20.000-0400",
    "updated": "2026-04-09T13:38:00.000-0400",
    "customfield_10503": { "value": ["CASCADES CANADA ULC"] },
    "customfield_10704": { "value": "S3" }
  },
  {
    "id": "2649451",
    "key": "PS-831673",
    "summary": "UTA - Rules: Please provide list of all UTA Rules for Client.",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P4" },
    "assignee": { "display_name": "Unassigned" },
    "reporter": { "display_name": "Theraune Seville", "name": "theraune.seville@ukg.com", "email": "theraune.seville@ukg.com" },
    "labels": ["UTARULES26"],
    "created": "2026-04-08T13:29:42.000-0400",
    "updated": "2026-04-09T14:04:26.000-0400",
    "customfield_10503": { "value": ["KEOLIS AMERICA INC."] },
    "customfield_10704": { "value": "S4" }
  },
  {
    "id": "2648789",
    "key": "PS-831427",
    "summary": "UTA Post Upgrade - Payroll Impacting Error showing on timesheets for multiple companies. Summary Error shows: Missing Rule: com.uta.globaltungsten.rules.GTDepartmentProjectValidationRule",
    "status": { "name": "Waiting To Accept", "category": "In Progress", "color": "inprogress" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P2" },
    "assignee": { "display_name": "Kenley Rodriguez", "name": "kenley.rodriguez@ukg.com", "email": "kenley.rodriguez@ukg.com" },
    "reporter": { "display_name": "Dalton Reynolds", "name": "dalton.reynolds@ukg.com", "email": "dalton.reynolds@ukg.com" },
    "labels": ["UTAUPGRADE26"],
    "created": "2026-04-08T11:48:51.000-0400",
    "updated": "2026-04-09T09:53:06.000-0400",
    "customfield_10503": { "value": ["Global Tungsten & Powders Corp."] },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2648811",
    "key": "PS-831258",
    "summary": "UTA - POST UPGRADE - Errors on Timesheet Due to Missing Customs",
    "status": { "name": "Waiting To Accept", "category": "In Progress", "color": "inprogress" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P2" },
    "assignee": { "display_name": "Kenley Rodriguez", "name": "kenley.rodriguez@ukg.com", "email": "kenley.rodriguez@ukg.com" },
    "reporter": { "display_name": "Michelle Navarro", "name": "michelle.navarro@ukg.com", "email": "michelle.navarro@ukg.com" },
    "labels": ["UTACUSTOMS26", "UTADAILYTS26", "UTAUPGRADE26"],
    "created": "2026-04-08T10:34:13.000-0400",
    "updated": "2026-04-08T14:11:51.000-0400",
    "customfield_10503": { "value": ["Good Shepherd Rehabilitation Network"] },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2644495",
    "key": "PS-827721",
    "summary": "SONY UTA - TEST-5: Unexplained retros",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Kevin Bello", "name": "kevin.bello@ukg.com", "email": "kevin.bello@ukg.com" },
    "reporter": { "display_name": "Diana Cheng", "name": "diana.cheng@ukg.com", "email": "diana.cheng@ukg.com" },
    "created": "2026-04-07T14:16:47.000-0400",
    "updated": "2026-04-08T12:29:53.000-0400",
    "customfield_10503": { "value": ["SONY PICTURES ENTERTAINMENT  INC."] },
    "customfield_10704": { "value": "S3" }
  },
  {
    "id": "2640095",
    "key": "PS-825484",
    "summary": "Cascades PROD UTA web outage from 3/20 - 3/23",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "None" },
    "assignee": { "display_name": "Varma Indukuri", "name": "varma.indukuri@ukg.com", "email": "varma.indukuri@ukg.com" },
    "reporter": { "display_name": "Diana Cheng", "name": "diana.cheng@ukg.com", "email": "diana.cheng@ukg.com" },
    "created": "2026-04-06T14:45:09.000-0400",
    "updated": "2026-04-07T11:11:47.000-0400",
    "customfield_10503": { "value": ["CASCADES CANADA ULC"] },
    "customfield_10704": { "value": "S3" }
  },
  {
    "id": "2639963",
    "key": "PS-825386",
    "summary": "UTA - UKGPro Mobile App: Overnight Employees Mobile CLOCK OFF - \"Your OFF transaction failed\"",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Kenley Rodriguez", "name": "kenley.rodriguez@ukg.com", "email": "kenley.rodriguez@ukg.com" },
    "reporter": { "display_name": "Theraune Seville", "name": "theraune.seville@ukg.com", "email": "theraune.seville@ukg.com" },
    "labels": ["UTAMOBILEAPP26"],
    "created": "2026-04-06T13:48:53.000-0400",
    "updated": "2026-04-08T16:22:28.000-0400",
    "customfield_10503": { "value": ["TETRA TECHNOLOGIES INC."] },
    "customfield_10704": { "value": "S3" }
  },
  {
    "id": "2639905",
    "key": "PS-825159",
    "summary": "UTA – Time Off Approval – DeepLink is no longer working for this client.",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Kenley Rodriguez", "name": "kenley.rodriguez@ukg.com", "email": "kenley.rodriguez@ukg.com" },
    "reporter": { "display_name": "Brian Toberman", "name": "brian.toberman@ukg.com", "email": "brian.toberman@ukg.com" },
    "labels": ["UTAALERT26", "UTATIMEOFF26"],
    "created": "2026-04-06T11:47:19.000-0400",
    "updated": "2026-04-08T10:44:15.000-0400",
    "customfield_10503": { "value": ["PCH HOTELS & RESORTS INC/RSA BATTLE HOUSE TOWER"] },
    "customfield_10704": { "value": "S3" }
  },
  {
    "id": "2636150",
    "key": "PS-823538",
    "summary": "UTA – POST UPGRADE – Unable to Manually Add an Employee to the Database",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Yendris Arce Fernandez", "name": "yendris.arce@ukg.com", "email": "yendris.arce@ukg.com" },
    "reporter": { "display_name": "Michelle Navarro", "name": "michelle.navarro@ukg.com", "email": "michelle.navarro@ukg.com" },
    "labels": ["UTAEE26", "UTAUPGRADE26"],
    "created": "2026-04-03T15:32:22.000-0400",
    "updated": "2026-04-10T03:07:40.000-0400",
    "customfield_10503": { "value": ["BERKELEY EDUCATIONAL SERVICES OF NEW JERSEY, INC."] },
    "customfield_10704": { "value": "S3" }
  },
  {
    "id": "2636047",
    "key": "PS-823394",
    "summary": "Test-4 UTA: Color change not carried over from TEST 4 PRO",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Kenley Rodriguez", "name": "kenley.rodriguez@ukg.com", "email": "kenley.rodriguez@ukg.com" },
    "reporter": { "display_name": "Diana Cheng", "name": "diana.cheng@ukg.com", "email": "diana.cheng@ukg.com" },
    "created": "2026-04-03T12:59:00.000-0400",
    "updated": "2026-04-08T10:44:11.000-0400",
    "customfield_10503": { "value": ["SONY PICTURES ENTERTAINMENT  INC."] },
    "customfield_10704": { "value": "S3" }
  },
  {
    "id": "2636201",
    "key": "PS-823376",
    "summary": "Sony TEST - Updates links in custom alerts in job scheduler",
    "status": { "name": "Code Complete", "category": "In Progress", "color": "inprogress" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Kenley Rodriguez", "name": "kenley.rodriguez@ukg.com", "email": "kenley.rodriguez@ukg.com" },
    "reporter": { "display_name": "Diana Cheng", "name": "diana.cheng@ukg.com", "email": "diana.cheng@ukg.com" },
    "created": "2026-04-03T12:23:15.000-0400",
    "updated": "2026-04-09T18:24:33.000-0400",
    "customfield_10503": { "value": ["SONY PICTURES ENTERTAINMENT  INC."] },
    "customfield_10704": { "value": "S3" }
  },
  {
    "id": "2632700",
    "key": "PS-821303",
    "summary": "MISSING INDEXES ON HIGH-IMPACT COGNOS DB TABLES",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Surendra Agrawal", "name": "surendra.agrawal@ukg.com", "email": "surendra.agrawal@ukg.com" },
    "reporter": { "display_name": "Surendra Agrawal", "name": "surendra.agrawal@ukg.com", "email": "surendra.agrawal@ukg.com" },
    "created": "2026-04-02T04:35:39.000-0400",
    "updated": "2026-04-08T02:17:01.000-0400",
    "customfield_10503": { "value": null },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2629381",
    "key": "PS-819453",
    "summary": "UTA Post Upgrade - Home Team Only check box on the timesheet is showing more employees than just the supervisors home team.",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Kenley Rodriguez", "name": "kenley.rodriguez@ukg.com", "email": "kenley.rodriguez@ukg.com" },
    "reporter": { "display_name": "Dalton Reynolds", "name": "dalton.reynolds@ukg.com", "email": "dalton.reynolds@ukg.com" },
    "labels": ["UTAUPGRADE26"],
    "created": "2026-04-01T09:10:42.000-0400",
    "updated": "2026-04-08T10:44:09.000-0400",
    "customfield_10503": { "value": ["ASPIRE LIVING & LEARNING INC."] },
    "customfield_10704": { "value": "S3" }
  },
  {
    "id": "2626583",
    "key": "PS-817595",
    "summary": "KIM1001 Retro Time Not Pulling",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P2" },
    "assignee": { "display_name": "Mark Zhang", "name": "mark.zhang@ukg.com", "email": "mark.zhang@ukg.com" },
    "reporter": { "display_name": "Diana Cheng", "name": "diana.cheng@ukg.com", "email": "diana.cheng@ukg.com" },
    "created": "2026-03-31T10:25:06.000-0400",
    "updated": "2026-04-08T10:44:42.000-0400",
    "customfield_10503": { "value": ["Kimberly-Clark Corporation"] },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2624902",
    "key": "PS-816478",
    "summary": "No one is able to access Cognos Analytics in UTA for the Production Environment for AR# BAU1002",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P2" },
    "assignee": { "display_name": "Mark Zhang", "name": "mark.zhang@ukg.com", "email": "mark.zhang@ukg.com" },
    "reporter": { "display_name": "Jeannie Saint Louis", "name": "jeannie.stlouis@ukg.com", "email": "jeannie.saintlouis@ukg.com" },
    "labels": ["RCA-Type-Non-Code-Fix"],
    "created": "2026-03-30T15:27:51.000-0400",
    "updated": "2026-04-08T10:44:39.000-0400",
    "customfield_10503": { "value": ["Bausch & Lomb Americas Inc."] },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2624130",
    "key": "PS-815975",
    "summary": "UTA – WBINT_IMPORT: Import is timing out when trying to import an employee record.",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Yendris Arce Fernandez", "name": "yendris.arce@ukg.com", "email": "yendris.arce@ukg.com" },
    "reporter": { "display_name": "Theraune Seville", "name": "theraune.seville@ukg.com", "email": "theraune.seville@ukg.com" },
    "labels": ["UTAINTEGRATION26", "UTAPORT26"],
    "created": "2026-03-30T10:22:13.000-0400",
    "updated": "2026-04-10T03:14:24.000-0400",
    "customfield_10503": { "value": ["BERKELEY EDUCATIONAL SERVICES OF NEW JERSEY, INC."] },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2623835",
    "key": "PS-815865",
    "summary": "UTA Upgrade - How do I access UTA once we have migrated to UKG WFM for history?",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P4" },
    "assignee": { "display_name": "Ian Cowpar", "name": "ian.cowpar@ukg.com", "email": "ian.cowpar@ukg.com" },
    "reporter": { "display_name": "Theraune Seville", "name": "theraune.seville@ukg.com", "email": "theraune.seville@ukg.com" },
    "labels": ["UTAUPGRADE26"],
    "created": "2026-03-30T09:40:17.000-0400",
    "updated": "2026-04-08T10:44:02.000-0400",
    "customfield_10503": { "value": ["Ellwood Group, Inc."] },
    "customfield_10704": { "value": "S4" }
  },
  {
    "id": "2621477",
    "key": "PS-814665",
    "summary": "UTA TEST 1 & 4 - New custom VAC CORPORATE WAIVER 2026 not accruing correctly",
    "status": { "name": "Waiting To Accept", "category": "In Progress", "color": "inprogress" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Radek Jadczak", "name": "radek.jadczak@ukg.com", "email": "radek.jadczak@ukg.com" },
    "reporter": { "display_name": "Diana Cheng", "name": "diana.cheng@ukg.com", "email": "diana.cheng@ukg.com" },
    "created": "2026-03-27T16:48:29.000-0400",
    "updated": "2026-04-09T14:02:21.000-0400",
    "customfield_10503": { "value": ["SONY PICTURES ENTERTAINMENT  INC."] },
    "customfield_10704": { "value": "S3" }
  },
  {
    "id": "2618561",
    "key": "PS-812782",
    "summary": "UTA - Vacation balances not decrementing correctly possibly due to custom entitlements",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Kevin Bello", "name": "kevin.bello@ukg.com", "email": "kevin.bello@ukg.com" },
    "reporter": { "display_name": "Diana Cheng", "name": "diana.cheng@ukg.com", "email": "diana.cheng@ukg.com" },
    "created": "2026-03-26T14:54:24.000-0400",
    "updated": "2026-04-08T10:44:17.000-0400",
    "customfield_10503": { "value": ["Kimberly-Clark Corporation"] },
    "customfield_10704": { "value": "S3" }
  },
  {
    "id": "2614663",
    "key": "PS-810452",
    "summary": "Test 5 UTA - SPE Employee Straight Time Calculation Task failing",
    "status": { "name": "Fix in Review", "category": "In Progress", "color": "inprogress" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Radek Jadczak", "name": "radek.jadczak@ukg.com", "email": "radek.jadczak@ukg.com" },
    "reporter": { "display_name": "Diana Cheng", "name": "diana.cheng@ukg.com", "email": "diana.cheng@ukg.com" },
    "created": "2026-03-25T14:19:05.000-0400",
    "updated": "2026-04-09T17:13:16.000-0400",
    "customfield_10503": { "value": ["SONY PICTURES ENTERTAINMENT  INC."] },
    "customfield_10704": { "value": "S3" }
  },
  {
    "id": "2614446",
    "key": "PS-810413",
    "summary": "UTA - Alerts: New Hire Alerts are not showing expected results.",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Mark Zhang", "name": "mark.zhang@ukg.com", "email": "mark.zhang@ukg.com" },
    "reporter": { "display_name": "Theraune Seville", "name": "theraune.seville@ukg.com", "email": "theraune.seville@ukg.com" },
    "labels": ["UTAALERT26"],
    "created": "2026-03-25T13:57:52.000-0400",
    "updated": "2026-04-08T10:44:36.000-0400",
    "customfield_10503": { "value": ["THE CADILLAC FAIRVIEW CORPORATION LIMITED"] },
    "customfield_10704": { "value": "S4" }
  },
  {
    "id": "2609040",
    "key": "PS-807022",
    "summary": "UTA Post Upgrade - Dolby: Auto Approve TOR - Scheduled, task is not adding auto approval comment since 02/13/2026.",
    "status": { "name": "Fix in Review", "category": "In Progress", "color": "inprogress" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Radek Jadczak", "name": "radek.jadczak@ukg.com", "email": "radek.jadczak@ukg.com" },
    "reporter": { "display_name": "Dalton Reynolds", "name": "dalton.reynolds@ukg.com", "email": "dalton.reynolds@ukg.com" },
    "labels": ["UTAUPGRADE26"],
    "created": "2026-03-24T09:22:55.000-0400",
    "updated": "2026-03-27T18:11:27.000-0400",
    "customfield_10503": { "value": ["DOLBY LABORATORIES  INC."] },
    "customfield_10704": { "value": "S3" }
  },
  {
    "id": "2605798",
    "key": "PS-805143",
    "summary": "UTA - Time Off Planner Audit Report Returns Incorrect Balance - JIRA PS-652068 did not resolve the issue for all balances.",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Kevin Bello", "name": "kevin.bello@ukg.com", "email": "kevin.bello@ukg.com" },
    "reporter": { "display_name": "Toni Hodge [X]", "name": "toni.hodge@ukg.com", "email": "toni.hodge@ukg.com" },
    "labels": ["UTABAL26", "UTAREPORT26"],
    "created": "2026-03-23T16:09:16.000-0400",
    "updated": "2026-04-08T10:44:25.000-0400",
    "customfield_10503": { "value": ["WATTS WATER TECHNOLOGIES  INC."] },
    "customfield_10704": { "value": "S3" }
  },
  {
    "id": "2601076",
    "key": "PS-802171",
    "summary": "BitSight - The Ultimate Software Group Company - ultiprotime.com - TLS/SSL Configuration Findings",
    "status": { "name": "Backlog", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "None" },
    "assignee": { "display_name": "Pedro Pouriet [X]", "name": "pedro.pouriet@ukg.com", "email": "pedro.pouriet@ukg.com" },
    "reporter": { "display_name": "Pedro Pouriet [X]", "name": "pedro.pouriet@ukg.com", "email": "pedro.pouriet@ukg.com" },
    "labels": ["asm", "automation", "bitsight", "the-ultimate-software-group-company", "vuln-router-processed"],
    "created": "2026-03-20T11:50:54.000-0400",
    "updated": "2026-03-31T09:01:45.000-0400",
    "customfield_10503": { "value": null },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2585681",
    "key": "PS-792754",
    "summary": "[Cosmos] Sensitive Information Disclosure: Unauthorized Access to Private Data Exposed",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "None" },
    "assignee": { "display_name": "Hao Ren", "name": "hao.ren@ukg.com", "email": "hao.ren@ukg.com" },
    "reporter": { "display_name": "svc_DevSecOps_RW", "name": "svc_DevSecOps_RW", "email": "noreply_engjira@ukg.com" },
    "created": "2026-03-13T22:50:32.000-0400",
    "updated": "2026-04-06T17:47:19.000-0400",
    "customfield_10503": { "value": null },
    "customfield_10704": { "value": "S4" }
  },
  {
    "id": "2585294",
    "key": "PS-792611",
    "summary": "UTA + UKG Pro app - received an error when trying to clock out",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Kenley Rodriguez", "name": "kenley.rodriguez@ukg.com", "email": "kenley.rodriguez@ukg.com" },
    "reporter": { "display_name": "Gloria Marquez", "name": "gloria.marquez@ukg.com", "email": "gloria.marquez@ukg.com" },
    "created": "2026-03-13T16:20:17.000-0400",
    "updated": "2026-04-08T16:22:42.000-0400",
    "customfield_10503": { "value": ["YOUNG MEN'S CHRISTIAN ASSOCIATION OF DELAWARE"] },
    "customfield_10704": { "value": "S3" }
  },
  {
    "id": "2584661",
    "key": "PS-792110",
    "summary": "Alignment in Time Off Approval view is offset since upgrade",
    "status": { "name": "Backlog", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "None" },
    "assignee": { "display_name": "Unassigned" },
    "reporter": { "display_name": "Arseny Medvedev", "name": "arseny.medvedev@ukg.com", "email": "arseny.medvedev@ukg.com" },
    "labels": ["RCA-Type-Defect", "UTA-UKG-Defect", "UTAUPGRADE26", "cust-jewish-federation-chicago"],
    "created": "2026-03-13T10:18:39.000-0400",
    "updated": "2026-04-06T15:24:46.000-0400",
    "customfield_10503": { "value": ["Jewish Federation of Metropolitan Chicago"] },
    "customfield_10704": { "value": "S4" }
  },
  {
    "id": "2578752",
    "key": "PS-788511",
    "summary": "UTA UPGRADE - Weekly Timesheet is NOT populating the employee default labor allocation.",
    "status": { "name": "Backlog", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Tharmen Balasubramaniam", "name": "tharmen.bala@ukg.com", "email": "tharmen.bala@ukg.com" },
    "reporter": { "display_name": "Arseny Medvedev", "name": "arseny.medvedev@ukg.com", "email": "arseny.medvedev@ukg.com" },
    "labels": ["RCA-Type-Defect", "UTA-INFOR-Defect", "UTAUPGRADE26", "UTAWEEKLYTS26", "cust-city-of-ann-arbor"],
    "created": "2026-03-11T10:25:53.000-0400",
    "updated": "2026-04-01T15:47:13.000-0400",
    "customfield_10503": { "value": ["CITY OF ANN ARBOR"] },
    "customfield_10704": { "value": "S3" }
  },
  {
    "id": "2576560",
    "key": "PS-787505",
    "summary": "[BitSight] SSL/TLS Configuration Issues - 53 wb61* ultiprotime.com domains",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "None" },
    "assignee": { "display_name": "Ronald Lau", "name": "ronald.lau@ukg.com", "email": "ronald.lau@ukg.com" },
    "reporter": { "display_name": "Pedro Pouriet [X]", "name": "pedro.pouriet@ukg.com", "email": "pedro.pouriet@ukg.com" },
    "labels": ["automation", "bitsight"],
    "created": "2026-03-10T20:46:43.000-0400",
    "updated": "2026-03-13T11:32:22.000-0400",
    "customfield_10503": { "value": null },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2574269",
    "key": "PS-786155",
    "summary": "Errors encountered in Db Upgrade for AME1075(Prod)",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "None" },
    "assignee": { "display_name": "Unassigned" },
    "reporter": { "display_name": "Tarun Kumar", "name": "tarun.kumar02@ukg.com", "email": "tarun.kumar02@ukg.com" },
    "created": "2026-03-10T07:49:33.000-0400",
    "updated": "2026-03-10T07:52:30.000-0400",
    "customfield_10503": { "value": null },
    "customfield_10704": { "value": "S4" }
  },
  {
    "id": "2573665",
    "key": "PS-785520",
    "summary": "UTA - CVE-2025-66566 @ Maven-org.lz4:lz4-java-1.8.0",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "None" },
    "assignee": { "display_name": "Nitin Deshpande", "name": "nitin.deshpande@ukg.com", "email": "nitin.deshpande@ukg.com" },
    "reporter": { "display_name": "svc_DevSecOps_RW", "name": "svc_DevSecOps_RW", "email": "noreply_engjira@ukg.com" },
    "labels": ["Checkmarx", "SCA", "UTA-Security-Vul", "UTA-TVE-Submitted", "branch:develop", "feedback-app:46e2df20-71a2-4bba-946a-6ff3e5b899da", "owner:UKGEPIC", "project:UKGEPIC/uta-uta64", "repo:uta-uta64", "security-field-updated", "vuln-transformer-unsuccessful"],
    "created": "2026-03-09T19:39:14.000-0400",
    "updated": "2026-04-08T11:16:09.000-0400",
    "customfield_10503": { "value": null },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2573408",
    "key": "PS-785519",
    "summary": "UTA - CVE-2023-34455 @ Maven-org.xerial.snappy:snappy-java-1.1.8.4",
    "status": { "name": "In Dev", "category": "In Progress", "color": "inprogress" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "None" },
    "assignee": { "display_name": "Hao Ren", "name": "hao.ren@ukg.com", "email": "hao.ren@ukg.com" },
    "reporter": { "display_name": "svc_DevSecOps_RW", "name": "svc_DevSecOps_RW", "email": "noreply_engjira@ukg.com" },
    "labels": ["Checkmarx", "SCA", "UTA-Security-Vul", "UTA-TVE-Submitted", "branch:develop", "feedback-app:46e2df20-71a2-4bba-946a-6ff3e5b899da", "owner:UKGEPIC", "project:UKGEPIC/uta-uta64", "repo:uta-uta64", "security-field-updated", "security_defects"],
    "created": "2026-03-09T19:38:55.000-0400",
    "updated": "2026-04-08T10:56:28.000-0400",
    "customfield_10503": { "value": null },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2573407",
    "key": "PS-785518",
    "summary": "UTA - CVE-2025-12183 @ Maven-org.lz4:lz4-java-1.8.0",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "None" },
    "assignee": { "display_name": "Nitin Deshpande", "name": "nitin.deshpande@ukg.com", "email": "nitin.deshpande@ukg.com" },
    "reporter": { "display_name": "svc_DevSecOps_RW", "name": "svc_DevSecOps_RW", "email": "noreply_engjira@ukg.com" },
    "labels": ["Checkmarx", "SCA", "UTA-Security-Vul", "UTA-TVE-Submitted", "branch:develop", "feedback-app:46e2df20-71a2-4bba-946a-6ff3e5b899da", "owner:UKGEPIC", "project:UKGEPIC/uta-uta64", "repo:uta-uta64", "security-field-updated"],
    "created": "2026-03-09T19:38:42.000-0400",
    "updated": "2026-04-08T11:16:29.000-0400",
    "customfield_10503": { "value": null },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2573404",
    "key": "PS-785515",
    "summary": "UTA - CVE-2023-5685 @ Maven-org.jboss.xnio:xnio-api-3.8.4.Final",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "None" },
    "assignee": { "display_name": "Varma Indukuri", "name": "varma.indukuri@ukg.com", "email": "varma.indukuri@ukg.com" },
    "reporter": { "display_name": "svc_DevSecOps_RW", "name": "svc_DevSecOps_RW", "email": "noreply_engjira@ukg.com" },
    "labels": ["Checkmarx", "SCA", "UTA-Security-Vul", "UTA-TVE-Submitted", "branch:develop", "feedback-app:46e2df20-71a2-4bba-946a-6ff3e5b899da", "owner:UKGEPIC", "project:UKGEPIC/uta-uta64", "repo:uta-uta64", "security-field-updated"],
    "created": "2026-03-09T19:38:31.000-0400",
    "updated": "2026-04-08T10:57:21.000-0400",
    "customfield_10503": { "value": null },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2573403",
    "key": "PS-785514",
    "summary": "UTA - CVE-2022-3143 @ Maven-org.wildfly.security:wildfly-elytron-password-impl-1.14.1.Final",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "None" },
    "assignee": { "display_name": "Varma Indukuri", "name": "varma.indukuri@ukg.com", "email": "varma.indukuri@ukg.com" },
    "reporter": { "display_name": "svc_DevSecOps_RW", "name": "svc_DevSecOps_RW", "email": "noreply_engjira@ukg.com" },
    "labels": ["Checkmarx", "SCA", "UTA-Security-Vul", "UTA-TVE-Submitted", "branch:develop", "feedback-app:46e2df20-71a2-4bba-946a-6ff3e5b899da", "owner:UKGEPIC", "project:UKGEPIC/uta-uta64", "repo:uta-uta64", "security-field-updated"],
    "created": "2026-03-09T19:38:27.000-0400",
    "updated": "2026-04-08T11:14:38.000-0400",
    "customfield_10503": { "value": null },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2573400",
    "key": "PS-785511",
    "summary": "UTA - CVE-2024-1233 @ Maven-org.wildfly.security:wildfly-elytron-realm-token-1.14.1.Final",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "None" },
    "assignee": { "display_name": "Varma Indukuri", "name": "varma.indukuri@ukg.com", "email": "varma.indukuri@ukg.com" },
    "reporter": { "display_name": "svc_DevSecOps_RW", "name": "svc_DevSecOps_RW", "email": "noreply_engjira@ukg.com" },
    "labels": ["Checkmarx", "SCA", "UTA-Security-Vul", "UTA-TVE-Submitted", "branch:develop", "feedback-app:46e2df20-71a2-4bba-946a-6ff3e5b899da", "owner:UKGEPIC", "project:UKGEPIC/uta-uta64", "repo:uta-uta64", "security-field-updated"],
    "created": "2026-03-09T19:38:17.000-0400",
    "updated": "2026-04-08T11:14:32.000-0400",
    "customfield_10503": { "value": null },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2572999",
    "key": "PS-785510",
    "summary": "UTA - CVE-2017-18214 @ Npm-moment-2.14.1",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "None" },
    "assignee": { "display_name": "Varma Indukuri", "name": "varma.indukuri@ukg.com", "email": "varma.indukuri@ukg.com" },
    "reporter": { "display_name": "svc_DevSecOps_RW", "name": "svc_DevSecOps_RW", "email": "noreply_engjira@ukg.com" },
    "labels": ["Checkmarx", "SCA", "UTA-Security-Vul", "UTA-TVE-Submitted", "branch:develop", "feedback-app:46e2df20-71a2-4bba-946a-6ff3e5b899da", "owner:UKGEPIC", "project:UKGEPIC/uta-uta64", "repo:uta-uta64", "security-field-updated", "vuln-transformer-dispatched"],
    "created": "2026-03-09T19:38:14.000-0400",
    "updated": "2026-04-08T10:59:41.000-0400",
    "customfield_10503": { "value": null },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2572997",
    "key": "PS-785508",
    "summary": "UTA - CVE-2023-25194 @ Maven-org.apache.kafka:kafka-clients-3.3.1",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "None" },
    "assignee": { "display_name": "Hao Ren", "name": "hao.ren@ukg.com", "email": "hao.ren@ukg.com" },
    "reporter": { "display_name": "svc_DevSecOps_RW", "name": "svc_DevSecOps_RW", "email": "noreply_engjira@ukg.com" },
    "labels": ["Checkmarx", "SCA", "UTA-Security-Vul", "UTA-TVE-Submitted", "branch:develop", "feedback-app:46e2df20-71a2-4bba-946a-6ff3e5b899da", "owner:UKGEPIC", "project:UKGEPIC/uta-uta64", "repo:uta-uta64", "security-field-updated"],
    "created": "2026-03-09T19:38:08.000-0400",
    "updated": "2026-04-08T10:54:59.000-0400",
    "customfield_10503": { "value": null },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2572996",
    "key": "PS-785507",
    "summary": "UTA - CVE-2024-21490 @ Npm-angular-1.4.7",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "None" },
    "assignee": { "display_name": "Varma Indukuri", "name": "varma.indukuri@ukg.com", "email": "varma.indukuri@ukg.com" },
    "reporter": { "display_name": "svc_DevSecOps_RW", "name": "svc_DevSecOps_RW", "email": "noreply_engjira@ukg.com" },
    "labels": ["Checkmarx", "SCA", "UTA-Security-Vul", "UTA-TVE-Submitted", "branch:develop", "feedback-app:46e2df20-71a2-4bba-946a-6ff3e5b899da", "owner:UKGEPIC", "project:UKGEPIC/uta-uta64", "repo:uta-uta64", "security-field-updated", "vuln-transformer-unsuccessful"],
    "created": "2026-03-09T19:38:05.000-0400",
    "updated": "2026-04-08T10:59:05.000-0400",
    "customfield_10503": { "value": null },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2572995",
    "key": "PS-785506",
    "summary": "UTA - CVE-2024-1233 @ Maven-org.wildfly.security:wildfly-elytron-1.14.1.Final",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "None" },
    "assignee": { "display_name": "Varma Indukuri", "name": "varma.indukuri@ukg.com", "email": "varma.indukuri@ukg.com" },
    "reporter": { "display_name": "svc_DevSecOps_RW", "name": "svc_DevSecOps_RW", "email": "noreply_engjira@ukg.com" },
    "labels": ["Checkmarx", "SCA", "UTA-Security-Vul", "UTA-TVE-Submitted", "branch:develop", "feedback-app:46e2df20-71a2-4bba-946a-6ff3e5b899da", "owner:UKGEPIC", "project:UKGEPIC/uta-uta64", "repo:uta-uta64", "security-field-updated"],
    "created": "2026-03-09T19:38:02.000-0400",
    "updated": "2026-04-08T11:14:43.000-0400",
    "customfield_10503": { "value": null },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2572994",
    "key": "PS-785504",
    "summary": "UTA - CVE-2022-3143 @ Maven-org.wildfly.security:wildfly-elytron-credential-1.14.1.Final",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "None" },
    "assignee": { "display_name": "Varma Indukuri", "name": "varma.indukuri@ukg.com", "email": "varma.indukuri@ukg.com" },
    "reporter": { "display_name": "svc_DevSecOps_RW", "name": "svc_DevSecOps_RW", "email": "noreply_engjira@ukg.com" },
    "labels": ["Checkmarx", "SCA", "UTA-Security-Vul", "UTA-TVE-Submitted", "branch:develop", "feedback-app:46e2df20-71a2-4bba-946a-6ff3e5b899da", "owner:UKGEPIC", "project:UKGEPIC/uta-uta64", "repo:uta-uta64", "security-field-updated"],
    "created": "2026-03-09T19:37:59.000-0400",
    "updated": "2026-04-08T11:14:20.000-0400",
    "customfield_10503": { "value": null },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2572991",
    "key": "PS-785501",
    "summary": "UTA - Cxb5e411c7-17b4 @ Npm-moment-timezone-0.5.5",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "None" },
    "assignee": { "display_name": "Varma Indukuri", "name": "varma.indukuri@ukg.com", "email": "varma.indukuri@ukg.com" },
    "reporter": { "display_name": "svc_DevSecOps_RW", "name": "svc_DevSecOps_RW", "email": "noreply_engjira@ukg.com" },
    "labels": ["Checkmarx", "SCA", "UTA-INFOR-TSE-Vul", "UTA-Security-Vul", "branch:develop", "feedback-app:46e2df20-71a2-4bba-946a-6ff3e5b899da", "owner:UKGEPIC", "project:UKGEPIC/uta-uta64", "repo:uta-uta64", "security-field-updated", "vuln-transformer-dispatched"],
    "created": "2026-03-09T19:37:49.000-0400",
    "updated": "2026-04-08T10:45:22.000-0400",
    "customfield_10503": { "value": null },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2572989",
    "key": "PS-785499",
    "summary": "UTA - CVE-2022-3143 @ Maven-org.wildfly.security:wildfly-elytron-realm-ldap-1.14.1.Final",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "None" },
    "assignee": { "display_name": "Varma Indukuri", "name": "varma.indukuri@ukg.com", "email": "varma.indukuri@ukg.com" },
    "reporter": { "display_name": "svc_DevSecOps_RW", "name": "svc_DevSecOps_RW", "email": "noreply_engjira@ukg.com" },
    "labels": ["Checkmarx", "SCA", "UTA-Security-Vul", "UTA-TVE-Submitted", "branch:develop", "feedback-app:46e2df20-71a2-4bba-946a-6ff3e5b899da", "owner:UKGEPIC", "project:UKGEPIC/uta-uta64", "repo:uta-uta64", "security-field-updated"],
    "created": "2026-03-09T19:37:43.000-0400",
    "updated": "2026-04-08T11:14:28.000-0400",
    "customfield_10503": { "value": null },
    "customfield_10704": { "value": "S2" }
  },
  {
    "id": "2563665",
    "key": "PS-779290",
    "summary": "URGENT - UPGRADE - FAILURE of Service Order related jobs",
    "status": { "name": "Analysis", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Kevin Bello", "name": "kevin.bello@ukg.com", "email": "kevin.bello@ukg.com" },
    "reporter": { "display_name": "Brian Toberman", "name": "brian.toberman@ukg.com", "email": "brian.toberman@ukg.com" },
    "created": "2026-03-05T17:36:22.000-0500",
    "updated": "2026-04-08T13:21:06.000-0400",
    "customfield_10503": { "value": ["DOLBY LABORATORIES  INC."] },
    "customfield_10704": { "value": "S3" }
  },
  {
    "id": "2558633",
    "key": "PS-775958",
    "summary": "UTA Reports -  Scheduled Reports access error",
    "status": { "name": "Backlog", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Tharmen Balasubramaniam", "name": "tharmen.bala@ukg.com", "email": "tharmen.bala@ukg.com" },
    "reporter": { "display_name": "Chi Liu", "name": "chi.liu@ukg.com", "email": "chi.liu@ukg.com" },
    "labels": ["RCA-Type-Defect", "UTA-INFOR-Defect"],
    "created": "2026-03-04T12:04:50.000-0500",
    "updated": "2026-04-08T10:42:02.000-0400",
    "customfield_10503": { "value": ["WINPAK LTD"] },
    "customfield_10704": { "value": "S3" }
  },
  {
    "id": "2508713",
    "key": "PS-743562",
    "summary": "UTA – POST UPGRADE – Task GWI - PST CREWPRO Punch Import Phase 2 Under Job Scheduler Producing Error Since Upgrade",
    "status": { "name": "Backlog", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Tharmen Balasubramaniam", "name": "tharmen.bala@ukg.com", "email": "tharmen.bala@ukg.com" },
    "reporter": { "display_name": "Michelle Navarro", "name": "michelle.navarro@ukg.com", "email": "michelle.navarro@ukg.com" },
    "labels": ["RCA-Type-Defect", "UTA-INFOR-Defect", "UTAJOBSKED26", "UTAPORT26", "UTAUPGRADE26", "cust-genesee-wyoming"],
    "created": "2026-02-10T14:39:49.000-0500",
    "updated": "2026-04-08T10:42:51.000-0400",
    "customfield_10503": { "value": ["Genesee & Wyoming Railroad Services, Inc"] },
    "customfield_10704": { "value": "S3" }
  },
  {
    "id": "2508109",
    "key": "PS-743284",
    "summary": "UTA Upgrade - Employee unable to enter 7th day of RIA in UKG",
    "status": { "name": "Fix in Review", "category": "In Progress", "color": "inprogress" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Radek Jadczak", "name": "radek.jadczak@ukg.com", "email": "radek.jadczak@ukg.com" },
    "reporter": { "display_name": "Carlos Munoz", "name": "carlos.munoz@ukg.com", "email": "carlos.munoz@ukg.com" },
    "labels": ["UTAUPGRADE26", "cust-dolby-laboratories"],
    "created": "2026-02-10T12:03:25.000-0500",
    "updated": "2026-04-08T10:44:58.000-0400",
    "customfield_10503": { "value": ["DOLBY LABORATORIES  INC."] },
    "customfield_10704": { "value": "S3" }
  },
  {
    "id": "2463722",
    "key": "PS-716246",
    "summary": "UTA Post Upgrade - Time Off Approval: Employee time off requests are creating duplicate approval entries.",
    "status": { "name": "Waiting for Support", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Tharmen Balasubramaniam", "name": "tharmen.bala@ukg.com", "email": "tharmen.bala@ukg.com" },
    "reporter": { "display_name": "Theraune Seville", "name": "theraune.seville@ukg.com", "email": "theraune.seville@ukg.com" },
    "labels": ["UTATIMEOFF26"],
    "created": "2026-01-20T14:57:28.000-0500",
    "updated": "2026-04-08T10:45:01.000-0400",
    "customfield_10503": { "value": ["MATTAMY HOMES LIMITED"] },
    "customfield_10704": { "value": "S3" }
  },
  {
    "id": "2340702",
    "key": "PS-641268",
    "summary": "UTA Upgrade - Imports: Transactions are showing as APPLIED on the WBINT_IMPORT Table instead of ERROR when a transaction shows as an error on the employee basic information override page.",
    "status": { "name": "Backlog", "category": "To Do", "color": "default" },
    "issue_type": { "name": "Defect" },
    "priority": { "name": "P3" },
    "assignee": { "display_name": "Kevin Bello", "name": "kevin.bello@ukg.com", "email": "kevin.bello@ukg.com" },
    "reporter": { "display_name": "Theraune Seville", "name": "theraune.seville@ukg.com", "email": "theraune.seville@ukg.com" },
    "labels": ["RCA-Type-Defect", "UTA-INFOR-Defect", "UTAEE25", "UTAJOBSKED25", "UTAPORT25", "UTAUPGRADE25", "cust-cheesecake-factory"],
    "created": "2025-11-12T13:10:31.000-0500",
    "updated": "2026-04-06T15:06:02.000-0400",
    "customfield_10503": { "value": ["CHEESECAKE FACTORY"] },
    "customfield_10704": { "value": "S3" }
  }
];

console.log('Starting Portfolio Team 3121 complete defect population...');
console.log(`Total defects to process: ${ALL_DEFECTS.length}`);

// Extract area from labels
function extractArea(labels) {
  if (!labels || !Array.isArray(labels) || labels.length === 0) {
    return 'Other / Uncategorized';
  }

  const areaLabel = labels.find(label => label.startsWith('UTA'));
  if (!areaLabel) {
    return 'Other / Uncategorized';
  }

  // Map common area labels
  const areaMap = {
    'UTADAILYTS': 'Daily Timesheet',
    'UTAWEEKLYTS': 'Weekly Timesheet',
    'UTACUSTOMS': 'Custom Code',
    'UTAEE': 'Employee Editor',
    'UTARULES': 'Rules',
    'UTABAL': 'Accruals/Balances',
    'UTATIMEOFF': 'Time Off',
    'UTAPORT': 'Integrations',
    'UTAALERT': 'Alerts',
    'UTAREPORT': 'Reports',
    'UTAMOBILEAPP': 'Mobile App',
    'UTAINTEGRATION': 'Integrations',
    'UTAJOBSKED': 'Job Scheduler',
    'UTASYSADMIN': 'System Admin',
    'UTAUPGRADE': 'Upgrade-Related',
    'UTAENTITLE': 'Entitlements'
  };

  for (const [prefix, area] of Object.entries(areaMap)) {
    if (areaLabel.startsWith(prefix)) {
      return area;
    }
  }

  return 'Other / Uncategorized';
}

// Calculate age in days
function getAgeDays(createdDate) {
  const created = new Date(createdDate);
  const now = new Date();
  const diffTime = Math.abs(now - created);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Transform Jira issue to DefectModel format
function transformIssue(issue) {
  const customers = issue.customfield_10503?.value || [];
  const customerCount = Array.isArray(customers) ? customers.length : 0;

  const labels = issue.labels || [];

  // CRITICAL: A defect = RCA-Type-Defect label (case insensitive) AND customer field NOT blank
  const hasRcaLabel = labels.some(l => l.toLowerCase() === 'rca-type-defect');
  const isCustomerReported = hasRcaLabel && customerCount > 0;

  const area = extractArea(labels);

  const now = new Date();
  const created = parseISO(issue.created);
  const updated = parseISO(issue.updated);
  const ageDays = differenceInDays(now, created);

  return {
    id: issue.id,
    product: 'uta',
    key: issue.key,
    summary: issue.summary,
    priority: issue.priority?.name || 'None',
    severity: issue.customfield_10704?.value || 'S4',
    status: issue.status.name,
    assignee: issue.assignee?.display_name === 'Unassigned' ? null : issue.assignee?.display_name,
    assignee_email: issue.assignee?.email || null,
    reporter: issue.reporter?.display_name,
    labels: labels,
    components: [],
    created_at: issue.created,
    updated_at: issue.updated,
    resolved_at: null,
    age_days: ageDays,
    is_customer_reported: isCustomerReported,
    is_security: labels.some(l => l.toLowerCase().includes('security') || l.toLowerCase().includes('cve')),
    jira_url: `https://engjira.int.kronos.com/browse/${issue.key}`,
    raw: issue,
    area: area,
    issue_type: issue.issue_type.name,
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

    // Delete existing UTA data
    console.log('Deleting existing UTA defects...');
    const db = dbManager.getDatabase();
    try {
      db.prepare('DELETE FROM defects WHERE product = ?').run('uta');
      console.log('✅ Cleared existing UTA defects');
    } catch (error) {
      console.log('Note: Could not clear defects (table may be empty)');
    }

    // Insert all defects
    let customerCount = 0;
    let internalCount = 0;

    for (const issue of ALL_DEFECTS) {
      const defect = transformIssue(issue);
      DefectModel.insert(defect);

      const customers = issue.customfield_10503?.value || [];
      const isCustomer = Array.isArray(customers) && customers.length > 0;

      if (isCustomer) {
        customerCount++;
      } else {
        internalCount++;
      }
    }

    console.log('\n✅ Population complete!');
    console.log(`Total defects: ${ALL_DEFECTS.length}`);
    console.log(`Customer-impacting defects: ${customerCount}`);
    console.log(`Internal defects: ${internalCount}`);
    console.log(`\nBreakdown:`);
    console.log(`  - With customers: ${customerCount}`);
    console.log(`  - Without customers (internal): ${internalCount}`);
    console.log(`\nThis includes all Portfolio Team 3121 Bug/Defect issues (excluding CM- change tickets)`);

    // Trigger backend reload if it's running
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
