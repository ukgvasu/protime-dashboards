# ProTime Dashboard

Real-time defect health tracking for UTA, UTM, and WFM Classic products.

## Features

- 📊 **Product Dashboards** - Individual health views for UTA, UTM, WFM Classic
- 👔 **Leadership View** - Portfolio-wide insights and high-risk defects
- 🔒 **Security Dashboard** - CVE tracking across all products
- 📈 **Historical Trends** - Multi-month defect analysis
- 🔄 **Live Sync** - Real-time Jira API integration
- 📥 **Data Export** - PDF and Excel exports (coming soon)

## Quick Start

### Prerequisites

- Node.js v20+ 
- Jira credentials (API token)

### Installation

```bash
# Install dependencies
cd ~/protime-dashboard
npm install

# Set up environment
cd backend
cp .env.example .env
# Edit .env with your Jira credentials
```

### Configuration

Edit `backend/.env`:

```env
JIRA_BASE_URL=https://engjira.int.kronos.com
JIRA_EMAIL=your.email@ukg.com
JIRA_API_TOKEN=your-api-token-here
PORT=3001
```

### Initial Data Load

```bash
# Run from project root
npm run sync
```

This will:
- Fetch all defects from Jira (UTA, UTM, WFM Classic)
- Populate SQLite database
- Create initial snapshots

### Development

```bash
# Terminal 1: Start backend API
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Frontend: http://localhost:3000  
Backend API: http://localhost:3001

## Project Structure

```
protime-dashboard/
├── backend/           # Node.js + Express API
│   ├── src/
│   │   ├── api/      # REST endpoints
│   │   ├── models/   # Database models
│   │   └── services/ # Business logic
│   └── .env          # Jira credentials
├── frontend/          # React SPA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
├── database/          # SQLite database
│   ├── schema.sql
│   └── protime.db    # Generated on first sync
├── config/            # Configuration files
│   ├── jira-boards.json
│   └── field-mappings.json
└── scripts/           # Utility scripts
    └── initial-sync.js
```

## API Endpoints

### Defects
- `GET /api/defects/:product` - Get defects for a product
- `GET /api/defects/:product/stats` - Get statistics
- `POST /api/defects/:key/update` - Update Jira issue

### Reports
- `GET /api/reports/leadership` - Leadership dashboard data
- `GET /api/reports/security` - Security CVEs
- `GET /api/reports/history/:product` - Historical trends

### Sync
- `POST /api/sync` - Manual sync trigger
- `GET /api/sync/status` - Last sync status

## Database

SQLite database at `database/protime.db`:

- **defects** - Current state of all defects
- **snapshots** - Daily aggregate metrics for trending
- **alerts** - Alert history
- **audit_log** - Change tracking

## Dashboard Pages

1. **Home** - Overview with product selector
2. **UTA Dashboard** - UTA defect health
3. **UTM Dashboard** - UTM defect health
4. **WFM Classic Dashboard** - WFM Classic defect health
5. **Leadership** - Portfolio-wide summary
6. **Security** - CVE tracking
7. **Trends** - Historical analysis

## Development Workflow

### Adding a new feature

1. Backend: Add endpoint in `backend/src/api/`
2. Frontend: Add API method in `frontend/src/services/api.js`
3. Frontend: Create/update component in `frontend/src/components/`
4. Frontend: Update page in `frontend/src/pages/`

### Syncing data

```bash
# Manual sync (all products)
npm run sync

# Or via API
curl -X POST http://localhost:3001/api/sync \
  -H "Content-Type: application/json" \
  -d '{"product": "all", "createSnapshot": true}'
```

## Tech Stack

- **Backend**: Node.js, Express, SQLite (better-sqlite3)
- **Frontend**: React, Vite, TailwindCSS, Recharts
- **Integration**: Jira REST API
- **Charts**: Recharts
- **Icons**: Lucide React

## Troubleshooting

### Sync fails
- Check Jira credentials in `backend/.env`
- Verify network access to https://engjira.int.kronos.com
- Check board IDs in `config/jira-boards.json`

### No data in frontend
- Ensure backend is running on port 3001
- Run initial sync: `npm run sync`
- Check browser console for errors

### Database errors
- Delete `database/protime.db` and re-run `npm run sync`
- Check database permissions

## Next Steps

- [ ] Set up scheduled sync (cron job)
- [ ] Add alert system (email/Slack)
- [ ] Implement PDF/Excel exports
- [ ] Add Jira edit modal
- [ ] Add user authentication
- [ ] Deploy to production

## Support

For issues or questions, contact the ProTime team.
