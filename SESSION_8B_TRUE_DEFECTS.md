# Session 8B - True Defects Filter Changes

**Date**: 2026-04-09  
**Status**: ✅ Complete

---

## Summary

All Leadership Dashboard metrics now filter by **"True Defects"** only - issues with RCA-Type-Defect or RCA-TYPE-DEFECT labels (`is_customer_reported = 1`).

---

## Backend Changes

### `/backend/src/api/reports.js`

**Line 1**: Added `differenceInDays` import from date-fns

**Lines 12-17**: Changed defect filtering logic
```javascript
// OLD: Only filtered by status
const allDefects = allDefectsRaw.filter(d => 
  d.status !== 'Closed' && d.status !== 'Canceled'
);

// NEW: Filter by RCA-Type-Defect label AND status
const allDefects = allDefectsRaw.filter(d =>
  d.status !== 'Closed' &&
  d.status !== 'Canceled' &&
  d.is_customer_reported === 1  // RCA-Type-Defect label
);
```

**Lines 18-24**: Added helper function for aging calculation
```javascript
// Helper: calculate days since last update
const daysSinceUpdate = (defect) => {
  if (!defect.updated_at) return defect.age_days;
  const now = new Date();
  const updated = new Date(defect.updated_at);
  return differenceInDays(now, updated);
};
```

**Lines 25-42**: Updated metric calculations
```javascript
// All metrics now operate on RCA-Type-Defect labeled defects only

totalOpenDefects = allDefects.length;
totalOpenCustomerFacing = allDefects.filter(d => d.customer_count > 0).length;
p1p2 = allDefects.filter(d => ['P1', 'P2'].includes(d.priority)).length;

// NEW: Split high severity by customer vs internal
highSeverityCustomer = S1/S2 + customer_count > 0
highSeverityInternal = S1/S2 + customer_count === 0

// UPDATED: Aging now uses "no update in 30+ days"
stale = allDefects.filter(d => daysSinceUpdate(d) >= 30).length;
```

**Response Changes**:
- Removed: `s1s2` (combined severity)
- Removed: `productsTracked`
- Added: `highSeverityCustomer`
- Added: `highSeverityInternal`
- Updated: `stale` calculation method

---

## Frontend Changes

### `/frontend/src/pages/LeadershipDashboard.jsx`

**Line 34**: Removed `highSeverity` calculation (no longer needed)

**Lines 63-113**: Updated 6 summary cards

| Card # | Label | Metric | Filter |
|--------|-------|--------|--------|
| 1 | Total Open Defects | `totalOpenDefects` | RCA-Type-Defect labeled |
| 2 | Customer-Facing | `totalOpenCustomerFacing` | RCA-Type-Defect + customer_count > 0 |
| 3 | High Priority (P1+P2) | `p1p2` | RCA-Type-Defect + P1/P2 |
| 4 | High Severity (Internal) | `highSeverityInternal` | RCA-Type-Defect + S1/S2 + customer_count = 0 |
| 5 | High Severity (Customer) | `highSeverityCustomer` | RCA-Type-Defect + S1/S2 + customer_count > 0 |
| 6 | Aging | `stale` | RCA-Type-Defect + no update 30+ days |

**Removed Card**: Products Tracked

**Updated Labels**:
- Card 1: Added sublabel "RCA-Type-Defect"
- Card 2: Changed sublabel from "Open Defects" to "With Customers"
- Card 6: Changed sublabel from "30+ days" to "No update 30+ days"

---

## Data Definitions

### True Defects
Issues with label `RCA-Type-Defect` or `RCA-TYPE-DEFECT` (case-insensitive)
- Database field: `is_customer_reported = 1`

### Customer-Facing Defects
True defects that have customers assigned
- Filter: `is_customer_reported = 1 AND customer_count > 0`

### Internal Defects
True defects without customers assigned
- Filter: `is_customer_reported = 1 AND customer_count = 0`

### Aging Definition
Defects with no update in the last 30 days
- Calculation: `differenceInDays(now, updated_at) >= 30`
- Fallback: Uses `age_days` if `updated_at` is null

---

## Product Health Comparison

✅ **Already Fixed** (Session 8A)

Product Health Comparison cards use `DefectModel.getCustomerFacingStats()` which filters by:
- `status !== 'Closed' AND status !== 'Canceled'`
- `is_customer_reported = 1`

This matches the Leadership summary cards' filtering logic.

---

## Impact

### Metric Changes (Expected)

