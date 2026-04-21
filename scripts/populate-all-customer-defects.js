#!/usr/bin/env node

/**
 * Populate ALL customer-impacting defects from Portfolio Team 3121
 * Excludes Change tickets (CM-xxxxx) - those are upgrade scheduling, not defects
 */

import { dbManager } from '../backend/src/models/database.js';
import { DefectModel } from '../backend/src/models/defect.js';
import { parseISO, differenceInDays } from 'date-fns';

const JIRA_RESULTS = {
  "total": 50,
  "start_at": 0,
  "max_results": 50,
  "issues": [
    {
      "id": "2653627",
      "key": "PS-837705",
      "summary": "UTA – POST UPGRADE – WBINT_IMPORT: Import is timing out when trying to import employee records (Similar to PS-815975)",
      "status": {
        "name": "Analysis",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P2"
      },
      "assignee": {
        "display_name": "Yendris Arce Fernandez",
        "name": "yendris.arce@ukg.com",
        "email": "yendris.arce@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?ownerId=JIRAUSER42882&avatarId=42702",
        "key": "JIRAUSER42882"
      },
      "reporter": {
        "display_name": "Michelle Navarro",
        "name": "michelle.navarro@ukg.com",
        "email": "michelle.navarro@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER51711"
      },
      "labels": [
        "UTAPORT26",
        "UTAUPGRADE26"
      ],
      "created": "2026-04-09T15:35:52.000-0400",
      "updated": "2026-04-09T17:29:30.000-0400",
      "customfield_10503": {
        "value": [
          "KILPATRICK TOWNSEND & STOCKTON LLP"
        ]
      },
      "customfield_10704": {
        "value": "S2"
      }
    },
    {
      "id": "2652864",
      "key": "PS-836407",
      "summary": "UTA Post Upgrade – Clock Import: Punch import is failing with message: Identifier Type has an invalid value [O]. It should be B for badge, N for name, or I for id as of 04/08/2026.",
      "status": {
        "name": "Analysis",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P2"
      },
      "assignee": {
        "display_name": "Mark Zhang",
        "name": "mark.zhang@ukg.com",
        "email": "mark.zhang@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?ownerId=JIRAUSER50112&avatarId=52607",
        "key": "JIRAUSER50112"
      },
      "reporter": {
        "display_name": "Theraune Seville",
        "name": "theraune.seville@ukg.com",
        "email": "theraune.seville@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER51755"
      },
      "labels": [
        "UTAPORT26",
        "UTASYSADMIN26",
        "UTAUPGRADE26"
      ],
      "created": "2026-04-09T11:39:17.000-0400",
      "updated": "2026-04-09T11:47:31.000-0400",
      "customfield_10503": {
        "value": [
          "Global Tungsten & Powders Corp."
        ]
      },
      "customfield_10704": {
        "value": "S2"
      }
    },
    {
      "id": "2652910",
      "key": "PS-836324",
      "summary": "UTA – Employee Lookup: When searching for an employee, the drop-down times out, errors or takes a long time to show the results. ",
      "status": {
        "name": "Analysis",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P2"
      },
      "assignee": {
        "display_name": "Kevin Bello",
        "name": "kevin.bello@ukg.com",
        "email": "kevin.bello@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19720",
        "key": "JIRAUSER42797"
      },
      "reporter": {
        "display_name": "Theraune Seville",
        "name": "theraune.seville@ukg.com",
        "email": "theraune.seville@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER51755"
      },
      "labels": [
        "UTADAILYTS26"
      ],
      "created": "2026-04-09T11:14:26.000-0400",
      "updated": "2026-04-09T15:37:46.000-0400",
      "customfield_10503": {
        "value": [
          "ACE PARKING MANAGEMENT, INC"
        ]
      },
      "customfield_10704": {
        "value": "S2"
      }
    },
    {
      "id": "2652320",
      "key": "PS-835607",
      "summary": "UTA error - A system error has occurred. Message: org/apache/jsp/usg_005fwidget/clock_jsp$1Params. Please contact system admin for support using the following reference ID: 36544",
      "status": {
        "name": "Waiting To Accept",
        "category": "In Progress",
        "color": "inprogress"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P2"
      },
      "assignee": {
        "display_name": "Shrey Khanna",
        "name": "shrey.khanna@ukg.com",
        "email": "shrey.khanna@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19730",
        "key": "JIRAUSER71110"
      },
      "reporter": {
        "display_name": "Reyad Mohammed",
        "name": "reyad.mohammed@ukg.com",
        "email": "reyad.mohammed@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER51807"
      },
      "created": "2026-04-09T08:29:38.000-0400",
      "updated": "2026-04-10T01:30:22.000-0400",
      "customfield_10503": {
        "value": [
          "BAKER, DONELSON, BEARMAN, CALDWELL & BERKOWITZ, P.C."
        ]
      },
      "customfield_10704": {
        "value": "S2"
      }
    },
    {
      "id": "2648789",
      "key": "PS-831427",
      "summary": "UTA Post Upgrade - Payroll Impacting Error showing on timesheets for multiple companies. Summary Error shows: Missing Rule: com.uta.globaltungsten.rules.GTDepartmentProjectValidationRule",
      "status": {
        "name": "Waiting To Accept",
        "category": "In Progress",
        "color": "inprogress"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P2"
      },
      "assignee": {
        "display_name": "Kenley Rodriguez",
        "name": "kenley.rodriguez@ukg.com",
        "email": "kenley.rodriguez@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19715",
        "key": "JIRAUSER74229"
      },
      "reporter": {
        "display_name": "Dalton Reynolds",
        "name": "dalton.reynolds@ukg.com",
        "email": "dalton.reynolds@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER55459"
      },
      "labels": [
        "UTAUPGRADE26"
      ],
      "created": "2026-04-08T11:48:51.000-0400",
      "updated": "2026-04-09T09:53:06.000-0400",
      "customfield_10503": {
        "value": [
          "Global Tungsten & Powders Corp."
        ]
      },
      "customfield_10704": {
        "value": "S2"
      }
    },
    {
      "id": "2648811",
      "key": "PS-831258",
      "summary": "UTA - POST UPGRADE - Errors on Timesheet Due to Missing Customs",
      "status": {
        "name": "Waiting To Accept",
        "category": "In Progress",
        "color": "inprogress"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P2"
      },
      "assignee": {
        "display_name": "Kenley Rodriguez",
        "name": "kenley.rodriguez@ukg.com",
        "email": "kenley.rodriguez@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19715",
        "key": "JIRAUSER74229"
      },
      "reporter": {
        "display_name": "Michelle Navarro",
        "name": "michelle.navarro@ukg.com",
        "email": "michelle.navarro@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER51711"
      },
      "labels": [
        "UTACUSTOMS26",
        "UTADAILYTS26",
        "UTAUPGRADE26"
      ],
      "created": "2026-04-08T10:34:13.000-0400",
      "updated": "2026-04-08T14:11:51.000-0400",
      "customfield_10503": {
        "value": [
          "Good Shepherd Rehabilitation Network"
        ]
      },
      "customfield_10704": {
        "value": "S2"
      }
    },
    {
      "id": "2626583",
      "key": "PS-817595",
      "summary": "KIM1001 Retro Time Not Pulling",
      "status": {
        "name": "Analysis",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P2"
      },
      "assignee": {
        "display_name": "Mark Zhang",
        "name": "mark.zhang@ukg.com",
        "email": "mark.zhang@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?ownerId=JIRAUSER50112&avatarId=52607",
        "key": "JIRAUSER50112"
      },
      "reporter": {
        "display_name": "Diana Cheng",
        "name": "diana.cheng@ukg.com",
        "email": "diana.cheng@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER54837"
      },
      "created": "2026-03-31T10:25:06.000-0400",
      "updated": "2026-04-08T10:44:42.000-0400",
      "customfield_10503": {
        "value": [
          "Kimberly-Clark Corporation"
        ]
      },
      "customfield_10704": {
        "value": "S2"
      }
    },
    {
      "id": "2624902",
      "key": "PS-816478",
      "summary": "No one is able to access Cognos Analytics in UTA for the Production Environment for AR# BAU1002",
      "status": {
        "name": "Analysis",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P2"
      },
      "assignee": {
        "display_name": "Mark Zhang",
        "name": "mark.zhang@ukg.com",
        "email": "mark.zhang@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?ownerId=JIRAUSER50112&avatarId=52607",
        "key": "JIRAUSER50112"
      },
      "reporter": {
        "display_name": "Jeannie Saint Louis",
        "name": "jeannie.stlouis@ukg.com",
        "email": "jeannie.saintlouis@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?ownerId=JIRAUSER55036&avatarId=49111",
        "key": "JIRAUSER55036"
      },
      "labels": [
        "RCA-Type-Non-Code-Fix"
      ],
      "created": "2026-03-30T15:27:51.000-0400",
      "updated": "2026-04-08T10:44:39.000-0400",
      "customfield_10503": {
        "value": [
          "Bausch & Lomb Americas Inc."
        ]
      },
      "customfield_10704": {
        "value": "S2"
      }
    },
    {
      "id": "2649597",
      "key": "PS-832126",
      "summary": "UTA Post Upgrade – Supervisor Summary: Sup. Summary is showing You do not have access to authorize the period for select employees for all Supervisors.",
      "status": {
        "name": "Analysis",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Kevin Bello",
        "name": "kevin.bello@ukg.com",
        "email": "kevin.bello@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19720",
        "key": "JIRAUSER42797"
      },
      "reporter": {
        "display_name": "Diana Cheng",
        "name": "diana.cheng@ukg.com",
        "email": "diana.cheng@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER54837"
      },
      "labels": [
        "UTAUPGRADE26"
      ],
      "created": "2026-04-08T16:28:20.000-0400",
      "updated": "2026-04-09T13:38:00.000-0400",
      "customfield_10503": {
        "value": [
          "CASCADES CANADA ULC"
        ]
      },
      "customfield_10704": {
        "value": "S3"
      }
    },
    {
      "id": "2644495",
      "key": "PS-827721",
      "summary": "SONY UTA - TEST-5: Unexplained retros",
      "status": {
        "name": "Analysis",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Kevin Bello",
        "name": "kevin.bello@ukg.com",
        "email": "kevin.bello@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19720",
        "key": "JIRAUSER42797"
      },
      "reporter": {
        "display_name": "Diana Cheng",
        "name": "diana.cheng@ukg.com",
        "email": "diana.cheng@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER54837"
      },
      "created": "2026-04-07T14:16:47.000-0400",
      "updated": "2026-04-08T12:29:53.000-0400",
      "customfield_10503": {
        "value": [
          "SONY PICTURES ENTERTAINMENT  INC."
        ]
      },
      "customfield_10704": {
        "value": "S3"
      }
    },
    {
      "id": "2639963",
      "key": "PS-825386",
      "summary": "UTA - UKGPro Mobile App: Overnight Employees Mobile CLOCK OFF - \"Your OFF transaction failed\"",
      "status": {
        "name": "Analysis",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Kenley Rodriguez",
        "name": "kenley.rodriguez@ukg.com",
        "email": "kenley.rodriguez@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19715",
        "key": "JIRAUSER74229"
      },
      "reporter": {
        "display_name": "Theraune Seville",
        "name": "theraune.seville@ukg.com",
        "email": "theraune.seville@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER51755"
      },
      "labels": [
        "UTAMOBILEAPP26"
      ],
      "created": "2026-04-06T13:48:53.000-0400",
      "updated": "2026-04-08T16:22:28.000-0400",
      "customfield_10503": {
        "value": [
          "TETRA TECHNOLOGIES INC."
        ]
      },
      "customfield_10704": {
        "value": "S3"
      }
    },
    {
      "id": "2639905",
      "key": "PS-825159",
      "summary": "UTA – Time Off Approval – DeepLink is no longer working for this client. ",
      "status": {
        "name": "Analysis",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Kenley Rodriguez",
        "name": "kenley.rodriguez@ukg.com",
        "email": "kenley.rodriguez@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19715",
        "key": "JIRAUSER74229"
      },
      "reporter": {
        "display_name": "Brian Toberman",
        "name": "brian.toberman@ukg.com",
        "email": "brian.toberman@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER51357"
      },
      "labels": [
        "UTAALERT26",
        "UTATIMEOFF26"
      ],
      "created": "2026-04-06T11:47:19.000-0400",
      "updated": "2026-04-08T10:44:15.000-0400",
      "customfield_10503": {
        "value": [
          "PCH HOTELS & RESORTS INC/RSA BATTLE HOUSE TOWER"
        ]
      },
      "customfield_10704": {
        "value": "S3"
      }
    },
    {
      "id": "2636150",
      "key": "PS-823538",
      "summary": "UTA – POST UPGRADE – Unable to Manually Add an Employee to the Database",
      "status": {
        "name": "Analysis",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Yendris Arce Fernandez",
        "name": "yendris.arce@ukg.com",
        "email": "yendris.arce@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?ownerId=JIRAUSER42882&avatarId=42702",
        "key": "JIRAUSER42882"
      },
      "reporter": {
        "display_name": "Michelle Navarro",
        "name": "michelle.navarro@ukg.com",
        "email": "michelle.navarro@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER51711"
      },
      "labels": [
        "UTAEE26",
        "UTAUPGRADE26"
      ],
      "created": "2026-04-03T15:32:22.000-0400",
      "updated": "2026-04-10T03:07:40.000-0400",
      "customfield_10503": {
        "value": [
          "BERKELEY EDUCATIONAL SERVICES OF NEW JERSEY, INC."
        ]
      },
      "customfield_10704": {
        "value": "S3"
      }
    },
    {
      "id": "2636047",
      "key": "PS-823394",
      "summary": "Test-4 UTA: Color change not carried over from TEST 4 PRO",
      "status": {
        "name": "Analysis",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Kenley Rodriguez",
        "name": "kenley.rodriguez@ukg.com",
        "email": "kenley.rodriguez@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19715",
        "key": "JIRAUSER74229"
      },
      "reporter": {
        "display_name": "Diana Cheng",
        "name": "diana.cheng@ukg.com",
        "email": "diana.cheng@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER54837"
      },
      "created": "2026-04-03T12:59:00.000-0400",
      "updated": "2026-04-08T10:44:11.000-0400",
      "customfield_10503": {
        "value": [
          "SONY PICTURES ENTERTAINMENT  INC."
        ]
      },
      "customfield_10704": {
        "value": "S3"
      }
    },
    {
      "id": "2636201",
      "key": "PS-823376",
      "summary": "Sony TEST - Updates links in custom alerts in job scheduler",
      "status": {
        "name": "Code Complete",
        "category": "In Progress",
        "color": "inprogress"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Kenley Rodriguez",
        "name": "kenley.rodriguez@ukg.com",
        "email": "kenley.rodriguez@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19715",
        "key": "JIRAUSER74229"
      },
      "reporter": {
        "display_name": "Diana Cheng",
        "name": "diana.cheng@ukg.com",
        "email": "diana.cheng@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER54837"
      },
      "created": "2026-04-03T12:23:15.000-0400",
      "updated": "2026-04-09T18:24:33.000-0400",
      "customfield_10503": {
        "value": [
          "SONY PICTURES ENTERTAINMENT  INC."
        ]
      },
      "customfield_10704": {
        "value": "S3"
      }
    },
    {
      "id": "2629381",
      "key": "PS-819453",
      "summary": "UTA Post Upgrade - Home Team Only check box on the timesheet is showing more employees than just the supervisors home team.",
      "status": {
        "name": "Analysis",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Kenley Rodriguez",
        "name": "kenley.rodriguez@ukg.com",
        "email": "kenley.rodriguez@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19715",
        "key": "JIRAUSER74229"
      },
      "reporter": {
        "display_name": "Dalton Reynolds",
        "name": "dalton.reynolds@ukg.com",
        "email": "dalton.reynolds@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER55459"
      },
      "labels": [
        "UTAUPGRADE26"
      ],
      "created": "2026-04-01T09:10:42.000-0400",
      "updated": "2026-04-08T10:44:09.000-0400",
      "customfield_10503": {
        "value": [
          "ASPIRE LIVING & LEARNING INC."
        ]
      },
      "customfield_10704": {
        "value": "S3"
      }
    },
    {
      "id": "2624130",
      "key": "PS-815975",
      "summary": "UTA – WBINT_IMPORT: Import is timing out when trying to import an employee record. ",
      "status": {
        "name": "Analysis",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Yendris Arce Fernandez",
        "name": "yendris.arce@ukg.com",
        "email": "yendris.arce@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?ownerId=JIRAUSER42882&avatarId=42702",
        "key": "JIRAUSER42882"
      },
      "reporter": {
        "display_name": "Theraune Seville",
        "name": "theraune.seville@ukg.com",
        "email": "theraune.seville@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER51755"
      },
      "labels": [
        "UTAINTEGRATION26",
        "UTAPORT26"
      ],
      "created": "2026-03-30T10:22:13.000-0400",
      "updated": "2026-04-10T03:14:24.000-0400",
      "customfield_10503": {
        "value": [
          "BERKELEY EDUCATIONAL SERVICES OF NEW JERSEY, INC."
        ]
      },
      "customfield_10704": {
        "value": "S2"
      }
    },
    {
      "id": "2621477",
      "key": "PS-814665",
      "summary": "UTA TEST 1 & 4 - New custom VAC CORPORATE WAIVER 2026 not accruing correctly",
      "status": {
        "name": "Waiting To Accept",
        "category": "In Progress",
        "color": "inprogress"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Radek Jadczak",
        "name": "radek.jadczak@ukg.com",
        "email": "radek.jadczak@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?ownerId=JIRAUSER43018&avatarId=57308",
        "key": "JIRAUSER43018"
      },
      "reporter": {
        "display_name": "Diana Cheng",
        "name": "diana.cheng@ukg.com",
        "email": "diana.cheng@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER54837"
      },
      "created": "2026-03-27T16:48:29.000-0400",
      "updated": "2026-04-09T14:02:21.000-0400",
      "customfield_10503": {
        "value": [
          "SONY PICTURES ENTERTAINMENT  INC."
        ]
      },
      "customfield_10704": {
        "value": "S3"
      }
    },
    {
      "id": "2618561",
      "key": "PS-812782",
      "summary": "UTA - Vacation balances not decrementing correctly possibly due to custom entitlements",
      "status": {
        "name": "Analysis",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Kevin Bello",
        "name": "kevin.bello@ukg.com",
        "email": "kevin.bello@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19720",
        "key": "JIRAUSER42797"
      },
      "reporter": {
        "display_name": "Diana Cheng",
        "name": "diana.cheng@ukg.com",
        "email": "diana.cheng@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER54837"
      },
      "created": "2026-03-26T14:54:24.000-0400",
      "updated": "2026-04-08T10:44:17.000-0400",
      "customfield_10503": {
        "value": [
          "Kimberly-Clark Corporation"
        ]
      },
      "customfield_10704": {
        "value": "S3"
      }
    },
    {
      "id": "2614663",
      "key": "PS-810452",
      "summary": "Test 5 UTA - SPE Employee Straight Time Calculation Task failing",
      "status": {
        "name": "Fix in Review",
        "category": "In Progress",
        "color": "inprogress"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Radek Jadczak",
        "name": "radek.jadczak@ukg.com",
        "email": "radek.jadczak@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?ownerId=JIRAUSER43018&avatarId=57308",
        "key": "JIRAUSER43018"
      },
      "reporter": {
        "display_name": "Diana Cheng",
        "name": "diana.cheng@ukg.com",
        "email": "diana.cheng@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER54837"
      },
      "created": "2026-03-25T14:19:05.000-0400",
      "updated": "2026-04-09T17:13:16.000-0400",
      "customfield_10503": {
        "value": [
          "SONY PICTURES ENTERTAINMENT  INC."
        ]
      },
      "customfield_10704": {
        "value": "S3"
      }
    },
    {
      "id": "2614446",
      "key": "PS-810413",
      "summary": "UTA - Alerts: New Hire Alerts are not showing expected results. ",
      "status": {
        "name": "Analysis",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Mark Zhang",
        "name": "mark.zhang@ukg.com",
        "email": "mark.zhang@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?ownerId=JIRAUSER50112&avatarId=52607",
        "key": "JIRAUSER50112"
      },
      "reporter": {
        "display_name": "Theraune Seville",
        "name": "theraune.seville@ukg.com",
        "email": "theraune.seville@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER51755"
      },
      "labels": [
        "UTAALERT26"
      ],
      "created": "2026-03-25T13:57:52.000-0400",
      "updated": "2026-04-08T10:44:36.000-0400",
      "customfield_10503": {
        "value": [
          "THE CADILLAC FAIRVIEW CORPORATION LIMITED"
        ]
      },
      "customfield_10704": {
        "value": "S4"
      }
    },
    {
      "id": "2609040",
      "key": "PS-807022",
      "summary": "UTA Post Upgrade - Dolby: Auto Approve TOR - Scheduled, task is not adding auto approval comment since 02/13/2026.",
      "status": {
        "name": "Fix in Review",
        "category": "In Progress",
        "color": "inprogress"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Radek Jadczak",
        "name": "radek.jadczak@ukg.com",
        "email": "radek.jadczak@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?ownerId=JIRAUSER43018&avatarId=57308",
        "key": "JIRAUSER43018"
      },
      "reporter": {
        "display_name": "Dalton Reynolds",
        "name": "dalton.reynolds@ukg.com",
        "email": "dalton.reynolds@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER55459"
      },
      "labels": [
        "UTAUPGRADE26"
      ],
      "created": "2026-03-24T09:22:55.000-0400",
      "updated": "2026-03-27T18:11:27.000-0400",
      "customfield_10503": {
        "value": [
          "DOLBY LABORATORIES  INC."
        ]
      },
      "customfield_10704": {
        "value": "S3"
      }
    },
    {
      "id": "2605798",
      "key": "PS-805143",
      "summary": "UTA - Time Off Planner Audit Report Returns Incorrect Balance - JIRA PS-652068 did not resolve the issue for all balances.",
      "status": {
        "name": "Analysis",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Kevin Bello",
        "name": "kevin.bello@ukg.com",
        "email": "kevin.bello@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19720",
        "key": "JIRAUSER42797"
      },
      "reporter": {
        "display_name": "Toni Hodge [X]",
        "name": "toni.hodge@ukg.com",
        "email": "toni.hodge@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER51703"
      },
      "labels": [
        "UTABAL26",
        "UTAREPORT26"
      ],
      "created": "2026-03-23T16:09:16.000-0400",
      "updated": "2026-04-08T10:44:25.000-0400",
      "customfield_10503": {
        "value": [
          "WATTS WATER TECHNOLOGIES  INC."
        ]
      },
      "customfield_10704": {
        "value": "S3"
      }
    },
    {
      "id": "2585294",
      "key": "PS-792611",
      "summary": "UTA + UKG Pro app - received an error when trying to clock out",
      "status": {
        "name": "Analysis",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Kenley Rodriguez",
        "name": "kenley.rodriguez@ukg.com",
        "email": "kenley.rodriguez@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19715",
        "key": "JIRAUSER74229"
      },
      "reporter": {
        "display_name": "Gloria Marquez",
        "name": "gloria.marquez@ukg.com",
        "email": "gloria.marquez@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19715",
        "key": "JIRAUSER61962"
      },
      "created": "2026-03-13T16:20:17.000-0400",
      "updated": "2026-04-08T16:22:42.000-0400",
      "customfield_10503": {
        "value": [
          "YOUNG MEN'S CHRISTIAN ASSOCIATION OF DELAWARE"
        ]
      },
      "customfield_10704": {
        "value": "S3"
      }
    },
    {
      "id": "2578752",
      "key": "PS-788511",
      "summary": "UTA UPGRADE - Weekly Timesheet is NOT populating the employee default labor allocation.",
      "status": {
        "name": "Backlog",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Tharmen Balasubramaniam",
        "name": "tharmen.bala@ukg.com",
        "email": "tharmen.bala@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19728",
        "key": "JIRAUSER42917"
      },
      "reporter": {
        "display_name": "Arseny Medvedev",
        "name": "arseny.medvedev@ukg.com",
        "email": "arseny.medvedev@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER51348"
      },
      "labels": [
        "RCA-Type-Defect",
        "UTA-INFOR-Defect",
        "UTAUPGRADE26",
        "UTAWEEKLYTS26",
        "cust-city-of-ann-arbor"
      ],
      "created": "2026-03-11T10:25:53.000-0400",
      "updated": "2026-04-01T15:47:13.000-0400",
      "customfield_10503": {
        "value": [
          "CITY OF ANN ARBOR"
        ]
      },
      "customfield_10704": {
        "value": "S3"
      }
    },
    {
      "id": "2563665",
      "key": "PS-779290",
      "summary": "URGENT - UPGRADE - FAILURE of Service Order related jobs",
      "status": {
        "name": "Analysis",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Kevin Bello",
        "name": "kevin.bello@ukg.com",
        "email": "kevin.bello@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19720",
        "key": "JIRAUSER42797"
      },
      "reporter": {
        "display_name": "Brian Toberman",
        "name": "brian.toberman@ukg.com",
        "email": "brian.toberman@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER51357"
      },
      "created": "2026-03-05T17:36:22.000-0500",
      "updated": "2026-04-08T13:21:06.000-0400",
      "customfield_10503": {
        "value": [
          "DOLBY LABORATORIES  INC."
        ]
      },
      "customfield_10704": {
        "value": "S3"
      }
    },
    {
      "id": "2558633",
      "key": "PS-775958",
      "summary": "UTA Reports -  Scheduled Reports access error",
      "status": {
        "name": "Backlog",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Tharmen Balasubramaniam",
        "name": "tharmen.bala@ukg.com",
        "email": "tharmen.bala@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19728",
        "key": "JIRAUSER42917"
      },
      "reporter": {
        "display_name": "Chi Liu",
        "name": "chi.liu@ukg.com",
        "email": "chi.liu@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19720",
        "key": "JIRAUSER51811"
      },
      "labels": [
        "RCA-Type-Defect",
        "UTA-INFOR-Defect"
      ],
      "created": "2026-03-04T12:04:50.000-0500",
      "updated": "2026-04-08T10:42:02.000-0400",
      "customfield_10503": {
        "value": [
          "WINPAK LTD"
        ]
      },
      "customfield_10704": {
        "value": "S3"
      }
    },
    {
      "id": "2508713",
      "key": "PS-743562",
      "summary": "UTA – POST UPGRADE – Task GWI - PST CREWPRO Punch Import Phase 2 Under Job Scheduler Producing Error Since Upgrade",
      "status": {
        "name": "Backlog",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Tharmen Balasubramaniam",
        "name": "tharmen.bala@ukg.com",
        "email": "tharmen.bala@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19728",
        "key": "JIRAUSER42917"
      },
      "reporter": {
        "display_name": "Michelle Navarro",
        "name": "michelle.navarro@ukg.com",
        "email": "michelle.navarro@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER51711"
      },
      "labels": [
        "RCA-Type-Defect",
        "UTA-INFOR-Defect",
        "UTAJOBSKED26",
        "UTAPORT26",
        "UTAUPGRADE26",
        "cust-genesee-wyoming"
      ],
      "created": "2026-02-10T14:39:49.000-0500",
      "updated": "2026-04-08T10:42:51.000-0400",
      "customfield_10503": {
        "value": [
          "Genesee & Wyoming Railroad Services, Inc"
        ]
      },
      "customfield_10704": {
        "value": "S3"
      }
    },
    {
      "id": "2508109",
      "key": "PS-743284",
      "summary": "UTA Upgrade - Employee unable to enter 7th day of RIA in UKG",
      "status": {
        "name": "Fix in Review",
        "category": "In Progress",
        "color": "inprogress"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Radek Jadczak",
        "name": "radek.jadczak@ukg.com",
        "email": "radek.jadczak@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?ownerId=JIRAUSER43018&avatarId=57308",
        "key": "JIRAUSER43018"
      },
      "reporter": {
        "display_name": "Carlos Munoz",
        "name": "carlos.munoz@ukg.com",
        "email": "carlos.munoz@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19720",
        "key": "JIRAUSER77720"
      },
      "labels": [
        "UTAUPGRADE26",
        "cust-dolby-laboratories"
      ],
      "created": "2026-02-10T12:03:25.000-0500",
      "updated": "2026-04-08T10:44:58.000-0400",
      "customfield_10503": {
        "value": [
          "DOLBY LABORATORIES  INC."
        ]
      },
      "customfield_10704": {
        "value": "S3"
      }
    },
    {
      "id": "2463722",
      "key": "PS-716246",
      "summary": "UTA Post Upgrade - Time Off Approval: Employee time off requests are creating duplicate approval entries. ",
      "status": {
        "name": "Waiting for Support",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Tharmen Balasubramaniam",
        "name": "tharmen.bala@ukg.com",
        "email": "tharmen.bala@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19728",
        "key": "JIRAUSER42917"
      },
      "reporter": {
        "display_name": "Theraune Seville",
        "name": "theraune.seville@ukg.com",
        "email": "theraune.seville@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER51755"
      },
      "labels": [
        "UTATIMEOFF26"
      ],
      "created": "2026-01-20T14:57:28.000-0500",
      "updated": "2026-04-08T10:45:01.000-0400",
      "customfield_10503": {
        "value": [
          "MATTAMY HOMES LIMITED"
        ]
      },
      "customfield_10704": {
        "value": "S3"
      }
    },
    {
      "id": "2340702",
      "key": "PS-641268",
      "summary": "UTA Upgrade - Imports: Transactions are showing as APPLIED on the WBINT_IMPORT Table instead of ERROR when a transaction shows as an error on the employee basic information override page. ",
      "status": {
        "name": "Backlog",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P3"
      },
      "assignee": {
        "display_name": "Kevin Bello",
        "name": "kevin.bello@ukg.com",
        "email": "kevin.bello@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19720",
        "key": "JIRAUSER42797"
      },
      "reporter": {
        "display_name": "Theraune Seville",
        "name": "theraune.seville@ukg.com",
        "email": "theraune.seville@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER51755"
      },
      "labels": [
        "RCA-Type-Defect",
        "UTA-INFOR-Defect",
        "UTAEE25",
        "UTAJOBSKED25",
        "UTAPORT25",
        "UTAUPGRADE25",
        "cust-cheesecake-factory"
      ],
      "created": "2025-11-12T13:10:31.000-0500",
      "updated": "2026-04-06T15:06:02.000-0400",
      "customfield_10503": {
        "value": [
          "CHEESECAKE FACTORY"
        ]
      },
      "customfield_10704": {
        "value": "S3"
      }
    },
    {
      "id": "2653134",
      "key": "PS-836615",
      "summary": "UTA - Timesheet: Work Detail is landing on the following day when punches cross midnight. ",
      "status": {
        "name": "Analysis",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P4"
      },
      "assignee": {
        "display_name": "Unassigned"
      },
      "reporter": {
        "display_name": "Theraune Seville",
        "name": "theraune.seville@ukg.com",
        "email": "theraune.seville@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER51755"
      },
      "labels": [
        "UTADAILYTS26"
      ],
      "created": "2026-04-09T13:18:22.000-0400",
      "updated": "2026-04-09T13:48:42.000-0400",
      "customfield_10503": {
        "value": [
          "ESSENDANT MANAGEMENT SERVICES LLC"
        ]
      },
      "customfield_10704": {
        "value": "S4"
      }
    },
    {
      "id": "2649451",
      "key": "PS-831673",
      "summary": "UTA - Rules: Please provide list of all UTA Rules for Client.",
      "status": {
        "name": "Analysis",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P4"
      },
      "assignee": {
        "display_name": "Unassigned"
      },
      "reporter": {
        "display_name": "Theraune Seville",
        "name": "theraune.seville@ukg.com",
        "email": "theraune.seville@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER51755"
      },
      "labels": [
        "UTARULES26"
      ],
      "created": "2026-04-08T13:29:42.000-0400",
      "updated": "2026-04-09T14:04:26.000-0400",
      "customfield_10503": {
        "value": [
          "KEOLIS AMERICA INC."
        ]
      },
      "customfield_10704": {
        "value": "S4"
      }
    },
    {
      "id": "2623835",
      "key": "PS-815865",
      "summary": "UTA Upgrade - How do I access UTA once we have migrated to UKG WFM for history?",
      "status": {
        "name": "Analysis",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P4"
      },
      "assignee": {
        "display_name": "Ian Cowpar",
        "name": "ian.cowpar@ukg.com",
        "email": "ian.cowpar@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER68801"
      },
      "reporter": {
        "display_name": "Theraune Seville",
        "name": "theraune.seville@ukg.com",
        "email": "theraune.seville@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER51755"
      },
      "labels": [
        "UTAUPGRADE26"
      ],
      "created": "2026-03-30T09:40:17.000-0400",
      "updated": "2026-04-08T10:44:02.000-0400",
      "customfield_10503": {
        "value": [
          "Ellwood Group, Inc."
        ]
      },
      "customfield_10704": {
        "value": "S4"
      }
    },
    {
      "id": "1468285",
      "key": "TO-10605",
      "summary": "UTA- Custom SONY SICK Entitlement not granting as designed.",
      "status": {
        "name": "In Test",
        "category": "In Progress",
        "color": "inprogress"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "P4"
      },
      "assignee": {
        "display_name": "Radek Jadczak",
        "name": "radek.jadczak@ukg.com",
        "email": "radek.jadczak@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?ownerId=JIRAUSER43018&avatarId=57308",
        "key": "JIRAUSER43018"
      },
      "reporter": {
        "display_name": "Donna Foster",
        "name": "donna.foster@ukg.com",
        "email": "donna.foster@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=19714",
        "key": "JIRAUSER51376"
      },
      "labels": [
        "UTA-CUSTOMS-MAINTENANCE",
        "UTACUSTOMS24",
        "UTAENTITLE24",
        "UTA_Case",
        "UTA_Customs"
      ],
      "created": "2024-04-12T12:51:24.000-0400",
      "updated": "2026-04-08T10:44:53.000-0400",
      "customfield_10503": {
        "value": [
          "SONY PICTURES ENTERTAINMENT  INC."
        ]
      },
      "customfield_10704": {
        "value": "S4"
      }
    },
    {
      "id": "2640095",
      "key": "PS-825484",
      "summary": "Cascades PROD UTA web outage from 3/20 - 3/23",
      "status": {
        "name": "Analysis",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "None"
      },
      "assignee": {
        "display_name": "Varma Indukuri",
        "name": "varma.indukuri@ukg.com",
        "email": "varma.indukuri@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?ownerId=JIRAUSER88719&avatarId=69502",
        "key": "JIRAUSER88719"
      },
      "reporter": {
        "display_name": "Diana Cheng",
        "name": "diana.cheng@ukg.com",
        "email": "diana.cheng@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER54837"
      },
      "created": "2026-04-06T14:45:09.000-0400",
      "updated": "2026-04-07T11:11:47.000-0400",
      "customfield_10503": {
        "value": [
          "CASCADES CANADA ULC"
        ]
      },
      "customfield_10704": {
        "value": "S3"
      }
    },
    {
      "id": "2584661",
      "key": "PS-792110",
      "summary": "Alignment in Time Off Approval view is offset since upgrade",
      "status": {
        "name": "Backlog",
        "category": "To Do",
        "color": "default"
      },
      "issue_type": {
        "name": "Defect"
      },
      "priority": {
        "name": "None"
      },
      "assignee": {
        "display_name": "Unassigned"
      },
      "reporter": {
        "display_name": "Arseny Medvedev",
        "name": "arseny.medvedev@ukg.com",
        "email": "arseny.medvedev@ukg.com",
        "avatar_url": "https://engjira.int.kronos.com/secure/useravatar?avatarId=10122",
        "key": "JIRAUSER51348"
      },
      "labels": [
        "RCA-Type-Defect",
        "UTA-UKG-Defect",
        "UTAUPGRADE26",
        "cust-jewish-federation-chicago"
      ],
      "created": "2026-03-13T10:18:39.000-0400",
      "updated": "2026-04-06T15:24:46.000-0400",
      "customfield_10503": {
        "value": [
          "Jewish Federation of Metropolitan Chicago"
        ]
      },
      "customfield_10704": {
        "value": "S4"
      }
    }
  ]
};

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

