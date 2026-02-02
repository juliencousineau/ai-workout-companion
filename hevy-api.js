/**
 * Hevy API Client
 * Handles all communication with the Hevy API
 */

class HevyAPI {
    constructor() {
        this.baseUrl = 'https://api.hevyapp.com/v1';
        this.apiKey = null;
    }

    /**
     * Set the API key for authentication
     */
    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('hevy_api_key', key);
    }

    /**
     * Load API key from localStorage
     */
    loadApiKey() {
        this.apiKey = localStorage.getItem('hevy_api_key');
        return this.apiKey;
    }

    /**
     * Clear the API key
     */
    clearApiKey() {
        this.apiKey = null;
        localStorage.removeItem('hevy_api_key');
    }

    /**
     * Make an authenticated request to the Hevy API
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
                if (response.status === 401) {
                    throw new Error('Invalid API key');
                }
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Hevy API Error:', error);
            throw error;
        }
    }

    /**
     * Test the API connection
     */
    async testConnection() {
        try {
            await this.request('/workouts/count');
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get all routines
     */
    async getRoutines(page = 1, pageSize = 20) {
        return await this.request(`/routines?page=${page}&page_size=${pageSize}`);
    }

    /**
     * Get a specific routine by ID
     */
    async getRoutine(routineId) {
        return await this.request(`/routines/${routineId}`);
    }

    /**
     * Get exercise templates
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

// Export singleton instance
const hevyApi = new HevyAPI();
