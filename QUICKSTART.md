# ProTime Dashboard - Quick Start

## 1️⃣ Setup (5 minutes)

### Create .env file
```bash
cd ~/protime-dashboard/backend
cp .env.example .env
```

**Edit `backend/.env`** with your credentials:
```env
JIRA_EMAIL=your.email@ukg.com
JIRA_API_TOKEN=your-token-here
```

Get your API token: https://id.atlassian.com/manage-profile/security/api-tokens

### Verify setup
```bash
cd ~/protime-dashboard
./scripts/check-setup.sh
```

## 2️⃣ Load Data

Sync from Jira (takes 1-2 minutes):
```bash
npm run sync
```

## 3️⃣ Start Dashboard

```bash
./scripts/dev.sh
```

Opens:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

## 4️⃣ Explore

- **Home** → Product overview
- **UTA/UTM/WFM Classic** → Individual dashboards
- **Leadership** → Portfolio insights
- **Security** → CVE tracking
- **Trends** → Historical analysis

## Daily Refresh

```bash
npm run sync    # Update data from Jira
```

## Troubleshooting

**No data showing?**
- Run `npm run sync` first

**Port already in use?**
- Check what's running: `lsof -i :3000` or `lsof -i :3001`
- Kill process: `kill -9 <PID>`

**Jira auth error?**
- Verify credentials in `backend/.env`
- Check API token hasn't expired

---

📖 Full documentation: See `SETUP.md` and `README.md`
