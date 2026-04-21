# Architecture Audit: UTA Upgrade Issues Tracker

**Date**: 2026-04-10  
**Scope**: Readiness assessment for "always live" UTA Upgrade Issues Tracker page  
**Requested Approach**: Auto-polling (frontend 60s, backend cache 15-min TTL)

---

## Executive Summary

The current architecture is **production-ready** for the auto-polling upgrade tracker with minor enhancements needed. The Express + SQLite + React stack can handle 60-second polling without performance issues. Key findings:

- **Backend**: Current in-memory label filtering already supports UTAUPGRADE label detection. No caching layer exists - recommend **in-memory cache with 15-min TTL**.
- **Database**: Schema needs 2 boolean columns (`is_upgrade_25`, `is_upgrade_26`) and 1 resolution time column. Current indexes are sufficient.
- **Jira API**: Existing `getBoardIssues()` method handles label-based filtering via JQL. Rate limit risk is low (1 req/15min per product).
- **Frontend**: Existing pattern (useEffect + Promise.all) can be extended with `setInterval()` for 60s polling.

---

## 1. Auto-Polling Feasibility

### Current State
- **No caching layer exists**: Backend fetches directly from Jira API on every sync.
- **Current sync**: Disabled auto-sync (line 155-172, `auto-sync.js`), relies on manual MCP data population.
- **Frontend pattern**: Single load on mount (`useEffect`), no polling.

### Recommendations

**Backend Caching Strategy** (in-memory, no Redis needed):
```javascript
// Add to backend/src/services/cache-service.js
class CacheService {
  constructor() {
    this.cache = new Map();
    this.TTL_MS = 15 * 60 * 1000; // 15 minutes
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }
  
  set(key, data) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.TTL_MS
    });
  }
  
  invalidate(key) {
    this.cache.delete(key);
  }
}

export const cacheService = new CacheService();
```

**Cache Invalidation**: When manual sync occurs via `/api/sync`, call `cacheService.invalidate('uta-upgrade-tracker')` before refreshing data.

**Performance Assessment**:
- **Current load**: 1 UTA board fetch = ~300-500 issues, ~2-3s response time
- **With polling**: Frontend requests every 60s, backend serves from cache (hits every 15min)
- **Jira API rate limit**: Cloud allows ~100 req/min. Upgrade tracker adds 1 req/15min = **negligible impact**.

---

## 2. Database Schema Changes

### Required Additions

```sql
-- Add upgrade tracking columns to defects table
ALTER TABLE defects ADD COLUMN is_upgrade_25 BOOLEAN DEFAULT 0;
ALTER TABLE defects ADD COLUMN is_upgrade_26 BOOLEAN DEFAULT 0;
ALTER TABLE defects ADD COLUMN resolution_time_days INTEGER;

-- Add index for fast upgrade filtering
CREATE INDEX IF NOT EXISTS idx_defects_upgrade_25 ON defects(is_upgrade_25) WHERE is_upgrade_25 = 1;
CREATE INDEX IF NOT EXISTS idx_defects_upgrade_26 ON defects(is_upgrade_26) WHERE is_upgrade_26 = 1;
```

### Data Population Logic

Update `backend/src/services/jira-service.js` `transformIssue()` method:

```javascript
// Inside transformIssue() function (line 220-269)
const labels = fields.labels || [];
const isUpgrade25 = labels.some(l => l.toLowerCase().includes('utaupgrade25'));
const isUpgrade26 = labels.some(l => l.toLowerCase().includes('utaupgrade26'));

// Calculate resolution time (in days)
let resolutionTimeDays = null;
if (fields.resolutiondate && fields.created) {
  const created = parseISO(fields.created);
  const resolved = parseISO(fields.resolutiondate);
  resolutionTimeDays = differenceInDays(resolved, created);
}

return {
  // ... existing fields
  is_upgrade_25: isUpgrade25,
  is_upgrade_26: isUpgrade26,
  resolution_time_days: resolutionTimeDays,
  // ... rest of fields
};
```

Update `DefectModel.insert()` to include new fields (line 6-46 in `defect.js`).

