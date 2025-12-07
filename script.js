/**
 * DictaMed - Medical Dictation Application
 * Main JavaScript file with improved structure and organization
 * Version: 2.0.0 - Refactored for better maintainability
 */

// ===== APPLICATION CONSTANTS =====
const APP_CONFIG = {
    MAX_RECORDING_DURATION: 120, // 2 minutes in seconds
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    MAX_PHOTOS: 5,
    MAX_PHOTO_SIZE: 10 * 1024 * 1024, // 10MB
    AUTOSAVE_INTERVAL: 30000, // 30 seconds
    AUTOSAVE_RETENTION: 24 * 60 * 60 * 1000, // 24 hours
    TIMEOUT_DURATION: 30000, // 30 seconds
    MODES: {
        NORMAL: 'normal',
        TEST: 'test',
        DMI: 'dmi',
        HOME: 'home'
    },
    SECTIONS: {
        normal: ['partie1', 'partie2', 'partie3', 'partie4'],
        test: ['clinique', 'antecedents', 'biologie']
    },
    ENDPOINTS: {
        normal: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedNormalMode',
        test: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed',
        dmi: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed'
    },
    AUDIO_FORMATS: {
        PRIORITY: [
            'audio/mpeg',              // MP3
            'audio/mp4',               // M4A/AAC
            'audio/webm;codecs=opus',  // WebM Opus
            'audio/webm',              // WebM
            'audio/ogg;codecs=opus',   // Ogg Opus
            'audio/wav'                // WAV
        ]
    }
};

// ===== APPLICATION STATE =====
class AppState {
    constructor() {
        this.currentMode = APP_CONFIG.MODES.HOME;
        this.recordings = {
            normal: {},
            test: {}
        };
        this.autoSaveInterval = null;
        this.lastSaveTime = null;
        this.isInitialized = false;
    }

    setMode(mode) {
        if (Object.values(APP_CONFIG.MODES).includes(mode)) {
            this.currentMode = mode;
        }
    }

    getMode() {
        return this.currentMode;
    }

    getRecordingsForMode(mode) {
        return this.recordings[mode] || {};
    }

    hasRecording(sectionId) {
        const mode = this.currentMode;
        return this.recordings[mode] && this.recordings[mode][sectionId] && this.recordings[mode][sectionId].hasRecording();
    }

    getRecording(sectionId) {
        const mode = this.currentMode;
        return this.recordings[mode] && this.recordings[mode][sectionId] ? this.recordings[mode][sectionId] : null;
    }

    setRecording(sectionId, recorder) {
        if (!this.recordings[this.currentMode]) {
            this.recordings[this.currentMode] = {};
        }
        this.recordings[this.currentMode][sectionId] = recorder;
    }

    clear() {
        this.recordings = {
            normal: {},
            test: {}
        };
        this.lastSaveTime = null;
    }
}

// ===== UTILITY FUNCTIONS =====
const Utils = {
    // Format duration in MM:SS format
    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    },

    // Convert file to Base64
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// ===== NOTIFICATION SYSTEM =====
class NotificationSystem {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.init();
    }

    init() {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 5000) {
        const id = Utils.generateId();
        const notification = this.createNotification(id, message, type);
        this.notifications.set(id, notification);
        
        this.container.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(id);
            }, duration);
        }
        
        return id;
    }

    createNotification(id, message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: ${this.getBackgroundColor(type)};
            color: ${this.getTextColor(type)};
            padding: 16px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            transition: all 0.3s ease;
            pointer-events: auto;
            position: relative;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 1.2em;">${this.getIcon(type)}</span>
                <span style="flex: 1;">${message}</span>
                <button onclick="notificationSystem.remove('${id}')" 
                        style="background: none; border: none; font-size: 1.2em; cursor: pointer; opacity: 0.7;">
                    ×
                </button>
            </div>
        `;
        
        return notification;
    }

    remove(id) {
        const notification = this.notifications.get(id);
        if (notification) {
            notification.classList.remove('show');
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.notifications.delete(id);
            }, 300);
        }
    }

    getBackgroundColor(type) {
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        return colors[type] || colors.info;
    }

    getTextColor(type) {
        return 'white';
    }

    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// ===== LOADING OVERLAY =====
class LoadingOverlay {
    constructor() {
        this.overlay = null;
        this.isVisible = false;
    }

    show(text = 'Chargement...') {
        if (this.isVisible) return;
        
        this.overlay = document.createElement('div');
        this.overlay.className = 'loading-overlay';
        this.overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <div class="loading-text">${text}</div>
            </div>
        `;
        
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        `;
        
        document.body.appendChild(this.overlay);
        this.isVisible = true;
    }

    hide() {
        if (this.overlay && this.isVisible) {
            this.overlay.style.animation = 'fadeOut 0.2s ease forwards';
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                    this.overlay = null;
                    this.isVisible = false;
                }
            }, 200);
        }
    }
}

// ===== AUTO-SAVE SYSTEM =====
class AutoSaveSystem {
    constructor(appState) {
        this.appState = appState;
        this.indicator = null;
        this.debounceTimer = null;
    }

    init() {
        this.createIndicator();
        this.startAutoSave();
    }

    createIndicator() {
        this.indicator = document.createElement('div');
        this.indicator.className = 'autosave-indicator';
        this.indicator.innerHTML = '<div class="icon"></div><span class="text">Sauvegarde automatique</span>';
        this.indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
            z-index: 1000;
        `;
        document.body.appendChild(this.indicator);
    }

    save() {
        try {
            const data = {
                mode: this.appState.getMode(),
                timestamp: Date.now(),
                forms: this.collectFormData()
            };
            
            localStorage.setItem('dictamed_autosave', JSON.stringify(data));
            this.appState.lastSaveTime = Date.now();
            this.showIndicator('saved');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            this.showIndicator('error');
        }
    }

    collectFormData() {
        const data = {};
        const mode = this.appState.getMode();
        
        // Collect form data based on current mode
        if (mode === APP_CONFIG.MODES.NORMAL) {
            data.numeroDossier = document.getElementById('numeroDossier')?.value || '';
            data.nomPatient = document.getElementById('nomPatient')?.value || '';
        } else if (mode === APP_CONFIG.MODES.TEST) {
            data.numeroDossier = document.getElementById('numeroDossierTest')?.value || '';
            data.nomPatient = document.getElementById('nomPatientTest')?.value || '';
        } else if (mode === APP_CONFIG.MODES.DMI) {
            data.numeroDossier = document.getElementById('numeroDossierDMI')?.value || '';
            data.nomPatient = document.getElementById('nomPatientDMI')?.value || '';
            data.texteLibre = document.getElementById('texteLibre')?.value || '';
        }
        
        return data;
    }

    startAutoSave() {
        appState.autoSaveInterval = setInterval(() => {
            this.save();
        }, APP_CONFIG.AUTOSAVE_INTERVAL);
        
        // Debounced save on form changes
        const debouncedSave = Utils.debounce(() => {
            this.save();
        }, 1000);
        
        document.addEventListener('input', debouncedSave);
    }

    showIndicator(state) {
        if (!this.indicator) return;
        
        this.indicator.style.opacity = '1';
        this.indicator.style.transform = 'translateY(0)';
        
        setTimeout(() => {
            this.indicator.style.opacity = '0';
            this.indicator.style.transform = 'translateY(20px)';
        }, 2000);
    }

    clear() {
        localStorage.removeItem('dictamed_autosave');
    }
}

