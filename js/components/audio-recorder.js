/**
 * DictaMed - Gestionnaire d'enregistrement audio
 * Version: 2.0.0 - Refactorisé pour une meilleure organisation
 */

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
        this.statusBadge = this.section.querySelector('.status-indicator');
        this.timer = this.section.querySelector('.timer');
        this.recordedBadge = this.section.querySelector('.recorded-badge-enhanced');
        this.btnRecord = this.section.querySelector('.btn-record-enhanced');
        this.btnPause = this.section.querySelector('.btn-control-enhanced[data-action="pause"]');
        this.btnStop = this.section.querySelector('.btn-control-enhanced[data-action="stop"]');
        this.btnReplay = this.section.querySelector('.btn-control-enhanced[data-action="replay"]');
        this.btnDelete = this.section.querySelector('.btn-control-enhanced[data-action="delete"]');
        this.audioPlayer = this.section.querySelector('.audio-player-enhanced');
    }

    initEventListeners() {
        // Add error handling guards
        if (!this.btnRecord) {
            console.error(`AudioRecorder: Record button not found for section ${this.sectionId}`);
            return;
        }

        this.btnRecord.addEventListener('click', () => this.startRecording());
        if (this.btnPause) this.btnPause.addEventListener('click', () => this.pauseRecording());
        if (this.btnStop) this.btnStop.addEventListener('click', () => this.stopRecording());
        if (this.btnReplay) this.btnReplay.addEventListener('click', () => this.replayRecording());
        if (this.btnDelete) this.btnDelete.addEventListener('click', () => this.deleteRecording());

        console.log(`AudioRecorder: Event listeners initialized for section ${this.sectionId}`);
    }

    async startRecording() {
        try {
            // Check browser compatibility
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Votre navigateur ne supporte pas l\'enregistrement audio. Veuillez utiliser un navigateur moderne (Chrome, Firefox, Edge, Safari).');
            }

            // Show loading indicator
            this.updateStatus('loading', '⏳ Accès au microphone...');
            if (this.btnRecord) this.btnRecord.disabled = true;

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
                if (this.audioPlayer) {
                    const audioUrl = URL.createObjectURL(this.audioBlob);
                    this.audioPlayer.src = audioUrl;
                    this.audioPlayer.classList.remove('hidden');
                }
                
                window.audioRecorderManager.updateSectionCount();
            });

            // Error handling during recording
            this.mediaRecorder.addEventListener('error', (event) => {
                console.error('Erreur MediaRecorder:', event.error);
                window.notificationSystem.error('Une erreur est survenue lors de l\'enregistrement. Veuillez réessayer.', 'Erreur d\'enregistrement');
                this.resetRecording();
            });

            // Start recording with timeslice for data collection
            this.mediaRecorder.start(1000);
            
            this.startTime = Date.now() - this.pausedTime;
            this.startTimer();
            
            // Update UI
            this.updateStatus('recording', '🔴 En cours');
            if (this.btnRecord) {
                this.btnRecord.classList.add('hidden');
                this.btnRecord.disabled = false;
            }
            if (this.btnPause) this.btnPause.classList.remove('hidden');
            if (this.btnStop) this.btnStop.classList.remove('hidden');
            
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
        
        window.notificationSystem.error(errorMessage, 'Accès au microphone');
    }

    pauseRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause();
            this.pausedTime = Date.now() - this.startTime;
            this.stopTimer();
            this.updateStatus('paused', '⏸️ En pause');
            if (this.btnPause) this.btnPause.textContent = '▶️ Reprendre';
            this.section.classList.remove('is-recording');
            this.section.classList.add('is-paused');
        } else if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume();
            this.startTime = Date.now() - this.pausedTime;
            this.startTimer();
            this.updateStatus('recording', '🔴 En cours');
            if (this.btnPause) this.btnPause.textContent = '⏸️ Pause';
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
            if (this.btnRecord) this.btnRecord.classList.add('hidden');
            if (this.btnPause) {
                this.btnPause.classList.add('hidden');
                this.btnPause.textContent = '⏸️ Pause';
            }
            if (this.btnStop) this.btnStop.classList.add('hidden');
            if (this.btnReplay) this.btnReplay.classList.remove('hidden');
            if (this.btnDelete) this.btnDelete.classList.remove('hidden');
            if (this.recordedBadge) this.recordedBadge.classList.remove('hidden');
            
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
        if (this.audioPlayer && this.audioPlayer.src) {
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
        if (this.timer) this.timer.textContent = '00:00';
        if (this.audioPlayer) {
            this.audioPlayer.src = '';
            this.audioPlayer.classList.add('hidden');
        }
        this.stopTimer();
        
        // Reset UI
        this.updateStatus('ready', '⚪ Prêt');
        if (this.btnRecord) {
            this.btnRecord.classList.remove('hidden');
            this.btnRecord.disabled = false;
        }
        if (this.btnPause) {
            this.btnPause.classList.add('hidden');
            this.btnPause.textContent = '⏸️ Pause';
        }
        if (this.btnStop) this.btnStop.classList.add('hidden');
        if (this.btnReplay) this.btnReplay.classList.add('hidden');
        if (this.btnDelete) this.btnDelete.classList.add('hidden');
        if (this.recordedBadge) this.recordedBadge.classList.add('hidden');
        
        // Remove all markings
        this.section.classList.remove('recorded', 'is-recording', 'is-paused');
        
        window.audioRecorderManager.updateSectionCount();
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const seconds = Math.floor(elapsed / 1000);
            
            if (this.timer) {
                this.timer.textContent = window.Utils.formatDuration(seconds);
            }
            
            // Auto stop after maximum duration
            if (seconds >= window.APP_CONFIG.MAX_RECORDING_DURATION) {
                window.notificationSystem.info('Durée maximale de 2 minutes atteinte. Enregistrement arrêté automatiquement.', 'Limite atteinte', 5000);
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
        if (this.statusBadge) {
            this.statusBadge.setAttribute('data-status', status);
            this.statusBadge.textContent = text;
        }
    }

    getSupportedMimeType() {
        for (const type of window.APP_CONFIG.AUDIO_FORMATS.PRIORITY) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return ''; // Let browser choose
    }

    async getBase64Audio() {
        if (!this.audioBlob) return null;
        return window.Utils.fileToBase64(this.audioBlob);
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

    getDuration() {
        // Estimate duration based on file size and bitrate
        if (!this.audioBlob || this.audioBlob.size === 0) {
            return 0;
        }
        
        // Rough estimation: 128kbps = 16KB per second
        const estimatedDuration = Math.round(this.audioBlob.size / 16000);
        return Math.max(estimatedDuration, 1); // Minimum 1 second
    }

    validateRecording() {
        if (!this.audioBlob) {
            return { valid: false, error: 'Aucun enregistrement disponible' };
        }

        if (this.audioBlob.size > window.APP_CONFIG.MAX_FILE_SIZE) {
            return { 
                valid: false, 
                error: `Enregistrement trop volumineux. Limite: ${window.Utils.formatFileSize(window.APP_CONFIG.MAX_FILE_SIZE)}` 
            };
        }

        if (this.audioBlob.size === 0) {
            return { valid: false, error: 'Enregistrement vide' };
        }

        return { valid: true, error: null };
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioRecorder;
} else {
    window.AudioRecorder = AudioRecorder;
}