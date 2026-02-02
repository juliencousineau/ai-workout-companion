# 03 - Voice Bilateral Walkthrough

## Summary

Added hands-free voice interaction using the **Web Speech API**. Users can speak to log reps and the AI responds with voice feedback.

---

## Changes Made

### New Files

| File | Purpose |
|------|---------|
| `voice-service.js` | Speech recognition (input) and synthesis (output) service |

### Modified Files

| File | Changes |
|------|---------|
| `index.html` | Added 🎤 microphone button, voice-service.js import |
| `styles.css` | Voice button styles with pulsing animation when listening |
| `app.js` | Voice service integration, AI responses spoken aloud |

---

## Features

### Speech-to-Text (Voice Input)
- Click the 🎤 button to start listening
- Button pulses red while listening
- Say commands like "one", "done", "skip"
- Speech is transcribed and sent to workout engine

### Text-to-Speech (Voice Output)
- All AI responses are automatically spoken
- Emojis and markdown are stripped for clean speech
- Uses natural-sounding browser voice

---

## How to Use

1. **Start a workout** from the routine selection screen
2. **Click the 🎤 button** in the chat input area
3. **Say your rep count** ("one", "two", etc.) or commands ("done", "skip")
4. **Listen to AI responses** - they're spoken automatically!

---

## Browser Support

| Browser | Speech-to-Text | Text-to-Speech |
|---------|---------------|----------------|
| Chrome | ✅ | ✅ |
| Edge | ✅ | ✅ |
| Safari | ✅ | ✅ |
| Firefox | ❌ | ✅ |

---

## Verification

- ✅ Voice button visible in chat screen
- ✅ `voiceService.isRecognitionSupported()` returns `true`
- ✅ Button pulses when listening
- ✅ AI responses are spoken aloud
- ✅ No critical console errors

![Chat screen with voice button](chat_screen_voice_button_1770040513609.png)
