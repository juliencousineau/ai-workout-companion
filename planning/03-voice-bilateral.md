# 03 - Voice Bilateral: Speech-to-Text & Text-to-Speech

## Goal

Add hands-free voice interaction to the AI Workout Companion. Users can **speak** to log reps and the AI **responds** with voice feedback. Perfect for mid-workout use when hands are busy.

---

## Technologies

Both use built-in browser APIs (no external services required):

| Feature | API | Browser Support |
|---------|-----|-----------------|
| **Speech-to-Text** | Web Speech API (`SpeechRecognition`) | Chrome, Edge, Safari |
| **Text-to-Speech** | Web Speech API (`SpeechSynthesis`) | All modern browsers |

---

## Proposed Changes

### 1. Create Voice Service

#### [NEW] `voice-service.js`

A service class to manage both speech recognition and synthesis:

```javascript
class VoiceService {
    constructor() {
        this.recognition = null;  // SpeechRecognition instance
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.onResult = null;  // Callback for speech results
    }

    // Speech-to-Text
    startListening() {}
    stopListening() {}
    
    // Text-to-Speech
    speak(text) {}
    stopSpeaking() {}
    
    // State
    isSupported() {}
}
```

---

### 2. Add Voice Toggle to Chat UI

#### [MODIFY] `index.html`

Add a microphone button next to the chat input:

```html
<div class="chat-input-container">
    <button id="voiceBtn" class="btn btn-voice" title="Voice input">🎤</button>
    <input type="text" id="chatInput" ...>
    <button id="sendBtn" ...>
</div>
```

---

### 3. Integrate Voice with App

#### [MODIFY] `app.js`

- Add voice button event listener
- Toggle listening state on button click
- Route speech results to `workoutEngine.processInput()`
- Pass AI responses to `voiceService.speak()`

---

### 4. Update Workout Engine

#### [MODIFY] `workout-engine.js`

- Strip markdown formatting from messages before speaking (remove `**`, emojis, etc.)
- Optionally trim long messages for speech

---

### 5. Add Voice Styles

#### [MODIFY] `styles.css`

- Style for microphone button (active/inactive states)
- Pulsing animation when listening
- Visual indicator for speech synthesis

---

## UX Flow

```
┌─────────────────────────────────────────────────────┐
│  User taps 🎤 button                                 │
│       ↓                                              │
│  Button pulses, listening starts                     │
│       ↓                                              │
│  User says: "one" or "done" or "skip"                │
│       ↓                                              │
│  Speech converted to text, sent to workout engine    │
│       ↓                                              │
│  AI responds: "9 remaining! Great rep!"              │
│       ↓                                              │
│  Response spoken aloud + shown in chat               │
└─────────────────────────────────────────────────────┘
```

---

## Voice Settings (Optional Enhancement)

Could add settings for:
- Voice on/off for AI responses
- Continuous listening mode vs push-to-talk
- Voice selection (different voices)

For now, we'll keep it simple: **push-to-talk** with automatic voice responses.

---

## Verification Plan

### Manual Testing in Browser

1. **Open the app** at `index.html`
2. **Connect to Hevy** and select a routine
3. **Start workout** to get to chat screen
4. **Test voice input:**
   - Click 🎤 button → should pulse/animate
   - Say "one" → should appear in chat and count rep
   - Say "done" → should complete set
5. **Test voice output:**
   - AI responses should be spoken aloud
   - Check that emojis/markdown are stripped from speech
6. **Test browser compatibility:**
   - Chrome: Full support
   - Safari: May need user gesture to enable

### Edge Cases to Verify
- [ ] Microphone permission prompt appears
- [ ] Works after denying then allowing permission
- [ ] Button shows correct state (listening vs not)
- [ ] Speech stops when navigating away from chat screen
