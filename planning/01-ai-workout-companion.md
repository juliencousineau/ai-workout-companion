# 01 - AI Workout Companion Chat

## Overview

An AI-powered conversational interface that guides the user through their Hevy workout, exercise by exercise, logging progress in real-time.

## Decisions

| Question | Answer |
|----------|--------|
| Hevy Integration | ✅ Hevy API |
| Workout Source | ✅ Import from Hevy |
| Interface | ✅ Web app |
| Data Storage | ✅ Rely on Hevy |

## User Flow

1. **Start Session** - User selects a workout from Hevy
2. **Exercise Iteration** - AI presents one exercise at a time
3. **Rep-by-Rep or Set Logging** - User can log after each rep OR after a full set
4. **Next Exercise** - User says "done" → AI moves to next exercise
5. **Session Complete** - AI summarizes and saves to Hevy

## Example Conversation - User Counts

```
AI: 🔥 Starting "Push Day" workout! 
    First exercise: Bench Press (4 sets × 8-10 reps @ 135lbs).
    Ready when you are!

User: starting set 1

AI: Let's go! Tell me each rep or total when done.

User: 1

AI: 1 ✓ Good start! Keep pushing!

User: 2

AI: 2 ✓ Nice and controlled! 💪

User: 3

AI: 3 ✓ You're in the zone!

User: done

AI: 🎉 Set 1 complete: 3 reps @ 135lbs - Solid work!
    Rest up, you've earned it. Ready for Set 2?
```

## Example Conversation - AI Countdown Mode

```
AI: 🔥 Next exercise: Plank (3 sets × 60 seconds).
    This is a timed exercise - I'll count down for you!
    Ready for Set 1?

User: yes

AI: 60 seconds starting NOW! 
    ...
    45 seconds - Halfway there! Stay tight! 💪
    ...
    30 seconds - You're crushing it!
    ...
    15 seconds - Almost done, push through!
    ...
    🎉 Set 1 complete! Great work!
    Rest up. Ready for Set 2?

User: ready

AI: 60 seconds starting NOW!
    ...
```

## Example Conversation - Rep Countdown

```
AI: 🔥 Next exercise: Lunges (3 sets × 10 reps each leg).
    I'll count down with you! Tell me when you finish each rep.

User: 1

AI: 10 ✓ Strong start! 💪

User: 2

AI: 9 ✓ Keep that form!

User: 3

AI: 8 ✓ You're in rhythm!

User: 4

AI: 7 ✓ More than halfway!

User: 5 6 7

AI: 6 ✓ 5 ✓ 4 ✓ You're flying through these!

User: done

AI: 🎉 Set 1 complete: 7/10 reps - Solid effort!
    Rest up. Ready for Set 2?
```

## Proposed Tech Stack

- **Frontend**: Web app (React or vanilla JS)
- **Backend**: Node.js or Python (for Hevy API integration)
- **API**: Hevy API for workout data & logging
- **No local database** - all data stored in Hevy

## Next Steps

1. Research Hevy API documentation
2. Design web app UI
3. Implement MVP

---

**Ready for your approval to proceed with implementation!**