// ===== AUDIO RECORDER CLASS =====
class AudioRecorder {
    constructor(sectionElement) {
        this.section = sectionElement;
        this.sectionId = sectionElement.getAttribute('data-section');
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this.startTime = null;
        this.pausedTime = 0;
        this.timerInterval = null;
        this.audioBlob = null;
        this.supportedMimeType = '';
        
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
    }

    initEventListeners() {
        this.btnRecord.addEventListener('click', () => this.startRecording());
        this.btnPause.addEventListener('click', () => this.pauseRecording());
        this.btnStop.addEventListener('click', () => this.stopRecording());
        this.btnReplay.addEventListener('click', () => this.replayRecording());
        this.btnDelete.addEventListener('click', () => this.deleteRecording());
    }

    async startRecording() {
        try {
            // Check browser compatibility
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Votre navigateur ne supporte pas l\'enregistrement audio. Veuillez utiliser un navigateur moderne (Chrome, Firefox, Edge, Safari).');
            }

            // Show loading indicator
            this.updateStatus('loading', '⏳ Accès au microphone...');
            this.btnRecord.disabled = true;

            // Request microphone access with optimized settings
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100,
                    channelCount: 1
                }
            });

            // Determine supported audio format
            this.supportedMimeType = this.getSupportedMimeType();
            console.log('Format audio utilisé:', this.supportedMimeType);
            
            // Create MediaRecorder with optimized options
            const options = this.supportedMimeType ? { 
                mimeType: this.supportedMimeType, 
                audioBitsPerSecond: 128000 
            } : {};
            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.audioChunks = [];

            // Event to collect audio data
            this.mediaRecorder.addEventListener('dataavailable', event => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            });

            // Recording end event
            this.mediaRecorder.addEventListener('stop', () => {
                this.audioBlob = new Blob(this.audioChunks, { 
                    type: this.supportedMimeType || 'audio/webm' 
                });
                const audioUrl = URL.createObjectURL(this.audioBlob);
                this.audioPlayer.src = audioUrl;
                this.audioPlayer.classList.remove('hidden');
                
                updateSectionCount();
            });

            // Error handling during recording
            this.mediaRecorder.addEventListener('error', (event) => {
                console.error('Erreur MediaRecorder:', event.error);
                notificationSystem.error('Une erreur est survenue lors de l\'enregistrement. Veuillez réessayer.', 'Erreur d\'enregistrement');
                this.resetRecording();
            });

            // Start recording with timeslice for data collection
            this.mediaRecorder.start(1000);
            
            this.startTime = Date.now() - this.pausedTime;
            this.startTimer();
            
            // Update UI
            this.updateStatus('recording', '🔴 En cours');
            this.btnRecord.classList.add('hidden');
            this.btnRecord.disabled = false;
            this.btnPause.classList.remove('hidden');
            this.btnStop.classList.remove('hidden');
            
            // Add visual recording indicator
            this.section.classList.add('is-recording');

        } catch (error) {
            console.error('Erreur d\'accès au microphone:', error);
            this.handleMicrophoneError(error);
            this.resetRecording();
        }
    }

    handleMicrophoneError(error) {
        let errorMessage = 'Erreur : Impossible d\'accéder au microphone.';
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMessage = '🎤 Accès refusé au microphone.\n\nVeuillez autoriser l\'accès au microphone dans les paramètres de votre navigateur et réessayer.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            errorMessage = '🎤 Aucun microphone détecté.\n\nVeuillez connecter un microphone et réessayer.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            errorMessage = '🎤 Microphone déjà utilisé.\n\nFermez les autres applications utilisant le microphone et réessayer.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        notificationSystem.error(errorMessage, 'Accès au microphone');
    }

    pauseRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause();
            this.pausedTime = Date.now() - this.startTime;
            this.stopTimer();
            this.updateStatus('paused', '⏸️ En pause');
            this.btnPause.textContent = '▶️ Reprendre';
            this.section.classList.remove('is-recording');
            this.section.classList.add('is-paused');
        } else if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume();
            this.startTime = Date.now() - this.pausedTime;
            this.startTimer();
            this.updateStatus('recording', '🔴 En cours');
            this.btnPause.textContent = '⏸️ Pause';
            this.section.classList.remove('is-paused');
            this.section.classList.add('is-recording');
        }
    }

    stopRecording() {
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
            this.stopTimer();
            
            // Stop all stream tracks
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }

            // Update UI
            this.updateStatus('ready', 'Prêt');
            this.btnRecord.classList.add('hidden');
            this.btnPause.classList.add('hidden');
            this.btnPause.textContent = '⏸️ Pause';
            this.btnStop.classList.add('hidden');
            this.btnReplay.classList.remove('hidden');
            this.btnDelete.classList.remove('hidden');
            this.recordedBadge.classList.remove('hidden');
            
            // Mark section as recorded
            this.section.classList.remove('is-recording', 'is-paused');
            this.section.classList.add('recorded');
            
            // Feedback for mobile users
            if ('vibrate' in navigator) {
                navigator.vibrate(200);
            }
        }
    }

    replayRecording() {
        if (this.audioPlayer.src) {
            this.audioPlayer.play();
        }
    }

    deleteRecording() {
        if (confirm('⚠️ Êtes-vous sûr de vouloir supprimer cet enregistrement ?\n\nCette action est irréversible.')) {
            this.resetRecording();
        }
    }

    resetRecording() {
        // Stop active stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        // Stop active MediaRecorder
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        // Reset state
        this.audioBlob = null;
        this.audioChunks = [];
        this.pausedTime = 0;
        this.timer.textContent = '00:00';
        this.audioPlayer.src = '';
        this.audioPlayer.classList.add('hidden');
        this.stopTimer();
        
        // Reset UI
        this.updateStatus('ready', '⚪ Prêt');
        this.btnRecord.classList.remove('hidden');
        this.btnRecord.disabled = false;
        this.btnPause.classList.add('hidden');
        this.btnPause.textContent = '⏸️ Pause';
        this.btnStop.classList.add('hidden');
        this.btnReplay.classList.add('hidden');
        this.btnDelete.classList.add('hidden');
        this.recordedBadge.classList.add('hidden');
        
        // Remove all markings
        this.section.classList.remove('recorded', 'is-recording', 'is-paused');
        
        updateSectionCount();
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const seconds = Math.floor(elapsed / 1000);
            
            this.timer.textContent = Utils.formatDuration(seconds);
            
            // Auto stop after maximum duration
            if (seconds >= APP_CONFIG.MAX_RECORDING_DURATION) {
                notificationSystem.info('Durée maximale de 2 minutes atteinte. Enregistrement arrêté automatiquement.', 'Limite atteinte', 5000);
                this.stopRecording();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateStatus(status, text) {
        this.statusBadge.setAttribute('data-status', status);
        this.statusBadge.textContent = text;
    }

    getSupportedMimeType() {
        for (const type of APP_CONFIG.AUDIO_FORMATS.PRIORITY) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return ''; // Let browser choose
    }

    async getBase64Audio() {
        if (!this.audioBlob) return null;
        return Utils.fileToBase64(this.audioBlob);
    }

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

    getMimeType() {
        return this.audioBlob ? this.audioBlob.type : 'audio/mpeg';
    }

    hasRecording() {
        return this.audioBlob !== null && this.audioBlob.size > 0;
    }

    validateRecording() {
        if (!this.audioBlob) {
            return { valid: false, error: 'Aucun enregistrement disponible' };
        }

        if (this.audioBlob.size > APP_CONFIG.MAX_FILE_SIZE) {
            return { 
                valid: false, 
                error: `Enregistrement trop volumineux. Limite: ${Utils.formatFileSize(APP_CONFIG.MAX_FILE_SIZE)}` 
            };
        }

        if (this.audioBlob.size === 0) {
            return { valid: false, error: 'Enregistrement vide' };
        }

        return { valid: true, error: null };
    }
}

// ===== AUDIO RECORDER MANAGER =====
class AudioRecorderManager {
    constructor(appState) {
        this.appState = appState;
        this.recorders = new Map();
    }

    init() {
        const recordingSections = document.querySelectorAll('.recording-section');
        
        recordingSections.forEach(section => {
            const sectionId = section.getAttribute('data-section');
            const recorder = new AudioRecorder(section);
            this.recorders.set(sectionId, recorder);
            this.appState.setRecording(sectionId, recorder);
        });
    }

    getRecorder(sectionId) {
        return this.recorders.get(sectionId);
    }

    getAllRecorders() {
        return this.recorders;
    }

    getSectionCount() {
        let count = 0;
        const mode = this.appState.getMode();
        const sections = APP_CONFIG.SECTIONS[mode];
        
        if (!sections) return 0;
        
        sections.forEach(sectionId => {
            const recorder = this.recorders.get(sectionId);
            if (recorder && recorder.hasRecording()) {
                count++;
            }
        });

        return count;
    }

    updateSectionCount() {
        const mode = this.appState.getMode();
        
        if (mode === APP_CONFIG.MODES.HOME) {
            return;
        }
        
        const count = this.getSectionCount();
        
        // Update display
        const countElements = document.querySelectorAll('.sections-count');
        countElements.forEach(el => {
            if (el.closest(`#mode-${mode}`)) {
                el.textContent = `${count} section(s) enregistrée(s)`;
            }
        });

        // Enable/disable submit button
        const submitBtn = mode === APP_CONFIG.MODES.NORMAL 
            ? document.getElementById('submitNormal')
            : document.getElementById('submitTest');
        
        if (submitBtn) {
            submitBtn.disabled = count === 0;
        }
    }

    resetMode(mode) {
        const sections = APP_CONFIG.SECTIONS[mode];
        if (!sections) return;
        
        sections.forEach(sectionId => {
            const recorder = this.recorders.get(sectionId);
            if (recorder && recorder.hasRecording()) {
                recorder.resetRecording();
            }
        });
    }
}

// ===== DATA SENDER =====
class DataSender {
    constructor(appState, audioRecorderManager) {
        this.appState = appState;
        this.audioRecorderManager = audioRecorderManager;
    }

    async send(mode) {
        try {
            const submitBtn = mode === APP_CONFIG.MODES.NORMAL 
                ? document.getElementById('submitNormal')
                : document.getElementById('submitTest');
            
            if (!submitBtn) {
                console.error('Bouton d\'envoi non trouvé pour le mode:', mode);
                return;
            }
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Envoi en cours...';

            // Show summary before sending
            const summary = this.showSendSummary(mode);
            console.log('📋', summary);
            notificationSystem.info('Vérification des données avant envoi...', 'Préparation', 2000);

            // Prepare payload with improved error handling
            const payload = await this.preparePayload(mode);
            
            if (!payload) {
                const errorMsg = 'Veuillez remplir le numéro de dossier et le nom du patient, et enregistrer au moins une section.';
                notificationSystem.warning(errorMsg, 'Champs manquants');
                submitBtn.disabled = false;
                submitBtn.textContent = mode === APP_CONFIG.MODES.NORMAL ? 'Envoyer les données' : 'Envoyer les données Test';
                return;
            }

            // Check if there are recorded sections
            const hasRecordings = Object.keys(payload.sections || {}).length > 0;
            if (!hasRecordings) {
                notificationSystem.warning('Veuillez enregistrer au moins une section avant d\'envoyer.', 'Aucun enregistrement');
                submitBtn.disabled = false;
                submitBtn.textContent = mode === APP_CONFIG.MODES.NORMAL ? 'Envoyer les données' : 'Envoyer les données Test';
                return;
            }

            // Determine endpoint
            const endpoint = APP_CONFIG.ENDPOINTS[mode];
            if (!endpoint) {
                throw new Error(`Endpoint non configuré pour le mode: ${mode}`);
            }

            console.log('🔄 Envoi des données vers:', endpoint);

            // Send data with timeout and retry
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
                    setTimeout(() => reject(new Error('Timeout après 30 secondes')), APP_CONFIG.TIMEOUT_DURATION)
                )
            ]);

            if (response.ok) {
                await this.handleSuccessResponse(mode);
            } else {
                await this.handleErrorResponse(response);
            }

        } catch (error) {
            this.handleNetworkError(error);
        } finally {
            const submitBtn = mode === APP_CONFIG.MODES.NORMAL 
                ? document.getElementById('submitNormal')
                : document.getElementById('submitTest');
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = mode === APP_CONFIG.MODES.NORMAL ? 'Envoyer les données' : 'Envoyer les données Test';
            }
        }
    }

    async preparePayload(mode) {
        const payload = {
            mode: mode,
            recordedAt: new Date().toISOString(),
            sections: {}
        };

        try {
            // Add Firebase user email if connected
            const currentUser = FirebaseAuthManager.getCurrentUser();
            if (currentUser && currentUser.email) {
                payload.userEmail = currentUser.email;
            }

            if (mode === APP_CONFIG.MODES.NORMAL) {
                return await this.prepareNormalModePayload(payload);
            } else if (mode === APP_CONFIG.MODES.TEST) {
                return await this.prepareTestModePayload(payload);
            }

            return null;
        } catch (error) {
            console.error('Erreur lors de la préparation du payload:', error);
            return null;
        }
    }

    async prepareNormalModePayload(payload) {
        const numeroDossier = document.getElementById('numeroDossier')?.value.trim();
        const nomPatient = document.getElementById('nomPatient')?.value.trim();

        // Validate required fields
        if (!numeroDossier || !nomPatient) {
            return null;
        }

        payload.NumeroDeDossier = numeroDossier;
        payload.NomDuPatient = nomPatient;

        return await this.prepareSectionsPayload(payload, APP_CONFIG.SECTIONS.normal);
    }

    async prepareTestModePayload(payload) {
        const numeroDossier = document.getElementById('numeroDossierTest')?.value.trim();
        const nomPatient = document.getElementById('nomPatientTest')?.value.trim();

        // Validate required fields
        if (!numeroDossier || !nomPatient) {
            return null;
        }

        payload.NumeroDeDossier = numeroDossier;
        payload.NomDuPatient = nomPatient;

        return await this.prepareSectionsPayload(payload, APP_CONFIG.SECTIONS.test);
    }

    async prepareSectionsPayload(payload, sections) {
        let index = 0;
        let hasValidRecording = false;
        
        for (const sectionId of sections) {
            const recorder = this.audioRecorderManager.getRecorder(sectionId);
            if (recorder && recorder.hasRecording()) {
                try {
                    // Validate recording
                    const validation = recorder.validateRecording();
                    if (!validation.valid) {
                        console.warn(`Section ${sectionId} invalide:`, validation.error);
                        continue;
                    }
                    
                    index++;
                    const base64 = await recorder.getBase64Audio();
                    const format = recorder.getAudioFormat();
                    const mimeType = recorder.getMimeType();
                    
                    // Additional security checks
                    if (!base64 || base64.length === 0) {
                        console.warn(`Enregistrement vide pour la section: ${sectionId}`);
                        continue;
                    }
                    
                    payload.sections[sectionId] = {
                        audioBase64: base64,
                        fileName: `msgVocal${index}.${format}`,
                        mimeType: mimeType,
                        format: format,
                        sectionName: sectionId,
                        fileSize: recorder.audioBlob.size
                    };
                    
                    hasValidRecording = true;
                    console.log(`✅ Section ${sectionId} préparée (${format}, ${Utils.formatFileSize(recorder.audioBlob.size)})`);
                } catch (sectionError) {
                    console.error(`Erreur lors de la préparation de la section ${sectionId}:`, sectionError);
                }
            }
        }

        if (!hasValidRecording) {
            return null;
        }

        return payload;
    }

    showSendSummary(mode) {
        const isTest = mode === APP_CONFIG.MODES.TEST;
        const numeroDossier = document.getElementById(isTest ? 'numeroDossierTest' : 'numeroDossier').value;
        const nomPatient = document.getElementById(isTest ? 'nomPatientTest' : 'nomPatient').value;
        const sections = isTest ? APP_CONFIG.SECTIONS.test : APP_CONFIG.SECTIONS.normal;
        
        let summary = `📋 Récapitulatif avant envoi (${mode.toUpperCase()}):\n\n`;
        summary += `👤 Patient: ${numeroDossier} - ${nomPatient}\n`;
        summary += `📊 Sections enregistrées:\n`;
        
        let sectionCount = 0;
        sections.forEach(sectionId => {
            const recorder = this.audioRecorderManager.getRecorder(sectionId);
            if (recorder && recorder.hasRecording()) {
                const validation = recorder.validateRecording();
                sectionCount++;
                const size = recorder.audioBlob ? Utils.formatFileSize(recorder.audioBlob.size) : '0';
                summary += `   ✅ ${sectionId}: ${size} ${validation.valid ? '' : `(⚠️ ${validation.error})`}\n`;
            }
        });
        
        if (sectionCount === 0) {
            summary += '   ❌ Aucune section enregistrée\n';
        }
        
        summary += `\n🎯 ${sectionCount} section(s) prête(s) pour l'envoi`;
        
        return summary;
    }

    async handleSuccessResponse(mode) {
        notificationSystem.success('Votre dossier a été envoyé et traité avec succès !', 'Envoi réussi');
        
        if (mode === APP_CONFIG.MODES.TEST) {
            // Test mode: Show Google Sheet and notification
            const googleSheetCard = document.getElementById('googleSheetCard');
            if (googleSheetCard) {
                googleSheetCard.style.display = 'block';
                googleSheetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            // Notification to consult Google Sheet
            setTimeout(() => {
                notificationSystem.info('Consultez le Google Sheet pour voir vos données transcrites en temps réel.', 'Résultats disponibles', 8000);
            }, 1000);
            
        } else {
            // Normal mode: Auto reset
            resetForm(mode);
            autoSaveSystem.clear();
            notificationSystem.success('Formulaire réinitialisé pour un nouveau patient.', 'Prêt', 3000);
        }
    }

    async handleErrorResponse(response) {
        let errorMessage = `Le serveur a renvoyé une erreur (${response.status})`;
        
        try {
            const errorText = await response.text();
            console.error('Détails de l\'erreur:', errorText);
            
            if (response.status === 413) {
                errorMessage = 'Les fichiers audio sont trop volumineux. Veuillez enregistrer des sections plus courtes.';
            } else if (response.status === 400) {
                errorMessage = 'Les données envoyées ne sont pas valides. Vérifiez vos enregistrements.';
            } else if (response.status >= 500) {
                errorMessage = 'Erreur serveur. Veuillez réessayer dans quelques instants.';
            }
        } catch (e) {
            console.error('Erreur lors de la lecture de la réponse:', e);
        }
        
        notificationSystem.error(errorMessage, 'Erreur d\'envoi');
    }

    handleNetworkError(error) {
        console.error('Erreur lors de l\'envoi:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            notificationSystem.error('Impossible de contacter le serveur. Vérifiez votre connexion Internet et réessayez.', 'Erreur réseau');
        } else if (error.message.includes('Timeout')) {
            notificationSystem.error('La connexion a pris trop de temps. Vérifiez votre connexion et réessayez.', 'Timeout');
        } else {
            notificationSystem.error(`Une erreur inattendue s'est produite: ${error.message}`, 'Erreur technique');
        }
    }
}

