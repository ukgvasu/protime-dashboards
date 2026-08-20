---
name: outcome_field_discovery
description: Outcome field (customfield_22600) discovery and integration process
metadata: 
  node_type: memory
  type: reference
  modified: 2026-08-20T20:30:53.805Z
  originSessionId: b8a71462-95c4-4c34-8dc0-a0fc831a707c
---

## Outcome Field Discovery & Implementation

**Date:** 2026-08-20
**Field ID:** customfield_22600
**Field Type:** string
**Total Jira Fields Scanned:** 671 custom fields

### Discovery Process

1. **Initial Problem**
   - User requested outcome values for UTA Business Epics
   - Field was not being returned in H1 Planning API
   - Initially tried 30+ different field IDs without success

2. **Solution Approach**
   - Created `/api/fy27/fields/list` endpoint to query all Jira fields
   - Endpoint uses Bearer token auth (same as jira-service.js)
   - Filtered results for fields matching "outcome", "result", or "status"
   - Successfully identified customfield_22600 as the Outcome field

3. **Implementation**
   - Added customfield_22600 to comprehensiveFields in fy27.js
   - Updated transformEpic() function to extract outcome value
   - Enhanced debug endpoint to return allFields array for troubleshooting
   - Updated `/api/fy27/:product` response to include outcome field

### Authentication Details

**Jira API Auth Method:** Bearer Token
```javascript
headers: {
  'Authorization': `Bearer ${process.env.JIRA_PAT}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}
```

**Previous Failed Attempts:**
- Basic Auth (username:password) - returned 403 Forbidden
- OAuth - not available in this environment

### Current Data Status

**UTA Business Epics Outcome Data:**
- Total Epics: 14
- With Outcome Data: 1 (EP-15462)
- Fill Rate: 7.1%

**Data Example (EP-15462):**
```
Outcome: "We have eliminated LaunchDarkly SDK key exposure risk ahead of 
the December 2026 legacy retirement deadline by migrating UTA's SDK key 
retrieval to Google Secret Manager through pipeline updates, code refactoring, 
and value-stream key migration. UTA no longer stores SDK keys in source repos."
```

### Backend Changes

**Files Modified:**
1. `/backend/src/api/fy27.js`
   - Added axios import for direct HTTP requests
   - Added transformEpic() outcome field extraction
   - Added customfield_22600 to comprehensiveFields
   - Created `/fields/list` endpoint to discover field definitions
   - Enhanced debug endpoint with allFields array

### API Endpoint

**GET /api/fy27/:product**
```json
{
  "epics": [
    {
      "key": "EP-15462",
      "name": "UTA FY27 H1 - LaunchDarkly SDK Key Management",
      "status": "Committed",
      "owner": "Keith MacDonald",
      "health": "On Track",
      "outcome": "We have eliminated LaunchDarkly...",
      "progress": 0,
      "dueDate": null,
      "swag": 32
    }
  ]
}
```

### Field List Endpoint

**GET /api/fy27/fields/list**
Returns:
- totalFields: 671
- outcomeFields: Array of status/outcome-related fields
- allCustomFields: All custom fields sorted by name

### Related Concepts
- [[swag_field_discovery]] — Similar discovery process for SWAG field
- ProTime Dashboard project uses Bearer token auth for Jira REST API v2
