---
name: protime_dashboard
description: UKG ProTime Dashboard - FY27 H1 Planning and development tracking system
metadata: 
  node_type: memory
  type: project
  originSessionId: b8a71462-95c4-4c34-8dc0-a0fc831a707c
  modified: 2026-08-20T11:51:18.131Z
---

## ProTime Dashboard Project

**Repository:** https://github.com/ukgvasu/protime-dashboards
**Local Path:** /Users/srinivas.sreekakolapu/claudeprojects/protime-dashboards
**Tech Stack:** React Frontend, Node.js Backend, Jira API integration

### Current Status (As of 2026-08-20)

#### Completed Work - FY27 H1 Planning System

**Three Products Supported:** UTA, UTM, WFM Classic

**1. H1 Plan Summary Pages** (`/uta/fy27-h1`, `/utm/fy27-h1`, `/wfm-classic/fy27-h1`)
- Displays all Business Epics for each product with health indicators
- Shows Planned SWAG stat card with total SWAG value
- Individual epic cards display: SWAG, Progress %, Status, Health indicator, Owner
- Color-coded health indicators (Healthy, On Track, At Risk, Funnel)

**2. Q1/Q2 Development Progress Pages** (`/fy27-h1/q1-progress`, `/fy27-h1/q2-progress`)
- Epic-level development tracking (not Business Epic level)
- Three visualization tabs: Cumulative, By Period, Stories
- Sprint-based tracking with 2-week sprint definitions
- Q1: 9/23/2026-12/22/2026 (7 sprints)
- Q2: 12/23/2026-3/23/2027 (7 sprints)

**3. Navigation Updates**
- H1 Planning → H1 Plan Summary (renamed)
- Q1/Q2 Progress nested as sub-items under H1 Plan Summary
- Removed section headers (ACTUALS, OTHER)
- Moved Defect Health Summary and KTLO Analysis to bottom ANALYTICS section
- Fixed highlighting: child links no longer highlight parent

#### SWAG Field Implementation

**Field ID:** customfield_18302
**Extraction Logic:** parseFloat(fields.customfield_18302) || 0
**Display:** Individual SWAG values in epic cards + sum total in Planned SWAG stat card

**Key Fix:** Removed code that overwrote epic SWAG with child stories' SWAG sum. Now displays the epic's own SWAG value.

#### WFM Classic Epic Discovery Challenge & Solution

**Problem:** WFM Classic uses different field structure than UTA/UTM
- Value Stream (customfield_22200): "Classic Offerings - Pro Time"
- Subvalue Stream (customfield_22201): "WFM Classic"
- Does NOT use standard Portfolio Team Name field (customfield_22500)

**Initial Issue:** Query returned 18 epics including unwanted ones:
- Pro WFM epics (EP-14753, EP-14755)
- WFM T&L epics (EP-15457)
- MFT epics (EP-14614)

**Solution:** Updated JQL to search specifically for "WFM Classic" in summary
```
type = "Business epic" AND summary ~ "WFM Classic" AND summary ~ "FY27 H1"
```

**Result:** Now returns exactly 11 WFM Classic Business Epics with total Planned SWAG: 1495

### Epic Counts by Product
- UTA: 14 Business Epics, Planned SWAG: 864
- UTM: 17 Business Epics
- WFM Classic: 11 Business Epics, Planned SWAG: 1495

### Key Files Created/Modified

**Backend:**
- `backend/src/api/fy27.js` - H1 Planning Business Epics endpoint
- `backend/src/api/q1-progress.js` - Q1 Development Progress endpoint
- `backend/src/api/q2-progress.js` - Q2 Development Progress endpoint

**Frontend:**
- `frontend/src/pages/FY27H1Summary.jsx` - H1 Planning page component
- `frontend/src/pages/Q1DevelopmentProgress.jsx` - Q1 Progress page
- `frontend/src/pages/Q2DevelopmentProgress.jsx` - Q2 Progress page
- `frontend/src/components/Layout.jsx` - Navigation updates
- `frontend/src/App.jsx` - Route definitions

### Last Commit
**Message:** Implement FY27 H1 Planning dashboard system with SWAG tracking
**Hash:** 7842d73
**Date:** 2026-08-20

### Development Servers
**Frontend:** http://localhost:3000
**Backend:** http://localhost:3001

Start with: `npm run dev` from project root
