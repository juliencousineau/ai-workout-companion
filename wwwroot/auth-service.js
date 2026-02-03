/**
 * Authentication Service
 * Handles Google OAuth and JWT token management
 */

class AuthService {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.user = null;

        // Load user from localStorage if token exists
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                this.user = JSON.parse(savedUser);
            } catch (e) {
                console.error('Failed to parse saved user:', e);
            }
        }
    }

    /**
     * Initialize Google Sign-In
     */
    async initGoogle(clientId) {
        return new Promise((resolve, reject) => {
            if (typeof google === 'undefined') {
                reject(new Error('Google SDK not loaded'));
                return;
            }

            google.accounts.id.initialize({
                client_id: clientId,
                callback: (response) => this.handleGoogleCallback(response)
            });

            resolve();
        });
    }

    /**
     * Render Google Sign-In button
     */
    renderGoogleButton(elementId, options = {}) {
        google.accounts.id.renderButton(
            document.getElementById(elementId),
            {
                theme: options.theme || 'filled_blue',
                size: options.size || 'large',
                type: options.type || 'standard',
                shape: options.shape || 'rectangular',
                text: options.text || 'signin_with',
                logo_alignment: options.logoAlignment || 'left'
            }
        );
    }

    /**
     * Handle Google OAuth callback
     */
    async handleGoogleCallback(response) {
        try {
            // Exchange Google ID token for our JWT
            const result = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: response.credential })
            });

            if (!result.ok) {
                throw new Error('Authentication failed');
            }

            const data = await result.json();

            // Store token and user info
            this.token = data.token;
            this.user = data.user;
            localStorage.setItem('auth_token', this.token);
            localStorage.setItem('user', JSON.stringify(this.user));

            // Trigger signed in event
            window.dispatchEvent(new CustomEvent('auth:signed-in', { detail: this.user }));

            return data;
        } catch (error) {
            console.error('Google sign-in error:', error);
            throw error;
        }
    }

    /**
     *Get authenticated token - Sign out
     */
    signOut() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');

        // Trigger signed out event
        window.dispatchEvent(new Event('auth:signed-out'));
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    /**
     * Get current user
     */
    getUser() {
        return this.user;
    }

    /**
     * Get auth token for API calls
     */
    getToken() {
        return this.token;
    }

    /**
     * Get authorization header
     */
    getAuthHeader() {
        return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    }
}

// Export singleton instance
const authService = new AuthService();
