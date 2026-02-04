/**
 * AI Workout Companion - Main Application
 */

class App {
    constructor() {
        this.screens = {
            welcome: document.getElementById('welcomeScreen'),
            setup: document.getElementById('setupScreen'),
            voiceSettings: document.getElementById('voiceSettingsScreen'),
            appSettings: document.getElementById('appSettingsScreen'),
            workoutSelect: document.getElementById('workoutSelectScreen'),
            chat: document.getElementById('chatScreen'),
            complete: document.getElementById('completeScreen')
        };

        this.elements = {
            connectionStatus: document.getElementById('connectionStatus'),
            apiKeyInput: document.getElementById('apiKeyInput'),
            connectBtn: document.getElementById('connectBtn'),
            routinesList: document.getElementById('routinesList'),
            startWorkoutBtn: document.getElementById('startWorkoutBtn'),
            workoutTitle: document.getElementById('workoutTitle'),
            exerciseProgress: document.getElementById('exerciseProgress'),
            endWorkoutBtn: document.getElementById('endWorkoutBtn'),
            chatMessages: document.getElementById('chatMessages'),
            chatInput: document.getElementById('chatInput'),
            sendBtn: document.getElementById('sendBtn'),
            voiceBtn: document.getElementById('voiceBtn'),
            workoutSummary: document.getElementById('workoutSummary'),
            newWorkoutBtn: document.getElementById('newWorkoutBtn'),
            disconnectBtn: document.getElementById('disconnectBtn'),
            providerSelectView: document.getElementById('providerSelectView'),
            connectionFormView: document.getElementById('connectionFormView'),
            backToProvidersBtn: document.getElementById('backToProvidersBtn'),
            providerCards: document.querySelectorAll('.provider-card:not(.disabled)'),
            voiceSettingsLink: document.getElementById('voiceSettingsLink'),
            backFromVoiceSettingsBtn: document.getElementById('backFromVoiceSettingsBtn'),
            voiceSelect: document.getElementById('voiceSelect'),
            pitchSlider: document.getElementById('pitchSlider'),
            pitchValue: document.getElementById('pitchValue'),
            rateSlider: document.getElementById('rateSlider'),
            rateValue: document.getElementById('rateValue'),
            volumeSlider: document.getElementById('volumeSlider'),
            volumeValue: document.getElementById('volumeValue'),
            testVoiceBtn: document.getElementById('testVoiceBtn'),
            // Auth elements
            googleSignInBtn: document.getElementById('googleSignInBtn'),
            signedInView: document.getElementById('signedInView'),
            signedOutView: document.getElementById('signedOutView'),
            guestView: document.getElementById('guestView'),
            guestViewHeader: document.getElementById('guestViewHeader'),
            continueAsGuestBtn: document.getElementById('continueAsGuestBtn'),
            guestSignOutBtn: document.getElementById('guestSignOutBtn'),
            guestSignOutHeaderBtn: document.getElementById('guestSignOutHeaderBtn'),
            voiceSettingsHeaderLink: document.getElementById('voiceSettingsHeaderLink'),
            voiceSettingsFooterLink: document.getElementById('voiceSettingsFooterLink'),
            userProfilePic: document.getElementById('userProfilePic'),
            userName: document.getElementById('userName'),
            signOutBtn: document.getElementById('signOutBtn'),

            // Footer menu elements
            connectionStatusFooter: document.getElementById('connectionStatusFooter'),
            connectionStatusFooterText: document.getElementById('connectionStatusFooterText'),
            userInfoFooter: document.getElementById('userInfoFooter'),
            userProfilePicFooter: document.getElementById('userProfilePicFooter'),
            userNameFooter: document.getElementById('userNameFooter'),
            guestInfoFooter: document.getElementById('guestInfoFooter'),
            guestSignOutFooterBtn: document.getElementById('guestSignOutFooterBtn'),
            userSignOutFooterBtn: document.getElementById('userSignOutFooterBtn'),

            // App Settings elements
            appSettingsFooterLink: document.getElementById('appSettingsFooterLink'),
            backFromAppSettingsBtn: document.getElementById('backFromAppSettingsBtn'),
            connectedProvidersList: document.getElementById('connectedProvidersList'),
            noProvidersMessage: document.getElementById('noProvidersMessage'),
            connectNewProviderBtn: document.getElementById('connectNewProviderBtn')
        };

        this.isGuestMode = false;
        this.editingFromAppSettings = false;

        this.selectedRoutine = null;
        this.routines = [];

        this.init();
    }