// ===== TAB NAVIGATION SYSTEM =====
class TabNavigationSystem {
    constructor(appState) {
        this.appState = appState;
        this.activeTab = 'home';
    }

    init() {
        this.initTabButtons();
        this.initFixedNavButtons();
    }

    initTabButtons() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });
    }

    initFixedNavButtons() {
        const fixedNavBtns = document.querySelectorAll('.fixed-nav-btn');
        fixedNavBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });
    }

    switchTab(tabId) {
        // Check access before switching
        if (!this.checkTabAccess(tabId)) {
            return;
        }
        
        // Deactivate all tabs and content
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Activate selected tab and content
        document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
        document.getElementById(tabId)?.classList.add('active');

        // Sync fixed navigation buttons
        this.updateFixedNavButtons(tabId);

        // Update current mode
        this.updateAppMode(tabId);
        
        this.activeTab = tabId;
    }

    checkTabAccess(tabId) {
        // Test mode always accessible
        if (tabId === APP_CONFIG.MODES.TEST || tabId === 'guide' || tabId === 'faq' || tabId === APP_CONFIG.MODES.HOME) {
            return true;
        }
        
        // DMI mode requires authentication, Normal mode no longer requires it
        if (tabId === APP_CONFIG.MODES.DMI && !FirebaseAuthManager.isAuthenticated()) {
            notificationSystem.warning('Veuillez vous connecter pour accéder à ce mode', 'Authentification requise');
            return false;
        }
        
        return true;
    }

    updateFixedNavButtons(activeTabId) {
        const fixedNavBtns = document.querySelectorAll('.fixed-nav-btn');
        fixedNavBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === activeTabId) {
                btn.classList.add('active');
            }
        });
    }

    updateAppMode(tabId) {
        let mode = APP_CONFIG.MODES.HOME;
        
        if (tabId === APP_CONFIG.MODES.NORMAL) {
            mode = APP_CONFIG.MODES.NORMAL;
        } else if (tabId === APP_CONFIG.MODES.TEST) {
            mode = APP_CONFIG.MODES.TEST;
        } else if (tabId === APP_CONFIG.MODES.DMI) {
            mode = APP_CONFIG.MODES.DMI;
        }
        
        this.appState.setMode(mode);
    }

    getActiveTab() {
        return this.activeTab;
    }
}

