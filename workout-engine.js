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

        // Callback for sending messages
        this.onMessage = null;
    }

    // Motivational messages pool
    motivationalMessages = {
        repStart: [
            "💪 Let's go!",
            "🔥 You got this!",
            "⚡ Power up!",
            "🎯 Focus!",
        ],
        repComplete: [
            "Strong start! 💪",
            "Keep pushing!",
            "Nice and controlled!",
            "You're in the zone!",
            "Great form!",
            "Beast mode! 🔥",
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
            "🎉 Set complete! Great work!",
            "💪 Solid set! Rest up.",
            "🔥 Crushed that set!",
            "⭐ Excellent work!",
        ],
        exerciseComplete: [
            "🏆 Exercise complete! You crushed it!",
            "💪 Awesome job on that exercise!",
            "🎉 Done with that one! Great effort!",
        ],
        timerHalfway: [
            "Halfway there! Stay tight! 💪",
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
    startWorkout(routine) {
        this.routine = routine;
        this.currentExerciseIndex = 0;
        this.currentSetIndex = 0;
        this.currentRep = 0;
        this.workoutStartTime = new Date();

        // Initialize workout data structure
        this.workoutData = {
            title: routine.title || routine.name || 'Workout',
            start_time: this.workoutStartTime.toISOString(),
            exercises: []
        };

        // Send welcome message
        const exercise = this.getCurrentExercise();
        this.sendAIMessage(`🔥 Starting "${this.workoutData.title}" workout!`);

        setTimeout(() => {
            this.announceExercise(exercise);
        }, 500);
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

        const sets = exercise.sets?.length || 3;
        const isTimedExercise = exercise.exercise_type === 'duration' ||
            exercise.superset_id?.includes('duration') ||
            exercise.duration_seconds > 0;

        let message = `🔥 Next exercise: **${exercise.title || exercise.exercise_template_id}**`;

        if (isTimedExercise) {
            const duration = exercise.duration_seconds || 60;
            message += ` (${sets} sets × ${duration} seconds).\n`;
            message += `This is a timed exercise - I'll count down for you!\n`;
            message += `Ready for Set 1?`;
            this.isCountdown = true;
            this.timerSeconds = duration;
        } else {
            const reps = exercise.reps || 10;
            message += ` (${sets} sets × ${reps} reps).\n`;
            message += `Tell me after each rep - I'll count down with you!`;
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

        // Check for workout end commands
        if (normalizedInput === 'done' || normalizedInput === 'end' || normalizedInput === 'finish') {
            return this.handleDone();
        }

        // Check for set start (for timed exercises)
        if (normalizedInput === 'yes' || normalizedInput === 'ready' || normalizedInput === 'go' || normalizedInput === 'start') {
            if (this.isCountdown) {
                return this.startTimer();
            }
            return this.sendAIMessage("Let's go! Tell me your rep count.");
        }

        // Check for skip
        if (normalizedInput === 'skip' || normalizedInput === 'next exercise') {
            return this.skipExercise();
        }

        // Check for rep counts (could be multiple: "1 2 3" or just "1")
        const repNumbers = normalizedInput.split(/[\s,]+/).filter(n => !isNaN(n) && n !== '');
        if (repNumbers.length > 0) {
            return this.handleRepInput(repNumbers);
        }

        // Default response
        this.sendAIMessage("Tell me your rep number, 'done' when finished with the set, or 'skip' to move on.");
    }

    /**
     * Handle rep input from user
     */
    handleRepInput(repNumbers) {
        const exercise = this.getCurrentExercise();
        if (!exercise) return;

        const targetReps = exercise.reps || 10;
        let messages = [];

        for (const repNum of repNumbers) {
            this.currentRep++;
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
            const totalSets = exercise?.sets?.length || 3;

            if (this.currentSetIndex >= totalSets) {
                messages.push(this.getMotivation('exerciseComplete'));
                this.moveToNextExercise();
            } else {
                messages.push(`Rest up. Ready for Set ${this.currentSetIndex + 1}?`);
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

        const totalSets = exercise?.sets?.length || 3;

        if (this.currentSetIndex < totalSets - 1) {
            // Done with current set, not all sets
            this.currentSetIndex++;
            this.currentRep = 0;
            this.sendAIMessage(`${this.getMotivation('setComplete')}\nReady for Set ${this.currentSetIndex + 1}?`);
        } else {
            // Done with exercise
            this.sendAIMessage(this.getMotivation('exerciseComplete'));
            this.moveToNextExercise();
        }
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

            // Milestone announcements
            if (remaining === Math.floor(duration / 2)) {
                this.sendAIMessage(this.getMotivation('timerHalfway'));
            } else if (remaining === 30 && duration > 45) {
                this.sendAIMessage(this.getMotivation('timer30sec'));
            } else if (remaining === 15) {
                this.sendAIMessage(this.getMotivation('timer15sec'));
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
        const totalSets = exercise?.sets?.length || 3;

        if (this.currentSetIndex >= totalSets) {
            this.sendAIMessage(`${this.getMotivation('setComplete')}\n${this.getMotivation('exerciseComplete')}`);
            this.moveToNextExercise();
        } else {
            this.sendAIMessage(`${this.getMotivation('setComplete')}\nRest up. Ready for Set ${this.currentSetIndex + 1}?`);
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
                notes: '',
                sets: []
            };
            this.workoutData.exercises.push(exerciseData);
        }

        // Add set data
        exerciseData.sets.push({
            index: exerciseData.sets.length,
            set_type: 'normal',
            weight_kg: exercise.weight_kg || 0,
            reps: this.currentRep || 0,
            duration_seconds: this.isCountdown ? this.timerSeconds : 0,
            distance_meters: 0,
            rpe: null
        });
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
        this.sendAIMessage("⏭️ Skipping to next exercise...");
        this.moveToNextExercise();
    }

    /**
     * Complete the workout
     */
    completeWorkout() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.workoutData.end_time = new Date().toISOString();

        const duration = Math.round((new Date() - this.workoutStartTime) / 1000 / 60);
        const totalSets = this.workoutData.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

        this.sendAIMessage(`🎉 **Workout Complete!**\n\n` +
            `⏱️ Duration: ${duration} minutes\n` +
            `🏋️ Exercises: ${this.workoutData.exercises.length}\n` +
            `📊 Total Sets: ${totalSets}\n\n` +
            `Great job! Your workout has been logged.`);

        // Trigger workout complete callback
        if (this.onWorkoutComplete) {
            this.onWorkoutComplete(this.workoutData);
        }
    }

    /**
     * Send AI message
     */
    sendAIMessage(content) {
        if (this.onMessage) {
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
