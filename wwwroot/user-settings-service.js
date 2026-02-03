/**
 * User Settings Service
 * Manages user-specific settings synced with server
 */

class UserSettingsService {
    constructor() {
        this.settings = {};
        this.loaded = false;
    }

    /**
     * Load all user settings from server
     */
    async loadSettings() {
        if (!authService.isAuthenticated()) {
            // Not authenticated, use localStorage
            this.loadFromLocalStorage();
            this.loaded = true;
            return;
        }

        try {
            const response = await fetch('/api/user-settings', {
                headers: {
                    ...authService.getAuthHeader()
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.settings = data.settings || {};
                this.loaded = true;

                // Sync to localStorage for offline access
                this.syncToLocalStorage();
            } else {
                // Fallback to localStorage
                this.loadFromLocalStorage();
                this.loaded = true;
            }
        } catch (error) {
            console.error('Failed to load settings from server:', error);
            this.loadFromLocalStorage();
            this.loaded = true;
        }
    }

    /**
     * Get a setting value
     */
    get(key, defaultValue = null) {
        return this.settings[key] ?? defaultValue;
    }

    /**
     * Set a setting value (saves to server if authenticated)
     */
    async set(key, value) {
        this.settings[key] = value;
        localStorage.setItem(key, value);

        if (!authService.isAuthenticated()) {
            return;
        }

        try {
            await fetch(`/api/user-settings/${key}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authService.getAuthHeader()
                },
                body: JSON.stringify({ value })
            });
        } catch (error) {
            console.error('Failed to save setting to server:', error);
        }
    }

    /**
     * Delete a setting
     */
    async delete(key) {
        delete this.settings[key];
        localStorage.removeItem(key);

        if (!authService.isAuthenticated()) {
            return;
        }

        try {
            await fetch(`/api/user-settings/${key}`, {
                method: 'DELETE',
                headers: authService.getAuthHeader()
            });
        } catch (error) {
            console.error('Failed to delete setting from server:', error);
        }
    }

    /**
     * Load settings from localStorage
     */
    loadFromLocalStorage() {
        const keys = ['tts_voice', 'tts_pitch', 'tts_rate', 'tts_volume'];
        keys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value !== null) {
                this.settings[key] = value;
            }
        });
    }

    /**
     * Sync current settings to localStorage
     */
    syncToLocalStorage() {
        Object.entries(this.settings).forEach(([key, value]) => {
            localStorage.setItem(key, value);
        });
    }
}

// Export singleton instance
const userSettingsService = new UserSettingsService();