// ===== FORM VALIDATION SYSTEM =====
class FormValidationSystem {
    constructor() {
        this.validators = new Map();
        this.init();
    }

    init() {
        this.initCharCounters();
        this.initOptionalSection();
        this.initDMIValidation();
    }

    initCharCounters() {
        const inputs = [
            { id: 'numeroDossier', counterId: 'numeroDossierCounter', maxLength: 50 },
            { id: 'nomPatient', counterId: 'nomPatientCounter', maxLength: 50 },
            { id: 'numeroDossierTest', counterId: 'numeroDossierTestCounter', maxLength: 50 },
            { id: 'nomPatientTest', counterId: 'nomPatientTestCounter', maxLength: 50 },
            { id: 'numeroDossierDMI', counterId: 'numeroDossierDMICounter', maxLength: 50 },
            { id: 'nomPatientDMI', counterId: 'nomPatientDMICounter', maxLength: 50 }
        ];

        inputs.forEach(({ id, counterId, maxLength }) => {
            const input = document.getElementById(id);
            const counter = document.getElementById(counterId);
            
            if (input && counter) {
                input.addEventListener('input', () => {
                    this.updateCharCounter(input, counter, maxLength);
                });
            }
        });

        // Textarea counter
        const texteLibre = document.getElementById('texteLibre');
        const texteLibreCounter = document.getElementById('texteLibreCounter');
        if (texteLibre && texteLibreCounter) {
            texteLibre.addEventListener('input', () => {
                texteLibreCounter.textContent = texteLibre.value.length;
            });
        }
    }