### Storage Requirements
- **Existing table**: ~1,500 rows (UTA defects)
- **New columns**: 3 columns × 1,500 rows = negligible storage (~15KB)
- **Index size**: ~30KB total (SQLite B-tree overhead minimal for boolean indexes)

---

## 3. Jira API Integration

### Current Capabilities
- **Method**: `getBoardIssues(boardId, jql, fields, maxTotal)` (line 86-125, `jira-service.js`)
- **Pagination**: Handles batching (100 issues/request)
- **Label filtering**: Supported via JQL

### New JQL Queries Needed

```javascript
// Fetch UTAUPGRADE25 issues
const jql25 = 'labels = UTAUPGRADE25 AND project = UTA ORDER BY created DESC';

// Fetch UTAUPGRADE26 issues
const jql26 = 'labels = UTAUPGRADE26 AND project = UTA ORDER BY created DESC';

// Baseline: All UTA issues (365-day window)
const jqlBaseline = 'project = UTA AND created >= -365d ORDER BY created DESC';
```

### Rate Limit Considerations
- **Current**: Auto-sync disabled. Manual sync ~1x/day.
- **With tracker**: 1 cached req/15min = 96 req/day.
- **Jira Cloud limit**: ~100 req/min = 144,000 req/day.
- **Risk**: **None**. Upgrade tracker adds <0.1% of limit.

---

## 4. Backend API Design

### Recommended New Endpoint

**Pattern**: Follow `/api/defects/:product/by-category/:category` (line 200-271, `defects.js`)

**New Route**: `/api/defects/uta/upgrade-tracker`

**Implementation** (add to `backend/src/api/defects.js`):

```javascript
// GET /api/defects/uta/upgrade-tracker - Get upgrade metrics
router.get('/uta/upgrade-tracker', async (req, res) => {
  try {
    const db = getDb();
    
    // Check cache first
    const cached = cacheService.get('uta-upgrade-tracker');
    if (cached) {
      return res.json(cached);
    }
    
    // Fetch UTAUPGRADE25 issues
    const upgrade25Stmt = db.prepare(`
      SELECT * FROM defects
      WHERE product = 'uta' AND is_upgrade_25 = 1
      ORDER BY created_at DESC
    `);
    const upgrade25 = upgrade25Stmt.all().map(parseDefectRow);
    
    // Fetch UTAUPGRADE26 issues
    const upgrade26Stmt = db.prepare(`
      SELECT * FROM defects
      WHERE product = 'uta' AND is_upgrade_26 = 1
      ORDER BY created_at DESC
    `);
    const upgrade26 = upgrade26Stmt.all().map(parseDefectRow);
    
    // Baseline: All UTA issues (365-day window)
    const baselineStmt = db.prepare(`
      SELECT * FROM defects
      WHERE product = 'uta'
        AND created_at >= date('now', '-365 days')
      ORDER BY created_at DESC
    `);
    const baseline = baselineStmt.all().map(parseDefectRow);
    
    // Calculate resolution time metrics
    const calcMetrics = (issues) => {
      const resolved = issues.filter(i => i.resolution_time_days !== null);
      if (resolved.length === 0) return { avg: 0, median: 0 };
      
      const times = resolved.map(i => i.resolution_time_days).sort((a, b) => a - b);
      const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
      const median = times.length % 2 === 0
        ? (times[times.length / 2 - 1] + times[times.length / 2]) / 2
        : times[Math.floor(times.length / 2)];
      
      return { avg: Math.round(avg), median };
    };
    
    const result = {
      upgrade25: {
        count: upgrade25.length,
        issues: upgrade25,
        resolutionTime: calcMetrics(upgrade25)
      },
      upgrade26: {
        count: upgrade26.length,
        issues: upgrade26,
        resolutionTime: calcMetrics(upgrade26)
      },
      baseline: {
        count: baseline.length,
        resolutionTime: calcMetrics(baseline)
      },
      lastUpdated: new Date().toISOString()
    };
    
    // Cache for 15 minutes
    cacheService.set('uta-upgrade-tracker', result);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function parseDefectRow(row) {
  return {
    ...row,
    labels: JSON.parse(row.labels || '[]'),
    components: JSON.parse(row.components || '[]'),
    customers: JSON.parse(row.customers || '[]')
  };
}
```

