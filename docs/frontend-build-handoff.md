# Frontend Build Handoff Notes
## UTA Upgrade Issues Tracker

**Phase:** 4 - Frontend Build  
**Previous Phase:** Backend Build (Complete ✅)  
**Date:** 2026-04-10

---

## Backend API Ready

### Endpoint
```
GET /api/defects/uta/upgrade-tracker
```

### Response Structure
```json
{
  "upgrade25": {
    "total": 45,
    "resolved": 30,
    "open": 15,
    "resolution_rate": 66.7,
    "avg_resolution_days": 12.5,
    "median_resolution_days": 10
  },
  "upgrade26": {
    "total": 38,
    "resolved": 22,
    "open": 16,
    "resolution_rate": 57.9,
    "avg_resolution_days": 14.2,
    "median_resolution_days": 11
  },
  "true_defects": {
    "total": 18,
    "defect_rate": 40.0,
    "avg_resolution_days": 15.2,
    "median_resolution_days": 12
  },
  "baseline": {
    "total": 150,
    "avg_resolution_days": 22.3
  },
  "aging_issues": [
    {
      "key": "UTA-1234",
      "summary": "Issue summary",
      "age_days": 45,
      "priority": "P2",
      "severity": "S2",
      "assignee": "John Doe",
      "status": "In Progress",
      "jira_url": "https://engjira.int.kronos.com/browse/UTA-1234"
    }
  ],
  "resolution_breakdown": {
    "Fixed": 25,
    "Won't Fix": 3,
    "Duplicate": 2,
    "Cannot Reproduce": 1
  },
  "generated_at": "2026-04-10T12:00:00.000Z"
}
```

### API Client Method
```javascript
import { api } from './services/api';

const data = await api.getUpgradeTracker('uta');
```

---

## Design Requirements (from Phase 3 UX Design)

### Layout
**3-column responsive grid:**
1. **Left Column (40%):** Upgrade 25 metrics
2. **Center Column (40%):** Upgrade 26 metrics  
3. **Right Column (20%):** True Defects analysis

**Below grid:** 
- Baseline comparison bar
- Aging issues table
- Resolution breakdown chart

### Color Scheme
- **Primary:** `#005151` (UTA teal)
- **Success:** `#27ae60` (green for high resolution rates)
- **Warning:** `#f39c12` (amber for medium rates)
- **Danger:** `#e74c3c` (red for low rates)

### Typography
- **Headers:** Bold, 1.5rem
- **Metrics:** Large (2rem), bold
- **Labels:** Small caps, 0.875rem
- **Body:** 1rem

---

## Component Structure (Suggested)

```
/frontend/src/pages/UTA/
├── UpgradeTrackerDashboard.jsx    # Main container
├── components/
│   ├── UpgradeMetricsCard.jsx     # Reusable for 25/26
│   ├── TrueDefectsCard.jsx        # True defect analysis
│   ├── BaselineComparison.jsx     # Baseline bar chart
│   ├── AgingIssuesTable.jsx       # Top 10 oldest issues
│   └── ResolutionBreakdown.jsx    # Pie/bar chart
└── styles/
    └── upgrade-tracker.css
```

---

## Key Metrics to Display

### Per Upgrade (25 & 26)
1. **Total Issues** - Large number at top
2. **Resolution Rate** - Progress bar with percentage
3. **Resolved vs Open** - Split display or small chart
4. **Avg Resolution Days** - Compared to baseline
5. **Median Resolution Days** - Compared to baseline

### True Defects
1. **Count** - How many are actual defects
2. **Defect Rate %** - What % of total are defects
3. **Avg Resolution** - How long defects take to fix
4. **Comparison** - vs baseline avg

### Baseline
- Show avg resolution days for Portfolio Team 3121
- Use as reference point for comparisons

### Aging Issues
- Table with 10 oldest unresolved true defects
- Columns: Key (link), Summary, Age, Priority, Severity, Assignee
- Sortable by age_days

### Resolution Breakdown
- Pie or bar chart showing distribution:
  - Fixed
  - Won't Fix
  - Duplicate
  - Cannot Reproduce
  - Other

---

## Comparison Logic

