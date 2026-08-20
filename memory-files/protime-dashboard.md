---
name: protime_dashboard_complete
description: Complete ProTime Dashboard system - FY27 H1/Q1/Q2 planning and security tracking
metadata: 
  node_type: memory
  type: project
  originSessionId: b8a71462-95c4-4c34-8dc0-a0fc831a707c
  modified: 2026-08-20T13:40:43.371Z
---

## ProTime Dashboard - Complete Implementation

**Repository:** https://github.com/ukgvasu/protime-dashboards
**Local Path:** /Users/srinivas.sreekakolapu/claudeprojects/protime-dashboards
**Tech Stack:** React Frontend, Node.js Backend, Jira REST API v2

### Project Overview

A comprehensive portfolio management dashboard for three UKG products (UTA, UTM, WFM Classic) providing:
- FY27 H1 Business Epic planning with health indicators
- Q1/Q2 Development Progress tracking at Epic level
- Security issue dashboards with product breakdown
- SWAG field integration for capacity planning

---

## Architecture & Implementation

### Frontend (React)
- **Location:** `/frontend/src`
- **Router:** React Router with NavLink exact path matching
- **Charts:** Recharts for visualizations
- **Icons:** lucide-react
- **Dev Server:** http://localhost:3000 (Vite)

### Backend (Node.js)
- **Location:** `/backend/src`
- **API Server:** http://localhost:3001
- **Database:** SQLite with DefectModel, SnapshotModel
- **Cache:** In-memory cache service (5-minute TTL)
- **Jira Integration:** Jira REST API v2 with custom JQL queries

---

## Features Implemented

### 1. H1 Plan Summary Pages
**Route:** `/[product]/fy27-h1` (or `/fy27-h1`)
**Products:** UTA, UTM, WFM Classic

**Components:**
- Business Epic cards showing SWAG, Progress %, Status, Health indicator, Owner
- Stat cards: Total Business Epics, Completed, At Risk, Planned SWAG
- 2-column grid layout with color-coded health indicators
- Links to individual Jira issues

**Epic Counts:**
- UTA: 14 Business Epics, Planned SWAG: 864
- UTM: 17 Business Epics
- WFM Classic: 11 Business Epics, Planned SWAG: 1495

**SWAG Field:** customfield_18302 (extracted from each epic)

### 2. Q1 Development Progress Pages
**Route:** `/[product]/fy27-h1/q1-progress`
**Date Range:** 9/23/2026 - 12/22/2026 (7 two-week sprints)

**Epic Counts:**
- UTA: 12 epics
- UTM: 15 epics
- WFM Classic: 9 epics

**Features:**
- Three visualization tabs: Cumulative, By Period, Stories
- Sprint-based progress tracking (Sprint 1-7)
- Stat cards: Total Epics, At Risk, On Track, Healthy, Planned SWAG
- Progress % visualization across sprints

### 3. Q2 Development Progress Pages
**Route:** `/[product]/fy27-h1/q2-progress`
**Date Range:** 12/23/2026 - 3/23/2027 (7 two-week sprints)

**Epic Counts:**
- UTA: 12 epics
- UTM: 15 epics
- WFM Classic: 8 epics

**Same features as Q1 with Q2-specific data**

### 4. Security Dashboard
**Route:** `/security`

**Features:**
- Total security defects count (299 WFM Classic issues)
- Critical issues breakdown (S1+S2 severity)
- Product breakdown:
  - UTA: 0 critical
  - UTM: 0 critical
  - WFM Classic: 299 critical
- Charts: By Severity, By Security Classification
- Security defects list with key, summary, status, priority, severity

**JQL Query:** `reporter = svc_DevSecOps_RW and component in ("WFM Classic", UTA, UTM) and status not in (Closed, Canceled)`

---

## Navigation Structure

```
FY27 (Header - larger text)
├─ H1 Plan Summary (parent)
│  ├─ Q1 Progress (child - indented)
│  └─ Q2 Progress (child - indented)
├─ Q4 Actuals vs Planned
├─ Defect Dashboard
└─ Customer Impact

ANALYTICS (bottom section)
├─ Defect Health Summary
└─ KTLO Analysis
```

**Key Fix:** Parent links use `end` prop for exact path matching to prevent highlighting both parent and child

---

## Key Technical Challenges & Solutions

### Challenge 1: SWAG Field Discovery
**Problem:** Initial attempts used 30+ different field IDs without success
**Solution:** Examined swag-actuals.js and discovered correct field: **customfield_18302**
**Key Learning:** User hint "Check how the Swag values were brought back in Q4 Actuals vs Planned"

### Challenge 2: WFM Classic Field Structure
**Problem:** WFM Classic uses different field structure than UTA/UTM
- Value Stream: customfield_22200 = "Classic Offerings - Pro Time"
- Subvalue Stream: customfield_22201 = "WFM Classic"
- Uses component field for organization (not Portfolio Team)

