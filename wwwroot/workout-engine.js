/**
 * Workout Engine
 * Manages workout state, exercise progression, and AI conversation
 */

class WorkoutEngine {
    constructor() {
        this.routine = null;
        this.currentExerciseIndex = 0;
        this.currentSetIndex = 0;
        this.currentRep = 0;
        this.targetReps = 0;
        this.isCountdown = false;
        this.workoutStartTime = null;
        this.workoutData = null;
        this.timerInterval = null;
        this.timerSeconds = 0;
        this.restTimerInterval = null;
        this.lastAIMessage = null;
        this.activeWorkoutId = null; // For real-time Hevy sync
        this.isCreatingWorkout = false; // Guard against duplicate creation

        // Callback for sending messages
        this.onMessage = null;
    }

    // Motivational messages pool
    motivationalMessages = {
        repStart: [
            "Let's go!",
            "You got this!",
            "Power up!",
            "Focus!",
        ],
        repComplete: [
            "Strong start!",
            "Keep pushing!",
            "Nice and controlled!",
            "You're in the zone!",
            "Great form!",
            "Beast mode!",
            "Crushing it!",
            "That's the way!",
        ],
        halfwayReps: [
            "Halfway there, stay strong!",
            "More than halfway! Keep it up!",
            "Over the hill, finish strong!",
        ],
        lastReps: [
            "Almost done, push through!",
            "Last few reps, give it everything!",
            "Final push! You've got this!",
        ],
        setComplete: [
            "Set complete! Great work!",
            "Solid set! Rest up.",
            "Crushed that set!",
            "Excellent work!",
        ],
        exerciseComplete: [
            "Exercise complete! You crushed it!",
            "Awesome job on that exercise!",
            "Done with that one! Great effort!",
        ],
        timerHalfway: [
            "Halfway there! Stay tight!",
            "50% done! Keep holding!",
        ],
        timer30sec: [
            "30 seconds left - You're crushing it!",
            "30 to go! Stay focused!",
        ],
        timer15sec: [
            "15 seconds - Almost done, push through!",
            "Final 15! You've got this!",
        ],
    };

