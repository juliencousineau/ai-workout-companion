/**
 * Workout Provider Interface
 * Base class that all workout providers must implement
 */

class WorkoutProvider {
    constructor() {
        if (this.constructor === WorkoutProvider) {
            throw new Error('WorkoutProvider is an abstract class and cannot be instantiated directly');
        }
        this.name = 'Unknown Provider';
        this.connected = false;
    }

    /**
     * Get the provider name
     * @returns {string}
     */
    getName() {
        return this.name;
    }

    /**
     * Check if currently connected
     * @returns {boolean}
     */
    isConnected() {
        return this.connected;
    }

    /**
     * Load saved credentials from storage
     * @returns {boolean} True if credentials were loaded
     */
    loadCredentials() {
        throw new Error('loadCredentials() must be implemented by subclass');
    }

    /**
     * Connect to the provider with credentials
     * @param {Object} credentials - Provider-specific credentials
     * @returns {Promise<boolean>} True if connection successful
     */
    async connect(credentials) {
        throw new Error('connect() must be implemented by subclass');
    }

    /**
     * Test the current connection
     * @returns {Promise<boolean>} True if connection is valid
     */
    async testConnection() {
        throw new Error('testConnection() must be implemented by subclass');
    }

    /**
     * Disconnect and clear credentials
     */
    disconnect() {
        throw new Error('disconnect() must be implemented by subclass');
    }

    /**
     * Get all routines/workout templates
     * @param {number} page - Page number
     * @param {number} pageSize - Items per page
     * @returns {Promise<{routines: Array}>}
     */
    async getRoutines(page = 1, pageSize = 20) {
        throw new Error('getRoutines() must be implemented by subclass');
    }

    /**
     * Get a specific routine by ID
     * @param {string} routineId
     * @returns {Promise<{routine: Object}>}
     */
    async getRoutine(routineId) {
        throw new Error('getRoutine() must be implemented by subclass');
    }

    /**
     * Get exercise templates
     * @param {number} page
     * @param {number} pageSize
     * @returns {Promise<{exercise_templates: Array}>}
     */
    async getExerciseTemplates(page = 1, pageSize = 100) {
        throw new Error('getExerciseTemplates() must be implemented by subclass');
    }

    /**
     * Create/log a new workout
     * @param {Object} workoutData - Workout data to save
     * @returns {Promise<Object>} Created workout
     */
    async createWorkout(workoutData) {
        throw new Error('createWorkout() must be implemented by subclass');
    }

    /**
     * Get workout history
     * @param {number} page
     * @param {number} pageSize
     * @returns {Promise<{workouts: Array}>}
     */
    async getWorkouts(page = 1, pageSize = 10) {
        throw new Error('getWorkouts() must be implemented by subclass');
    }
}