    /**
     * Initialize the app
     */
    async init() {
        this.bindEvents();
        this.setupWorkoutEngine();
        this.setupVoiceService();

        // Initialize Google Auth
        await this.initAuth();

        // Load user settings (voice preferences) from server
        await userSettingsService.loadSettings();
        // Reload voice service with synced settings
        voiceService.reloadSettings();
        this.loadVoiceSettings();
        this.populateVoiceSelector();

        // Check for saved provider credentials
        const hasCredentials = await providerManager.loadSavedProvider();
        if (hasCredentials) {
            this.elements.apiKeyInput.value = '••••••••••••••••';
            await this.testConnection();
        }
    }

    /**
     * Initialize authentication
     */
    async initAuth() {
        // Set up auth event listeners
        window.addEventListener('auth:signed-in', (e) => this.handleSignIn(e.detail));
        window.addEventListener('auth:signed-out', () => this.handleSignOut());

        // Check if already authenticated
        if (authService.isAuthenticated()) {
            this.showUserProfile(authService.getUser());
            this.showScreen('setup'); // Skip welcome, go to setup
            return;
        }

        // Check if guest mode was previously selected
        if (localStorage.getItem('guest_mode') === 'true') {
            this.enterGuestMode();
            return;
        }

        // Show welcome screen for auth selection
        this.showScreen('welcome');

        // Fetch Google Client ID from backend configuration
        let clientId = '';
        try {
            const response = await fetch('/api/config');
            if (response.ok) {
                const config = await response.json();
                clientId = config.googleClientId || '';
            }
        } catch (error) {
            console.warn('Failed to fetch config:', error);
        }

        // Only initialize Google if Client ID is configured
        if (clientId) {
            try {
                await authService.initGoogle(clientId);
                authService.renderGoogleButton('googleSignInBtn', {
                    theme: 'filled_blue',
                    size: 'large',
                    text: 'signin_with',
                    width: 280
                });
            } catch (error) {
                console.warn('Google Auth not available:', error);
            }
        } else {
            // Hide Google button if not configured
            this.elements.googleSignInBtn.style.display = 'none';
        }
    }

    /**
     * Enter guest mode (localStorage only, no server sync)
     */
    enterGuestMode() {
        this.isGuestMode = true;
        localStorage.setItem('guest_mode', 'true');
        this.elements.guestView.style.display = 'flex';
        this.elements.guestViewHeader.style.display = 'flex';
        // Update footer
        if (this.elements.guestInfoFooter) {
            this.elements.guestInfoFooter.style.display = 'flex';
        }
        if (this.elements.userInfoFooter) {
            this.elements.userInfoFooter.style.display = 'none';
        }
        this.showScreen('setup');
    }

    /**
     * Exit guest mode and return to welcome screen
     */
    exitGuestMode() {
        this.isGuestMode = false;
        localStorage.removeItem('guest_mode');
        this.elements.guestView.style.display = 'none';
        this.elements.guestViewHeader.style.display = 'none';
        // Update footer
        if (this.elements.guestInfoFooter) {
            this.elements.guestInfoFooter.style.display = 'none';
        }
        this.showScreen('welcome');
    }