    /**
     * Get random message from category
     */
    getMotivation(category) {
        const messages = this.motivationalMessages[category];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    /**
     * Start a workout with the given routine
     */
    async startWorkout(routine) {
        this.routine = routine;
        this.currentExerciseIndex = 0;
        this.currentSetIndex = 0;
        this.currentRep = 0;
        this.workoutStartTime = new Date();
        this.activeWorkoutId = null;

        // Initialize workout data structure
        this.workoutData = {
            title: routine.title || routine.name || 'Workout',
            start_time: this.workoutStartTime.toISOString(),
            end_time: this.workoutStartTime.toISOString(),
            is_private: false,
            exercises: []
        };

        // Send welcome message
        const exercise = this.getCurrentExercise();
        this.sendAIMessage(`Starting "${this.workoutData.title}" workout!`);

        // Note: Workout will be created in Hevy when first set is logged
        // (Hevy requires at least 1 exercise)

        setTimeout(() => {
            this.announceExercise(exercise);
        }, 500);
    }

    /**
     * Create workout in Hevy for real-time sync
     * Note: isCreatingWorkout flag is set by caller (syncToHevy)
     */
    async createWorkoutInHevy() {
        try {
            const provider = providerManager.getActive();
            if (provider && provider.connected) {
                const response = await provider.createWorkout(this.workoutData);
                console.log('Hevy API response:', response);

                // Hevy API returns workout as an array, not an object
                // Handle both array and object response formats
                let workoutId = null;
                if (response?.workout) {
                    if (Array.isArray(response.workout) && response.workout.length > 0) {
                        workoutId = response.workout[0].id;
                    } else if (response.workout.id) {
                        workoutId = response.workout.id;
                    }
                }

                if (workoutId) {
                    this.activeWorkoutId = workoutId;
                    console.log('Workout created in Hevy:', this.activeWorkoutId);
                } else {
                    console.error('Failed to get workout ID from Hevy response:', response);
                }
            }
        } catch (error) {
            console.error('Failed to create workout in Hevy:', error);
            // Continue workout locally even if Hevy fails
        } finally {
            this.isCreatingWorkout = false;
        }
    }

    /**
     * Update workout in Hevy with current data
     * Creates the workout if it doesn't exist yet
     */
    async syncToHevy() {
        console.log('syncToHevy called - activeWorkoutId:', this.activeWorkoutId, 'isCreatingWorkout:', this.isCreatingWorkout);

        // If no workout created yet and we have exercises, create it
        if (!this.activeWorkoutId && this.workoutData.exercises.length > 0) {
            // Guard against duplicate creation from race conditions
            // Set flag SYNCHRONOUSLY before any await to prevent parallel calls
            if (this.isCreatingWorkout) {
                console.log('Workout creation already in progress, skipping...');
                return;
            }
            this.isCreatingWorkout = true; // Set immediately before await
            await this.createWorkoutInHevy();
            return; // createWorkoutInHevy already contains the latest data
        }

        if (!this.activeWorkoutId) {
            return;
        }

        try {
            const provider = providerManager.getActive();
            if (provider && provider.connected) {
                await provider.updateWorkout(this.activeWorkoutId, this.workoutData);
                console.log('Workout synced to Hevy');
            }
        } catch (error) {
            console.error('Failed to sync workout to Hevy:', error);
        }
    }

    /**
     * Get the current exercise
     */
    getCurrentExercise() {
        if (!this.routine || !this.routine.exercises) return null;
        return this.routine.exercises[this.currentExerciseIndex];
    }

    /**
     * Get exercise progress string
     */
    getExerciseProgress() {
        const total = this.routine?.exercises?.length || 0;
        return `Exercise ${this.currentExerciseIndex + 1}/${total}`;
    }

    /**
     * Announce the current exercise
     */
    announceExercise(exercise) {
        if (!exercise) return;

        const sets = exercise.sets?.length;

        // Check if duration is specified in the first set (from API)
        const firstSetDuration = exercise.sets?.[0]?.duration_seconds || 0;

        // Detect timed exercises using ONLY API data (no hardcoded names)
        const isTimedExercise = firstSetDuration > 0;

        let message = `Next exercise: **${exercise.title || exercise.exercise_template_id}**`;

        if (isTimedExercise) {
            const duration = exercise.duration_seconds || firstSetDuration;
            message += ` (${sets} sets × ${duration} seconds).\n`;
            message += `Ready for Set 1? Say 'yes', 'go', or 'start the set'!`;
            this.isCountdown = true;
            this.timerSeconds = duration;
        } else {
            const reps = exercise.reps || 10;
            message += ` (${sets} sets × ${reps} reps).\n`;
            message += `Ready for Set 1? Say 'yes' or 'go'!`;
            this.isCountdown = false;
            this.targetReps = reps;
            this.currentRep = 0;
        }

        this.sendAIMessage(message);
    }

    /**
     * Process user input
     */
    processInput(input) {
        const normalizedInput = input.toLowerCase().trim();

        // Check for end workout command (explicitly ending the whole workout)
        if (normalizedInput === 'end workout' || normalizedInput === 'finish workout' || normalizedInput === 'stop workout') {
            this.sendAIMessage("Ending workout...");
            if (this.onWorkoutEnd) {
                this.onWorkoutEnd();
            }
            return;
        }

        // Check for set/exercise completion commands
        if (normalizedInput === 'done' || normalizedInput === 'end' || normalizedInput === 'finish') {
            return this.handleDone();
        }

        // Check for set start (for timed exercises)
        if (normalizedInput === 'yes' || normalizedInput === 'ready' || normalizedInput === 'go' || normalizedInput === 'start' || normalizedInput === 'start the set') {
            if (this.isCountdown) {
                return this.startTimer();
            }
            return this.sendAIMessage("Let's go! Tell me after each rep - I'll count down with you!.");
        }

        // Check for repeat request
        if (normalizedInput === 'what' || normalizedInput === 'repeat' || normalizedInput === 'say that again') {
            if (this.lastAIMessage) {
                return this.sendAIMessage(this.lastAIMessage);
            }
            return this.sendAIMessage("I haven't said anything yet!");
        }

        // Check for skip
        if (normalizedInput === 'skip' || normalizedInput === 'next exercise') {
            return this.skipExercise();
        }

        // Check for exercise instructions
        if (normalizedInput.includes('how') || normalizedInput === 'instructions' || normalizedInput === 'help') {
            const exercise = this.getCurrentExercise();
            if (exercise?.notes) {
                return this.sendAIMessage(`Here's how to do ${exercise.title}: ${exercise.notes}`);
            } else {
                return this.sendAIMessage(`I don't have specific instructions for this exercise.`);
            }
        }

        // Convert spoken word numbers to digits
        const convertedInput = this.convertWordsToNumbers(normalizedInput);

        // Check for rep counts (could be multiple: "1 2 3" or just "1")
        const repNumbers = convertedInput.split(/[\s,]+/).filter(n => !isNaN(n) && n !== '');
        if (repNumbers.length > 0) {
            return this.handleRepInput(repNumbers);
        }

        // Default response - repeat last message instead of generic prompt
        if (this.lastAIMessage) {
            this.sendAIMessage(this.lastAIMessage);
        }
    }

    /**
     * Convert spoken word numbers to digits
     * Includes phonetic near-matches for common speech recognition errors
     * e.g., "one" -> "1", "tree" -> "3"
     */
    convertWordsToNumbers(input) {
        const wordToNumber = {
            // Zero
            'zero': '0', 'oh': '0',

            // One
            'one': '1', 'won': '1', 'wan': '1',

            // Two
            'two': '2', 'to': '2', 'too': '2', 'tu': '2',

            // Three - common mishearing
            'three': '3', 'tree': '3', 'free': '3', 'thee': '3',

            // Four
            'four': '4', 'for': '4', 'fore': '4', 'floor': '4',

            // Five
            'five': '5', 'fife': '5', 'hive': '5',

            // Six
            'six': '6', 'sex': '6', 'sicks': '6',

            // Seven
            'seven': '7', 'sven': '7',

            // Eight
            'eight': '8', 'ate': '8', 'ait': '8',

            // Nine
            'nine': '9', 'nein': '9', 'mine': '9',

            // Ten and above
            'ten': '10', 'tin': '10',
            'eleven': '11', 'leaven': '11',
            'twelve': '12', 'twelfth': '12',
            'thirteen': '13',
            'fourteen': '14',
            'fifteen': '15',
            'sixteen': '16',
            'seventeen': '17',
            'eighteen': '18',
            'nineteen': '19',
            'twenty': '20'
        };

        let result = input;
        for (const [word, num] of Object.entries(wordToNumber)) {
            // Replace whole words only (not partial matches)
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            result = result.replace(regex, num);
        }
        return result;
    }

    /**
     * Handle rep input from user
     * Uses the actual spoken number as the current rep (smart sequencing)
     */
    handleRepInput(repNumbers) {
        const exercise = this.getCurrentExercise();
        if (!exercise) return;

        const targetReps = exercise.reps || 10;
        let messages = [];

        // Deduplicate repeated numbers (e.g., "two two" -> just "2")
        const uniqueReps = [...new Set(repNumbers)];

        for (const repNumStr of uniqueReps) {
            const spokenRep = parseInt(repNumStr, 10);

            // Only process if the spoken number advances the count
            // Saying "four" twice should NOT keep counting up
            if (spokenRep > this.currentRep && spokenRep <= targetReps) {
                this.currentRep = spokenRep;
            } else if (spokenRep === this.currentRep) {
                // Same number repeated - re-announce current state
                const repsRemaining = targetReps - this.currentRep;
                messages.push(`${repsRemaining} ✓ ${this.getMotivation('repComplete')}`);
                continue;
            } else if (spokenRep < this.currentRep) {
                // Number lower than current - ignore (probably heard old audio)
                continue;
            } else {
                // Number higher than target - ignore
                continue;
            }

            const repsRemaining = targetReps - this.currentRep;

            let motivation = this.getMotivation('repComplete');

            // Special messages for milestones
            if (this.currentRep === 1) {
                motivation = this.getMotivation('repStart');
            } else if (repsRemaining === Math.floor(targetReps / 2)) {
                motivation = this.getMotivation('halfwayReps');
            } else if (repsRemaining <= 2 && repsRemaining > 0) {
                motivation = this.getMotivation('lastReps');
            }

            messages.push(`${repsRemaining} ✓ ${motivation}`);
        }

        // Check if set is complete
        if (this.currentRep >= targetReps) {
            messages.push('');
            messages.push(this.getMotivation('setComplete'));
            this.logSet();
            this.currentSetIndex++;
            this.currentRep = 0;

            const exercise = this.getCurrentExercise();
            const totalSets = exercise?.sets?.length;

            if (this.currentSetIndex >= totalSets) {
                messages.push(this.getMotivation('exerciseComplete'));
                this.sendAIMessage(messages.join('\n'));
                this.startRestTimerForNextExercise(exercise);
                return; // Exit early, rest timer will handle the transition
            } else {
                // Start rest timer if rest_seconds is defined
                const restSeconds = exercise.rest_seconds;
                messages.push(`Rest for ${restSeconds} seconds...`);
                this.sendAIMessage(messages.join('\n'));
                this.startRestTimer(restSeconds, this.currentSetIndex + 1);
                return; // Exit early, rest timer will handle the next message
            }
        }

        this.sendAIMessage(messages.join('\n'));
    }

    /**
     * Handle done command
     */
    handleDone() {
        const exercise = this.getCurrentExercise();
        if (!exercise) return;

        // Log partial set if any reps were done
        if (this.currentRep > 0) {
            this.logSet();
        }

        const totalSets = exercise?.sets?.length;

        if (this.currentSetIndex < totalSets - 1) {
            // Done with current set, not all sets
            this.currentSetIndex++;
            this.currentRep = 0;
            const exercise = this.getCurrentExercise();
            const restSeconds = exercise.rest_seconds;
            this.sendAIMessage(`${this.getMotivation('setComplete')}\nRest for ${restSeconds} seconds...`);
            this.startRestTimer(restSeconds, this.currentSetIndex + 1);
        } else {
            // Done with exercise - start rest before next exercise
            this.sendAIMessage(this.getMotivation('exerciseComplete'));
            this.startRestTimerForNextExercise(exercise);
        }
    }

    /**
     * Start rest timer countdown between sets
     */
    startRestTimer(duration, nextSetNumber) {
        let remaining = duration;

        // Clear any existing rest timer
        if (this.restTimerInterval) {
            clearInterval(this.restTimerInterval);
        }

        this.restTimerInterval = setInterval(() => {
            remaining--;

            // Announce every 10 seconds
            if (remaining > 0 && remaining % 10 === 0) {
                this.sendAIMessage(`${remaining} seconds...`);
            } else if (remaining === 0) {
                clearInterval(this.restTimerInterval);
                this.restTimerInterval = null;
                this.sendAIMessage(`Rest over! Ready for Set ${nextSetNumber}? Say 'yes' or 'go'!`);
            }
        }, 1000);
    }

    /**
     * Start rest timer before transitioning to next exercise
     * Uses the rest_seconds from Hevy routine data
     */
    startRestTimerForNextExercise(completedExercise) {
        // Get rest time from Hevy routine data
        const restSeconds = completedExercise.rest_seconds;

        let remaining = restSeconds;

        this.sendAIMessage(`Rest for ${restSeconds} seconds before the next exercise...`);

        // Clear any existing rest timer
        if (this.restTimerInterval) {
            clearInterval(this.restTimerInterval);
        }

        this.restTimerInterval = setInterval(() => {
            remaining--;

            // Announce every 10 seconds
            if (remaining > 0 && remaining % 10 === 0) {
                this.sendAIMessage(`${remaining} seconds...`);
            } else if (remaining === 0) {
                clearInterval(this.restTimerInterval);
                this.restTimerInterval = null;
                this.moveToNextExercise();
            }
        }, 1000);
    }

    /**
     * Start timer for timed exercises
     */
    startTimer() {
        const duration = this.timerSeconds;
        let remaining = duration;

        this.sendAIMessage(`${duration} seconds starting NOW!`);

        this.timerInterval = setInterval(() => {
            remaining--;

            // Announce every 10 seconds
            if (remaining > 0 && remaining % 10 === 0) {
                this.sendAIMessage(`${remaining} seconds...`);
            } else if (remaining === 0) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
                this.handleTimerComplete();
            }
        }, 1000);
    }

