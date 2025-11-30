/**
 * DictaMed - Refactored Main Application Script
 * Addresses all identified issues: duplicates, security, architecture, performance
 * 
 * NOUVELLES FONCTIONNALITÉS: 
 * - Firebase Authentication with security enhancements
 * - Unified configuration management
 * - Consolidated debugging system
 * - Enhanced error handling and input validation
 * - Improved performance and security
 */

'use strict';

// Import new secure modules
import { appConfig, APP_CONSTANTS } from './config-manager.js';
import { secureFirebase } from './firebase-config-secure.js';
import { secureFirebaseAuth } from './firebase-auth-service-secure.js';
import { unifiedDebugSystem } from './unified-debug-system.js';

// Initialize Firebase securely
async function initializeFirebase() {
    try {
        await secureFirebase.initialize();
        await secureFirebaseAuth.initialize();
        appState.isFirebaseReady = true;
        appState.isAuthenticated = false;
        appState.currentUser = null;
        appState.userRole = null;
        
        console.log('✅ Firebase initialized securely');
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        throw error;
    }
}

// ===== APPLICATION STATE =====
const appState = {
    currentMode: 'test', // Default to test mode for easier access
    recordings: {
        normal: {},
        test: {}
    },
    autoSaveInterval: null,
    lastSaveTime: null,
    
    // Firebase Authentication State
    isAuthenticated: false,
    currentUser: null,
    userRole: null,
    isFirebaseReady: false,
    
    // Configuration
    config: appConfig,
    
    // Debug system
    debug: unifiedDebugSystem
};

// Audio recording management with enhanced error handling
class AudioRecorderManager {
    constructor() {
        this.recorders = new Map();
        this.supportedFormats = appConfig.get('recording.supportedFormats', ['audio/webm']);
        this.maxDuration = appConfig.get('recording.maxDuration', 120);
        this.maxFileSize = appConfig.get('recording.maxFileSize', 50 * 1024 * 1024);
    }
    
    /**
     * Initialize all audio recorders
     */
    init() {
        const recordingSections = document.querySelectorAll('.recording-section');
        
        recordingSections.forEach(section => {
            const sectionId = section.getAttribute('data-section');
            const mode = section.getAttribute('data-mode') || 'normal';
            const recorder = new SecureAudioRecorder(section, sectionId, mode);
            this.recorders.set(sectionId, recorder);
        });
        
        appState.debug.logger.log('audio', 'info', `Initialized ${this.recorders.size} audio recorders`);
    }
    
    /**
     * Get recorder by section ID
     */
    getRecorder(sectionId) {
        return this.recorders.get(sectionId);
    }
    
    /**
     * Get all recorders for a specific mode
     */
    getRecordersByMode(mode) {
        return Array.from(this.recorders.values()).filter(recorder => recorder.mode === mode);
    }
    
    /**
     * Reset all recordings
     */
    resetAll() {
        this.recorders.forEach(recorder => recorder.reset());
        appState.debug.logger.log('audio', 'info', 'All recorders reset');
    }
    
    /**
     * Get recording statistics
     */
    getStatistics() {
        const stats = {
            total: this.recorders.size,
            active: 0,
            recorded: 0,
            totalDuration: 0,
            totalSize: 0
        };
        
        this.recorders.forEach(recorder => {
            if (recorder.isRecording) stats.active++;
            if (recorder.hasRecording()) stats.recorded++;
            if (recorder.hasRecording()) {
                stats.totalDuration += recorder.getDuration();
                stats.totalSize += recorder.getFileSize();
            }
        });
        
        return stats;
    }
}

/**
 * Secure Audio Recorder with enhanced validation
 */
class SecureAudioRecorder {
    constructor(sectionElement, sectionId, mode = 'normal') {
        this.section = sectionElement;
        this.sectionId = sectionId;
        this.mode = mode;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this.startTime = null;
        this.pausedTime = 0;
        this.timerInterval = null;
        this.audioBlob = null;
        this.isRecording = false;
        
        // Configuration from appConfig
        this.maxDuration = appConfig.get('recording.maxDuration', 120) * 1000; // Convert to ms
        this.maxFileSize = appConfig.get('recording.maxFileSize', 50 * 1024 * 1024);
        this.supportedFormats = appConfig.get('recording.supportedFormats', ['audio/webm']);
        
        this.initElements();
        this.initEventListeners();
    }
    
    initElements() {
        this.statusBadge = this.section.querySelector('.status-badge');
        this.timer = this.section.querySelector('.timer');
        this.recordedBadge = this.section.querySelector('.recorded-badge');
        this.btnRecord = this.section.querySelector('.btn-record');
        this.btnPause = this.section.querySelector('.btn-pause');
        this.btnStop = this.section.querySelector('.btn-stop');
        this.btnReplay = this.section.querySelector('.btn-replay');
        this.btnDelete = this.section.querySelector('.btn-delete');
        this.audioPlayer = this.section.querySelector('.audio-player');
        
        if (!this.statusBadge || !this.timer || !this.btnRecord) {
            console.error(`Required elements not found for section: ${this.sectionId}`);
        }
    }
    
    initEventListeners() {
        if (this.btnRecord) {
            this.btnRecord.addEventListener('click', () => this.startRecording());
        }
        if (this.btnPause) {
            this.btnPause.addEventListener('click', () => this.pauseRecording());
        }
        if (this.btnStop) {
            this.btnStop.addEventListener('click', () => this.stopRecording());
        }
        if (this.btnReplay) {
            this.btnReplay.addEventListener('click', () => this.replayRecording());
        }
        if (this.btnDelete) {
            this.btnDelete.addEventListener('click', () => this.deleteRecording());
        }
    }
    