### Good vs. Bad Indicators

**Resolution Rate:**
- ≥70% = Green (good)
- 50-69% = Amber (medium)
- <50% = Red (needs attention)

**Avg Resolution Days:**
- Better than baseline = Green
- Within 20% of baseline = Amber
- Worse than baseline by >20% = Red

**Defect Rate:**
- <30% = Green (low noise)
- 30-50% = Amber (medium noise)
- >50% = Red (high quality signal)

---

## Interactive Elements

### Clickable Items
- Jira issue keys → Open in new tab
- Aging issues rows → Highlight/expand
- Charts → Tooltips on hover

### Filters (Phase 5)
- Toggle between Upgrade 25/26
- Show only unresolved
- Filter by priority/severity

### Refresh
- Manual refresh button
- Auto-refresh every 15 min (cache TTL)
- Show last updated timestamp

---

## Error Handling

### Loading States
```javascript
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <NoDataMessage />;
```

### Empty States
- No upgrade 25 issues
- No upgrade 26 issues
- No aging issues
- No resolution data

### API Errors
- Network failure
- 500 server error
- Invalid data format

---

## Accessibility

- ARIA labels on all cards
- Keyboard navigation for table
- Screen reader friendly metrics
- High contrast mode support
- Semantic HTML (section, article, table)

---

## Testing Checklist

Frontend Build Agent should verify:

- [ ] Dashboard loads without errors
- [ ] API call fetches data correctly
- [ ] Metrics cards display all values
- [ ] Charts render properly
- [ ] Aging issues table populates
- [ ] Links to Jira work
- [ ] Responsive on mobile/tablet/desktop
- [ ] Loading states show during fetch
- [ ] Error states display on failure
- [ ] Colors match design spec
- [ ] Typography matches existing pages

---

## Integration Steps

1. **Create page route:**
   ```javascript
   // In App.jsx or routes config
   <Route path="/uta/upgrade-tracker" element={<UpgradeTrackerDashboard />} />
   ```

2. **Add navigation link:**
   ```javascript
   // In sidebar or UTA section
   <NavLink to="/uta/upgrade-tracker">Upgrade Tracker</NavLink>
   ```

3. **Fetch data on mount:**
   ```javascript
   useEffect(() => {
     api.getUpgradeTracker('uta')
       .then(setData)
       .catch(setError)
       .finally(() => setLoading(false));
   }, []);
   ```

4. **Render components:**
   ```jsx
   <div className="upgrade-tracker">
     <div className="metrics-grid">
       <UpgradeMetricsCard data={data.upgrade25} label="Upgrade 25" />
       <UpgradeMetricsCard data={data.upgrade26} label="Upgrade 26" />
       <TrueDefectsCard data={data.true_defects} />
     </div>
     <BaselineComparison baseline={data.baseline} upgrades={[data.upgrade25, data.upgrade26]} />
     <AgingIssuesTable issues={data.aging_issues} />
     <ResolutionBreakdown breakdown={data.resolution_breakdown} />
   </div>
   ```

---

## Style Reference

Match existing ProTime dashboard patterns:

### Card Styling
```css
.metrics-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 1.5rem;
  transition: transform 0.2s;
}

.metrics-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}
```

### Grid Layout
```css
.metrics-grid {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

@media (max-width: 1024px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## Notes for Frontend Agent

### Reuse Existing Components
- Look for similar metric cards in `/frontend/src/components/`
- Reuse table styles from defects pages
- Use existing chart library (Chart.js or Recharts)

### Data Availability
- Backend is ready and tested
- API endpoint validated
- Cache working (15-min TTL)
- No backend changes needed

### Focus Areas
1. **Visual polish** - Match Confluence design exactly
2. **Responsiveness** - Works on all screen sizes
3. **Performance** - Lazy load charts, optimize renders
4. **UX** - Smooth loading states, clear error messages

### Questions?
- Backend implementation details: `/docs/backend-implementation-summary.md`
- UX design spec: (provided by user in Phase 3)
- API validation: Run `node scripts/validate-backend.js`

---

## Ready to Build! 🚀

All backend components are in place and validated. The Frontend Build phase can proceed independently without any backend dependencies.
