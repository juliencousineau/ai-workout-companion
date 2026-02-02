# 04 - ASP.NET Core Conversion Walkthrough

## Summary

Converted the static HTML/JS application to an **ASP.NET Core web application** to solve the microphone permission persistence issue.

---

## Changes Made

### New Files

| File | Purpose |
|------|---------|
| `Program.cs` | ASP.NET Core entry point - serves static files |
| `ai-workout-companion.csproj` | Project file targeting .NET 10 |
| `.gitignore` | Ignores bin/, obj/, and other build artifacts |

### Moved Files

All static files moved to `wwwroot/`:
- `index.html`
- `styles.css`  
- `app.js`
- `workout-engine.js`
- `voice-service.js`
- `providers/` (entire folder)

---

## How to Run

```bash
cd ai-workout-companion
dotnet run
```

Then open **http://localhost:5000** in your browser.

---

## Benefits

| Before (file://) | After (ASP.NET Core) |
|------------------|---------------------|
| ❌ Mic permission prompt every time | ✅ Permission remembered |
| ❌ No server-side capabilities | ✅ Ready for future backend features |
| ❌ CORS issues with some APIs | ✅ Can proxy API calls |

---

## Verification

- ✅ Server starts at http://localhost:5000
- ✅ Setup screen displays correctly
- ✅ No console errors
- ✅ All static files served correctly

![ASP.NET Core running](../walkthrough/aspnet_screenshot.png)