    /**
     * Start recording with validation
     */
    async startRecording() {
        try {
            // Validate browser support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Your browser does not support audio recording');
            }
            
            // Check if already recording
            if (this.isRecording) {
                appState.debug.logger.log('audio', 'warn', 'Recording already in progress');
                return;
            }
            
            this.updateStatus('loading', '⏳ Accessing microphone...');
            this.setButtonState({ recording: true });
            
            // Request microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100,
                    channelCount: 1
                }
            });
            
            const mimeType = this.getSupportedMimeType();
            if (!mimeType) {
                throw new Error('No supported audio format found');
            }
            
            this.setupMediaRecorder(mimeType);
            this.isRecording = true;
            this.startTime = Date.now() - this.pausedTime;
            this.startTimer();
            
            this.updateStatus('recording', '🔴 Recording');
            appState.debug.logger.log('audio', 'info', `Started recording section: ${this.sectionId}`, {
                format: mimeType,
                duration: `${this.maxDuration / 1000}s`
            });
            
        } catch (error) {
            console.error('Recording start error:', error);
            this.handleRecordingError(error);
            this.resetRecording();
        }
    }
    
    /**
     * Setup MediaRecorder with error handling
     */
    setupMediaRecorder(mimeType) {
        const options = { 
            mimeType, 
            audioBitsPerSecond: 128000 
        };
        
        this.mediaRecorder = new MediaRecorder(this.stream, options);
        this.audioChunks = [];
        
        this.mediaRecorder.addEventListener('dataavailable', (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        });
        
        this.mediaRecorder.addEventListener('stop', () => {
            this.audioBlob = new Blob(this.audioChunks, { type: mimeType });
            this.setupAudioPlayer();
            this.updateRecordedState();
            this.isRecording = false;
            
            appState.debug.logger.log('audio', 'info', `Recording completed: ${this.sectionId}`, {
                size: `${(this.audioBlob.size / 1024 / 1024).toFixed(2)}MB`,
                duration: `${this.getDuration()}s`
            });
        });
        
        this.mediaRecorder.addEventListener('error', (event) => {
            const error = event.error || new Error('MediaRecorder error');
            appState.debug.logger.log('audio', 'error', 'MediaRecorder error', { error: error.message });
            this.handleRecordingError(error);
            this.resetRecording();
        });
        
        // Start recording
        this.mediaRecorder.start(1000);
    }
    
    /**
     * Handle recording errors with user-friendly messages
     */
    handleRecordingError(error) {
        let errorMessage = 'Recording error occurred';
        let userMessage = 'An error occurred during recording';
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMessage = 'Microphone access denied';
            userMessage = 'Microphone access denied. Please allow microphone access and try again.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            errorMessage = 'No microphone found';
            userMessage = 'No microphone detected. Please connect a microphone and try again.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            errorMessage = 'Microphone in use';
            userMessage = 'Microphone is already in use. Please close other applications using the microphone.';
        } else if (error.name === 'OverconstrainedError') {
            errorMessage = 'Microphone constraints not supported';
            userMessage = 'Your microphone does not support the required audio settings.';
        } else if (error.message) {
            errorMessage = error.message;
            userMessage = error.message;
        }
        
        appState.debug.logger.log('audio', 'error', errorMessage, { error: error.name, details: error.message });
        
        // Show user-friendly error (this would integrate with your existing Toast system)
        if (typeof Toast !== 'undefined') {
            Toast.error(userMessage, 'Recording Error');
        } else {
            alert(userMessage);
        }
    }
    
    /**
     * Pause/resume recording
     */
    pauseRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause();
            this.pausedTime = Date.now() - this.startTime;
            this.stopTimer();
            this.updateStatus('paused', '⏸️ Paused');
            this.btnPause.textContent = '▶️ Resume';
            
        } else if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume();
            this.startTime = Date.now() - this.pausedTime;
            this.startTimer();
            this.updateStatus('recording', '🔴 Recording');
            this.btnPause.textContent = '⏸️ Pause';
        }
    }
    
    /**
     * Stop recording
     */
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.stopTimer();
            
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
            
            this.updateStatus('ready', 'Ready');
            this.setButtonState({ recorded: true });
            
            if ('vibrate' in navigator) {
                navigator.vibrate(200);
            }
        }
    }
    
    /**
     * Setup audio player
     */
    setupAudioPlayer() {
        if (this.audioBlob) {
            const audioUrl = URL.createObjectURL(this.audioBlob);
            this.audioPlayer.src = audioUrl;
            this.audioPlayer.classList.remove('hidden');
        }
    }
    
    /**
     * Replay recording
     */
    replayRecording() {
        if (this.audioPlayer && this.audioPlayer.src) {
            this.audioPlayer.currentTime = 0;
            this.audioPlayer.play();
            appState.debug.logger.log('audio', 'debug', `Replaying recording: ${this.sectionId}`);
        }
    }
    
    /**
     * Delete recording
     */
    deleteRecording() {
        if (confirm('⚠️ Are you sure you want to delete this recording?')) {
            this.resetRecording();
            appState.debug.logger.log('audio', 'info', `Recording deleted: ${this.sectionId}`);
        }
    }
    
    /**
     * Reset recording state
     */
    resetRecording() {
        // Stop any active recording
        if (this.mediaRecorder && this.isRecording) {
            this.stopRecording();
        }
        
        // Clean up resources
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        // Reset state
        this.audioBlob = null;
        this.audioChunks = [];
        this.pausedTime = 0;
        this.isRecording = false;
        this.timer.textContent = '00:00';
        this.audioPlayer.src = '';
        this.audioPlayer.classList.add('hidden');
        this.stopTimer();
        
        // Reset UI
        this.updateStatus('ready', '⚪ Ready');
        this.setButtonState({ reset: true });
        this.recordedBadge.classList.add('hidden');
        this.section.classList.remove('recorded', 'is-recording', 'is-paused');
        
        appState.debug.logger.log('audio', 'debug', `Recording reset: ${this.sectionId}`);
    }
    
    /**
     * Start recording timer
     */
    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            
            this.timer.textContent = 
                `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
            
            // Check duration limit
            if (elapsed >= this.maxDuration) {
                appState.debug.logger.log('audio', 'warn', `Max duration reached: ${this.sectionId}`);
                this.stopRecording();
                if (typeof Toast !== 'undefined') {
                    Toast.info('Maximum duration reached. Recording stopped.', 'Duration Limit', 5000);
                }
            }
        }, 1000);
    }
    
    /**
     * Stop recording timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    /**
     * Update status badge
     */
    updateStatus(status, text) {
        if (this.statusBadge) {
            this.statusBadge.setAttribute('data-status', status);
            this.statusBadge.textContent = text;
        }
    }
    
    /**
     * Set button states
     */
    setButtonState(state) {
        if (state.recording) {
            this.btnRecord?.classList.add('hidden');
            this.btnPause?.classList.remove('hidden');
            this.btnStop?.classList.remove('hidden');
        } else if (state.recorded) {
            this.btnRecord?.classList.add('hidden');
            this.btnPause?.classList.add('hidden');
            this.btnStop?.classList.add('hidden');
            this.btnReplay?.classList.remove('hidden');
            this.btnDelete?.classList.remove('hidden');
            this.recordedBadge?.classList.remove('hidden');
            this.section?.classList.add('recorded');
        } else if (state.reset) {
            this.btnRecord?.classList.remove('hidden');
            this.btnPause?.classList.add('hidden');
            this.btnStop?.classList.add('hidden');
            this.btnReplay?.classList.add('hidden');
            this.btnDelete?.classList.add('hidden');
            this.recordedBadge?.classList.add('hidden');
            this.section?.classList.remove('recorded', 'is-recording', 'is-paused');
        }
    }
    
    /**
     * Update recorded state
     */
    updateRecordedState() {
        this.setButtonState({ recorded: true });
        updateSectionCount();
    }
    
    /**
     * Get supported MIME type
     */
    getSupportedMimeType() {
        for (const type of this.supportedFormats) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return '';
    }
    
    /**
     * Convert audio to base64
     */
    async getBase64Audio() {
        if (!this.audioBlob) return null;
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(this.audioBlob);
        });
    }
    
    /**
     * Get audio format
     */
    getAudioFormat() {
        if (!this.audioBlob) return 'webm';
        
        const type = this.audioBlob.type;
        if (type.includes('webm')) return 'webm';
        if (type.includes('ogg')) return 'ogg';
        if (type.includes('mp4')) return 'mp4';
        if (type.includes('mpeg')) return 'mp3';
        if (type.includes('wav')) return 'wav';
        return 'webm';
    }
    
    /**
     * Get MIME type
     */
    getMimeType() {
        return this.audioBlob ? this.audioBlob.type : 'audio/webm';
    }
    
    /**
     * Check if has recording
     */
    hasRecording() {
        return this.audioBlob !== null && this.audioBlob.size > 0;
    }
    
    /**
     * Get recording duration
     */
    getDuration() {
        if (!this.audioBlob) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
    
    /**
     * Get file size
     */
    getFileSize() {
        return this.audioBlob ? this.audioBlob.size : 0;
    }
    
    /**
     * Validate recording
     */
    validateRecording() {
        if (!this.hasRecording()) {
            return { valid: false, error: 'No recording available' };
        }
        
        if (this.audioBlob.size > this.maxFileSize) {
            return { valid: false, error: 'File too large' };
        }
        
        if (this.audioBlob.size === 0) {
            return { valid: false, error: 'Empty recording' };
        }
        
        return { valid: true, error: null };
    }
}

// Initialize audio recorder manager
const audioRecorderManager = new AudioRecorderManager();

// ===== APPLICATION INITIALIZATION =====
async function initializeApplication() {
    try {
        console.log('🚀 Initializing DictaMed...');
        
        // Initialize Firebase securely
        await initializeFirebase();
        
        // Initialize core systems
        Toast.init(); // Assuming Toast exists
        AutoSave.init();
        
        // Initialize application components
        initializeComponents();
        
        // Set up authentication
        setupAuthentication();
        
        console.log('✅ DictaMed initialized successfully!');
        
    } catch (error) {
        console.error('❌ Application initialization failed:', error);
        
        // Show error to user
        if (typeof Toast !== 'undefined') {
            Toast.error('Application failed to load. Please refresh the page.', 'Initialization Error');
        } else {
            alert('Application failed to load. Please refresh the page.');
        }
    }
}

/**
 * Initialize all application components
 */
function initializeComponents() {
    initTabs();
    initCharCounters();
    initOptionalSection();
    initAudioRecorders();
    initDMIPhotosUpload();
    initSwipeHint();
    
    updateSectionCount();
    validateDMIMode();
    
    // Set up event listeners
    setupEventListeners();
    
    appState.debug.logger.log('app', 'info', 'All components initialized');
}

/**
 * Initialize tabs navigation
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
}

/**
 * Switch between tabs
 */
function switchTab(tabId) {
    // Deactivate all tabs and content
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Activate selected tab and content
    const tabBtn = document.querySelector(`[data-tab="${tabId}"]`);
    const tabContent = document.getElementById(tabId);
    
    if (tabBtn) {
        tabBtn.classList.add('active');
        tabBtn.setAttribute('aria-selected', 'true');
    }
    if (tabContent) {
        tabContent.classList.add('active');
    }
    
    // Update current mode
    if (tabId === 'mode-normal') {
        appState.currentMode = 'normal';
    } else if (tabId === 'mode-test') {
        appState.currentMode = 'test';
    } else if (tabId === 'mode-dmi') {
        appState.currentMode = 'dmi';
    }
    
    updateSectionCount();
    
    appState.debug.logger.log('ui', 'debug', `Switched to tab: ${tabId}`);
}

// Make switchTab global for CTA buttons
window.switchTab = switchTab;

/**
 * Initialize character counters
 */
function initCharCounters() {
    const inputs = [
        { id: 'numeroDossier', counterId: 'numeroDossierCounter' },
        { id: 'nomPatient', counterId: 'nomPatientCounter' },
        { id: 'numeroDossierTest', counterId: 'numeroDossierTestCounter' },
        { id: 'nomPatientTest', counterId: 'nomPatientTestCounter' },
        { id: 'numeroDossierDMI', counterId: 'numeroDossierDMICounter' },
        { id: 'nomPatientDMI', counterId: 'nomPatientDMICounter' }
    ];
    
    inputs.forEach(({ id, counterId }) => {
        const input = document.getElementById(id);
        const counter = document.getElementById(counterId);
        
        if (input && counter) {
            input.addEventListener('input', () => {
                const length = input.value.length;
                const maxLength = input.maxLength || 50;
                counter.textContent = `${length}/${maxLength}`;
                
                counter.classList.remove('warning', 'danger');
                if (length >= maxLength) {
                    counter.classList.add('danger');
                } else if (length >= maxLength * 0.8) {
                    counter.classList.add('warning');
                }
                
                // Validation for DMI mode
                if (id === 'numeroDossierDMI') {
                    validateDMIMode();
                }
            });
        }
    });
    
    // Counter for DMI textarea
    const dmiTexteLibre = document.getElementById('dmiTexteLibre');
    const dmiTexteLibreCounter = document.getElementById('dmiTexteLibreCounter');
    if (dmiTexteLibre && dmiTexteLibreCounter) {
        dmiTexteLibre.addEventListener('input', () => {
            const length = dmiTexteLibre.value.length;
            dmiTexteLibreCounter.textContent = length;
            
            // Warn if approaching limit
            if (length >= appConfig.get('dmi.maxTextLength', 50000) * 0.9) {
                dmiTexteLibreCounter.style.color = 'var(--red)';
            } else {
                dmiTexteLibreCounter.style.color = 'var(--gray-medium)';
            }
        });
    }
}

/**
 * Initialize optional section toggle
 */
function initOptionalSection() {
    const toggleBtn = document.getElementById('togglePartie4');
    const partie4 = document.querySelector('[data-section="partie4"]');
    
    if (toggleBtn && partie4) {
        toggleBtn.addEventListener('click', () => {
            partie4.classList.toggle('hidden');
            toggleBtn.textContent = partie4.classList.contains('hidden')
                ? 'Show Part 4 (optional)'
                : 'Hide Part 4';
        });
    }
}

/**
 * Initialize audio recorders
 */
function initAudioRecorders() {
    audioRecorderManager.init();
}

/**
 * Initialize DMI photos upload
 */
function initDMIPhotosUpload() {
    const photosInput = document.getElementById('dmiPhotosUpload');
    const photosPreview = document.getElementById('dmiPhotosPreview');
    
    if (!photosInput || !photosPreview) return;
    
    const maxPhotos = appConfig.get('dmi.maxPhotos', 5);
    const maxPhotoSize = appConfig.get('dmi.maxPhotoSize', 10 * 1024 * 1024);
    const supportedTypes = appConfig.get('dmi.supportedImageTypes', ['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    
    let uploadedPhotos = [];
    
    photosInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        
        // Validate quantity
        if (uploadedPhotos.length + files.length > maxPhotos) {
            if (typeof Toast !== 'undefined') {
                Toast.warning(`Maximum ${maxPhotos} photos allowed.`, 'Limit Reached');
            }
            return;
        }
        
        files.forEach(file => {
            // Validate file type
            if (!supportedTypes.includes(file.type)) {
                if (typeof Toast !== 'undefined') {
                    Toast.error(`"${file.name}" is not a supported image format.`, 'Unsupported Format');
                }
                return;
            }
            
            // Validate file size
            if (file.size > maxPhotoSize) {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                if (typeof Toast !== 'undefined') {
                    Toast.error(`"${file.name}" is too large (${sizeMB} MB).`, 'File Too Large');
                }
                return;
            }
            
            uploadedPhotos.push(file);
        });
        
        photosInput.value = '';
        updatePhotosPreview();
    });
    
    function updatePhotosPreview() {
        photosPreview.innerHTML = '';
        
        uploadedPhotos.forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item';
                
                photoItem.innerHTML = `
                    <img src="${e.target.result}" alt="Photo ${index + 1}">
                    <button class="photo-item-remove" data-index="${index}" title="Remove">×</button>
                    <div class="photo-item-info">${file.name}</div>
                `;
                
                photosPreview.appendChild(photoItem);
                
                const removeBtn = photoItem.querySelector('.photo-item-remove');
                removeBtn.addEventListener('click', () => {
                    uploadedPhotos.splice(index, 1);
                    updatePhotosPreview();
                });
            };
            
            reader.readAsDataURL(file);
        });
        
        appState.debug.logger.log('dmi', 'debug', 'Photos preview updated', {
            count: uploadedPhotos.length
        });
    }
}

/**
 * Initialize swipe hint
 */
function initSwipeHint() {
    const tabsContainer = document.querySelector('.tabs-container');
    const swipeHint = document.querySelector('.swipe-hint');
    
    if (tabsContainer && swipeHint) {
        let hasScrolled = false;
        
        tabsContainer.addEventListener('scroll', () => {
            if (!hasScrolled) {
                hasScrolled = true;
                swipeHint.style.animation = 'fadeOut 0.5s ease forwards';
                setTimeout(() => {
                    swipeHint.style.display = 'none';
                }, 500);
            }
        });
        
        // Hide after 10 seconds if no scroll
        setTimeout(() => {
            if (!hasScrolled && swipeHint) {
                swipeHint.style.animation = 'fadeOut 0.5s ease forwards';
                setTimeout(() => {
                    swipeHint.style.display = 'none';
                }, 500);
            }
        }, 10000);
    }
}

/**
 * Set up authentication system
 */
function setupAuthentication() {
    secureFirebaseAuth.onAuthStateChange((state, user) => {
        appState.debug.logger.log('auth', 'info', `Auth state changed: ${state}`);
        
        if (state === 'signed_in') {
            appState.isAuthenticated = true;
            appState.currentUser = user;
            appState.userRole = secureFirebaseAuth.getCurrentUserRole();
            updateAuthUI();
            saveAuthState();
        } else if (state === 'signed_out') {
            appState.isAuthenticated = false;
            appState.currentUser = null;
            appState.userRole = null;
            updateAuthUI();
            clearAuthState();
        }
    });
}

/**
 * Update UI based on authentication state
 */
function updateAuthUI() {
    const authSection = document.querySelector('.auth-card');
    const profileSection = document.getElementById('userProfileSection');
    
    if (appState.isAuthenticated) {
        // Hide auth section
        if (authSection) {
            authSection.style.display = 'none';
        }
        
        // Show user profile
        if (profileSection) {
            profileSection.style.display = 'block';
            updateUserProfileInfo();
        }
    } else {
        // Show auth section
        if (authSection) {
            authSection.style.display = 'block';
        }
        
        // Hide user profile
        if (profileSection) {
            profileSection.style.display = 'none';
        }
    }
}

/**
 * Update user profile information
 */
function updateUserProfileInfo() {
    const profileDisplayName = document.getElementById('profileDisplayName');
    const profileEmail = document.getElementById('profileEmail');
    const profileRole = document.getElementById('profileRole');
    
    if (appState.currentUser) {
        if (profileDisplayName) {
            profileDisplayName.textContent = appState.currentUser.displayName || 'Not specified';
        }
        if (profileEmail) {
            profileEmail.textContent = appState.currentUser.email;
        }
        if (profileRole) {
            profileRole.textContent = appState.userRole === 'admin' ? 'Administrator' : 'User';
        }
    }
}

/**
 * Save authentication state
 */
function saveAuthState() {
    try {
        const authData = {
            isAuthenticated: appState.isAuthenticated,
            userId: appState.currentUser?.uid,
            userEmail: appState.currentUser?.email,
            userDisplayName: appState.currentUser?.displayName,
            userRole: appState.userRole,
            timestamp: Date.now()
        };
        
        localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.AUTH_STATE, JSON.stringify(authData));
    } catch (error) {
        appState.debug.logger.log('auth', 'error', 'Failed to save auth state', { error: error.message });
    }
}

/**
 * Clear authentication state
 */
function clearAuthState() {
    try {
        localStorage.removeItem(APP_CONSTANTS.STORAGE_KEYS.AUTH_STATE);
        // Clear rate limiting for the user
        secureFirebaseAuth.clearUserCache();
    } catch (error) {
        appState.debug.logger.log('auth', 'error', 'Failed to clear auth state', { error: error.message });
    }
}

/**
 * Check authentication requirement for current mode
 */
function checkAuthenticationRequirement() {
    const mode = appState.currentMode;
    const requiresAuth = appConfig.get(`auth.requiredFor${mode.charAt(0).toUpperCase() + mode.slice(1)}Mode`, false);
    
    if (requiresAuth && !appState.isAuthenticated) {
        if (typeof Toast !== 'undefined') {
            Toast.error('Authentication required for this section. Please sign in.', 'Authentication Required');
        }
        
        // Show login modal (this would integrate with your existing auth system)
        if (typeof authComponents !== 'undefined' && authComponents.showModal) {
            authComponents.showModal('loginModal');
        }
        return false;
    }
    
    return true;
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Submit buttons
    const submitNormalBtn = document.getElementById('submitNormal');
    const submitTestBtn = document.getElementById('submitTest');
    const submitDmiBtn = document.getElementById('submitDMI');
    
    if (submitNormalBtn) {
        submitNormalBtn.addEventListener('click', async () => {
            if (!checkAuthenticationRequirement()) return;
            Loading.show('Sending data...');
            await sendData('normal');
            Loading.hide();
        });
    }
    
    if (submitTestBtn) {
        submitTestBtn.addEventListener('click', async () => {
            Loading.show('Sending test data...');
            await sendData('test');
            Loading.hide();
        });
    }
    
    if (submitDmiBtn) {
        submitDmiBtn.addEventListener('click', async () => {
            if (!checkAuthenticationRequirement()) return;
            Loading.show('Sending DMI data...');
            await sendDmiData();
            Loading.hide();
        });
    }
    
    // Authentication buttons
    setupAuthButtons();
}

/**
 * Set up authentication buttons
 */
function setupAuthButtons() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const showMigrationBtn = document.getElementById('showMigrationBtn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            appState.debug.logger.log('ui', 'debug', 'Login button clicked');
            
            if (typeof authComponents !== 'undefined' && authComponents.showModal) {
                authComponents.showModal('loginModal');
            } else {
                appState.debug.logger.log('auth', 'error', 'Auth components not available');
            }
        });
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            appState.debug.logger.log('ui', 'debug', 'Register button clicked');
            
            if (typeof authComponents !== 'undefined' && authComponents.showModal) {
                authComponents.showModal('registerModal');
            } else {
                appState.debug.logger.log('auth', 'error', 'Auth components not available');
            }
        });
    }
    
    if (showMigrationBtn) {
        showMigrationBtn.addEventListener('click', (e) => {
            e.preventDefault();
            appState.debug.logger.log('ui', 'debug', 'Migration button clicked');
            
            if (typeof authComponents !== 'undefined' && authComponents.showModal) {
                authComponents.showModal('migrationModal');
            } else {
                appState.debug.logger.log('auth', 'error', 'Auth components not available');
            }
        });
    }
}

/**
 * Update section count display
 */
function updateSectionCount() {
    const mode = appState.currentMode;
    const sections = getSectionsForMode(mode);
    
    if (!sections) return;
    
    let count = 0;
    sections.forEach(sectionId => {
        const recorder = audioRecorderManager.getRecorder(sectionId);
        if (recorder && recorder.hasRecording()) {
            count++;
        }
    });
    
    // Update display for current mode
    const countElement = document.querySelector(`.sections-count[data-mode="${mode}"]`);
    if (countElement) {
        countElement.textContent = `${count} section(s) recorded`;
    }
    
    // Enable/disable submit button
    const submitBtn = getSubmitButtonForMode(mode);
    if (submitBtn) {
        submitBtn.disabled = count === 0;
    }
    
    appState.debug.logger.log('ui', 'debug', `Updated section count for ${mode}`, { count });
}

/**
 * Get sections for a specific mode
 */
function getSectionsForMode(mode) {
    const sectionsConfig = {
        normal: ['partie1', 'partie2', 'partie3', 'partie4'],
        test: ['clinique', 'antecedents', 'biologie'],
        dmi: [] // DMI mode doesn't use audio sections
    };
    
    return sectionsConfig[mode];
}

/**
 * Get submit button for a specific mode
 */
function getSubmitButtonForMode(mode) {
    const buttonMap = {
        normal: 'submitNormal',
        test: 'submitTest',
        dmi: 'submitDMI'
    };
    
    return document.getElementById(buttonMap[mode]);
}

/**
 * Send data with enhanced error handling
 */
async function sendData(mode) {
    try {
        appState.debug.logger.log('data', 'info', `Starting data send for mode: ${mode}`);
        
        const submitBtn = getSubmitButtonForMode(mode);
        if (!submitBtn) {
            appState.debug.logger.log('data', 'error', `Submit button not found for mode: ${mode}`);
            return;
        }
        
        // Update button state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        // Validate form and prepare payload
        const payload = await preparePayload(mode);
        if (!payload) {
            const errorMsg = mode === 'normal'
                ? 'Please fill all required fields and record at least one section.'
                : 'Please fill patient number and name, and record at least one section.';
            
            if (typeof Toast !== 'undefined') {
                Toast.warning(errorMsg, 'Missing Information');
            }
            return;
        }
        
        // Check for recordings
        const hasRecordings = Object.keys(payload.sections || {}).length > 0;
        if (!hasRecordings) {
            if (typeof Toast !== 'undefined') {
                Toast.warning('Please record at least one section.', 'No Recordings');
            }
            return;
        }
        
        // Get endpoint
        const endpoint = appConfig.get(`endpoints.${mode.toUpperCase()}`);
        if (!endpoint) {
            throw new Error(`No endpoint configured for mode: ${mode}`);
        }
        
        appState.debug.logger.log('network', 'info', 'Sending data to endpoint', { 
            endpoint, 
            mode,
            sections: Object.keys(payload.sections).length
        });
        
        // Send data with timeout
        const timeout = appConfig.get('recording.requestTimeout', 30000);
        const response = await Promise.race([
            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), timeout)
            )
        ]);
        
        if (response.ok) {
            appState.debug.logger.log('data', 'success', 'Data sent successfully');
            
            if (typeof Toast !== 'undefined') {
                Toast.success('Data sent successfully!', 'Success');
            }
            
            if (mode === 'test') {
                showGoogleSheetResult();
            } else {
                resetForm(mode);
                AutoSave.clear();
            }
        } else {
            throw new Error(`Server error: ${response.status}`);
        }
        
    } catch (error) {
        appState.debug.logger.log('data', 'error', 'Data send failed', { 
            error: error.message,
            mode 
        });
        
        if (typeof Toast !== 'undefined') {
            if (error.message.includes('timeout')) {
                Toast.error('Request timed out. Please try again.', 'Timeout');
            } else if (error.message.includes('fetch')) {
                Toast.error('Unable to connect to server.', 'Network Error');
            } else {
                Toast.error(`Error: ${error.message}`, 'Send Error');
            }
        }
    } finally {
        const submitBtn = getSubmitButtonForMode(mode);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = mode === 'normal' ? 'Send Data' : 'Send Test Data';
        }
    }
}

/**
 * Prepare data payload with validation
 */
async function preparePayload(mode) {
    const payload = {
        mode: mode,
        recordedAt: new Date().toISOString(),
        sections: {}
    };
    
    try {
        if (mode === 'normal') {
            // Validate authentication
            if (!appState.isAuthenticated) {
                appState.debug.logger.log('data', 'error', 'User not authenticated');
                return null;
            }
            
            // Get form data
            const numeroDossier = document.getElementById('numeroDossier')?.value.trim();
            const nomPatient = document.getElementById('nomPatient')?.value.trim();
            
            if (!numeroDossier || !nomPatient) {
                appState.debug.logger.log('data', 'warn', 'Missing required fields', {
                    numeroDossier: !!numeroDossier,
                    nomPatient: !!nomPatient
                });
                return null;
            }
            
            // Add user information
            payload.userId = appState.currentUser.uid;
            payload.userEmail = appState.currentUser.email;
            payload.userDisplayName = appState.currentUser.displayName;
            payload.userRole = appState.userRole;
            payload.NumeroDeDossier = numeroDossier;
            payload.NomDuPatient = nomPatient;
            
            // Process audio sections
            const sections = ['partie1', 'partie2', 'partie3', 'partie4'];
            let index = 0;
            let hasValidRecording = false;
            
            for (const sectionId of sections) {
                const recorder = audioRecorderManager.getRecorder(sectionId);
                if (recorder && recorder.hasRecording()) {
                    try {
                        const validation = recorder.validateRecording();
                        if (!validation.valid) {
                            appState.debug.logger.log('data', 'warn', `Invalid recording in ${sectionId}`, {
                                error: validation.error
                            });
                            continue;
                        }
                        
                        index++;
                        const base64 = await recorder.getBase64Audio();
                        const format = recorder.getAudioFormat();
                        const mimeType = recorder.getMimeType();
                        
                        if (!base64 || base64.length === 0) {
                            appState.debug.logger.log('data', 'warn', `Empty base64 for ${sectionId}`);
                            continue;
                        }
                        
                        payload.sections[sectionId] = {
                            audioBase64: base64,
                            fileName: `msgVocal${index}.${format}`,
                            mimeType: mimeType,
                            format: format,
                            sectionName: sectionId,
                            fileSize: recorder.getFileSize()
                        };
                        
                        hasValidRecording = true;
                        appState.debug.logger.log('data', 'debug', `Added section: ${sectionId}`, {
                            size: `${(recorder.getFileSize() / 1024).toFixed(1)}KB`,
                            format
                        });
                        
                    } catch (sectionError) {
                        appState.debug.logger.log('data', 'error', `Error processing section ${sectionId}`, {
                            error: sectionError.message
                        });
                    }
                }
            }
            
            if (!hasValidRecording) {
                appState.debug.logger.log('data', 'warn', 'No valid recordings found');
                return null;
            }
            
        } else {
            // Test mode validation
            const numeroDossier = document.getElementById('numeroDossierTest')?.value.trim();
            const nomPatient = document.getElementById('nomPatientTest')?.value.trim();
            
            if (!numeroDossier || !nomPatient) {
                return null;
            }
            
            payload.NumeroDeDossier = numeroDossier;
            payload.NomDuPatient = nomPatient;
            
            // Process audio sections for test mode
            const sections = ['clinique', 'antecedents', 'biologie'];
            let index = 0;
            let hasValidRecording = false;
            
            for (const sectionId of sections) {
                const recorder = audioRecorderManager.getRecorder(sectionId);
                if (recorder && recorder.hasRecording()) {
                    try {
                        const validation = recorder.validateRecording();
                        if (!validation.valid) continue;
                        
                        index++;
                        const base64 = await recorder.getBase64Audio();
                        const format = recorder.getAudioFormat();
                        const mimeType = recorder.getMimeType();
                        
                        if (!base64 || base64.length === 0) continue;
                        
                        payload.sections[sectionId] = {
                            audioBase64: base64,
                            fileName: `msgVocal${index}.${format}`,
                            mimeType: mimeType,
                            format: format,
                            sectionName: sectionId,
                            fileSize: recorder.getFileSize()
                        };
                        
                        hasValidRecording = true;
                    } catch (sectionError) {
                        appState.debug.logger.log('data', 'error', `Error processing test section ${sectionId}`, {
                            error: sectionError.message
                        });
                    }
                }
            }
            
            if (!hasValidRecording) return null;
        }
        
        if (Object.keys(payload.sections).length === 0) {
            appState.debug.logger.log('data', 'warn', 'No sections in payload');
            return null;
        }
        
        appState.debug.logger.log('data', 'info', 'Payload prepared successfully', {
            mode,
            sectionsCount: Object.keys(payload.sections).length,
            hasUser: !!payload.userId
        });
        
        return payload;
        
    } catch (error) {
        appState.debug.logger.log('data', 'error', 'Payload preparation failed', {
            error: error.message,
            mode
        });
        return null;
    }
}

/**
 * Show Google Sheet result for test mode
 */
function showGoogleSheetResult() {
    const googleSheetCard = document.getElementById('googleSheetCard');
    if (googleSheetCard) {
        googleSheetCard.style.display = 'block';
        googleSheetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        appState.debug.logger.log('ui', 'info', 'Google Sheet result displayed');
        
        setTimeout(() => {
            if (typeof Toast !== 'undefined') {
                Toast.info('Check the Google Sheet to see your data.', 'Results Available', 8000);
            }
        }, 1000);
    }
}

/**
 * Reset form after successful submission
 */
function resetForm(mode) {
    if (mode === 'normal') {
        // Reset patient info fields
        document.getElementById('numeroDossier').value = '';
        document.getElementById('nomPatient').value = '';
        
        // Reset counters
        ['numeroDossierCounter', 'nomPatientCounter'].forEach(counterId => {
            const counter = document.getElementById(counterId);
            if (counter) counter.textContent = '0/50';
        });
        
        // Reset all audio recordings
        const sections = ['partie1', 'partie2', 'partie3', 'partie4'];
        sections.forEach(sectionId => {
            const recorder = audioRecorderManager.getRecorder(sectionId);
            if (recorder && recorder.hasRecording()) {
                recorder.resetRecording();
            }
        });
        
    } else if (mode === 'test') {
        // Reset test form
        document.getElementById('numeroDossierTest').value = '';
        document.getElementById('nomPatientTest').value = '';
        
        ['numeroDossierTestCounter', 'nomPatientTestCounter'].forEach(counterId => {
            const counter = document.getElementById(counterId);
            if (counter) counter.textContent = '0/50';
        });
        
        const sections = ['clinique', 'antecedents', 'biologie'];
        sections.forEach(sectionId => {
            const recorder = audioRecorderManager.getRecorder(sectionId);
            if (recorder && recorder.hasRecording()) {
                recorder.resetRecording();
            }
        });
        
        // Hide Google Sheet result
        const googleSheetCard = document.getElementById('googleSheetCard');
        if (googleSheetCard) {
            googleSheetCard.style.display = 'none';
        }
    }
    
    updateSectionCount();
    appState.debug.logger.log('ui', 'info', `Form reset for mode: ${mode}`);
}

/**
 * DMI mode functions
 */
function validateDMIMode() {
    const numeroDossier = document.getElementById('numeroDossierDMI')?.value.trim();
    const submitBtn = document.getElementById('submitDMI');
    
    if (submitBtn) {
        submitBtn.disabled = !numeroDossier;
    }
}

/**
 * Send DMI data
 */
async function sendDmiData() {
    try {
        appState.debug.logger.log('dmi', 'info', 'Starting DMI data send');
        
        const submitBtn = document.getElementById('submitDMI');
        if (!submitBtn) return;
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        // Get form data
        const numeroDossier = document.getElementById('numeroDossierDMI')?.value.trim();
        const nomPatient = document.getElementById('nomPatientDMI')?.value.trim();
        const dmiTexte = document.getElementById('dmiTexteLibre')?.value.trim();
        
        if (!numeroDossier) {
            if (typeof Toast !== 'undefined') {
                Toast.warning('Patient number is required.', 'Required Field');
            }
            return;
        }
        
        // Check content
        const photos = []; // This would contain the uploaded photos
        if (!dmiTexte && photos.length === 0) {
            if (typeof Toast !== 'undefined') {
                Toast.warning('Please enter text or add photos.', 'Content Required');
            }
            return;
        }
        
        // Prepare payload
        const payload = {
            mode: 'dmi',
            recordedAt: new Date().toISOString(),
            NumeroDeDossier: numeroDossier,
            NomDuPatient: nomPatient,
            dmiTexte: dmiTexte,
            photos: photos,
            
            // Add user information if authenticated
            userId: appState.isAuthenticated ? appState.currentUser.uid : null,
            userEmail: appState.isAuthenticated ? appState.currentUser.email : null,
            userDisplayName: appState.isAuthenticated ? appState.currentUser.displayName : null,
            userRole: appState.userRole
        };
        
        // Get DMI endpoint
        const endpoint = appConfig.get('endpoints.DMI');
        if (!endpoint) {
            throw new Error('DMI endpoint not configured');
        }
        
        appState.debug.logger.log('network', 'info', 'Sending DMI data', {
            endpoint,
            textLength: dmiTexte?.length || 0,
            photosCount: photos.length
        });
        
        const timeout = appConfig.get('recording.requestTimeout', 30000);
        const response = await Promise.race([
            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), timeout)
            )
        ]);
        
        if (response.ok) {
            appState.debug.logger.log('dmi', 'success', 'DMI data sent successfully');
            
            if (typeof Toast !== 'undefined') {
                Toast.success('DMI data sent successfully!', 'Success');
            }
            
            if (confirm('Reset DMI form?')) {
                resetDmiForm();
            }
        } else {
            throw new Error(`Server error: ${response.status}`);
        }
        
    } catch (error) {
        appState.debug.logger.log('dmi', 'error', 'DMI data send failed', { error: error.message });
        
        if (typeof Toast !== 'undefined') {
            if (error.message.includes('timeout')) {
                Toast.error('Request timed out. Please try again.', 'Timeout');
            } else {
                Toast.error('Unable to send data. Please try again.', 'Send Error');
            }
        }
    } finally {
        const submitBtn = document.getElementById('submitDMI');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send DMI Data';
        }
    }
}

/**
 * Reset DMI form
 */
function resetDmiForm() {
    document.getElementById('numeroDossierDMI').value = '';
    document.getElementById('nomPatientDMI').value = '';
    document.getElementById('dmiTexteLibre').value = '';
    document.getElementById('dmiTexteLibreCounter').textContent = '0';
    document.getElementById('numeroDossierDMICounter').textContent = '0/50';
    document.getElementById('nomPatientDMICounter').textContent = '0/100';
    
    // Reset photo upload
    document.getElementById('dmiPhotosUpload').value = '';
    const photosPreview = document.getElementById('dmiPhotosPreview');
    if (photosPreview) {
        photosPreview.innerHTML = '';
    }
    
    validateDMIMode();
    appState.debug.logger.log('dmi', 'info', 'DMI form reset');
}

/**
 * Auto-save functionality with configuration support
 */
const AutoSave = {
    indicator: null,
    debounceTimer: null,
    
    init() {
        if (!this.indicator) {
            this.indicator = document.createElement('div');
            this.indicator.className = 'autosave-indicator';
            this.indicator.innerHTML = '<div class="icon"></div><span class="text">Auto-save</span>';
            document.body.appendChild(this.indicator);
        }
        
        this.restore();
        this.startAutoSave();
    },
    
    save() {
        try {
            const mode = appState.currentMode;
            const data = {
                mode,
                timestamp: Date.now(),
                forms: {},
                userInfo: appState.isAuthenticated ? {
                    uid: appState.currentUser?.uid,
                    email: appState.currentUser?.email,
                    displayName: appState.currentUser?.displayName,
                    role: appState.userRole
                } : null
            };
            
            // Save form data for public modes
            const publicModes = appConfig.get('auth.publicModes', ['test']);
            if (publicModes.includes(mode)) {
                if (mode === 'test') {
                    data.forms = {
                        numeroDossierTest: document.getElementById('numeroDossierTest')?.value || '',
                        nomPatientTest: document.getElementById('nomPatientTest')?.value || ''
                    };
                }
            }
            
            localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.AUTOSAVE, JSON.stringify(data));
            appState.lastSaveTime = Date.now();
            
            this.showIndicator('saved');
            appState.debug.logger.log('autosave', 'debug', 'Auto-save completed');
            
        } catch (error) {
            appState.debug.logger.log('autosave', 'error', 'Auto-save failed', { error: error.message });
        }
    },
    
    restore() {
        try {
            const saved = localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.AUTOSAVE);
            if (!saved) return;
            
            const data = JSON.parse(saved);
            
            // Check if data is not too old (24 hours)
            const dayInMs = 24 * 60 * 60 * 1000;
            if (Date.now() - data.timestamp > dayInMs) {
                localStorage.removeItem(APP_CONSTANTS.STORAGE_KEYS.AUTOSAVE);
                return;
            }
            
            // Restore form data
            if (data.userInfo && appState.isAuthenticated) {
                if (data.mode === appState.currentMode && appConfig.get('auth.publicModes', []).includes(data.mode)) {
                    Object.entries(data.forms || {}).forEach(([key, value]) => {
                        const element = document.getElementById(key);
                        if (element && value) {
                            element.value = value;
                            element.dispatchEvent(new Event('input'));
                        }
                    });
                    
                    if (data.mode === 'test' && typeof Toast !== 'undefined') {
                        Toast.info('Session data restored', 'Resume');
                    }
                }
            }
            
        } catch (error) {
            appState.debug.logger.log('autosave', 'error', 'Auto-save restore failed', { error: error.message });
        }
    },
    
    startAutoSave() {
        const interval = appConfig.get('recording.autoSaveInterval', 30000);
        appState.autoSaveInterval = setInterval(() => this.save(), interval);
        
        // Add listeners for form inputs
        const publicInputs = document.querySelectorAll('#numeroDossierTest, #nomPatientTest');
        publicInputs.forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    clearTimeout(this.debounceTimer);
                    this.showIndicator('saving');
                    this.debounceTimer = setTimeout(() => this.save(), 2000);
                });
            }
        });
    },
    
    showIndicator(state) {
        if (!this.indicator) return;
        
        this.indicator.className = `autosave-indicator show ${state}`;
        
        setTimeout(() => {
            this.indicator.classList.remove('show');
        }, 2000);
    },
    
    clear() {
        localStorage.removeItem(APP_CONSTANTS.STORAGE_KEYS.AUTOSAVE);
        appState.debug.logger.log('autosave', 'info', 'Auto-save data cleared');
    }
};

/**
 * Loading overlay functionality
 */
const Loading = {
    overlay: null,
    
    show(text = 'Loading...') {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'loading-overlay';
            this.overlay.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <div class="loading-text">${text}</div>
                </div>
            `;
            
            // Ensure overlay doesn't block clicks when hidden
            this.overlay.style.pointerEvents = 'none';
            this.overlay.style.zIndex = '9998';
            
            document.body.appendChild(this.overlay);
            appState.debug.logger.log('ui', 'debug', 'Loading overlay shown', { text });
        }
    },
    
    hide() {
        if (this.overlay) {
            this.overlay.style.animation = 'fadeOut 0.2s ease forwards';
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                    this.overlay = null;
                    appState.debug.logger.log('ui', 'debug', 'Loading overlay hidden');
                }
            }, 200);
        }
    }
};

// ===== APPLICATION ENTRY POINT =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DictaMed Starting...');
    
    try {
        await initializeApplication();
        appState.debug.logger.log('app', 'success', 'DictaMed initialization complete');
    } catch (error) {
        appState.debug.logger.log('app', 'error', 'DictaMed initialization failed', {
            error: error.message,
            stack: error.stack
        });
    }
});

// Export for testing and debugging
if (typeof window !== 'undefined') {
    window.DictaMedApp = {
        appState,
        audioRecorderManager,
        sendData,
        sendDmiData,
        checkAuthenticationRequirement,
        generateDebugReport: () => appState.debug.generateFullReport(),
        getAppConfig: () => appConfig.export()
    };
    
    console.log('🛠️ DictaMed debug tools available');
    console.log('- DictaMedApp.generateDebugReport()');
    console.log('- DictaMedApp.getAppConfig()');
    console.log('- dictamedDebug.* (unified debug system)');
}