    /**
     * Handle user sign in
     */
    async handleSignIn(user) {
        this.showUserProfile(user);
        // Reload settings from server
        await userSettingsService.loadSettings();
        this.loadVoiceSettings();

        // Reload saved credentials (now user-linked)
        const hasCredentials = await providerManager.loadSavedProvider();
        if (hasCredentials) {
            this.elements.apiKeyInput.value = '••••••••••••••••';
            const connected = await this.testConnection();
            if (connected) {
                // testConnection already navigates to workout selection via onConnected()
                return;
            }
        }

        // Only show setup screen if not already connected
        this.showScreen('setup');
    }

    /**
     * Handle user sign out
     */
    handleSignOut() {
        // Call authService to clear token and user data
        authService.signOut();

        // Refresh page to properly reset Google Sign-In button
        location.reload();
    }

    /**
     * Show user profile in header
     */
    showUserProfile(user) {
        this.elements.signedOutView.style.display = 'none';
        this.elements.signedInView.style.display = 'flex';
        this.elements.userName.textContent = user.name;
        // Support both profilePictureUrl and picture (Google auth uses 'picture')
        const profilePic = user.profilePictureUrl || user.picture;
        if (profilePic) {
            this.elements.userProfilePic.src = profilePic;
        }
        // Update footer
        if (this.elements.userInfoFooter) {
            this.elements.userInfoFooter.style.display = 'flex';
            this.elements.userNameFooter.textContent = user.name;
            if (profilePic) {
                this.elements.userProfilePicFooter.src = profilePic;
            }
        }
        if (this.elements.guestInfoFooter) {
            this.elements.guestInfoFooter.style.display = 'none';
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Connect button
        this.elements.connectBtn.addEventListener('click', () => this.handleConnect());

        // API key enter
        this.elements.apiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleConnect();
        });

        // Start workout button
        this.elements.startWorkoutBtn.addEventListener('click', () => this.startWorkout());

        // End workout button
        this.elements.endWorkoutBtn.addEventListener('click', () => this.confirmEndWorkout());

        // Chat input
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        this.elements.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Voice button
        this.elements.voiceBtn.addEventListener('click', () => this.toggleVoice());

        // New workout button
        this.elements.newWorkoutBtn.addEventListener('click', () => this.showScreen('workoutSelect'));

        // Disconnect button
        this.elements.disconnectBtn.addEventListener('click', () => this.handleDisconnect());

        // Provider cards
        this.elements.providerCards.forEach(card => {
            card.addEventListener('click', () => this.selectProvider(card.dataset.provider));
        });

        // Back to providers button
        this.elements.backToProvidersBtn.addEventListener('click', () => {
            if (this.editingFromAppSettings) {
                this.editingFromAppSettings = false;
                this.showAppSettings();
            } else {
                this.showProviderSelect();
            }
        });

        // Sign out button
        this.elements.signOutBtn.addEventListener('click', () => {
            authService.signOut();
        });