    updateCharCounter(input, counter, maxLength) {
        const length = input.value.length;
        counter.textContent = `${length}/${maxLength}`;

        // Change color based on usage level
        counter.classList.remove('warning', 'danger');
        if (length >= maxLength) {
            counter.classList.add('danger');
        } else if (length >= maxLength * 0.8) {
            counter.classList.add('warning');
        }

        // DMI mode validation
        if (input.id === 'numeroDossierDMI') {
            this.validateDMIMode();
        }
    }

    initOptionalSection() {
        const toggleBtn = document.getElementById('togglePartie4');
        const partie4 = document.querySelector('[data-section="partie4"]');
        
        if (toggleBtn && partie4) {
            toggleBtn.addEventListener('click', () => {
                const isHidden = partie4.classList.contains('hidden');
                partie4.classList.toggle('hidden');
                toggleBtn.textContent = isHidden 
                    ? 'Masquer Partie 4' 
                    : 'Afficher Partie 4 (optionnelle)';
            });
        }
    }

    validateDMIMode() {
        const numeroDossier = document.getElementById('numeroDossierDMI').value.trim();
        const submitBtn = document.getElementById('submitDMI');
        
        if (submitBtn) {
            submitBtn.disabled = !numeroDossier;
        }
    }

    initDMIValidation() {
        this.validateDMIMode();
    }
}

// ===== PHOTO MANAGEMENT SYSTEM =====
class PhotoManagementSystem {
    constructor() {
        this.uploadedPhotos = [];
        this.init();
    }

    init() {
        this.initPhotosUpload();
    }

    initPhotosUpload() {
        const photosInput = document.getElementById('photosUpload');
        const photosPreview = document.getElementById('photosPreview');
        
        if (!photosInput || !photosPreview) return;
        
        photosInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFileSelection(files);
        });
    }

    handleFileSelection(files) {
        // Limit to 5 photos
        if (this.uploadedPhotos.length + files.length > APP_CONFIG.MAX_PHOTOS) {
            notificationSystem.warning(`Vous avez atteint la limite de ${APP_CONFIG.MAX_PHOTOS} photos. Supprimez des photos existantes pour en ajouter de nouvelles.`, 'Limite atteinte');
            return;
        }
        
        // Validate each file
        files.forEach(file => {
            if (!this.validateFile(file)) {
                return;
            }
            
            this.addPhoto(file);
        });
        
        this.updatePreview();
    }

    validateFile(file) {
        // Check format
        if (!file.type.startsWith('image/')) {
            notificationSystem.error(`Le fichier "${file.name}" n'est pas une image valide.`, 'Format non supporté');
            return false;
        }
        
        // Check size
        if (file.size > APP_CONFIG.MAX_PHOTO_SIZE) {
            const sizeMB = Utils.formatFileSize(file.size);
            notificationSystem.error(`Le fichier "${file.name}" est trop volumineux (${sizeMB}). Limite : ${Utils.formatFileSize(APP_CONFIG.MAX_PHOTO_SIZE)}.`, 'Fichier trop lourd');
            return false;
        }
        
        return true;
    }

    addPhoto(file) {
        this.uploadedPhotos.push(file);
    }

    removePhoto(index) {
        this.uploadedPhotos.splice(index, 1);
        this.updatePreview();
    }

    updatePreview() {
        const photosPreview = document.getElementById('photosPreview');
        if (!photosPreview) return;
        
        photosPreview.innerHTML = '';
        
        this.uploadedPhotos.forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const photoItem = this.createPhotoItem(e.target.result, file, index);
                photosPreview.appendChild(photoItem);
            };
            
            reader.readAsDataURL(file);
        });
    }

    createPhotoItem(src, file, index) {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        
        photoItem.innerHTML = `
            <img src="${src}" alt="Photo ${index + 1}">
            <button class="photo-item-remove" data-index="${index}" title="Supprimer">×</button>
            <div class="photo-item-info">${file.name}</div>
        `;
        
        // Add remove event
        const removeBtn = photoItem.querySelector('.photo-item-remove');
        removeBtn.addEventListener('click', () => {
            this.removePhoto(index);
        });
        
        return photoItem;
    }

    getPhotos() {
        return this.uploadedPhotos;
    }

    clear() {
        this.uploadedPhotos = [];
        this.updatePreview();
    }

    async getPhotosAsBase64() {
        const photos = [];
        for (const file of this.uploadedPhotos) {
            const base64 = await Utils.fileToBase64(file);
            photos.push({
                fileName: file.name,
                mimeType: file.type,
                size: file.size,
                base64: base64
            });
        }
        return photos;
    }
}

