# Railway Deployment Configuration

## Required Environment Variables

Add these in your Railway project settings:

### Database (Auto-configured by Railway)
```
DATABASE_URL=<automatically_provided_by_railway>
```

### Google OAuth
```
Authentication__Google__ClientId=YOUR_PRODUCTION_CLIENT_ID.apps.googleusercontent.com
Authentication__Google__ClientSecret=YOUR_PRODUCTION_CLIENT_SECRET
```

### JWT Configuration
```
Jwt__SecretKey=GENERATE_SECURE_KEY_HERE
Jwt__Issuer=ai-workout-companion
Jwt__Audience=ai-workout-companion-client
```

## How to Generate JWT Secret

Run this command locally:
```bash
openssl rand -base64 48
```

Copy the output and paste it as the value for `Jwt__SecretKey`.

## Google OAuth Setup for Production

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to Credentials → Your OAuth Client ID
4. Add to **Authorized JavaScript origins**:
   ```
   https://your-app-name.up.railway.app
   ```
5. Copy Client ID and Client Secret to Railway environment variables

## Frontend Configuration

Update `wwwroot/app.js` (line ~89):

**Option 1: Hardcode production Client ID** (simplest)
```javascript
const clientId = 'YOUR_PRODUCTION_CLIENT_ID.apps.googleusercontent.com';
```

**Option 2: Create config endpoint** (recommended for multi-environment)
Create `/api/config` endpoint that returns:
```json
{
  "googleClientId": "YOUR_CLIENT_ID"
}
```

## Deployment Steps

1. **Set Environment Variables** in Railway dashboard
2. **Deploy** - Railway will auto-build from GitHub
3. **Run Migration** (one-time):
   - Railway will auto-run migrations on startup (already configured in `Program.cs`)
4. **Test** - Visit your Railway URL and try Google Sign-In

## Local Development

For local development, create `appsettings.Development.json`:

```bash
cp appsettings.Development.json.template appsettings.Development.json
```

Then edit with your local Google OAuth credentials (can use same credentials with `http://localhost:5000` in authorized origins).

This file is gitignored and won't be committed!

## Verification

After deployment:
1. Visit your Railway URL
2. Click "Sign in with Google"
3. If you get an error about unauthorized origin, check Google Cloud Console authorized origins
4. After successful sign-in, check Railway logs to confirm user creation

## Troubleshooting

**"Origin not allowed":**
- Add your Railway URL to Google Cloud Console authorized JavaScript origins

**"Invalid JWT secret key not configured":**
- Ensure `Jwt__SecretKey` is set in Railway environment variables

**Database connection issues:**
- Railway auto-provides `DATABASE_URL`
- If using PostgreSQL service, connection string is auto-configured

## Environment Variable Format

Railway uses double underscore `__` for nested configuration:
- `Authentication:Google:ClientId` → `Authentication__Google__ClientId`
- `Jwt:SecretKey` → `Jwt__SecretKey`
