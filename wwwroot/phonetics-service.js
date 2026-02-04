/**
 * Phonetics Service
 * Manages custom phonetic mappings for improved voice recognition
 */

class PhoneticsService {
    constructor() {
        this.customPhonetics = [];
        this.loaded = false;
    }

    /**
     * Load user's custom phonetics from the server
     */
    async load() {
        if (!authService.isAuthenticated()) {
            this.customPhonetics = [];
            this.loaded = true;
            return;
        }

        try {
            const response = await fetch('/api/phonetics', {
                headers: authService.getAuthHeader()
            });

            if (response.ok) {
                const data = await response.json();
                this.customPhonetics = data.phonetics || [];
                console.log(`Loaded ${this.customPhonetics.length} custom phonetics`);
            }
        } catch (error) {
            console.error('Failed to load phonetics:', error);
        }
        this.loaded = true;
    }

    /**
     * Add a new phonetic mapping
     */
    async add(canonical, alternative, category = 'number') {
        if (!authService.isAuthenticated()) {
            console.log('Cannot save phonetics: not authenticated');
            return false;
        }

        try {
            const response = await fetch('/api/phonetics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authService.getAuthHeader()
                },
                body: JSON.stringify({ canonical, alternative, category })
            });

            if (response.ok) {
                await this.load(); // Reload to get updated list
                return true;
            }
        } catch (error) {
            console.error('Failed to add phonetic:', error);
        }
        return false;
    }

    /**
     * Delete a phonetic mapping
     */
    async delete(id) {
        if (!authService.isAuthenticated()) {
            return false;
        }

        try {
            const response = await fetch(`/api/phonetics/${id}`, {
                method: 'DELETE',
                headers: authService.getAuthHeader()
            });

            if (response.ok) {
                this.customPhonetics = this.customPhonetics.filter(p => p.id !== id);
                return true;
            }
        } catch (error) {
            console.error('Failed to delete phonetic:', error);
        }
        return false;
    }

    /**
     * Get all custom phonetics as a word-to-number map for the workout engine
     */
    getPhoneticMap() {
        const map = {};
        for (const p of this.customPhonetics) {
            map[p.alternative.toLowerCase()] = p.canonical;
        }
        return map;
    }

    /**
     * Get phonetics grouped by category for display
     */
    getGroupedPhonetics() {
        const numbers = this.customPhonetics.filter(p => p.category === 'number');
        const commands = this.customPhonetics.filter(p => p.category === 'command');
        return { numbers, commands };
    }

    /**
     * Reset all phonetics to defaults
     */
    async resetToDefaults() {
        if (!authService.isAuthenticated()) {
            return false;
        }

        try {
            const response = await fetch('/api/phonetics/reset', {
                method: 'POST',
                headers: authService.getAuthHeader()
            });

            if (response.ok) {
                await this.load(); // Reload to get the defaults
                return true;
            }
        } catch (error) {
            console.error('Failed to reset phonetics:', error);
        }
        return false;
    }
}

// Export singleton instance
const phoneticsService = new PhoneticsService();
