# Planning: Google OAuth Authentication & User Settings

## Overview
Implement Google OAuth authentication to replace device-based storage with user accounts, enabling persistent API keys and voice settings across devices.

## Problem Statement
Currently, API keys and settings are tied to device IDs, which:
- Don't survive browser data clearing
- Can't sync across multiple devices
- Lack proper user identity management

## Solution
- Add Google OAuth 2.0 sign-in
- Store credentials per user (not per device)
- Sync voice settings across devices via PostgreSQL
- Generate JWT tokens for API authentication

## Technical Approach

### Backend
1. **Authentication**: ASP.NET Core JWT Bearer + Google.Apis.Auth
2. **Database**: New tables (Users, UserSettings) in existing PostgreSQL
3. **API**: GoogleAuthController + UserSettingsController

### Frontend
1. **Services**: auth-service.js, user-settings-service.js
2. **UI**: Google Sign-In button in header
3. **Integration**: Wire services into app initialization

## Breaking Changes
- Users must re-enter Hevy API key after first Google sign-in
- Device-based storage remains as fallback for backward compatibility

## Migration Strategy
- Keep existing device-based endpoints functional
- New authenticated endpoints for logged-in users
- localStorage fallback when offline or not authenticated

## Required Configuration
- Google Cloud OAuth credentials (CLIENT_ID, CLIENT_SECRET)
- JWT secret key (minimum 32 characters)
- Both configured in appsettings.json

## Success Criteria
- ✅ User can sign in with Google
- ✅ API keys persist across browser sessions
- ✅ Voice settings sync across devices
- ✅ Graceful fallback to localStorage when unauthenticated
