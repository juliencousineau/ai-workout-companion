# 05 - UI Improvements: Disconnect Button

## Goal

Add a **disconnect button** so users can log out from Hevy and return to the setup screen.

---

## Proposed Changes

### 1. Add Disconnect Button to Header

#### [MODIFY] `wwwroot/index.html`

Add a disconnect button next to the connection status:

```html
<div class="connection-status" id="connectionStatus">
    <span class="status-dot connected"></span>
    <span>Connected</span>
    <button id="disconnectBtn" class="btn-disconnect">✕</button>
</div>
```

---

### 2. Style the Button

#### [MODIFY] `wwwroot/styles.css`

Add styles for the disconnect button (small X icon, visible only when connected).

---

### 3. Add Disconnect Logic

#### [MODIFY] `wwwroot/app.js`

- Add click handler for disconnect button
- Clear API key from provider/localStorage
- Return to setup screen
- Update connection status

---

## Verification

1. Connect to Hevy
2. Click disconnect button
3. Verify: returns to setup screen, connection status shows "Not Connected"
4. Refresh page - should still be on setup screen (not auto-reconnecting)