**Before**: All metrics counted ALL open issues (bugs, defects, tasks, etc.)

**After**: All metrics count ONLY RCA-Type-Defect labeled issues

**Expected Results**:
- ✅ Total Open Defects: Much lower (only customer-reported defects)
- ✅ Customer-Facing: More accurate (filters by actual customer assignment)
- ✅ High Severity: Split into two meaningful metrics
- ✅ Aging: More actionable (shows stale defects, not just old ones)
- ✅ Product Health Comparison: Consistent with summary cards

---

## Verification Queries

### Total Open Defects (RCA-Type-Defect labeled)
```sql
SELECT COUNT(*) FROM defects 
WHERE is_customer_reported = 1 
  AND status NOT IN ('Closed', 'Canceled');
```

### Customer-Facing Defects
```sql
SELECT COUNT(*) FROM defects 
WHERE is_customer_reported = 1 
  AND customer_count > 0 
  AND status NOT IN ('Closed', 'Canceled');
```

### High Severity (Customer)
```sql
SELECT COUNT(*) FROM defects 
WHERE is_customer_reported = 1 
  AND severity IN ('S1', 'S2') 
  AND customer_count > 0 
  AND status NOT IN ('Closed', 'Canceled');
```

### High Severity (Internal)
```sql
SELECT COUNT(*) FROM defects 
WHERE is_customer_reported = 1 
  AND severity IN ('S1', 'S2') 
  AND customer_count = 0 
  AND status NOT IN ('Closed', 'Canceled');
```

### Aging (No Update 30+ Days)
```sql
SELECT COUNT(*) FROM defects 
WHERE is_customer_reported = 1 
  AND (julianday('now') - julianday(updated_at)) >= 30 
  AND status NOT IN ('Closed', 'Canceled');
```

### JQL Equivalents

**Total Open Defects**:
```
labels in (RCA-Type-Defect, RCA-TYPE-DEFECT) AND
statusCategory != Done
```

**Customer-Facing**:
```
labels in (RCA-Type-Defect, RCA-TYPE-DEFECT) AND
"Impacted Customers" is not EMPTY AND
statusCategory != Done
```

**High Severity (Customer)**:
```
labels in (RCA-Type-Defect, RCA-TYPE-DEFECT) AND
Severity in (S1, S2) AND
"Impacted Customers" is not EMPTY AND
statusCategory != Done
```

---

## Build Status

✅ Backend syntax check passed  
✅ Frontend build successful (671.74 kB)

---

## Testing Checklist

### Leadership Dashboard
- [ ] Navigate to Leadership Dashboard
- [ ] Verify 6 summary cards display
- [ ] Card 1: "Total Open Defects" with sublabel "RCA-Type-Defect"
- [ ] Card 2: "Customer-Facing" with sublabel "With Customers"
- [ ] Card 3: "High Priority (P1+P2)"
- [ ] Card 4: "High Severity (Internal)" - S1/S2 without customers
- [ ] Card 5: "High Severity (Customer)" - S1/S2 with customers
- [ ] Card 6: "Aging" with sublabel "No update 30+ days"
- [ ] Verify "Products Tracked" card is GONE
- [ ] All counts should be lower than before (RCA-Type-Defect filter applied)

### Product Health Comparison
- [ ] Verify card counts match summary "Total Open Defects"
- [ ] UTA + UTM + WFM Classic totals should equal portfolio total
- [ ] Counts should be customer-facing defects only

### Data Accuracy
- [ ] Compare Total Open Defects to JQL query count
- [ ] Verify Customer-Facing matches customers field filter
- [ ] Check that High Severity (Customer) + High Severity (Internal) equals total S1+S2
- [ ] Confirm Aging count uses updated_at field, not created_at

---

## Files Modified

### Backend
1. `/backend/src/api/reports.js`
   - Lines 1, 12-42, 80-95: Filter by RCA-Type-Defect, calculate new metrics

### Frontend
1. `/frontend/src/pages/LeadershipDashboard.jsx`
   - Lines 34, 63-113: Updated 6 summary cards

---

## Summary

✅ **All Leadership metrics now filter by "True Defects"** (RCA-Type-Defect labeled)  
✅ **Customer-Facing correctly filters by customer assignment** (not just label)  
✅ **High Severity split into Customer vs Internal** (meaningful distinction)  
✅ **Aging uses "no update 30+ days"** (more actionable than age-based)  
✅ **Product Health Comparison consistent** (customer-facing stats)  
✅ **Removed Products Tracked card** (replaced with High Severity Internal)
