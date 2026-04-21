# ProTime Dashboard - Setup Guide

## Step 1: Configure Jira Credentials

Create `backend/.env` file:

```bash
cd ~/protime-dashboard/backend
cp .env.example .env
```

Edit `backend/.env` and add your Jira credentials:

```env
JIRA_BASE_URL=https://engjira.int.kronos.com
JIRA_EMAIL=your.email@ukg.com
JIRA_API_TOKEN=your-api-token-here
PORT=3001
NODE_ENV=development
DB_PATH=../database/protime.db
```

### Getting a Jira API Token

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a name (e.g., "ProTime Dashboard")
4. Copy the token and paste into `.env` file

## Step 2: Install Dependencies

```bash
cd ~/protime-dashboard

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Step 3: Initial Data Sync

Load data from Jira into the local database:

```bash
cd ~/protime-dashboard
npm run sync
```

This will:
- Create the SQLite database
- Fetch all defects from UTA, UTM, and WFM Classic boards
- Populate the database with current data
- Create initial snapshots for trending

**Expected output:**
```
📥 ProTime Dashboard - Initial Data Sync
🔧 Initializing database...
✅ Database ready

📡 Fetching UTA defects from Jira...
   Found XX defects
💾 Saving to database...
   Stats: XX total, P1:X P2:X, Unassigned:X
📸 Creating snapshot...
✅ UTA sync complete

... (repeat for UTM and WFM Classic)

✅ Total: XX defects across all products
🎉 Initial sync complete!
```

## Step 4: Start Development Servers

### Option A: Using the dev script (recommended)

```bash
cd ~/protime-dashboard
./scripts/dev.sh
```

This starts both backend and frontend together.

### Option B: Manual startup

**Terminal 1 - Backend:**
```bash
cd ~/protime-dashboard/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd ~/protime-dashboard/frontend
npm run dev
```

## Step 5: Access the Dashboard

Open your browser to: **http://localhost:3000**

## Verification Checklist

- [ ] Backend running on http://localhost:3001
- [ ] Frontend running on http://localhost:3000
- [ ] Database created at `database/protime.db`
- [ ] Home page loads successfully
- [ ] Product dashboards show data
- [ ] Leadership view displays portfolio metrics
- [ ] Security dashboard shows CVEs
- [ ] Trends page renders (may be empty if no historical data yet)

## Troubleshooting

### "Cannot connect to backend"
- Check backend is running on port 3001
- Verify no firewall blocking localhost connections
- Check backend terminal for errors

### "No data displayed"
- Run `npm run sync` to populate database
- Check `database/protime.db` exists
- Verify Jira credentials in `backend/.env`

### "Jira authentication failed"
- Verify API token in `.env` is correct
- Check email address matches your Jira account
- Try generating a new API token

### Database errors
- Delete `database/protime.db`
- Re-run `npm run sync`

## Next Steps

1. **Set up automated sync**
   - Add cron job to run `npm run sync` daily
   - Or implement scheduled task in backend

2. **Deploy to production**
   - Build frontend: `cd frontend && npm run build`
   - Deploy backend to server
   - Set up reverse proxy (nginx)

3. **Add alerts**
   - Configure alert rules in `config/alert-rules.json`
   - Set up Slack/email integration

## Daily Usage

### Refresh data
```bash
cd ~/protime-dashboard
npm run sync
```

### Start working
```bash
./scripts/dev.sh
```

### Manual API sync (while app is running)
```bash
curl -X POST http://localhost:3001/api/sync \
  -H "Content-Type: application/json" \
  -d '{"product": "all", "createSnapshot": true}'
```

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review backend logs in the terminal
3. Check browser console for frontend errors
4. Verify Jira board IDs in `config/jira-boards.json`
