# 05 - Disconnect Button Walkthrough

## Summary

Added a **disconnect button** (✕) to the header that allows users to log out from Hevy and return to the setup screen.

---

## Changes Made

### Files Modified

| File | Change |
|------|--------|
| `wwwroot/index.html` | Added disconnect button to header |
| `wwwroot/styles.css` | Added `.btn-disconnect` styles |
| `wwwroot/app.js` | Added disconnect handler and show/hide logic |

---

## How It Works

1. **When connected**: A small ✕ button appears next to "Connected" status
2. **Click the button**: Clears API key, disconnects provider, returns to setup screen
3. **Status updates**: Shows "Not Connected" and hides the disconnect button

---

## Verification

- ✅ Button visible when connected
- ✅ Button hidden when not connected
- ✅ Clicking returns to setup screen
- ✅ Connection status updates correctly
- ✅ No console errors
