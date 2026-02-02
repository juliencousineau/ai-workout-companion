# 02 - Hevy Decoupling: Provider Abstraction

## Goal

Decouple the app from Hevy by introducing a **Provider abstraction layer**. This allows the app to connect to different workout apps (Hevy, Strong, Fitbod, etc.) in the future. Hevy becomes just one of possibly many providers.

---

## Current State

The app is tightly coupled to Hevy:
- `hevy-api.js` - HevyAPI class with Hevy-specific endpoints
- `app.js` - Directly references `hevyApi` singleton (lines 44, 106, 111, 123, 164, 224, 307)
- Data structures assume Hevy's format (`routines`, `exercises`, `exercise_template_id`)

---

## Proposed Changes

### 1. Create Provider Interface

#### [NEW] `providers/provider-interface.js`

Define an abstract interface that all providers must implement:

```javascript
class WorkoutProvider {
    // Authentication
    async connect(credentials) {}
    async testConnection() {}
    disconnect() {}
    
    // Routines/Templates
    async getRoutines() {}
    async getRoutine(id) {}
    
    // Exercises
    async getExerciseTemplates() {}
    
    // Workout Logging
    async createWorkout(workoutData) {}
}
```

---

### 2. Refactor Hevy as a Provider

#### [MODIFY] `hevy-api.js` → [NEW] `providers/hevy-provider.js`

- Rename and move to `providers/` folder
- Implement the `WorkoutProvider` interface
- Keep all existing Hevy-specific logic

---

### 3. Create Provider Manager

#### [NEW] `providers/provider-manager.js`

A manager to:
- Register available providers
- Store the active provider
- Provide a unified API for the app

```javascript
class ProviderManager {
    constructor() {
        this.providers = {};  // registered providers
        this.activeProvider = null;
    }
    
    register(name, provider) {}
    setActive(name) {}
    getActive() {}
}
```

---

### 4. Update App to Use Provider Manager

#### [MODIFY] `app.js`

Replace all `hevyApi.*` calls with `providerManager.getActive().*`:

| Before | After |
|--------|-------|
| `hevyApi.loadApiKey()` | `providerManager.getActive().loadCredentials()` |
| `hevyApi.setApiKey(key)` | `providerManager.getActive().connect({ apiKey: key })` |
| `hevyApi.testConnection()` | `providerManager.getActive().testConnection()` |
| `hevyApi.getRoutines()` | `providerManager.getActive().getRoutines()` |
| `hevyApi.createWorkout()` | `providerManager.getActive().createWorkout()` |

---

### 5. Update HTML

#### [MODIFY] `index.html`

- Update script imports to load provider files
- Optionally add a provider selector dropdown (for future use)

---

## File Structure After Changes

```
/providers/
  provider-interface.js    # Base interface (NEW)
  provider-manager.js      # Manager singleton (NEW)
  hevy-provider.js         # Hevy implementation (MOVED from hevy-api.js)
app.js                     # Uses provider-manager instead of hevy-api
index.html                 # Updated script imports
```

---

## Verification Plan

### Manual Testing

1. **Open the app** in browser at `index.html`
2. **Enter Hevy API key** and click Connect
3. **Verify connection works** (should show routines list)
4. **Select a routine** and start workout
5. **Complete a few reps** to verify workout logging still works
6. **End workout** and verify it saves to Hevy

### Code Review Checklist

- [ ] No direct references to `hevyApi` in `app.js`
- [ ] All provider methods follow the interface
- [ ] localStorage keys are provider-specific (e.g., `hevy_api_key`)
- [ ] Console shows no errors during normal flow

---

## Future Enhancements (Out of Scope)

- Provider selection UI on setup screen
- Additional providers (Strong, Fitbod, manual entry)
- Provider-specific settings/configuration
