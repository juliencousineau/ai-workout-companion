# 06 - Provider Selection Screen

## Goal

Replace the hardcoded "Connect to Hevy" setup screen with a **provider selection screen** that shows all available workout apps. Users click an app to see its connection form.

---

## Current State

Setup screen shows:
- "Connect to Hevy" with API key input
- No way to choose between different providers

---

## Proposed Changes

### 1. New Provider Selection View

Show a list of available providers as cards:

```
┌─────────────────────────────────┐
│  🏋️ AI Workout Companion       │
├─────────────────────────────────┤
│                                 │
│   Choose a Workout App          │
│                                 │
│   ┌─────────────────────────┐   │
│   │  🟠 Hevy                │   │
│   │  Sync your workouts     │   │
│   └─────────────────────────┘   │
│                                 │
│   ┌─────────────────────────┐   │
│   │  🔵 Strong (coming soon)│   │
│   │                         │   │
│   └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

### 2. Flow

1. **Setup screen** → Shows list of providers
2. **Click provider** → Shows that provider's connection form
3. **Back button** → Return to provider list
4. **Connect** → Same as before

---

## File Changes

### [MODIFY] `wwwroot/index.html`

- Add provider selection view inside setup screen
- Add provider cards with icons
- Add back button to connection form

### [MODIFY] `wwwroot/styles.css`

- Style provider cards
- Style back button

### [MODIFY] `wwwroot/app.js`

- Add provider selection logic
- Toggle between provider list and connection form

---

## Verification

1. Open app - see list of providers (Hevy)
2. Click Hevy - see connection form with back button
3. Click back - return to provider list
4. Connect - works as before
