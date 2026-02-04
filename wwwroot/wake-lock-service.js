/**
 * Screen Wake Lock Service
 * Prevents the device screen from sleeping during workouts
 */

class WakeLockService {
    constructor() {
        this.wakeLock = null;
        this.isSupported = 'wakeLock' in navigator;

        // Re-acquire wake lock when page becomes visible again
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.wakeLock !== null) {
                this.acquire();
            }
        });
    }

    /**
     * Request a wake lock to keep the screen on
     */
    async acquire() {
        if (!this.isSupported) {
            console.log('Wake Lock API not supported');
            return false;
        }

        try {
            this.wakeLock = await navigator.wakeLock.request('screen');
            console.log('Screen wake lock acquired');

            this.wakeLock.addEventListener('release', () => {
                console.log('Screen wake lock released');
            });

            return true;
        } catch (err) {
            console.error('Failed to acquire wake lock:', err);
            return false;
        }
    }

    /**
     * Release the wake lock
     */
    async release() {
        if (this.wakeLock) {
            try {
                await this.wakeLock.release();
                this.wakeLock = null;
                console.log('Screen wake lock released manually');
            } catch (err) {
                console.error('Failed to release wake lock:', err);
            }
        }
    }

    /**
     * Check if wake lock is currently active
     */
    isActive() {
        return this.wakeLock !== null && !this.wakeLock.released;
    }
}

// Export singleton instance
const wakeLockService = new WakeLockService();
