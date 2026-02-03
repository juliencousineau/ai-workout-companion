# Configuration Setup

## Local Development Secrets

**Important:** Never commit sensitive data like API keys, client IDs, or secrets to Git.

### Setup Instructions

1. **Copy the development template:**
   ```bash
   # appsettings.Development.json is already created with placeholders
   ```

2. **Fill in your actual values in `appsettings.Development.json`:**
   - `Authentication.Google.ClientId`: Your Google OAuth Client ID from Google Cloud Console
   - `Authentication.Google.ClientSecret`: Your Google OAuth Client Secret
   - `Jwt.SecretKey`: A secure random string (minimum 32 characters)

3. **Verify it's gitignored:**
   ```bash
   git status
   # appsettings.Development.json should NOT appear in the list
   ```

### Files

- **`appsettings.json`**: Base configuration ✅ Committed to Git
- **`appsettings.Development.json`**: Local secrets ❌ Git-ignored (never commit)
- **`appsettings.Production.json`**: Production config ❌ Git-ignored (use environment variables)

### How It Works

ASP.NET Core automatically loads configuration files in this order:
1. `appsettings.json` (base)
2. `appsettings.{Environment}.json` (environment-specific, overrides base)
3. Environment variables (highest priority)

The `.gitignore` excludes `appsettings.Development.json` so your local secrets stay safe.
