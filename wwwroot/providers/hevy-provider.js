/**
 * Hevy Provider
 * Implements WorkoutProvider interface for Hevy API
 */

class HevyProvider extends WorkoutProvider {
    constructor() {
        super();
        this.name = 'Hevy';
        this.baseUrl = 'https://api.hevyapp.com/v1';
        this.apiKey = null;
    }

    /**
     * Load API key from server
     * @returns {Promise<boolean>}
     */
    async loadCredentials() {
        this.apiKey = await cryptoUtils.loadCredentials('hevy');
        this.connected = !!this.apiKey;
        return this.connected;
    }

    /**
     * Connect with API key
     * @param {Object} credentials - { apiKey: string }
     * @returns {Promise<boolean>}
     */
    async connect(credentials) {
        if (!credentials.apiKey) {
            throw new Error('API key is required');
        }

        this.apiKey = credentials.apiKey;
        await cryptoUtils.saveCredentials('hevy', this.apiKey);

        const success = await this.testConnection();
        this.connected = success;

        if (!success) {
            this.disconnect();
        }

        return success;
    }

    /**
     * Test the API connection
     * @returns {Promise<boolean>}
     */
    async testConnection() {
        try {
            await this.request('/workouts/count');
            this.connected = true;
            return true;
        } catch (error) {
            this.connected = false;
            return false;
        }
    }

    /**
     * Disconnect and clear credentials
     */
    disconnect() {
        this.apiKey = null;
        this.connected = false;
        cryptoUtils.deleteCredentials('hevy');
    }

    /**
     * Make an authenticated request to the Hevy API
     * @private
     */
    async request(endpoint, options = {}) {
        if (!this.apiKey) {
            throw new Error('API key not set');
        }

        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                // Log the error response body for debugging
                let errorBody = '';
                try {
                    errorBody = await response.text();
                    console.error('Hevy API Error Response:', errorBody);
                } catch (e) { }

                if (response.status === 401) {
                    throw new Error('Invalid API key');
                }
                throw new Error(`API error: ${response.status} - ${errorBody}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Hevy API Error:', error);
            throw error;
        }
    }

    /**
     * Get all routines
     * @returns {Promise<{routines: Array}>}
     */
    async getRoutines(page = 1, pageSize = 20) {
        return await this.request(`/routines?page=${page}&page_size=${pageSize}`);
    }

    /**
     * Get a specific routine by ID
     * @returns {Promise<{routine: Object}>}
     */
    async getRoutine(routineId) {
        return await this.request(`/routines/${routineId}`);
    }

    /**
     * Get exercise templates
     * @returns {Promise<{exercise_templates: Array}>}
     */
    async getExerciseTemplates(page = 1, pageSize = 100) {
        return await this.request(`/exercise_templates?page=${page}&page_size=${pageSize}`);
    }

    /**
     * Get a specific exercise template
     */
    async getExerciseTemplate(templateId) {
        return await this.request(`/exercise_templates/${templateId}`);
    }

    /**
     * Get workouts
     * @returns {Promise<{workouts: Array}>}
     */
    async getWorkouts(page = 1, pageSize = 10) {
        return await this.request(`/workouts?page=${page}&page_size=${pageSize}`);
    }

    /**
     * Get workout count
     */
    async getWorkoutCount() {
        return await this.request('/workouts/count');
    }

    /**
     * Create a new workout log
     * @returns {Promise<Object>}
     */
    async createWorkout(workoutData) {
        return await this.request('/workouts', {
            method: 'POST',
            body: JSON.stringify({ workout: workoutData })
        });
    }

    /**
     * Update an existing workout
     */
    async updateWorkout(workoutId, workoutData) {
        return await this.request(`/workouts/${workoutId}`, {
            method: 'PUT',
            body: JSON.stringify({ workout: workoutData })
        });
    }
}

// Register with provider manager
const hevyProvider = new HevyProvider();
providerManager.register('hevy', hevyProvider);
