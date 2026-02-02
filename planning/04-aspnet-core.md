# 04 - Convert to ASP.NET Core Web Application

## Goal

Convert the static HTML/JS application to an **ASP.NET Core web application**. This provides:
- Proper web server with permanent URL (localhost or deployed)
- Browser remembers microphone permissions
- Foundation for future server-side features (API proxying, authentication, etc.)

---

## Current State

The app runs as static files opened via `file://` protocol:
- `index.html` - Main HTML file
- `styles.css` - CSS styles
- `app.js`, `workout-engine.js`, `voice-service.js` - JavaScript
- `providers/` - Provider abstraction layer

**Problem:** `file://` doesn't persist browser permissions (microphone prompt every time).

---

## Proposed Changes

### 1. Install .NET SDK

If not already installed, install .NET 8 SDK:
```bash
brew install dotnet
```

---

### 2. Create ASP.NET Core Project

Create a minimal ASP.NET Core web app configured to serve static files:

#### [NEW] `Program.cs`

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseDefaultFiles();  // Serve index.html by default
app.UseStaticFiles();   // Serve files from wwwroot

app.Run();
```

#### [NEW] `ai-workout-companion.csproj`

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
</Project>
```

---

### 3. Move Static Files to wwwroot

Move all static files into `wwwroot/` folder (ASP.NET Core convention):

| Current Location | New Location |
|------------------|--------------|
| `index.html` | `wwwroot/index.html` |
| `styles.css` | `wwwroot/styles.css` |
| `app.js` | `wwwroot/app.js` |
| `workout-engine.js` | `wwwroot/workout-engine.js` |
| `voice-service.js` | `wwwroot/voice-service.js` |
| `providers/` | `wwwroot/providers/` |

---

### 4. Update .gitignore

Add .NET build artifacts:

```
bin/
obj/
*.user
```

---

## File Structure After Changes

```
/
├── Program.cs                    # ASP.NET Core entry point (NEW)
├── ai-workout-companion.csproj   # Project file (NEW)
├── wwwroot/                      # Static files (MOVED)
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── workout-engine.js
│   ├── voice-service.js
│   └── providers/
│       ├── provider-interface.js
│       ├── provider-manager.js
│       └── hevy-provider.js
├── planning/                     # Unchanged
└── walkthrough/                  # Unchanged
```

---

## Verification Plan

### Automated Test

Run the app and verify it starts:
```bash
dotnet run
```
Expected: Server starts on `http://localhost:5000` (or similar port)

### Manual Testing

1. Open `http://localhost:5000` in browser
2. Verify the app loads with setup screen
3. Grant microphone permission (click "Allow while visiting the site")
4. Refresh the page - verify permission is **remembered** (no popup)
5. Connect to Hevy and verify all features work

---

## Future Enhancements (Out of Scope)

- Server-side Hevy API proxy (hide API key from client)
- User authentication
- Docker containerization
- Azure/AWS deployment