**Recommendation**: Add to existing `defects.js` rather than new file. Keeps UTA-specific logic centralized.

---

## 5. Data Sync Strategy

### Current Sync Process (line 45-148, `auto-sync.js`)
1. Fetch open defects (`getDefects()`)
2. Fetch recently closed (30 days)
3. Fetch security defects
4. Combine and bulk insert
5. Calculate stats

### Recommended Integration

**Option A: Integrated Sync (Recommended)**
- Add UTAUPGRADE filtering to existing `getDefects()` call
- Populate `is_upgrade_25/26` during `transformIssue()`
- No separate sync needed
- **Pros**: Single API call, consistent data, simpler maintenance
- **Cons**: Slightly larger payload (~50 extra labels checked)

**Option B: Separate Sync**
- Add new `getUpgradeDefects()` method
- Sync separately after main UTA sync
- **Pros**: Isolated failure domain
- **Cons**: Extra API call, potential data staleness

**Recommendation**: **Option A**. Current `transformIssue()` already classifies labels (line 196-217). Adding upgrade detection is a 2-line change:

```javascript
// In transformIssue() method
const isUpgrade25 = labels.some(l => l.toLowerCase().includes('utaupgrade25'));
const isUpgrade26 = labels.some(l => l.toLowerCase().includes('utaupgrade26'));
```

---

## 6. Risks & Limitations

### Identified Risks

1. **Label Consistency**: UTAUPGRADE labels must be standardized (case-sensitive? UTAUPGRADE25 vs UTAUpgrade25?).
   - **Mitigation**: Use case-insensitive matching (`toLowerCase()`).

2. **Cache Stampede**: If 15-min cache expires during high traffic, multiple requests might hit Jira.
   - **Mitigation**: Add mutex lock or stale-while-revalidate pattern.

3. **Browser Tab Resource**: 60s polling keeps connection active, drains battery on mobile.
   - **Mitigation**: Use `document.visibilityState` to pause polling when tab hidden.

4. **Stale Data During Manual Sync**: Frontend sees cached data while sync in progress.
   - **Mitigation**: Invalidate cache before sync starts (line 19, `sync.js`).

### Performance Limitations

- **SQLite file lock**: Multiple concurrent writes may block. Not an issue for read-heavy tracker.
- **In-memory cache**: Lost on server restart. Acceptable for 15-min TTL data.
- **No horizontal scaling**: Single-instance Express app. Fine for internal tool (<50 users).

---

## 7. Implementation Recommendations

### Phase 1: Backend Foundation (2-3 hours)
1. Add schema columns (5 min)
2. Update `transformIssue()` to populate upgrade flags (15 min)
3. Create `CacheService` class (30 min)
4. Add `/api/defects/uta/upgrade-tracker` endpoint (1 hour)
5. Test with existing data (30 min)

### Phase 2: Frontend Integration (1-2 hours)
1. Create `useUpgradeTracker()` hook with polling logic (45 min)
2. Build UI components (charts, tables) (1 hour)
3. Add visibility-based pause (15 min)

### Phase 3: Polish (1 hour)
1. Add loading states during cache refresh
2. Add "Last Updated" timestamp display
3. Error handling for network failures

**Total Effort**: ~5 hours development + 1 hour testing

---

## Conclusion

The current architecture is **well-suited** for the upgrade tracker with minimal changes. Key strengths:

- Existing label classification pattern easily extends to UTAUPGRADE labels
- SQLite performance sufficient for read-heavy queries (<500ms)
- Express API design already follows RESTful patterns for similar endpoints
- React frontend polling is straightforward with `setInterval()`

**Recommended path**: Implement Option A (integrated sync) with in-memory caching. This balances simplicity, performance, and maintainability for an internal tool serving <50 users.

**No blockers identified**. Ready to proceed with implementation.
