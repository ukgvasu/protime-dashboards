# ProTime Dashboard - Local Deployment Guide

## Prerequisites

- **Node.js v20+** ([download here](https://nodejs.org/))
- **Git** (if cloning from repository)
- **Jira PAT token** (Personal Access Token)
- **Anthropic API key** (optional, only needed for chat feature)

## Step 1: Get the Code

### Option A: From Zip File
1. Extract `protime-dashboard.zip` to your preferred location
2. Open terminal/command prompt in the extracted folder

### Option B: From Git Repository
```bash
git clone [repository-url]
cd protime-dashboard
```

## Step 2: Install Dependencies

```bash
npm install
```

This will install all dependencies for both backend and frontend.

**Expected time:** 1-2 minutes

## Step 3: Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your credentials:

```env
# Jira Configuration (REQUIRED)
JIRA_BASE_URL=https://engjira.int.kronos.com
JIRA_PAT=your-jira-pat-token-here

# Claude API (OPTIONAL - only needed for chat)
ANTHROPIC_API_KEY=your-api-key-here
CLAUDE_MODEL_NAME=claude-sonnet-4-6

# Server Configuration
PORT=3001
NODE_ENV=development
DB_PATH=../database/protime.db
```

### Getting Jira PAT Token:
1. Go to https://engjira.int.kronos.com
2. Click your profile icon → **Personal Access Tokens**
3. Click **Create token**
4. Name: "ProTime Dashboard" (or any name)
5. Permissions: **Read** access to projects
6. Copy the generated token to your `.env` file

**Important:** Save the token immediately - you won't be able to see it again!

### Getting Anthropic API Key (Optional):
1. Go to https://console.anthropic.com
2. Navigate to **API Keys** section
3. Create new key
4. Copy to `.env` file

**Note:** Chat feature will be disabled if this key is not provided. All other dashboard features work without it.

## Step 4: Initial Data Sync

```bash
# From project root directory
npm run sync
```

This will:
- Connect to Jira using your PAT token
- Fetch all defects for UTA, UTM, and WFM Classic
- Create SQLite database at `database/protime.db`
- Populate initial data

**Expected time:** 2-3 minutes on first run

**What you should see:**
```
✓ Connected to Jira
✓ Fetching defects from UTA board...
✓ Fetching defects from UTM board...
✓ Fetching defects from WFM Classic board...
✓ Database created and populated
✓ Sync complete! Total defects: [number]
```

## Step 5: Start the Application

### Option A: Both servers at once (Recommended)
```bash
# From project root
npm run dev
```

### Option B: Separate terminals
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

**Backend will start on:** http://localhost:3001  
**Frontend will start on:** http://localhost:3000

**What you should see:**
```
Backend: Server running on http://localhost:3001
Frontend: 
  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

## Step 6: Access the Dashboard

Open your browser to: **http://localhost:3000**

### Available Pages:
- **Leadership Dashboard** - `/leadership` (default home page)
- **UTA Upgrade Tracker** - `/uta-upgrade-tracker`
- **UTM Dashboard** - `/utm`
- **WFM Classic Dashboard** - `/wfm-classic`

### API Endpoints:
Backend API documentation available at: http://localhost:3001

## Refreshing Data

The dashboard displays cached data from the SQLite database. To refresh with latest Jira data:

### Manual Refresh via API:
```bash
curl -X POST http://localhost:3001/api/sync
```

### Manual Refresh via UI:
Look for a **Refresh** button in the dashboard interface (if implemented).

**Recommended refresh frequency:** Once per day, or before important meetings.

## Troubleshooting

### "Cannot connect to Jira"
**Symptoms:** Sync fails with authentication error

**Solutions:**
- Verify PAT token is correct in `backend/.env`
- Check if you're on VPN (may be required for internal Jira)
- Confirm base URL: `https://engjira.int.kronos.com`
- Verify token has not expired
- Create a new PAT token if needed

### "No data showing in dashboard"
**Symptoms:** Dashboard loads but shows zero defects or empty charts

**Solutions:**
- Run initial sync: `npm run sync`
- Check backend is running on port 3001
- Check browser console for errors (F12 → Console tab)
- Verify database file exists: `ls -la database/protime.db`

### "Port already in use"
**Symptoms:** Error: "EADDRINUSE: address already in use :::3001"

**Solutions:**
- **Mac/Linux:** `lsof -ti:3001 | xargs kill -9`
- **Windows:** `netstat -ano | findstr :3001` then `taskkill /PID [number] /F`
- Or change PORT in `backend/.env` to a different number (e.g., 3002)

### Database errors
**Symptoms:** SQLite errors or corrupt database

**Solutions:**
1. Stop the application (Ctrl+C)
2. Delete database: `rm database/protime.db`
3. Re-run sync: `npm run sync`

### "Module not found" errors
**Symptoms:** Import errors when starting application

**Solutions:**
- Delete `node_modules/`: `rm -rf node_modules/`
- Delete lock file: `rm package-lock.json`
- Reinstall: `npm install`

### Chat feature not working
**Symptoms:** Chat interface shows error or is disabled

**Solutions:**
- Chat is optional - verify you added `ANTHROPIC_API_KEY` to `.env`
- Check API key is valid at https://console.anthropic.com
- Verify you have API credits available
- Dashboard works fine without chat feature

## Stopping the Application

Press `Ctrl+C` in the terminal(s) running the servers.

If servers don't stop cleanly:
- **Mac/Linux:** `killall node`
- **Windows:** Use Task Manager to end Node.js processes

## Why Can't This Run on GitHub Pages?

GitHub Pages only hosts **static files** (HTML, CSS, JavaScript). 

ProTime Dashboard requires:
- **Node.js backend server** (Express API)
- **SQLite database** (persistent storage)
- **Jira API authentication** (server-side PAT token)
- **Real-time data sync** (background jobs)

**Alternative hosting options** (for future):
- Internal UKG server
- Cloud VM (AWS EC2, Azure VM, Google Compute)
- Docker container on internal infrastructure
- Kubernetes cluster
- Heroku, Railway, or similar PaaS

For now, local deployment is the recommended approach.

## Data Privacy & Security

**Important Notes:**
- Dashboard connects directly to Jira using your PAT token
- All data is stored locally in SQLite database on your machine
- No data is sent to external services (except Anthropic for chat if enabled)
- PAT token is stored in `.env` file - keep this file secure
- Do not commit `.env` file to Git (already in `.gitignore`)

## Updating the Dashboard

When new code changes are available:

```bash
git pull origin main  # Get latest code
npm install           # Update dependencies
npm run sync          # Refresh data
npm run dev           # Restart application
```

## Support

For issues or questions:
- **Contact:** Ian Cowpar
- **Team:** ProTime Engineering
- **Issues:** Check existing documentation in `/docs` folder

## Development Notes

### Project Structure:
```
protime-dashboard/
├── backend/          # Node.js/Express API
│   ├── src/
│   │   ├── api/      # Route handlers
│   │   └── services/ # Business logic
│   └── .env          # Configuration (DO NOT COMMIT)
├── frontend/         # React application
│   └── src/
│       ├── pages/    # Dashboard pages
│       └── components/
├── database/         # SQLite database
├── config/           # Jira board configurations
└── scripts/          # Utility scripts
```

### Tech Stack:
- **Backend:** Node.js, Express, SQLite
- **Frontend:** React, Vite, Lucide icons
- **APIs:** Jira REST API, Anthropic Claude API
- **Charts:** Recharts library

## Next Steps

1. **Explore the dashboards** - Navigate to different pages to see defect metrics
2. **Set up scheduled sync** - Consider running `npm run sync` via cron/scheduled task
3. **Customize views** - Modify filters or add new visualizations as needed
4. **Share with team** - Provide dashboard URL to stakeholders

---

**Last Updated:** April 2026  
**Version:** 1.0  
**Maintained by:** ProTime Engineering Team