// ===== DMI DATA SENDER =====
class DMIDataSender {
    constructor(photoManagementSystem) {
        this.photoManagementSystem = photoManagementSystem;
    }

    async send() {
        try {
            const submitBtn = document.getElementById('submitDMI');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Envoi en cours...';

            // Prepare payload
            const payload = await this.preparePayload();
            if (!payload) {
                notificationSystem.warning('Le numéro de dossier est obligatoire pour envoyer les données.', 'Champ requis');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Envoyer les données DMI';
                return;
            }

            // Send to webhook
            const response = await fetch(APP_CONFIG.ENDPOINTS.dmi, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                notificationSystem.success('Vos données DMI ont été envoyées avec succès !', 'Envoi réussi');
                
                if (confirm('Voulez-vous réinitialiser le formulaire DMI ?')) {
                    this.resetForm();
                }
            } else {
                const errorText = await response.text();
                notificationSystem.error(`Le serveur a renvoyé une erreur (${response.status}). Veuillez réessayer ou contactez le support.`, 'Erreur d\'envoi');
                console.error('Détails:', errorText);
            }

        } catch (error) {
            console.error('Erreur lors de l\'envoi:', error);
            notificationSystem.error('Impossible de contacter le serveur. Vérifiez votre connexion Internet.', 'Erreur réseau');
        } finally {
            const submitBtn = document.getElementById('submitDMI');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Envoyer les données DMI';
        }
    }

    async preparePayload() {
        const numeroDossier = document.getElementById('numeroDossierDMI').value.trim();
        const nomPatient = document.getElementById('nomPatientDMI').value.trim();
        const texteLibre = document.getElementById('texteLibre').value.trim();

        if (!numeroDossier) {
            return null;
        }

        const payload = {
            mode: APP_CONFIG.MODES.DMI,
            recordedAt: new Date().toISOString(),
            NumeroDeDossier: numeroDossier,
            NomDuPatient: nomPatient,
            texte: texteLibre,
            photos: []
        };

        // Add Firebase user email if connected
        const currentUser = FirebaseAuthManager.getCurrentUser();
        if (currentUser && currentUser.email) {
            payload.userEmail = currentUser.email;
        }

        // Convert photos to Base64
        payload.photos = await this.photoManagementSystem.getPhotosAsBase64();

        return payload;
    }

    resetForm() {
        document.getElementById('numeroDossierDMI').value = '';
        document.getElementById('nomPatientDMI').value = '';
        document.getElementById('texteLibre').value = '';
        document.getElementById('texteLibreCounter').textContent = '0';
        this.photoManagementSystem.clear();
        document.getElementById('submitDMI').disabled = true;
    }
}

// ===== AUTHENTICATION MODAL SYSTEM =====
class AuthModalSystem {
    constructor() {
        this.isOpen = false;
    }

    init() {
        this.initEventListeners();
    }

    initEventListeners() {
        // Modal toggle
        const authButton = document.getElementById('authButton');
        if (authButton) {
            authButton.addEventListener('click', () => this.toggle());
        }

        // Close on outside click
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) {
                    this.close();
                }
            });
        }

        // Close button
        const closeBtn = document.querySelector('.auth-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Password visibility toggle
        const passwordToggle = document.querySelector('.password-toggle');
        if (passwordToggle) {
            passwordToggle.addEventListener('click', () => this.togglePasswordVisibility());
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.classList.remove('hidden');
            this.isOpen = true;
            
            // Focus on first input
            const firstInput = authModal.querySelector('input[type="email"]');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    close() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.classList.add('hidden');
            this.isOpen = false;
        }
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('modalPasswordInput');
        const eyeIcon = document.querySelector('.password-toggle .eye-icon');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeIcon.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            eyeIcon.textContent = '👁️';
        }
    }
}

