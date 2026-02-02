/**
 * Voice Service
 * Handles speech-to-text (recognition) and text-to-speech (synthesis)
 */

class VoiceService {
    constructor() {
        // Speech Recognition setup
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            this.setupRecognitionHandlers();
        } else {
            this.recognition = null;
            console.warn('Speech Recognition not supported in this browser');
        }

        // Speech Synthesis setup
        this.synthesis = window.speechSynthesis;
        this.voice = null;
        this.loadVoices();

        // State
        this.isListening = false;
        this.isSpeaking = false;

        // Callbacks
        this.onResult = null;
        this.onListeningChange = null;
        this.onError = null;
    }

    /**
     * Setup speech recognition event handlers
     */
    setupRecognitionHandlers() {
        this.recognition.onresult = (event) => {
            const result = event.results[0];
            if (result.isFinal) {
                const transcript = result[0].transcript.trim();
                console.log('Speech recognized:', transcript);
                if (this.onResult) {
                    this.onResult(transcript);
                }
            }
        };

        this.recognition.onstart = () => {
            this.isListening = true;
            if (this.onListeningChange) {
                this.onListeningChange(true);
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            if (this.onListeningChange) {
                this.onListeningChange(false);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            if (this.onListeningChange) {
                this.onListeningChange(false);
            }
            if (this.onError) {
                this.onError(event.error);
            }
        };
    }

    /**
     * Load available voices for synthesis
     */
    loadVoices() {
        // Voices may load asynchronously
        const setVoice = () => {
            const voices = this.synthesis.getVoices();
            // Prefer a natural-sounding English voice
            this.voice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Samantha')) ||
                voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
                voices.find(v => v.lang.startsWith('en')) ||
                voices[0];
        };

        if (this.synthesis.getVoices().length > 0) {
            setVoice();
        } else {
            this.synthesis.onvoiceschanged = setVoice;
        }
    }

    /**
     * Check if speech recognition is supported
     */
    isRecognitionSupported() {
        return !!this.recognition;
    }

    /**
     * Check if speech synthesis is supported
     */
    isSynthesisSupported() {
        return !!this.synthesis;
    }

    /**
     * Start listening for speech input
     */
    startListening() {
        if (!this.recognition) {
            console.error('Speech recognition not supported');
            return false;
        }

        if (this.isListening) {
            return true;
        }

        try {
            // Stop any ongoing speech before listening
            this.stopSpeaking();
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            return false;
        }
    }

    /**
     * Stop listening for speech input
     */
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    /**
     * Toggle listening state
     */
    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
        return this.isListening;
    }

    /**
     * Speak the given text
     * @param {string} text - Text to speak
     * @param {Object} options - Optional settings
     */
    speak(text, options = {}) {
        if (!this.synthesis) {
            console.error('Speech synthesis not supported');
            return;
        }

        // Clean text for speech (remove markdown, emojis, etc.)
        const cleanText = this.cleanTextForSpeech(text);
        if (!cleanText) return;

        // Cancel any current speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.voice = this.voice;
        utterance.rate = options.rate || 1.1;  // Slightly faster for workout context
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;

        utterance.onstart = () => {
            this.isSpeaking = true;
        };

        utterance.onend = () => {
            this.isSpeaking = false;
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            this.isSpeaking = false;
        };

        this.synthesis.speak(utterance);
    }

    /**
     * Stop any ongoing speech
     */
    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.isSpeaking = false;
        }
    }

    /**
     * Clean text for speech output
     * Removes markdown, emojis, and other non-speakable content
     */
    cleanTextForSpeech(text) {
        return text
            // Remove emojis
            .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '')
            // Remove markdown bold/italic
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            // Remove markdown links
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // Clean up extra whitespace
            .replace(/\s+/g, ' ')
            .trim();
    }
}

// Export singleton instance
const voiceService = new VoiceService();
