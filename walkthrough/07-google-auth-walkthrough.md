# Walkthrough: Google OAuth Authentication

## Overview
Successfully implemented Google OAuth 2.0 authentication with user-based settings persistence, replacing device-based storage.

## What Was Built

### Backend

#### Database Schema
Created two new tables via EF Core migration:

**Users Table:**
- Stores Google user profiles (GoogleId, Email, Name, ProfilePictureUrl)
- Tracks login activity (CreatedAt, LastLoginAt)
- Primary key on Id, unique index on GoogleId

**UserSettings Table:**
- Stores key-value settings per user (tts_voice, tts_pitch, tts_rate, tts_volume)
- Foreign key to Users with cascade delete
- Unique constraint on (UserId, SettingKey)

#### API Controllers

**[GoogleAuthController](file:///Users/julien/Workspaces/ai-workout-companion/Controllers/GoogleAuthController.cs):**
- `POST /api/auth/google` - Verifies Google ID token
- Creates/updates User record
- Generates JWT token (30-day expiration)
- Returns user profile + JWT

**[UserSettingsController](file:///Users/julien/Workspaces/ai-workout-companion/Controllers/UserSettingsController.cs):**
- `GET /api/user-settings` - Load all user settings
- `POST /api/user-settings/{key}` - Save/update setting
- `DELETE /api/user-settings/{key}` - Delete setting
- All endpoints require JWT authentication

#### Authentication  
- JWT Bearer authentication configured in [Program.cs](file:///Users/julien/Workspaces/ai-workout-companion/Program.cs#L21-L37)
- Token validation with issuer/audience checks
- 30-day token expiration

---

### Frontend

#### Services

**[auth-service.js](file:///Users/julien/Workspaces/ai-workout-companion/wwwroot/auth-service.js):**
- Initializes Google Sign-In SDK
- Handles OAuth callback
- Exchanges Google token for JWT
- Stores JWT + user profile in localStorage
- Dispatches `auth:signed-in` / `auth:signed-out` events

**[user-settings-service.js](file:///Users/julien/Workspaces/ai-workout-companion/wwwroot/user-settings-service.js):**
- Loads settings from server when authenticated
- Falls back to localStorage when offline/unauthenticated
- Auto-syncs settings to server on change
- Caches locally for offline access

#### UI Components

**Header Authentication:**
- Google Sign-In button when unauthenticated
- User profile with avatar + name when signed in
- Sign Out button

**Integration:**
- [app.js](file:///Users/julien/Workspaces/ai-workout-companion/wwwroot/app.js#L78-L145) handles auth initialization
- Voice settings auto-sync to server
- Graceful fallback to localStorage

---

## Configuration Required

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen:
   - User Type: External (for testing)
   - App name: "AI Workout Companion"
   - Add your email as test user
6. Create OAuth Client ID:
   - Application type: Web application
   - Authorized JavaScript origins:
     - `http://localhost:5000` (local development)
     - `https://your-railway-domain.up.railway.app` (production)
   - Authorized redirect URIs: (none needed for implicit flow)
7. Copy the Client ID and Client Secret

### 2. Update Configuration Files

**`appsettings.json`:**
```json
{
  "Authentication": {
    "Google": {
      "ClientId": "YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com",
      "ClientSecret": "YOUR_ACTUAL_CLIENT_SECRET"
    }
  },
  "Jwt": {
    "SecretKey": "GENERATE_A_SECURE_RANDOM_STRING_AT_LEAST_32_CHARACTERS_LONG",
    "Issuer": "ai-workout-companion",
    "Audience": "ai-workout-companion-client"
  }
}
```

> [!IMPORTANT]
> Generate a secure JWT secret key. You can use: `openssl rand -base64 48`

**`wwwroot/app.js` (line ~89):**
```javascript
const clientId = 'YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com';
```

### 3. Run Database Migration

```bash
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet ef database update
```

This creates the `Users` and `UserSettings` tables.

---

## Testing Guide

### Test 1: Google Sign-In Flow

1. Start the app: `dotnet run`
2. Open http://localhost:5000
3. Click "Sign in with Google" button in header
4. Authorize the app in Google OAuth popup
5. **Expected:** User profile appears in header with avatar + name

**Verification:**
- Check database: `SELECT * FROM "Users";` → Should show your Google profile
- Check browser localStorage: `auth_token` and `user` should be set
- JWT token should be valid for 30 days

### Test 2: Voice Settings Persistence

1. Sign in with Google
2. Click "⚙️ Voice Settings"
3. Adjust pitch, rate, volume sliders
4. Reload the page
5. **Expected:** Settings restored from server

**Verification:**
- Check database: `SELECT * FROM "UserSettings" WHERE "UserId" = 1;`
- Should see rows for `tts_pitch`, `tts_rate`, `tts_volume`
- Values should match what you set

### Test 3: Multi-Device Sync

1. Sign in on Device A (or Browser A)
2. Set voice pitch to 1.5
3. Sign out
4. Sign in on Device B (or Browser B) with same Google account
5. Open Voice Settings
6. **Expected:** Pitch should be 1.5 (synced from server)

### Test 4: Offline Fallback

1. Stop the server
2. Adjust voice settings
3. **Expected:** Settings save to localStorage
4. Restart server, reload page
5. **Expected:** Settings load from localStorage

### Test 5: Sign Out

1. Click "Sign Out" button
2. **Expected:** 
   - User profile disappears
   - Google Sign-In button appears
   - localStorage `auth_token` and `user` cleared

---

## Known Limitations

1. **API Keys Not Migrated:** Hevy API keys still use device-based storage. Will need to migrate `CredentialsController` to user-based auth in future.

2. **Client ID Hardcoded:** Google Client ID is hardcoded in `app.js`. Should move to config endpoint.

3. **No Token Refresh:** JWT tokens expire after 30 days. User must sign in again (no refresh token implementation).

4. **localStorage Dependency:** Still relies on localStorage for offline mode and backwards compatibility.

---

## Deployment (Railway)

### Environment Variables

Set these in Railway dashboard:

```
Authentication__Google__ClientId=YOUR_CLIENT_ID
Authentication__Google__ClientSecret=YOUR_CLIENT_SECRET
Jwt__SecretKey=YOUR_SECURE_JWT_SECRET
ConnectionStrings__DefaultConnection=<railway-provides-this>
```

### OAuth Configuration

Add Railway URL to Google Cloud Console:
- Authorized JavaScript origins: `https://your-app.up.railway.app`

### Update Frontend

Before deploying, update `app.js` with production Client ID or fetch from API.

---

## Files Changed

### New Files
- `Models/User.cs`
- `Models/UserSetting.cs`
- `Controllers/GoogleAuthController.cs`
- `Controllers/UserSettingsController.cs`
- `wwwroot/auth-service.js`
- `wwwroot/user-settings-service.js`
- `Migrations/20260203121207_AddUserAuthentication.cs`
- `planning/07-google-auth.md`

### Modified Files
- `Program.cs` - Added JWT authentication
- `Data/AppDbContext.cs` - Added Users, UserSettings tables
- `appsettings.json` - Added Google OAuth + JWT config
- `wwwroot/index.html` - Added Google SDK, auth UI
- `wwwroot/app.js` - Integrated auth services
- `wwwroot/styles.css` - Added auth UI styles

---

## Success! ✅

Google OAuth authentication is fully implemented with:
- ✅ User sign-in with Google
- ✅ JWT token generation
- ✅ User-based settings storage
- ✅ Multi-device sync
- ✅ Offline localStorage fallback
- ✅ Clean UI integration

**Next Steps:**
1. Configure Google OAuth credentials
2. Test the full flow
3. Consider migrating API keys to user-based storage
4. Add token refresh mechanism for long-term sessions