// ===== FIREBASE AUTHENTICATION MANAGER (IMPROVED) =====
const FirebaseAuthManager = {
    currentUser: null,
    isInitializing: true,
    
    init() {
        console.log('Initialisation Firebase Auth...');
        
        if (typeof firebase === 'undefined') {
            console.error('Firebase n\'est pas chargé');
            return;
        }
        
        this.setupGoogleAuth();
        
        firebase.auth().onAuthStateChanged((user) => {
            this.handleAuthStateChanged(user);
        });
        
        this.initUIEvents();
        
        this.currentUser = firebase.auth().currentUser;
        this.isInitializing = false;
        this.updateUI();
        
        console.log('✅ Firebase Auth initialisé');
    },
    
    setupGoogleAuth() {
        this.googleProvider = new firebase.auth.GoogleAuthProvider();
        this.googleProvider.addScope('email');
        this.googleProvider.addScope('profile');
    },
    
    handleAuthStateChanged(user) {
        this.currentUser = user;
        this.updateUI();
        
        if (user) {
            console.log('Utilisateur connecté:', user.email);
            notificationSystem.success(`Bienvenue ${user.displayName || user.email} !`, 'Connexion réussie');
            authModalSystem.close();
            
            // Auto redirect to normal mode after connection
            setTimeout(() => {
                console.log('Redirection automatique vers le mode normal...');
                tabNavigationSystem.switchTab(APP_CONFIG.MODES.NORMAL);
            }, 1500);
        } else {
            console.log('Utilisateur déconnecté');
        }
    },
    
    initUIEvents() {
        // Auth mode toggle
        const modalSignInTab = document.getElementById('modalSignInTab');
        const modalSignUpTab = document.getElementById('modalSignUpTab');
        
        if (modalSignInTab && modalSignUpTab) {
            modalSignInTab.addEventListener('click', () => this.switchAuthMode('signin'));
            modalSignUpTab.addEventListener('click', () => this.switchAuthMode('signup'));
        }
        
        // Email auth form
        const modalEmailAuthForm = document.getElementById('modalEmailAuthForm');
        if (modalEmailAuthForm) {
            modalEmailAuthForm.addEventListener('submit', (e) => this.handleEmailAuth(e));
        }
        
        // Google Sign-In
        const modalGoogleSignInBtn = document.getElementById('modalGoogleSignInBtn');
        if (modalGoogleSignInBtn) {
            modalGoogleSignInBtn.addEventListener('click', () => this.signInWithGoogle());
        }
        
        // Sign out
        const modalSignOutBtn = document.getElementById('modalSignOutBtn');
        if (modalSignOutBtn) {
            modalSignOutBtn.addEventListener('click', () => this.signOut());
        }
    },
    
    switchAuthMode(mode) {
        const modalSignInTab = document.getElementById('modalSignInTab');
        const modalSignUpTab = document.getElementById('modalSignUpTab');
        const modalEmailSubmitBtn = document.getElementById('modalEmailSubmitBtn');
        const modalEmailInput = document.getElementById('modalEmailInput');
        const modalPasswordInput = document.getElementById('modalPasswordInput');
        
        if (mode === 'signin') {
            modalSignInTab.classList.add('active');
            modalSignUpTab.classList.remove('active');
            modalEmailSubmitBtn.querySelector('.btn-text').textContent = 'Se connecter';
            modalEmailInput.placeholder = 'votre@email.com';
            modalPasswordInput.placeholder = 'Mot de passe';
        } else {
            modalSignInTab.classList.remove('active');
            modalSignUpTab.classList.add('active');
            modalEmailSubmitBtn.querySelector('.btn-text').textContent = 'Créer un compte';
            modalEmailInput.placeholder = 'votre@email.com';
            modalPasswordInput.placeholder = 'Mot de passe (min. 6 caractères)';
        }
        
        this.hideAuthError();
    },
    
    async handleEmailAuth(event) {
        event.preventDefault();
        
        const email = document.getElementById('modalEmailInput').value.trim();
        const password = document.getElementById('modalPasswordInput').value;
        const isSignUp = document.getElementById('modalSignUpTab').classList.contains('active');
        
        if (!email || !password) {
            this.showAuthError('Veuillez remplir tous les champs');
            return;
        }
        
        if (!Utils.isValidEmail(email)) {
            this.showAuthError('Veuillez entrer une adresse email valide');
            return;
        }
        
        if (password.length < 6) {
            this.showAuthError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }
        
        const modalEmailSubmitBtn = document.getElementById('modalEmailSubmitBtn');
        const btnText = modalEmailSubmitBtn.querySelector('.btn-text');
        const loadingSpinner = modalEmailSubmitBtn.querySelector('.loading-spinner-small');
        
        try {
            modalEmailSubmitBtn.disabled = true;
            btnText.textContent = 'Traitement...';
            loadingSpinner.classList.remove('hidden');
            this.hideAuthError();
            
            let result;
            if (isSignUp) {
                result = await firebase.auth().createUserWithEmailAndPassword(email, password);
            } else {
                result = await firebase.auth().signInWithEmailAndPassword(email, password);
            }
            
            document.getElementById('modalEmailAuthForm').reset();
            
        } catch (error) {
            console.error('Erreur authentification email:', error);
            this.handleAuthError(error);
        } finally {
            modalEmailSubmitBtn.disabled = false;
            btnText.textContent = isSignUp ? 'Créer un compte' : 'Se connecter';
            loadingSpinner.classList.add('hidden');
        }
    },
    
    async signInWithGoogle() {
        const modalGoogleSignInBtn = document.getElementById('modalGoogleSignInBtn');
        const originalText = modalGoogleSignInBtn.textContent;
        
        try {
            modalGoogleSignInBtn.disabled = true;
            modalGoogleSignInBtn.textContent = 'Connexion...';
            this.hideAuthError();
            
            const result = await firebase.auth().signInWithPopup(this.googleProvider);
            console.log('Connexion Google réussie:', result.user.email);
            
        } catch (error) {
            console.error('Erreur connexion Google:', error);
            this.handleAuthError(error);
        } finally {
            modalGoogleSignInBtn.disabled = false;
            modalGoogleSignInBtn.textContent = originalText;
        }
    },
    
    async signOut() {
        try {
            await firebase.auth().signOut();
            console.log('Déconnexion réussie');
            authModalSystem.close();
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            notificationSystem.error('Erreur lors de la déconnexion', 'Erreur');
        }
    },
    
    handleAuthError(error) {
        let message = 'Une erreur est survenue';
        
        switch (error.code) {
            case 'auth/user-not-found':
                message = 'Aucun compte trouvé avec cet email';
                break;
            case 'auth/wrong-password':
                message = 'Mot de passe incorrect';
                break;
            case 'auth/email-already-in-use':
                message = 'Cet email est déjà utilisé';
                break;
            case 'auth/weak-password':
                message = 'Le mot de passe est trop faible';
                break;
            case 'auth/invalid-email':
                message = 'Adresse email invalide';
                break;
            case 'auth/operation-not-allowed':
                message = 'Opération non autorisée';
                break;
            case 'auth/too-many-requests':
                message = 'Trop de tentatives. Réessayez plus tard';
                break;
            case 'auth/popup-closed-by-user':
                message = 'Connexion annulée';
                break;
            case 'auth/popup-blocked':
                message = 'Pop-up bloquée. Veuillez autoriser les pop-ups';
                break;
            case 'auth/network-request-failed':
                message = 'Erreur de connexion. Vérifiez votre internet';
                break;
            default:
                message = error.message || 'Erreur d\'authentification';
        }
        
        this.showAuthError(message);
    },
    
    showAuthError(message) {
        const modalAuthError = document.getElementById('modalAuthError');
        if (modalAuthError) {
            modalAuthError.textContent = message;
            modalAuthError.classList.remove('hidden');
            
            setTimeout(() => {
                this.hideAuthError();
            }, 5000);
        }
    },
    
    hideAuthError() {
        const modalAuthError = document.getElementById('modalAuthError');
        if (modalAuthError) {
            modalAuthError.classList.add('hidden');
        }
    },
    
    updateUI() {
        const modalAuthForm = document.getElementById('modalEmailAuthForm');
        const modalUserProfile = document.getElementById('modalUserProfile');
        const authButtonText = document.getElementById('authButtonText');
        
        if (this.currentUser) {
            if (modalAuthForm) modalAuthForm.classList.add('hidden');
            if (modalUserProfile) modalUserProfile.classList.remove('hidden');
            
            if (authButtonText) {
                authButtonText.textContent = 'Déconnexion';
            }
            
            this.updateUserProfile();
        } else {
            if (modalAuthForm) modalAuthForm.classList.remove('hidden');
            if (modalUserProfile) modalUserProfile.classList.add('hidden');
            
            if (authButtonText) {
                authButtonText.textContent = 'Connexion';
            }
        }
    },
    
    updateUserProfile() {
        const user = this.currentUser;
        if (!user) return;
        
        const modalUserName = document.getElementById('modalUserName');
        const modalUserEmail = document.getElementById('modalUserEmail');
        const modalUserAvatar = document.getElementById('modalUserAvatar');
        const modalAvatarPlaceholder = document.getElementById('modalAvatarPlaceholder');
        
        if (modalUserName) {
            modalUserName.textContent = user.displayName || 'Utilisateur';
        }
        
        if (modalUserEmail) {
            modalUserEmail.textContent = user.email;
        }
        
        if (user.photoURL && modalUserAvatar) {
            const oldImg = modalUserAvatar.querySelector('img');
            if (oldImg) oldImg.remove();
            
            const img = document.createElement('img');
            img.src = user.photoURL;
            img.alt = 'Avatar utilisateur';
            img.onerror = () => {
                img.remove();
                modalAvatarPlaceholder.classList.remove('hidden');
            };
            modalUserAvatar.appendChild(img);
            modalAvatarPlaceholder.classList.add('hidden');
        } else if (modalAvatarPlaceholder) {
            modalAvatarPlaceholder.classList.remove('hidden');
            
            const oldImg = modalUserAvatar.querySelector('img');
            if (oldImg) oldImg.remove();
        }
    },
    
    isAuthenticated() {
        return this.currentUser !== null;
    },
    
    getCurrentUser() {
        return this.currentUser;
    },
    
    isInitialized() {
        return !this.isInitializing;
    }
};

