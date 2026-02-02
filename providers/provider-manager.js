/**
 * Provider Manager
 * Manages workout providers and provides a unified API for the app
 */

class ProviderManager {
    constructor() {
        this.providers = {};
        this.activeProvider = null;
        this.activeProviderName = null;
    }

    /**
     * Register a provider
     * @param {string} name - Unique provider name
     * @param {WorkoutProvider} provider - Provider instance
     */
    register(name, provider) {
        this.providers[name] = provider;
        console.log(`Provider registered: ${name}`);
    }

    /**
     * Get list of registered provider names
     * @returns {string[]}
     */
    getProviderNames() {
        return Object.keys(this.providers);
    }

    /**
     * Get a provider by name
     * @param {string} name
     * @returns {WorkoutProvider|null}
     */
    getProvider(name) {
        return this.providers[name] || null;
    }

    /**
     * Set the active provider
     * @param {string} name - Provider name
     * @returns {boolean} True if provider was set
     */
    setActive(name) {
        if (!this.providers[name]) {
            console.error(`Provider not found: ${name}`);
            return false;
        }

        this.activeProvider = this.providers[name];
        this.activeProviderName = name;
        localStorage.setItem('active_provider', name);
        console.log(`Active provider set: ${name}`);
        return true;
    }

    /**
     * Get the active provider
     * @returns {WorkoutProvider|null}
     */
    getActive() {
        return this.activeProvider;
    }

    /**
     * Get the active provider name
     * @returns {string|null}
     */
    getActiveName() {
        return this.activeProviderName;
    }

    /**
     * Load the last active provider from storage
     * @returns {boolean} True if a provider was loaded and connected
     */
    loadSavedProvider() {
        const savedName = localStorage.getItem('active_provider');

        if (savedName && this.providers[savedName]) {
            this.setActive(savedName);
            return this.activeProvider.loadCredentials();
        }

        // Default to first registered provider
        const names = this.getProviderNames();
        if (names.length > 0) {
            this.setActive(names[0]);
            return this.activeProvider.loadCredentials();
        }

        return false;
    }

    /**
     * Clear the active provider
     */
    clearActive() {
        if (this.activeProvider) {
            this.activeProvider.disconnect();
        }
        this.activeProvider = null;
        this.activeProviderName = null;
        localStorage.removeItem('active_provider');
    }
}

// Export singleton instance
const providerManager = new ProviderManager();
