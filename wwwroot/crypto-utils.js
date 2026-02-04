/**
 * Crypto Utilities
 * Save/load encrypted credentials via server API
 * Supports both authenticated (UserId) and guest (DeviceId) modes
 */

class CryptoUtils {
    constructor() {
        this.deviceId = null;
    }

    /**
     * Get or generate device ID
     */
    getDeviceId() {
        if (this.deviceId) return this.deviceId;

        // Get or create device ID
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = this.generateDeviceId();
            localStorage.setItem('device_id', deviceId);
        }

        this.deviceId = deviceId;
        return deviceId;
    }

    /**
     * Generate unique device ID
     */
    generateDeviceId() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Get auth headers if user is authenticated
     */
    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };

        // Add authorization header if user is signed in
        if (window.authService && window.authService.isAuthenticated()) {
            const authHeader = window.authService.getAuthHeader();
            // Merge auth headers (getAuthHeader now returns an object)
            Object.assign(headers, authHeader);
        }

        return headers;
    }

    /**
     * Save API key to server (encrypted server-side)
     * Uses UserId if authenticated, DeviceId if guest
     */
    async saveCredentials(provider, apiKey) {
        try {
            const response = await fetch('/api/credentials/save', {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    deviceId: this.getDeviceId(), // Send DeviceId for fallback
                    provider,
                    apiKey
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save credentials');
            }

            const result = await response.json();
            console.log('Credentials saved:', result.userLinked ? 'user-linked' : 'device-linked');
            return result;
        } catch (error) {
            console.error('Save credentials error:', error);
            // Fallback to localStorage
            localStorage.setItem(`${provider}_api_key`, apiKey);
            return { success: true, fallback: true };
        }
    }

    /**
     * Load API key from server
     * Prioritizes UserId if authenticated, falls back to DeviceId
     */
    async loadCredentials(provider) {
        try {
            const response = await fetch('/api/credentials/load', {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    deviceId: this.getDeviceId(), // Send DeviceId for fallback
                    provider
                })
            });

            if (!response.ok) {
                throw new Error('Failed to load credentials');
            }

            const result = await response.json();
            if (result.found) {
                console.log('Credentials loaded:', result.userLinked ? 'user-linked' : 'device-linked');
            }
            return result.found ? result.apiKey : null;
        } catch (error) {
            console.error('Load credentials error:', error);
            // Fallback to localStorage
            return localStorage.getItem(`${provider}_api_key`);
        }
    }

    /**
     * Delete credentials from server
     */
    async deleteCredentials(provider) {
        try {
            const response = await fetch('/api/credentials/delete', {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    deviceId: this.getDeviceId(), // Send DeviceId for fallback
                    provider
                })
            });

            if (!response.ok) {
                throw new Error('Failed to delete credentials');
            }

            return await response.json();
        } catch (error) {
            console.error('Delete credentials error:', error);
            // Fallback to localStorage
            localStorage.removeItem(`${provider}_api_key`);
            return { success: true, fallback: true };
        }
    }
}

// Export singleton instance
const cryptoUtils = new CryptoUtils();