    /**
     * Handle timer completion
     */
    handleTimerComplete() {
        this.logSet();
        this.currentSetIndex++;

        const exercise = this.getCurrentExercise();
        const totalSets = exercise?.sets?.length;

        if (this.currentSetIndex >= totalSets) {
            this.sendAIMessage(`${this.getMotivation('setComplete')}\n${this.getMotivation('exerciseComplete')}`);
            this.startRestTimerForNextExercise(exercise);
        } else {
            // Start rest timer between sets
            const restSeconds = exercise.rest_seconds;
            this.sendAIMessage(`${this.getMotivation('setComplete')}\nRest for ${restSeconds} seconds...`);
            this.startRestTimer(restSeconds, this.currentSetIndex + 1);
        }
    }

    /**
     * Log the current set
     */
    logSet() {
        const exercise = this.getCurrentExercise();
        if (!exercise) return;

        // Find or create exercise entry in workout data
        let exerciseData = this.workoutData.exercises.find(
            e => e.exercise_template_id === exercise.exercise_template_id
        );

        if (!exerciseData) {
            exerciseData = {
                exercise_template_id: exercise.exercise_template_id,
                sets: []
            };
            this.workoutData.exercises.push(exerciseData);
        }

        // Add set data (without index - Hevy API doesn't accept it)
        exerciseData.sets.push({
            type: 'normal',
            weight_kg: exercise.weight_kg || 0,
            reps: this.currentRep || 0,
            duration_seconds: this.isCountdown ? this.timerSeconds : null,
            distance_meters: null,
            rpe: null
        });

        // Sync to Hevy after each set
        this.syncToHevy();
    }