async function populateAll() {
  try {
    console.log('🔧 Initializing database...');
    await dbManager.initialize();
    console.log('✅ Database ready\n');

    // Filter out Change tickets (CM-xxxxx) - exclude any issue with key starting with "CM-"
    const defectIssues = JIRA_RESULTS.issues.filter(issue => {
      return !issue.key.startsWith('CM-');
    });

    console.log(`📊 Source data: ${JIRA_RESULTS.total} total issues`);
    console.log(`   ${JIRA_RESULTS.issues.length - defectIssues.length} Change tickets excluded`);
    console.log(`   ${defectIssues.length} customer-impacting defects\n`);

    const defects = defectIssues.map(transformDefect);

    console.log(`📥 Replacing UTA data with ${defects.length} defects...`);

    // Delete existing UTA data
    DefectModel.deleteByProduct('uta');

    // Insert fresh data
    DefectModel.bulkInsert(defects);

    const stats = DefectModel.getStats('uta');

    console.log('\n✅ Database populated successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Total defects: ${stats.total}`);
    console.log(`   P1: ${stats.p1}, P2: ${stats.p2}, P3+: ${stats.total - stats.p1 - stats.p2}`);
    console.log(`   Customer-facing: ${stats.customer_impacting}`);

    // Count unique customers
    const customerSet = new Set();
    defects.forEach(d => {
      if (d.customers && d.customers.length > 0) {
        d.customers.forEach(c => customerSet.add(c));
      }
    });
    console.log(`   Unique customers: ${customerSet.size}`);
    console.log('\n🎉 Complete!\n');

  } catch (error) {
    console.error('❌ Population failed:', error);
    process.exit(1);
  } finally {
    dbManager.close();
  }
}

populateAll();
