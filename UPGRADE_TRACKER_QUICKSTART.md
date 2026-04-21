# UTA Upgrade Tracker - Quick Start Guide

## What Was Built

Complete backend API for tracking UTA upgrade issues (UTAUPGRADE25 and UTAUPGRADE26).

## Files Changed/Created

### Created (4 files)
1. `/database/migrations/001_add_upgrade_tracking.sql` - Database schema changes
2. `/backend/src/services/cache-service.js` - In-memory cache (15-min TTL)
3. `/scripts/run-migration.js` - SQL migration runner
4. `/scripts/validate-backend.js` - Validation script

### Modified (5 files)
1. `/backend/src/services/jira-service.js` - Added upgrade label detection
2. `/backend/src/models/defect.js` - Added query methods + metrics calculator
3. `/backend/src/api/defects.js` - Added `/upgrade-tracker` endpoint
4. `/backend/src/api/sync.js` - Added cache invalidation
5. `/frontend/src/services/api.js` - Added `getUpgradeTracker()` method

---

## API Endpoint

### Request
```bash
GET /api/defects/uta/upgrade-tracker
```

### Response Fields
- `upgrade25` - Metrics for UTAUPGRADE25 issues
- `upgrade26` - Metrics for UTAUPGRADE26 issues
- `true_defects` - Analysis of RCA-Type-Defect labeled issues
- `baseline` - Portfolio Team 3121 comparison data
- `aging_issues` - Top 10 oldest unresolved true defects
- `resolution_breakdown` - Counts by resolution type
- `generated_at` - Timestamp

### Caching
- 15-minute TTL
- Auto-invalidates on sync
- In-memory (no persistence)

---

## Database Schema

### New Columns
```sql
is_upgrade_25          BOOLEAN  -- UTAUPGRADE25 label flag
is_upgrade_26          BOOLEAN  -- UTAUPGRADE26 label flag
resolution_time_days   INTEGER  -- Days to resolve (null if unresolved)
```

### New Indexes
```sql
idx_defects_upgrade_25  -- Fast WHERE is_upgrade_25 = 1
idx_defects_upgrade_26  -- Fast WHERE is_upgrade_26 = 1
```

---

## Usage Examples

### Frontend Component
```javascript
import { api } from './services/api';
import { useEffect, useState } from 'react';

function UpgradeTracker() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getUpgradeTracker('uta')
      .then(result => setData(result))
      .catch(err => console.error(err));
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h2>Upgrade 25</h2>
      <p>Total: {data.upgrade25.total}</p>
      <p>Resolved: {data.upgrade25.resolved}</p>
      <p>Rate: {data.upgrade25.resolution_rate}%</p>
    </div>
  );
}
```

### Direct API Call
```bash
curl http://localhost:3001/api/defects/uta/upgrade-tracker
```

---

## Testing

### Validate Backend
```bash
cd /home/iancowpar/protime-dashboard
node scripts/validate-backend.js
```

Expected output: `✅ ALL VALIDATIONS PASSED!`

### Test API Endpoint
```bash
# Start backend server
npm run dev

# In another terminal
curl http://localhost:3001/api/defects/uta/upgrade-tracker | jq
```

---

## Next Steps

1. ✅ Backend complete (this phase)
2. ⏭️ **Frontend Build** - Create dashboard UI
3. ⏭️ **Integration & Polish** - Final testing

---

## Key Configuration

- **Portfolio Team ID:** `3121` (for baseline queries)
- **Cache TTL:** 15 minutes
- **Upgrade Labels:** UTAUPGRADE25, UTAUPGRADE26 (case-insensitive)
- **Custom Field:** `customfield_22500` (Portfolio Team)

---

## Troubleshooting

### API returns empty data
1. Run a sync to populate database: `POST /api/sync`
2. Verify issues have UTAUPGRADE25/26 labels in Jira
3. Check console for errors

### Cache not clearing
1. Verify `cacheService.invalidate()` in sync.js
2. Check console for `🗑️ Cache invalidated` message
3. Try manual cache clear (restart server)

### Baseline query empty
1. Verify Portfolio Team custom field: `customfield_22500`
2. Check team ID is `'3121'` (string)
3. Verify issues exist in last 365 days

---

## Documentation

- Full backend details: `/docs/backend-implementation-summary.md`
- Frontend handoff: `/docs/frontend-build-handoff.md`
- Validation script: `/scripts/validate-backend.js`

---

## Support

For issues or questions:
1. Check validation script output
2. Review implementation summary
3. Inspect API response in browser DevTools
4. Check backend console logs
