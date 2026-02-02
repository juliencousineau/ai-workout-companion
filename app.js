/**
 * AI Workout Companion - Main Application
 */

class App {
    constructor() {
        this.screens = {
            setup: document.getElementById('setupScreen'),
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
            workoutSummary: document.getElementById('workoutSummary'),
            newWorkoutBtn: document.getElementById('newWorkoutBtn')
        };

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

        // Check for saved provider credentials
        const hasCredentials = providerManager.loadSavedProvider();
        if (hasCredentials) {
            this.elements.apiKeyInput.value = '••••••••••••••••';
            await this.testConnection();
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

        // New workout button
        this.elements.newWorkoutBtn.addEventListener('click', () => this.showScreen('workoutSelect'));
    }

    /**
     * Setup workout engine callbacks
     */
    setupWorkoutEngine() {
        workoutEngine.onMessage = (sender, content) => {
            this.addMessage(sender, content);
        };

        workoutEngine.onWorkoutComplete = async (workoutData) => {
            await this.saveWorkout(workoutData);
            this.showWorkoutComplete();
        };
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
        const text = this.elements.connectionStatus.querySelector('span:last-child');

        if (connected) {
            dot.classList.remove('disconnected');
            dot.classList.add('connected');
            text.textContent = 'Connected';
        } else {
            dot.classList.remove('connected');
            dot.classList.add('disconnected');
            text.textContent = 'Not Connected';
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
                const exerciseCount = routine.exercises?.length || 0;
                const item = document.createElement('div');
                item.className = 'routine-item';
                item.innerHTML = `
                    <h3>${routine.name || 'Unnamed Routine'}</h3>
                    <p>${exerciseCount} exercises</p>
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

        // Scroll to bottom
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    /**
     * Confirm ending workout
     */
    confirmEndWorkout() {
        if (confirm('Are you sure you want to end this workout?')) {
            workoutEngine.completeWorkout();
        }
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
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });

        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