**Solution:** Updated JQL queries to use summary pattern matching for WFM Classic
- H1 Planning: `summary ~ "WFM Classic" AND summary ~ "FY27 H1"`
- Q1 Progress: `summary ~ "WFM Classic" AND summary ~ "Q1"`
- Q2 Progress: `summary ~ "WFM Classic" AND summary ~ "Q2"`
- Security: `component = "WFM Classic"` (standard Jira field)

### Challenge 3: Security Dashboard JQL Failure
**Problem:** Old JQL with "Classification", "CTO Staff", "Pillar" fields returning 400 errors
**Solution:** Replaced with working query from DevSecOps: `reporter = svc_DevSecOps_RW and component in ("WFM Classic", UTA, UTM) and status not in (Closed, Canceled)`

### Challenge 4: SWAG Value Not Displaying
**Problem:** Epic's own SWAG being overwritten by sum of child stories' SWAG
**Solution:** Removed child story SWAG aggregation - display epic's own SWAG value from customfield_18302

---

## API Endpoints

### H1 Planning
- `GET /api/fy27/:product` — Business Epics with SWAG
  - Returns: epics array, stats (totalEpics, plannedSWAG)
  - Products: uta, utm, wfmClassic
  - Cache key: `fy27:{product}:h1`

### Q1 Progress
- `GET /api/q1-progress/:product` — Q1 Epics
  - Returns: epics array, stats
  - Cache key: `q1-progress:{product}`

### Q2 Progress
- `GET /api/q2-progress/:product` — Q2 Epics
  - Returns: epics array, stats
  - Cache key: `q2-progress:{product}`

### Security
- `GET /api/reports/security` — All security issues
  - Returns: total, critical (S1+S2), byProduct, byProduct breakdown
  - Cache key: `security`

- `GET /api/reports/security/:product` — Product-specific security
  - Products: uta, utm, wfm-classic
  - Cache key: `security_uta`, `security_utm`, `security_wfm`

---

## Files Modified/Created

### Backend
- `backend/src/api/fy27.js` (created) — H1 Planning Business Epics
- `backend/src/api/q1-progress.js` (created) — Q1 Development Progress
- `backend/src/api/q2-progress.js` (created) — Q2 Development Progress
- `backend/src/api/reports.js` (modified) — Security dashboard with new JQL
- `backend/src/server.js` (modified) — Route registration

### Frontend
- `frontend/src/pages/FY27H1Summary.jsx` (created) — H1 Planning page
- `frontend/src/pages/Q1DevelopmentProgress.jsx` (created) — Q1 Progress page
- `frontend/src/pages/Q2DevelopmentProgress.jsx` (created) — Q2 Progress page
- `frontend/src/components/Layout.jsx` (modified) — Navigation updates
- `frontend/src/App.jsx` (modified) — Route definitions

### Configuration
- `.claude/launch.json` (created) — Dev server configuration

---

## Recent Git Commits

1. **7842d73** - Implement FY27 H1 Planning dashboard system with SWAG tracking
2. **87bcd11** - Fix security dashboard error handling
3. **b7d55fa** - Update security dashboard with correct JQL query (299 WFM Classic issues)
4. **9b53e27** - Add WFM Classic epic support to Q1/Q2 Progress pages

---

## Current Status

### ✅ Working Features
- H1 Plan Summary pages for all products with SWAG display
- Q1/Q2 Progress pages for all products with epic tracking
- Security Dashboard showing 299 WFM Classic issues
- Multi-tab visualizations (Cumulative, By Period, Stories)
- Health indicators with color coding
- Navigation with proper parent/child highlighting
- Real-time Jira integration with caching

### 📊 Data Summary
- **Total Business Epics:** 42 (14 UTA + 17 UTM + 11 WFM Classic)
- **Total Planned SWAG:** 2,359+ (864 UTA + 1,495 WFM Classic)
- **Security Issues:** 299 WFM Classic
- **Development Epics Q1:** 36 total
- **Development Epics Q2:** 35 total

### ⚙️ Development
- **Start servers:** `npm run dev` from project root
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001
- **Deployment:** Code pushed to GitHub via git credential helper (macOS keychain)

---

## Known Limitations & Future Enhancements

1. **Planned SWAG for Q1/Q2:** Currently hardcoded to 0 - could be calculated from epic SWAG
2. **Security Classification:** Removed old logic - could be re-added if needed
3. **Child Story SWAG:** Currently not aggregated - could be calculated per epic
4. **Cache Invalidation:** Time-based (5 min) - no manual invalidation endpoint yet

---

## Related Memory Files
- [[swag_field_discovery]] — SWAG field implementation details
