# Google OAuth Authentication & User Settings

Replace device-based credential storage with Google OAuth authentication and user-based settings persistence in PostgreSQL.

## User Review Required

> [!IMPORTANT]
> **Breaking Change**: Existing device-based credentials will need to be re-entered after signing in with Google for the first time.

> [!NOTE]
> **Google OAuth Setup**: You'll need to create a Google Cloud project and OAuth credentials. I'll provide instructions during implementation.

## Proposed Changes

### Backend - Authentication

#### [NEW] [GoogleAuthController.cs](file:///Users/julien/Workspaces/ai-workout-companion/Controllers/GoogleAuthController.cs)

Create controller for handling Google OAuth callback and JWT token generation:
- `POST /api/auth/google` - Verify Google ID token
- Exchange Google ID token for JWT
- Create/update User record in database
- Return JWT for client storage

#### [MODIFY] [Program.cs](file:///Users/julien/Workspaces/ai-workout-companion/Program.cs)

Add authentication services:
- Google authentication library
- JWT Bearer authentication
- Configure Google OAuth client ID/secret from environment
- Add `app.UseAuthentication()` and `app.UseAuthorization()`

---

### Backend - Database Schema

#### [MODIFY] [AppDbContext.cs](file:///Users/julien/Workspaces/ai-workout-companion/Data/AppDbContext.cs)

Add new tables:
- **Users** table:
  - `Id` (int, primary key)
  - `GoogleId` (string, unique, indexed)
  - `Email` (string)
  - `Name` (string)
  - `ProfilePictureUrl` (string, nullable)
  - `CreatedAt` (datetime)
  - `LastLoginAt` (datetime)

- **UserSettings** table:
  - `Id` (int, primary key)
  - `UserId` (int, foreign key to Users)
  - `SettingKey` (string) - e.g., "tts_voice", "tts_pitch", "tts_rate"
  - `SettingValue` (string) - JSON-serialized value
  - `UpdatedAt` (datetime)
  - Unique constraint on (UserId, SettingKey)

Keep **UserCredentials** table, but change:
- Replace `DeviceId` with `UserId` (foreign key to Users)
- Keep encrypted API key storage

#### [NEW] [Models/User.cs](file:///Users/julien/Workspaces/ai-workout-companion/Models/User.cs)
#### [NEW] [Models/UserSetting.cs](file:///Users/julien/Workspaces/ai-workout-companion/Models/UserSetting.cs)

Create entity models for the new tables.

---

### Backend - API Controllers

#### [MODIFY] [CredentialsController.cs](file:///Users/julien/Workspaces/ai-workout-companion/Controllers/CredentialsController.cs)

Update to use user authentication:
- Add `[Authorize]` attribute
- Replace `DeviceId` with `UserId` from JWT claims
- Keep encryption/decryption logic

#### [NEW] [UserSettingsController.cs](file:///Users/julien/Workspaces/ai-workout-companion/Controllers/UserSettingsController.cs)

Create controller for managing user settings:
- `GET /api/user-settings` - Get all settings for authenticated user
- `POST /api/user-settings/{key}` - Save a setting
- `DELETE /api/user-settings/{key}` - Delete a setting

---

### Frontend - Authentication UI

#### [MODIFY] [index.html](file:///Users/julien/Workspaces/ai-workout-companion/wwwroot/index.html)

Add Google Sign-In button to setup screen:
- Show sign-in button if not authenticated
- Show user profile + sign-out if authenticated
- Load Google Sign-In JavaScript library

#### [NEW] [auth-service.js](file:///Users/julien/Workspaces/ai-workout-companion/wwwroot/auth-service.js)

Create authentication service:
- Initialize Google Sign-In
- Handle Google OAuth callback
- Exchange Google token for our JWT
- Store JWT in localStorage
- Provide `getAuthToken()` helper
- Provide `isAuthenticated()` check
- Handle sign-out

---

### Frontend - Settings Migration

#### [MODIFY] [crypto-utils.js](file:///Users/julien/Workspaces/ai-workout-companion/wwwroot/crypto-utils.js)

Update to use JWT authentication:
- Add `Authorization: Bearer {token}` header to all API calls
- Remove `deviceId` from request bodies
- Keep fallback to localStorage for offline mode

#### [NEW] [user-settings-service.js](file:///Users/julien/Workspaces/ai-workout-companion/wwwroot/user-settings-service.js)

Create service for managing user settings:
- Load all settings on app init
- Save voice settings ( pitch, rate, volume, voice name)
- Sync with server
- Cache locally for offline mode

#### [MODIFY] [app.js](file:///Users/julien/Workspaces/ai-workout-companion/wwwroot/app.js)

Update initialization flow:
- Check authentication status first
- Load user settings after auth
- Show sign-in screen if not authenticated

---

### Configuration

#### [NEW] [appsettings.Development.json](file:///Users/julien/Workspaces/ai-workout-companion/appsettings.Development.json)

Add Google OAuth configuration:
```json
{
  "Authentication": {
    "Google": {
      "ClientId": "YOUR_CLIENT_ID",
      "ClientSecret": "YOUR_CLIENT_SECRET"
    }
  },
  "Jwt": {
    "SecretKey": "YOUR_JWT_SECRET",
    "Issuer": "ai-workout-companion",
    "Audience": "ai-workout-companion-client"
  }
}
```

#### [MODIFY] [.gitignore](file:///Users/julien/Workspaces/ai-workout-companion/.gitignore)

Ensure `appsettings.Development.json` is ignored.

---

## Verification Plan

### Automated Tests
None - manual testing for MVP.

### Manual Verification

1. **Google Sign-In**:
   - Click "Sign in with Google"
   - Authorize app in Google OAuth consent screen
   - Verify user created in database
   - Verify JWT token stored in client

2. **API Key Persistence**:
   - Sign in with Google
   - Enter Hevy API key
   - Reload page → Should auto-load key
   - Sign out and sign in on different browser → Should load key

3. **Voice Settings Persistence**:
   - Sign in with Google
   - Adjust voice settings (pitch, rate, voice)
   - Reload page → Should restore settings
   - Sign in on different device → Should sync settings

4. **Multi-Device Sync**:
   - Set up on Device A
   - Sign in on Device B with same Google account
   - Verify all settings and credentials sync
