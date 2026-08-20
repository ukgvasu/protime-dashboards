---
name: swag_field_discovery
description: SWAG field integration - field ID discovery process and implementation
metadata: 
  node_type: memory
  type: reference
  originSessionId: b8a71462-95c4-4c34-8dc0-a0fc831a707c
  modified: 2026-08-20T11:51:28.663Z
---

## SWAG Field Implementation - How It Was Discovered

### The Challenge
Need to extract and display SWAG values from Jira Business Epics for dashboard display.

### Discovery Process

**Initial Attempts:** Tried 30+ different field IDs unsuccessfully
- Attempted: customfield_10001, 10002, 10000, 10087, 10088, 20000 range, 50000 range, etc.
- All returned 0 or null values

**Breakthrough:** User provided critical hint
- "Check how the Swag values were brought back in Q4 Actuals vs Planned"

**Solution:** Examined existing swag-actuals.js code
- Located at: backend/src/api/swag-actuals.js line 46
- Found: `swag: parseFloat(issue.fields?.customfield_18302) || 0,`

**Verification:** Used debug endpoint to confirm
- Created `/api/fy27/debug/:epicKey` endpoint
- Fixed issue: endpoint was only checking fields every 10 increments (10000, 10010, ... 10090, 10100...)
- This missed customfield_18302 (ends in 2, not 0 or 10)
- Updated to check ALL fields: `for (let i = 10000; i <= 30000; i++)`

### Correct Field Information

**Field ID:** customfield_18302
**Field Type:** SWAG field
**Data Format:** Numeric value (parseFloat compatible)
**Extraction Code:**
```javascript
function extractSWAG(fields, issueKey) {
  if (fields.customfield_18302) {
    const val = parseFloat(fields.customfield_18302);
    if (!isNaN(val)) {
      return val;
    }
  }
  return 0;
}
```

### Important Notes

1. **Don't fetch child story SWAG** - Initial implementation tried to sum child stories' SWAG values, but for Business Epics we should display the epic's own SWAG value from customfield_18302

2. **WFM Classic uses different structure** - While customfield_18302 is the same SWAG field, WFM Classic epics have portfolio team in customfield_22201 (Subvalue Stream) instead of customfield_22500 (Portfolio Team Name)

3. **Request field explicitly** - Always include 'customfield_18302' in the fields list when fetching from Jira API to ensure it's returned

### Where SWAG Is Used

- H1 Plan Summary page: Total Planned SWAG stat card + individual epic SWAG values
- Q1/Q2 Progress pages: Planned SWAG stat card (currently hardcoded to 0, could be enhanced)
- Epic cards throughout dashboard

### Related Files
- `backend/src/api/fy27.js` - extractSWAG function
- `backend/src/api/swag-actuals.js` - Original SWAG extraction reference
- `frontend/src/pages/FY27H1Summary.jsx` - SWAG display in epic cards