// ===== GLOBAL APPLICATION INSTANCES =====
const appState = new AppState();
const notificationSystem = new NotificationSystem();
const loadingOverlay = new LoadingOverlay();
const autoSaveSystem = new AutoSaveSystem(appState);
const audioRecorderManager = new AudioRecorderManager(appState);
const dataSender = new DataSender(appState, audioRecorderManager);
const tabNavigationSystem = new TabNavigationSystem(appState);
const formValidationSystem = new FormValidationSystem();
const photoManagementSystem = new PhotoManagementSystem();
const dmiDataSender = new DMIDataSender(photoManagementSystem);
const authModalSystem = new AuthModalSystem();

// ===== GLOBAL HELPER FUNCTIONS =====
function updateSectionCount() {
    audioRecorderManager.updateSectionCount();
}

function resetForm(mode) {
    if (mode === APP_CONFIG.MODES.NORMAL) {
        document.getElementById('numeroDossier').value = '';
        document.getElementById('nomPatient').value = '';
        
        // Reset character counters
        const counters = [
            { input: 'numeroDossier', counter: 'numeroDossierCounter' },
            { input: 'nomPatient', counter: 'nomPatientCounter' }
        ];
        counters.forEach(({ counter }) => {
            const counterEl = document.getElementById(counter);
            if (counterEl) counterEl.textContent = '0/50';
        });
        
        audioRecorderManager.resetMode(mode);
    } else {
        document.getElementById('numeroDossierTest').value = '';
        document.getElementById('nomPatientTest').value = '';
        
        // Reset character counters
        const counters = [
            { input: 'numeroDossierTest', counter: 'numeroDossierTestCounter' },
            { input: 'nomPatientTest', counter: 'nomPatientTestCounter' }
        ];
        counters.forEach(({ counter }) => {
            const counterEl = document.getElementById(counter);
            if (counterEl) counterEl.textContent = '0/50';
        });
        
        audioRecorderManager.resetMode(mode);
    }
    
    updateSectionCount();
}

// ===== GLOBAL EVENT LISTENERS =====
function initEventListeners() {
    // Submit buttons
    const submitNormalBtn = document.getElementById('submitNormal');
    const submitTestBtn = document.getElementById('submitTest');
    const submitDmiBtn = document.getElementById('submitDMI');

    if (submitNormalBtn) {
        submitNormalBtn.addEventListener('click', () => {
            loadingOverlay.show('Envoi en cours...');
            dataSender.send(APP_CONFIG.MODES.NORMAL).finally(() => loadingOverlay.hide());
        });
    }

    if (submitTestBtn) {
        submitTestBtn.addEventListener('click', () => {
            loadingOverlay.show('Envoi en cours...');
            dataSender.send(APP_CONFIG.MODES.TEST).finally(() => loadingOverlay.hide());
        });
    }

    if (submitDmiBtn) {
        submitDmiBtn.addEventListener('click', () => {
            loadingOverlay.show('Envoi en cours...');
            dmiDataSender.send().finally(() => loadingOverlay.hide());
        });
    }

    // Swipe hint hiding
    const tabsContainer = document.querySelector('.tabs-container');
    const swipeHint = document.querySelector('.swipe-hint');

    if (tabsContainer && swipeHint) {
        let hasScrolled = false;
        
        tabsContainer.addEventListener('scroll', Utils.throttle(() => {
            if (!hasScrolled) {
                hasScrolled = true;
                swipeHint.style.animation = 'fadeOut 0.5s ease forwards';
                setTimeout(() => {
                    swipeHint.style.display = 'none';
                }, 500);
            }
        }, 100));
        
        // Auto hide after 10 seconds
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

// ===== APPLICATION INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initialisation de DictaMed v2.0...');
    
    try {
        // Initialize core systems
        tabNavigationSystem.init();
        formValidationSystem.init();
        photoManagementSystem.init();
        authModalSystem.init();
        autoSaveSystem.init();
        
        // Initialize audio recorders
        audioRecorderManager.init();
        
        // Initialize Firebase Auth with delay
        setTimeout(() => {
            FirebaseAuthManager.init();
        }, 100);
        
        // Initialize event listeners
        initEventListeners();
        
        // Update initial state
        updateSectionCount();
        
        appState.isInitialized = true;
        
        console.log('✅ DictaMed v2.0 initialisé avec succès!');
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        notificationSystem.error('Erreur lors de l\'initialisation de l\'application', 'Erreur d\'initialisation');
    }
});

// ===== EXPORT FOR GLOBAL ACCESS =====
window.switchTab = (tabId) => tabNavigationSystem.switchTab(tabId);
window.toggleAuthModal = () => authModalSystem.toggle();
window.closeAuthModal = () => authModalSystem.close();
window.togglePasswordVisibility = () => authModalSystem.togglePasswordVisibility();
window.showForgotPassword = () => {
    const email = document.getElementById('modalEmailInput').value.trim();
    if (!email) {
        alert('Veuillez d\'abord entrer votre adresse email pour réinitialiser votre mot de passe.');
        document.getElementById('modalEmailInput').focus();
        return;
    }
    
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().sendPasswordResetEmail(email)
            .then(() => {
                notificationSystem.success('Un email de réinitialisation a été envoyé à ' + email, 'Email envoyé');
            })
            .catch((error) => {
                console.error('Erreur:', error);
                if (error.code === 'auth/user-not-found') {
                    notificationSystem.error('Aucun compte trouvé avec cet email', 'Erreur');
                } else {
                    notificationSystem.error('Impossible d\'envoyer l\'email de réinitialisation', 'Erreur');
                }
            });
    } else {
        alert('Un email de réinitialisation sera envoyé à: ' + email);
    }
};
