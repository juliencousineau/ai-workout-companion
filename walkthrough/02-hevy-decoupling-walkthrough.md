# 02 - Hevy Decoupling Walkthrough

## Summary

Decoupled the app from Hevy by introducing a **Provider abstraction layer**. The app now uses a generic provider interface that Hevy (and future providers) implements.

---

## Changes Made

### New Files Created

| File | Purpose |
|------|---------|
| `providers/provider-interface.js` | Base class defining the provider interface |
| `providers/provider-manager.js` | Singleton manager for registering/switching providers |
| `providers/hevy-provider.js` | Hevy implementation of the provider interface |

### Modified Files

| File | Changes |
|------|---------|
| `app.js` | Replaced all `hevyApi.*` calls with `providerManager.getActive().*` |
| `index.html` | Updated script imports to load provider files |

### Deleted Files

| File | Reason |
|------|--------|
| `hevy-api.js` | Replaced by `providers/hevy-provider.js` |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                      App                         │
│                    (app.js)                      │
└─────────────────────┬───────────────────────────┘
                      │ uses
                      ▼
┌─────────────────────────────────────────────────┐
│              ProviderManager                     │
│           (provider-manager.js)                  │
│   - register(name, provider)                     │
│   - setActive(name)                              │
│   - getActive() → WorkoutProvider                │
└─────────────────────┬───────────────────────────┘
                      │ manages
                      ▼
┌─────────────────────────────────────────────────┐
│            WorkoutProvider (interface)           │
│          (provider-interface.js)                 │
│   - connect() / disconnect()                     │
│   - getRoutines() / getRoutine()                 │
│   - createWorkout()                              │
└─────────────────────┬───────────────────────────┘
                      │ implements
                      ▼
┌─────────────────────────────────────────────────┐
│              HevyProvider                        │
│           (hevy-provider.js)                     │
│   - Hevy API specific implementation             │
└─────────────────────────────────────────────────┘
```

---

## Verification

- ✅ App loads without JavaScript errors
- ✅ Setup screen displays correctly
- ✅ Provider manager initializes and registers Hevy provider
- ✅ No direct `hevyApi` references remain in `app.js`

![Setup screen working](hevy_setup_screen_1770039539703.png)
