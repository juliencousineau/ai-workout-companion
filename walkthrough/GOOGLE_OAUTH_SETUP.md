# Google OAuth Setup Guide

## Quick Start

### 1. Get Google OAuth Credentials

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create project: "AI Workout Companion"
3. Enable APIs: Google+ API
4. Create OAuth 2.0 Client ID:
   - Type: Web application  
   - Origins: `http://localhost:5000`, `https://your-railway-url.up.railway.app`
5. Copy Client ID & Secret

### 2. Configure Backend

Edit `appsettings.json`:

```json
{
  "Authentication": {
    "Google": {
      "ClientId": "PASTE_YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
      "ClientSecret": "PASTE_YOUR_CLIENT_SECRET_HERE"
    }
  },
  "Jwt": {
    "SecretKey": "RUN: openssl rand -base64 48",
    "Issuer": "ai-workout-companion",
    "Audience": "ai-workout-companion-client"
  }
}
```

### 3. Configure Frontend

Edit `wwwroot/app.js` (line ~89):

```javascript
const clientId = 'PASTE_YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';
```

### 4. Run Migration

```bash
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet ef database update
```

### 5. Start App

```bash
docker-compose up -d  # Start PostgreSQL
dotnet run
```

### 6. Test

1. Open http://localhost:5000
2. Click "Sign in with Google"
3. Authorize app
4. See your profile in header!

## Troubleshooting

**"Invalid Client ID":**
- Check Client ID matches in both `appsettings.json` AND `app.js`
- Verify `http://localhost:5000` is in authorized origins

**"Sign-in button not showing":**
- Check browser console for errors
- Ensure Google SDK loaded (check Network tab)
- Verify `googleSignInBtn` element exists

**"Settings not syncing":**
- Check JWT token in localStorage
- Verify server is running
- Check browser console for API errors
- Confirm database migration ran successfully

## Production Deployment (Railway)

1. Add environment variables in Railway:
   ```
   Authentication__Google__ClientId=...
   Authentication__Google__ClientSecret=...
   Jwt__SecretKey=...
   ```

2. Update Google Cloud Console:
   - Add Railway URL to authorized origins

3. Update `app.js` with production Client ID

Done! 🎉