        // Continue as guest link
        this.elements.continueAsGuestBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.enterGuestMode();
        });

        // Guest sign out button
        this.elements.guestSignOutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.exitGuestMode();
        });

        // Voice settings link
        this.elements.voiceSettingsLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showScreen('voiceSettings');
        });

        // Header voice settings link
        if (this.elements.voiceSettingsHeaderLink) {
            this.elements.voiceSettingsHeaderLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showScreen('voiceSettings');
            });
        }

        // Header guest sign out button
        if (this.elements.guestSignOutHeaderBtn) {
            this.elements.guestSignOutHeaderBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exitGuestMode();
            });
        }

        // Footer voice settings link
        if (this.elements.voiceSettingsFooterLink) {
            this.elements.voiceSettingsFooterLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showScreen('voiceSettings');
            });
        }

        // Footer voice settings link
        if (this.elements.voiceSettingsFooterLink) {
            this.elements.voiceSettingsFooterLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showScreen('voiceSettings');
            });
        }

        // Footer guest sign out button
        if (this.elements.guestSignOutFooterBtn) {
            this.elements.guestSignOutFooterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exitGuestMode();
            });
        }

        // User sign out footer button
        if (this.elements.userSignOutFooterBtn) {
            this.elements.userSignOutFooterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSignOut();
            });
        }

        // Back from voice settings
        this.elements.backFromVoiceSettingsBtn.addEventListener('click', () => {
            const provider = providerManager.getActive();
            if (provider && provider.connected) {
                this.showScreen('workoutSelect');
            } else {
                this.showScreen('setup');
            }
        });

        // Voice selector
        this.elements.voiceSelect.addEventListener('change', (e) => this.handleVoiceChange(e.target.value));

        // Pitch slider
        this.elements.pitchSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.elements.pitchValue.textContent = value.toFixed(2);
            voiceService.pitch = value;
            userSettingsService.set('tts_pitch', value.toString());
        });

        // Rate slider
        this.elements.rateSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.elements.rateValue.textContent = value.toFixed(1);
            voiceService.rate = value;
            userSettingsService.set('tts_rate', value.toString());
        });

        // Volume slider
        this.elements.volumeSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.elements.volumeValue.textContent = value.toFixed(1);
            voiceService.volume = value;
            userSettingsService.set('tts_volume', value.toString());
        });

        // Test voice button
        this.elements.testVoiceBtn.addEventListener('click', () => {
            voiceService.speak('This is a test of your voice settings. How does it sound?');
        });

        // App Settings footer link
        if (this.elements.appSettingsFooterLink) {
            this.elements.appSettingsFooterLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAppSettings();
            });
        }

        // Back from App Settings
        if (this.elements.backFromAppSettingsBtn) {
            this.elements.backFromAppSettingsBtn.addEventListener('click', () => {
                // Go back to workout select if connected, otherwise setup
                const provider = providerManager.getActive();
                if (provider && provider.connected) {
                    this.showScreen('workoutSelect');
                } else {
                    this.showScreen('setup');
                }
            });
        }

        // Connect new provider button
        if (this.elements.connectNewProviderBtn) {
            this.elements.connectNewProviderBtn.addEventListener('click', () => {
                this.showScreen('setup');
            });
        }
    }

    /**
     * Setup workout engine callbacks
     */
    setupWorkoutEngine() {
        workoutEngine.onMessage = (sender, content) => {
            this.addMessage(sender, content);

            // Speak AI responses
            if (sender === 'ai') {
                voiceService.speak(content);
            }
        };

        workoutEngine.onWorkoutComplete = async (workoutData) => {
            // Note: Workout is already synced to Hevy by the workout engine's syncToHevy()
            // No need to call saveWorkout here - it would create a duplicate
            this.showWorkoutComplete();
        };

        // Handle voice "end workout" command
        workoutEngine.onWorkoutEnd = () => {
            workoutEngine.completeWorkout();
        };
    }

    /**
     * Setup voice service callbacks
     */
    setupVoiceService() {
        // Check if voice is supported
        if (!voiceService.isRecognitionSupported()) {
            this.elements.voiceBtn.disabled = true;
            this.elements.voiceBtn.title = 'Voice not supported in this browser';
            return;
        }

        // Handle speech recognition results
        voiceService.onResult = (transcript) => {
            // Convert word numbers to digits for display
            let convertedTranscript = workoutEngine.convertWordsToNumbers(transcript.toLowerCase().trim());

            // Deduplicate repeated numbers (e.g., "10 10" -> "10")
            const parts = convertedTranscript.split(/\s+/);
            const deduplicatedParts = [];
            let lastPart = null;
            for (const part of parts) {
                if (part !== lastPart) {
                    deduplicatedParts.push(part);
                    lastPart = part;
                }
            }
            convertedTranscript = deduplicatedParts.join(' ');

            this.addMessage('user', convertedTranscript);
            workoutEngine.processInput(transcript);
            this.updateProgressDisplay();
        };

        // Update button state when listening changes
        voiceService.onListeningChange = (isListening) => {
            // Button shows 'listening' class when continuous mode is active
            if (voiceService.continuousMode) {
                this.elements.voiceBtn.classList.add('listening');
            } else {
                this.elements.voiceBtn.classList.remove('listening');
            }
        };

        // Handle voice errors
        voiceService.onError = (error) => {
            if (error === 'not-allowed') {
                alert('Microphone access denied. Please enable microphone permissions.');
                voiceService.continuousMode = false;
                this.elements.voiceBtn.classList.remove('listening');
            }
        };
    }

    /**
     * Populate voice selector dropdown
     */
    populateVoiceSelector() {
        // Wait for voices to load
        const populate = () => {
            const voices = voiceService.getAvailableVoices();
            if (voices.length === 0) {
                // Voices not loaded yet, try again
                setTimeout(populate, 100);
                return;
            }

            // Clear and populate dropdown
            this.elements.voiceSelect.innerHTML = '';

            // Get current voice name
            const savedVoiceName = localStorage.getItem('tts_voice') || voiceService.voice?.name;

            voices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                if (voice.name === savedVoiceName) {
                    option.selected = true;
                }
                this.elements.voiceSelect.appendChild(option);
            });
        };

        // Wait a bit for voice service to initialize
        setTimeout(populate, 250);
    }

    /**
     * Handle voice selection change
     */
    handleVoiceChange(voiceName) {
        voiceService.setVoiceByName(voiceName);
    }

    /**
     * Load saved voice settings from localStorage
     */
    loadVoiceSettings() {
        // Load pitch
        const savedPitch = parseFloat(userSettingsService.get('tts_pitch', '1.05'));
        this.elements.pitchSlider.value = savedPitch;
        this.elements.pitchValue.textContent = savedPitch.toFixed(2);
        voiceService.pitch = savedPitch;

        // Load rate
        const savedRate = parseFloat(userSettingsService.get('tts_rate', '1.2'));
        this.elements.rateSlider.value = savedRate;
        this.elements.rateValue.textContent = savedRate.toFixed(1);
        voiceService.rate = savedRate;

        // Load volume
        const savedVolume = parseFloat(userSettingsService.get('tts_volume', '1.0'));
        this.elements.volumeSlider.value = savedVolume;
        this.elements.volumeValue.textContent = savedVolume.toFixed(1);
        voiceService.volume = savedVolume;
    }

    /**
     * Toggle voice listening
     */
    toggleVoice() {
        const isNowListening = voiceService.toggleListening();
        // Update button immediately
        if (isNowListening) {
            this.elements.voiceBtn.classList.add('listening');
        } else {
            this.elements.voiceBtn.classList.remove('listening');
        }
    }

    /**
     * Handle connect button click
     */
    async handleConnect() {
        const apiKey = this.elements.apiKeyInput.value.trim();

        if (!apiKey || apiKey === '••••••••••••••••') {
            return;
        }

        this.elements.connectBtn.textContent = 'Connecting...';
        this.elements.connectBtn.disabled = true;

        // Ensure Hevy provider is active
        providerManager.setActive('hevy');
        const provider = providerManager.getActive();

        const connected = await provider.connect({ apiKey });

        if (!connected) {
            provider.disconnect();
            this.elements.connectBtn.textContent = 'Connect';
            this.elements.connectBtn.disabled = false;
            alert('Invalid API key. Please check and try again.');
        } else {
            await this.onConnected();
        }
    }

    /**
     * Handle successful connection
     */
    async onConnected() {
        this.updateConnectionStatus(true);
        await this.loadRoutines();
        this.showScreen('workoutSelect');
    }

    /**
     * Test the API connection
     */
    async testConnection() {
        try {
            const provider = providerManager.getActive();
            if (!provider) return false;

            const connected = await provider.testConnection();

            if (connected) {
                await this.onConnected();
                return true;
            }
        } catch (error) {
            console.error('Connection failed:', error);
        }

        this.updateConnectionStatus(false);
        return false;
    }

    /**
     * Update connection status display
     */
    updateConnectionStatus(connected) {
        const dot = this.elements.connectionStatus.querySelector('.status-dot');
        const text = this.elements.connectionStatus.querySelector('span:not(.status-dot):not(button)');

        if (connected) {
            dot.classList.remove('disconnected');
            dot.classList.add('connected');
            text.textContent = 'Connected';
            this.elements.disconnectBtn.style.display = 'inline-block';
            // Update footer
            if (this.elements.connectionStatusFooter) {
                this.elements.connectionStatusFooter.style.display = 'flex';
                this.elements.connectionStatusFooter.classList.remove('disconnected');
                this.elements.connectionStatusFooterText.textContent = 'Connected';
            }
        } else {
            dot.classList.remove('connected');
            dot.classList.add('disconnected');
            text.textContent = 'Not Connected';
            this.elements.disconnectBtn.style.display = 'none';
            // Update footer
            if (this.elements.connectionStatusFooter) {
                this.elements.connectionStatusFooter.style.display = 'none';
            }
        }
    }

    /**
     * Handle disconnect button click
     */
    handleDisconnect() {
        const provider = providerManager.getActive();
        if (provider) {
            provider.disconnect();
        }

        // Clear API key input
        this.elements.apiKeyInput.value = '';

        // Reset connect button
        this.elements.connectBtn.textContent = 'Connect';
        this.elements.connectBtn.disabled = false;

        // Update status and go to setup screen
        this.updateConnectionStatus(false);
        this.showProviderSelect();
        this.showScreen('setup');
    }

    /**
     * Select a provider and show its connection form
     */
    selectProvider(providerName) {
        providerManager.setActive(providerName);

        // Show connection form
        this.elements.providerSelectView.style.display = 'none';
        this.elements.connectionFormView.style.display = 'flex';
    }

    /**
     * Show provider selection view
     */
    showProviderSelect() {
        this.elements.providerSelectView.style.display = 'flex';
        this.elements.connectionFormView.style.display = 'none';
    }

    /**
     * Show App Settings screen with connected providers
     */
    showAppSettings() {
        this.showScreen('appSettings');
        this.renderConnectedProviders();
    }

    /**
     * Render the list of connected providers
     */
    renderConnectedProviders() {
        const providerNames = providerManager.getProviderNames();
        const connectedProviders = [];

        // Check which providers are connected
        for (const name of providerNames) {
            const provider = providerManager.providers[name];
            if (provider && provider.connected) {
                connectedProviders.push({
                    name: name,
                    displayName: name.charAt(0).toUpperCase() + name.slice(1),
                    icon: name === 'hevy' ? '🟠' : '🔵'
                });
            }
        }

        if (connectedProviders.length === 0) {
            this.elements.connectedProvidersList.innerHTML = '';
            this.elements.noProvidersMessage.style.display = 'block';
        } else {
            this.elements.noProvidersMessage.style.display = 'none';
            this.elements.connectedProvidersList.innerHTML = connectedProviders.map(p => `
                <div class="provider-card-item" data-provider="${p.name}">
                    <div class="provider-card-icon">${p.icon}</div>
                    <div class="provider-card-content">
                        <div class="provider-card-name">${p.displayName}</div>
                        <div class="provider-card-status">Connected</div>
                    </div>
                    <div class="provider-card-actions">
                        <button type="button" class="btn-action" onclick="event.stopPropagation(); app.editProvider('${p.name}')">Edit</button>
                        <button type="button" class="btn-action btn-danger" onclick="event.stopPropagation(); app.disconnectProvider('${p.name}')">Remove</button>
                    </div>
                </div>
            `).join('');
        }
    }

    /**
     * Edit a provider's API key
     */
    editProvider(providerName) {
        // Track that we came from App Settings
        this.editingFromAppSettings = true;
        // Navigate directly to connection form
        providerManager.setActive(providerName);
        this.showScreen('setup');
        // Show connection form directly (not provider list)
        this.elements.providerSelectView.style.display = 'none';
        this.elements.connectionFormView.style.display = 'flex';
        // Clear the input so user can enter new key
        this.elements.apiKeyInput.value = '';
        // Reset button state
        this.elements.connectBtn.textContent = 'Connect';
        this.elements.connectBtn.disabled = false;
        this.elements.apiKeyInput.focus();
    }

    /**
     * Disconnect a provider - show inline confirmation
     */
    disconnectProvider(providerName) {
        // Find the provider card and show inline confirmation
        const card = document.querySelector(`.provider-card-item[data-provider="${providerName}"]`);
        if (!card) return;

        const actionsDiv = card.querySelector('.provider-card-actions');
        const originalContent = actionsDiv.innerHTML;

        // Replace with confirmation UI - stacked layout
        actionsDiv.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                <span style="font-family: var(--font-serif); font-size: 0.875rem; color: var(--stone-900);">Remove this app?</span>
                <div style="display: flex; gap: 8px;">
                    <button type="button" class="btn-action" onclick="event.stopPropagation(); app.cancelDisconnect('${providerName}')">Cancel</button>
                    <button type="button" class="btn-action btn-danger" onclick="event.stopPropagation(); app.confirmDisconnect('${providerName}')">Remove</button>
                </div>
            </div>
        `;

        // Store original content for cancel
        card.dataset.originalActions = originalContent;
    }

    /**
     * Confirm disconnect - actually remove the provider
     */
    async confirmDisconnect(providerName) {
        const provider = providerManager.providers[providerName];
        if (provider) {
            provider.disconnect();
        }

        // Re-render the list
        this.renderConnectedProviders();
    }

    /**
     * Cancel disconnect - restore original buttons
     */
    cancelDisconnect(providerName) {
        const card = document.querySelector(`.provider-card-item[data-provider="${providerName}"]`);
        if (!card) return;

        const actionsDiv = card.querySelector('.provider-card-actions');
        if (card.dataset.originalActions) {
            actionsDiv.innerHTML = card.dataset.originalActions;
            delete card.dataset.originalActions;
        }
    }

    /**
     * Load routines from provider
     */
    async loadRoutines() {
        try {
            this.elements.routinesList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

            const provider = providerManager.getActive();
            const response = await provider.getRoutines();
            this.routines = response.routines || [];

            if (this.routines.length === 0) {
                this.elements.routinesList.innerHTML = `
                    <div class="routine-item">
                        <h3>No routines found</h3>
                        <p>Create routines in the Hevy app first</p>
                    </div>
                `;
                return;
            }

            this.elements.routinesList.innerHTML = '';

            for (const routine of this.routines) {
                const exercises = routine.exercises || [];
                const exerciseCount = exercises.length;

                // Build exercise summary (show exercise names)
                const exerciseNames = exercises
                    .map(e => e.title || e.exercise_title || 'Exercise')
                    .join(' • ');

                const item = document.createElement('div');
                item.className = 'routine-item';
                item.innerHTML = `
                    <h3>${routine.title || routine.name || 'Unnamed Routine'}</h3>
                    <p class="exercise-count">${exerciseCount} exercises</p>
                    <p class="exercise-list">${exerciseNames}</p>
                `;
                item.addEventListener('click', () => this.selectRoutine(routine, item));
                this.elements.routinesList.appendChild(item);
            }
        } catch (error) {
            console.error('Failed to load routines:', error);
            this.elements.routinesList.innerHTML = `
                <div class="routine-item">
                    <h3>Failed to load routines</h3>
                    <p>Please check your connection</p>
                </div>
            `;
        }
    }

    /**
     * Select a routine
     */
    selectRoutine(routine, element) {
        // Remove selection from all items
        document.querySelectorAll('.routine-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Select this item
        element.classList.add('selected');
        this.selectedRoutine = routine;
        this.elements.startWorkoutBtn.disabled = false;
    }

    /**
     * Start the workout
     */
    async startWorkout() {
        if (!this.selectedRoutine) return;

        // Fetch full routine details if needed
        try {
            const provider = providerManager.getActive();
            const fullRoutine = await provider.getRoutine(this.selectedRoutine.id);
            this.selectedRoutine = fullRoutine.routine || fullRoutine;
        } catch (error) {
            console.error('Failed to fetch routine details:', error);
        }

        // Update header
        this.elements.workoutTitle.textContent = this.selectedRoutine.name || 'Workout';

        // Clear chat
        this.elements.chatMessages.innerHTML = '';

        // Show chat screen
        this.showScreen('chat');

        // Start workout engine
        workoutEngine.startWorkout(this.selectedRoutine);

        // Update progress display
        this.updateProgressDisplay();

        // Auto-start listening immediately (user already clicked so permissions should work)
        if (!voiceService.continuousMode) {
            voiceService.startContinuousListening();
            this.elements.voiceBtn.classList.add('listening');
        }
    }

    /**
     * Update the exercise progress display
     */
    updateProgressDisplay() {
        this.elements.exerciseProgress.textContent = workoutEngine.getExerciseProgress();
    }

    /**
     * Send a message
     */
    sendMessage() {
        const input = this.elements.chatInput.value.trim();
        if (!input) return;

        // Add user message
        this.addMessage('user', input);

        // Clear input
        this.elements.chatInput.value = '';

        // Process with workout engine
        workoutEngine.processInput(input);

        // Update progress
        this.updateProgressDisplay();
    }

    /**
     * Add a message to the chat
     */
    addMessage(sender, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        // Parse markdown bold
        const formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        messageDiv.innerHTML = `
            <div class="message-content">${formattedContent.replace(/\n/g, '<br>')}</div>
        `;

        this.elements.chatMessages.appendChild(messageDiv);

        // Scroll to bottom with delay to ensure DOM is updated
        setTimeout(() => {
            this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        }, 50);
    }

    /**
     * Show inline confirmation for ending workout
     */
    confirmEndWorkout() {
        const endBtn = document.getElementById('endWorkoutBtn');
        const confirmUI = document.getElementById('endWorkoutConfirm');

        // Hide the end button, show confirmation
        endBtn.style.display = 'none';
        confirmUI.style.display = 'flex';

        // Set up cancel handler
        document.getElementById('endWorkoutCancel').onclick = () => {
            confirmUI.style.display = 'none';
            endBtn.style.display = 'inline-flex';
        };

        // Set up confirm handler
        document.getElementById('endWorkoutConfirmBtn').onclick = () => {
            confirmUI.style.display = 'none';
            endBtn.style.display = 'inline-flex';
            workoutEngine.completeWorkout();
        };
    }

    /**
     * Save workout to provider
     */
    async saveWorkout(workoutData) {
        try {
            const provider = providerManager.getActive();
            await provider.createWorkout(workoutData);
            console.log('Workout saved to provider');
        } catch (error) {
            console.error('Failed to save workout:', error);
            // Still show complete screen, but maybe show error
        }
    }

    /**
     * Show workout complete screen
     */
    showWorkoutComplete() {
        const summary = workoutEngine.getWorkoutSummary();

        if (summary) {
            this.elements.workoutSummary.innerHTML = `
                <div class="summary-stat">
                    <label>Workout</label>
                    <value>${summary.title}</value>
                </div>
                <div class="summary-stat">
                    <label>Duration</label>
                    <value>${summary.duration} minutes</value>
                </div>
                <div class="summary-stat">
                    <label>Exercises</label>
                    <value>${summary.exerciseCount}</value>
                </div>
                <div class="summary-stat">
                    <label>Total Sets</label>
                    <value>${summary.totalSets}</value>
                </div>
                <div class="summary-stat">
                    <label>Total Reps</label>
                    <value>${summary.totalReps}</value>
                </div>
            `;
        }

        this.showScreen('complete');
    }

    /**
     * Show a specific screen
     */
    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show selected screen
        const targetScreen = document.getElementById(`${screenName}Screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }

        // Hide footer on welcome screen, show on all others
        const footer = document.querySelector('.footer');
        if (footer) {
            if (screenName === 'welcome') {
                footer.style.display = 'none';
            } else {
                footer.style.display = 'block';
            }
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