    /**
     * Move to the next exercise
     */
    moveToNextExercise() {
        this.currentExerciseIndex++;
        this.currentSetIndex = 0;
        this.currentRep = 0;

        const nextExercise = this.getCurrentExercise();
        if (nextExercise) {
            setTimeout(() => {
                this.announceExercise(nextExercise);
            }, 1000);
        } else {
            this.completeWorkout();
        }
    }

    /**
     * Skip current exercise
     */
    skipExercise() {
        this.sendAIMessage("Skipping to next exercise...");
        this.moveToNextExercise();
    }

    /**
     * Complete the workout
     */
    async completeWorkout() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        if (this.restTimerInterval) {
            clearInterval(this.restTimerInterval);
            this.restTimerInterval = null;
        }

        // Stop any ongoing voice announcements and listening
        if (typeof voiceService !== 'undefined') {
            voiceService.stopSpeaking();
            voiceService.stopListening();
        }

        this.workoutData.end_time = new Date().toISOString();

        // Wait for any in-progress workout creation before final sync
        // This prevents duplicate creation if user ends workout quickly after first set
        if (this.isCreatingWorkout) {
            console.log('Waiting for workout creation to complete before final sync...');
            // Poll until creation is complete (max 5 seconds)
            let attempts = 0;
            while (this.isCreatingWorkout && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
        }

        // Final sync to Hevy with end time
        await this.syncToHevy();

        const duration = Math.round((new Date() - this.workoutStartTime) / 1000 / 60);
        const totalSets = this.workoutData.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

        this.sendAIMessage(`**Workout Complete!**\n\n` +
            `⏱️ Duration: ${duration} minutes\n` +
            `🏋️ Exercises: ${this.workoutData.exercises.length}\n` +
            `📊 Total Sets: ${totalSets}\n\n` +
            `Great job! Your workout has been logged.`);

        // Trigger workout complete callback
        if (this.onWorkoutComplete) {
            this.onWorkoutComplete(this.workoutData);
        }

        // Clear active workout ID
        this.activeWorkoutId = null;
    }

    /**
     * Send AI message
     */
    sendAIMessage(content) {
        if (this.onMessage) {
            this.lastAIMessage = content;
            this.onMessage('ai', content);
        }
    }

    /**
     * Get workout summary
     */
    getWorkoutSummary() {
        if (!this.workoutData) return null;

        const duration = this.workoutData.end_time
            ? Math.round((new Date(this.workoutData.end_time) - new Date(this.workoutData.start_time)) / 1000 / 60)
            : 0;

        const totalSets = this.workoutData.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
        const totalReps = this.workoutData.exercises.reduce((sum, ex) =>
            sum + ex.sets.reduce((s, set) => s + (set.reps || 0), 0), 0);

        return {
            title: this.workoutData.title,
            duration,
            exerciseCount: this.workoutData.exercises.length,
            totalSets,
            totalReps
        };
    }
}

// Export singleton instance
const workoutEngine = new WorkoutEngine();
