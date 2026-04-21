# Slack Integration Setup

## Overview

The ProTime Dashboard can send alerts to Slack via Slack Bot integration. This allows you to share insights from Clara (the chat assistant) directly to the `#tof-psa-alerts` Slack channel.

## How It Works

1. **Slack Bot**: Uses Slack Web API with a bot token
2. **Centralized Config**: Admin configures once - no user passwords needed
3. **One-way Communication**: Dashboard → Slack (no responses needed)
4. **Secure**: Bot token has limited permissions (only `chat:write`)

## Setup Instructions

### 1. Create a Slack App (One-time setup by admin)

1. Go to https://api.slack.com/apps
2. Click **"Create New App"** → **"From scratch"**
3. Name it: **"ProTime Dashboard Bot"**
4. Select workspace: **UKG Inc**
5. Click **"Create App"**

### 2. Configure Bot Permissions

1. In your app settings, go to **"OAuth & Permissions"** (left sidebar)
2. Scroll to **"Scopes"** → **"Bot Token Scopes"**
3. Add these scopes:
   - `chat:write` - Post messages to channels
   - `chat:write.public` - Post to public channels without joining
4. Click **"Save Changes"**

### 3. Install App to Workspace

1. Scroll up to **"OAuth Tokens for Your Workspace"**
2. Click **"Install to Workspace"**
3. Review permissions and click **"Allow"**
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`)
   - ⚠️ Keep this secret! Don't commit it to git.

### 4. Add Bot to Channel (Optional)

If you want the bot to post to a private channel:
1. Go to the Slack channel (`#tof-psa-alerts`)
2. Click channel name → **"Integrations"** → **"Add apps"**
3. Search for **"ProTime Dashboard Bot"** and add it

For public channels, the bot can post without being added (uses `chat:write.public`).

### 5. Configure Backend

Add to `/home/iancowpar/protime-dashboard/backend/.env`:

```bash
# Slack Bot Integration
SLACK_BOT_TOKEN=xoxb-your-token-here
SLACK_CHANNEL_ID=C09861JGVQF
```

**Finding Channel ID:**
- Right-click channel name → **"View channel details"**
- Scroll to bottom, copy the Channel ID

### 6. Restart Backend Server

```bash
cd /home/iancowpar/protime-dashboard/backend
npm run dev
```

### 7. Test the Integration

1. Open ProTime Dashboard (http://localhost:3003)
2. Click chat assistant button (bottom right)
3. Ask Clara: "What are the top 3 high-priority defects?"
4. Click **"Send to Slack"** button
5. Check `#tof-psa-alerts` for the message

## Usage

### Sending Messages to Slack

1. **From Chat Assistant:**
   - Ask Clara any question about defects
   - Click **"Send to Slack"** button below her response
   - Message appears in `#tof-psa-alerts`

2. **Message Format:**
   ```
   🚨 ProTime Alert
   From: Dashboard User
   
   [Clara's response content]
   ```

### Use Cases

- **High-Priority Alerts**: "There are 5 new P1 defects that need attention"
- **Trend Analysis**: "Defect count increased 40% this week"
- **Customer Escalations**: "3 defects from key customer X need review"
- **Team Coordination**: Share insights with product/dev teams
- **Urgent Issues**: Quick notification for items requiring immediate attention

## API Endpoints

### POST /api/alerts/slack
Send a message to Slack.

**Request:**
```json
{
  "message": "Alert message content",
  "fromUser": "Dashboard User"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "1234567890.123456",
  "channel": "C09861JGVQF"
}
```

### GET /api/alerts/status
Check if Slack bot is configured.

**Response:**
```json
{
  "configured": true,
  "channelId": "C09861JGVQF",
  "ready": true
}
```

## Troubleshooting

### Error: "Slack service not configured"
- Check that `SLACK_BOT_TOKEN` is set in `.env`
- Token should start with `xoxb-`
- Restart the backend server after updating `.env`

### Error: "Failed to send alert"
- Verify bot token is correct
- Check if bot has `chat:write` permission
- Ensure bot is added to channel (for private channels)
- Check if channel ID is correct

### Error: "not_in_channel"
- Bot needs to be added to private channels first
- For public channels, ensure `chat:write.public` scope is enabled
- Or manually add bot: Channel → Integrations → Add apps

### Messages not appearing in Slack
- Verify channel ID is correct (should be `C09861JGVQF`)
- Check bot permissions in https://api.slack.com/apps
- Ensure bot is installed to workspace
- Check if bot was removed from channel

### Error: "invalid_auth"
- Bot token may be expired or revoked
- Generate a new token from app settings
- Update `SLACK_BOT_TOKEN` in `.env`
- Restart backend server

## Security Notes

- ✅ **No user passwords required** - only admin configures bot token
- ✅ **Limited permissions** - bot only has `chat:write` scope
- ✅ **Centralized control** - single bot token in backend `.env`
- ⚠️ **Never commit `.env`** - it's in `.gitignore`
- ✅ **Secure storage** - token stored server-side only
- ✅ **No client exposure** - frontend never sees the token

## Benefits Over Email Integration

1. **No user friction** - admin sets up once, works for everyone
2. **No password storage** - no individual credentials needed
3. **Better security** - limited bot permissions vs. email access
4. **IT-friendly** - no SMTP relay or password policies to worry about
5. **Native Slack** - better formatting, threading, reactions
6. **Future-proof** - can add interactive features later

## Advanced Features (Future)

With Slack Bot, you can add:
- **Rich formatting** with Block Kit
- **Interactive buttons** ("Assign to me", "Mark as P1")
- **Threading** - group related alerts
- **Reactions** - acknowledge alerts with emoji
- **Two-way** - respond to alerts from Slack

Current implementation is one-way only (dashboard → Slack).
