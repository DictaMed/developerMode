/**
 * DictaMed - Application de dictée médicale intelligente
 * Version améliorée avec correction du bug DMI
 * 
 * CORRECTION IMPORTANTE: 
 * - Variable 'texteLibre' renommée en 'dmiTexteLibre' pour éviter les conflits
 * - Variable 'photosUpload' renommée en 'dmiPhotosUpload'
 * - Stockage des photos DMI séparé dans 'dmiUploadedPhotos'
 */

'use strict';

// ===== CONFIGURATION =====
const CONFIG = {
    ENDPOINTS: {
        NORMAL: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedNormalMode',
        TEST: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed',
        DMI: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedDMI' // Endpoint séparé pour DMI
    },
    MAX_RECORDING_DURATION: 120, // 2 minutes en secondes
    MAX_PHOTO_SIZE: 10 * 1024 * 1024, // 10 MB
    MAX_PHOTOS: 5,
    AUTOSAVE_INTERVAL: 30000, // 30 secondes
    REQUEST_TIMEOUT: 30000 // 30 secondes
};

// ===== ÉTAT GLOBAL =====
const appState = {
    currentMode: 'normal',
    recordings: {
        normal: {},
        test: {}
    },
    autoSaveInterval: null,
    lastSaveTime: null
};

// Configuration des sections par mode
const sectionsConfig = {
    normal: ['partie1', 'partie2', 'partie3', 'partie4'],
    test: ['clinique', 'antecedents', 'biologie']
};

// Stockage des photos DMI (variable séparée pour éviter les conflits)
let dmiUploadedPhotos = [];

// ===== INITIALISATION DU MODE =====
function initializeMode() {
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        const tabId = activeTab.getAttribute('data-tab');
        if (tabId === 'mode-normal') {
            appState.currentMode = 'normal';
        } else if (tabId === 'mode-test') {
            appState.currentMode = 'test';
        }
    }
    console.log('Mode initial:', appState.currentMode);
}

// ===== SYSTÈME DE TOAST NOTIFICATIONS =====
const Toast = {
    container: null,
    
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'info', title = '', duration = 5000) {
        this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        const defaultTitles = {
            success: 'Succès',
            error: 'Erreur',
            warning: 'Attention',
            info: 'Information'
        };
        
        const toastTitle = title || defaultTitles[type];
        
        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <div class="toast-title">${toastTitle}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Fermer">×</button>
        `;
        
        this.container.appendChild(toast);
        
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.remove(toast));
        toast.addEventListener('click', (e) => {
            if (e.target !== closeBtn) {
                this.remove(toast);
            }
        });
        
        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }
        
        return toast;
    },
    
    remove(toast) {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    },
    
    success(message, title = '') { return this.show(message, 'success', title); },
    error(message, title = '') { return this.show(message, 'error', title); },
    warning(message, title = '') { return this.show(message, 'warning', title); },
    info(message, title = '') { return this.show(message, 'info', title); }
};

// ===== LOADING OVERLAY =====
const Loading = {
    overlay: null,
    
    show(text = 'Chargement...') {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'loading-overlay';
            this.overlay.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <div class="loading-text">${text}</div>
                </div>
            `;
            document.body.appendChild(this.overlay);
        }
    },
    
    hide() {
        if (this.overlay) {
            this.overlay.style.animation = 'fadeOut 0.2s ease forwards';
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                    this.overlay = null;
                }
            }, 200);
        }
    }
};

// ===== AUTO-SAVE AVEC LOCALSTORAGE =====
const AutoSave = {
    indicator: null,
    debounceTimer: null,
    
    init() {
        if (!this.indicator) {
            this.indicator = document.createElement('div');
            this.indicator.className = 'autosave-indicator';
            this.indicator.innerHTML = '<div class="icon"></div><span class="text">Sauvegarde automatique</span>';
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
                forms: {}
            };
            
            // Sauvegarder UNIQUEMENT l'authentification en mode normal
            if (mode === 'normal') {
                data.forms = {
                    username: document.getElementById('username')?.value || '',
                    accessCode: document.getElementById('accessCode')?.value || ''
                };
            }
            
            localStorage.setItem('dictamed_autosave', JSON.stringify(data));
            appState.lastSaveTime = Date.now();
            
            this.showIndicator('saved');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
    },
    
    restore() {
        try {
            const saved = localStorage.getItem('dictamed_autosave');
            if (!saved) return;
            
            const data = JSON.parse(saved);
            
            // Vérifier si les données ne sont pas trop anciennes (24h)
            const dayInMs = 24 * 60 * 60 * 1000;
            if (Date.now() - data.timestamp > dayInMs) {
                localStorage.removeItem('dictamed_autosave');
                return;
            }
            
            // Restaurer UNIQUEMENT l'authentification en mode normal
            if (data.mode === 'normal' && document.getElementById('username')) {
                Object.entries(data.forms).forEach(([key, value]) => {
                    const element = document.getElementById(key);
                    if (element && value) {
                        element.value = value;
                        element.dispatchEvent(new Event('input'));
                    }
                });
                
                Toast.info('Identifiants restaurés', 'Reprise de session');
            }
        } catch (error) {
            console.error('Erreur lors de la restauration:', error);
        }
    },
    
    startAutoSave() {
        appState.autoSaveInterval = setInterval(() => this.save(), CONFIG.AUTOSAVE_INTERVAL);
        
        const authInputs = document.querySelectorAll('#username, #accessCode');
        authInputs.forEach(input => {
            input.addEventListener('input', () => {
                clearTimeout(this.debounceTimer);
                this.showIndicator('saving');
                this.debounceTimer = setTimeout(() => this.save(), 2000);
            });
        });
    },
    
    showIndicator(state) {
        if (!this.indicator) return;
        
        this.indicator.className = 'autosave-indicator show ' + state;
        
        setTimeout(() => {
            this.indicator.classList.remove('show');
        }, 2000);
    },
    
    clear() {
        localStorage.removeItem('dictamed_autosave');
    }
};

// ===== NAVIGATION PAR ONGLETS =====
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
}

function switchTab(tabId) {
    // Désactiver tous les onglets et contenus
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Activer l'onglet et le contenu sélectionnés
    const tabBtn = document.querySelector(`[data-tab="${tabId}"]`);
    const tabContent = document.getElementById(tabId);
    
    if (tabBtn) {
        tabBtn.classList.add('active');
        tabBtn.setAttribute('aria-selected', 'true');
    }
    if (tabContent) {
        tabContent.classList.add('active');
    }

    // Mettre à jour le mode actuel
    if (tabId === 'mode-normal') {
        appState.currentMode = 'normal';
    } else if (tabId === 'mode-test') {
        appState.currentMode = 'test';
    }
    
    // Mettre à jour le compteur de sections pour le mode
    updateSectionCount();
}

// Rendre la fonction switchTab globale pour les boutons CTA
window.switchTab = switchTab;

// ===== COMPTEUR DE CARACTÈRES =====
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
                const maxLength = input.maxLength;
                counter.textContent = `${length}/${maxLength}`;

                counter.classList.remove('warning', 'danger');
                if (length >= maxLength) {
                    counter.classList.add('danger');
                } else if (length >= maxLength * 0.8) {
                    counter.classList.add('warning');
                }

                // Validation pour le mode DMI
                if (id === 'numeroDossierDMI') {
                    validateDMIMode();
                }
            });
        }
    });

    // Compteur pour le textarea DMI (variable renommée)
    const dmiTexteLibre = document.getElementById('dmiTexteLibre');
    const dmiTexteLibreCounter = document.getElementById('dmiTexteLibreCounter');
    if (dmiTexteLibre && dmiTexteLibreCounter) {
        dmiTexteLibre.addEventListener('input', () => {
            dmiTexteLibreCounter.textContent = dmiTexteLibre.value.length;
        });
    }
}

// ===== PARTIE 4 OPTIONNELLE =====
function initOptionalSection() {
    const toggleBtn = document.getElementById('togglePartie4');
    const partie4 = document.querySelector('[data-section="partie4"]');
    
    if (toggleBtn && partie4) {
        toggleBtn.addEventListener('click', () => {
            partie4.classList.toggle('hidden');
            toggleBtn.textContent = partie4.classList.contains('hidden') 
                ? 'Afficher Partie 4 (optionnelle)' 
                : 'Masquer Partie 4';
        });
    }
}

// ===== ENREGISTREMENT AUDIO =====
class AudioRecorder {
    constructor(sectionElement) {
        this.section = sectionElement;
        this.sectionId = sectionElement.getAttribute('data-section');
        this.sectionMode = sectionElement.getAttribute('data-mode') || 'normal';
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this.startTime = null;
        this.pausedTime = 0;
        this.timerInterval = null;
        this.audioBlob = null;
        
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
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Votre navigateur ne supporte pas l\'enregistrement audio.');
            }

            this.updateStatus('loading', '⏳ Accès au microphone...');
            this.btnRecord.disabled = true;

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
            console.log(`🎙️ Section ${this.sectionId} - Format audio: ${mimeType}`);
            
            const options = mimeType ? { mimeType, audioBitsPerSecond: 128000 } : {};
            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.audioChunks = [];

            this.mediaRecorder.addEventListener('dataavailable', event => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            });

            this.mediaRecorder.addEventListener('stop', () => {
                this.audioBlob = new Blob(this.audioChunks, { type: mimeType || 'audio/webm' });
                const audioUrl = URL.createObjectURL(this.audioBlob);
                this.audioPlayer.src = audioUrl;
                this.audioPlayer.classList.remove('hidden');
                
                const sizeMB = (this.audioBlob.size / (1024 * 1024)).toFixed(2);
                console.log(`✅ Section ${this.sectionId} - Enregistrement terminé: ${sizeMB} MB`);
                
                updateSectionCount();
            });

            this.mediaRecorder.addEventListener('error', (event) => {
                console.error('Erreur MediaRecorder:', event.error);
                Toast.error('Une erreur est survenue lors de l\'enregistrement.', 'Erreur');
                this.resetRecording();
            });

            this.mediaRecorder.start(1000);
            
            this.startTime = Date.now() - this.pausedTime;
            this.startTimer();
            
            this.updateStatus('recording', '🔴 En cours');
            this.btnRecord.classList.add('hidden');
            this.btnRecord.disabled = false;
            this.btnPause.classList.remove('hidden');
            this.btnStop.classList.remove('hidden');
            
            this.section.classList.add('is-recording');

        } catch (error) {
            console.error('Erreur d\'accès au microphone:', error);
            
            let errorMessage = 'Erreur : Impossible d\'accéder au microphone.';
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = '🎤 Accès refusé au microphone.\n\nVeuillez autoriser l\'accès dans les paramètres.';
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage = '🎤 Aucun microphone détecté.\n\nVeuillez connecter un microphone.';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage = '🎤 Microphone déjà utilisé.\n\nFermez les autres applications.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            Toast.error(errorMessage, 'Accès au microphone');
            this.resetRecording();
        }
    }

    pauseRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause();
            this.pausedTime = Date.now() - this.startTime;
            this.stopTimer();
            this.updateStatus('paused', '⏸️ En pause');
            this.btnPause.textContent = '▶️ Reprendre';
            this.btnPause.classList.add('btn-resume');
            this.section.classList.remove('is-recording');
            this.section.classList.add('is-paused');
        } else if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume();
            this.startTime = Date.now() - this.pausedTime;
            this.startTimer();
            this.updateStatus('recording', '🔴 En cours');
            this.btnPause.textContent = '⏸️ Pause';
            this.btnPause.classList.remove('btn-resume');
            this.section.classList.remove('is-paused');
            this.section.classList.add('is-recording');
        }
    }

    stopRecording() {
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
            this.stopTimer();
            
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }

            this.updateStatus('ready', 'Prêt');
            this.btnRecord.classList.add('hidden');
            this.btnPause.classList.add('hidden');
            this.btnPause.textContent = '⏸️ Pause';
            this.btnPause.classList.remove('btn-resume');
            this.btnStop.classList.add('hidden');
            this.btnReplay.classList.remove('hidden');
            this.btnDelete.classList.remove('hidden');
            this.recordedBadge.classList.remove('hidden');
            
            this.section.classList.remove('is-recording', 'is-paused');
            this.section.classList.add('recorded');
            
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
        if (confirm('⚠️ Êtes-vous sûr de vouloir supprimer cet enregistrement ?')) {
            this.resetRecording();
        }
    }

    resetRecording() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        this.audioBlob = null;
        this.audioChunks = [];
        this.pausedTime = 0;
        this.timer.textContent = '00:00';
        this.audioPlayer.src = '';
        this.audioPlayer.classList.add('hidden');
        this.stopTimer();
        
        this.updateStatus('ready', '⚪ Prêt');
        this.btnRecord.classList.remove('hidden');
        this.btnRecord.disabled = false;
        this.btnPause.classList.add('hidden');
        this.btnPause.textContent = '⏸️ Pause';
        this.btnPause.classList.remove('btn-resume');
        this.btnStop.classList.add('hidden');
        this.btnReplay.classList.add('hidden');
        this.btnDelete.classList.add('hidden');
        this.recordedBadge.classList.add('hidden');
        
        this.section.classList.remove('recorded', 'is-recording', 'is-paused');
        
        updateSectionCount();
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            this.timer.textContent = 
                `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
            
            if (seconds >= CONFIG.MAX_RECORDING_DURATION) {
                Toast.info('Durée maximale atteinte. Enregistrement arrêté.', 'Limite atteinte', 5000);
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
        const types = [
            'audio/mpeg',
            'audio/mp4',
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/wav'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        return '';
    }

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
        return this.audioBlob ? this.audioBlob.type : 'audio/webm';
    }

    hasRecording() {
        return this.audioBlob !== null;
    }

    validateRecording() {
        if (!this.audioBlob) {
            return { valid: false, error: 'Aucun enregistrement disponible' };
        }

        const maxSize = 50 * 1024 * 1024; // 50MB
        if (this.audioBlob.size > maxSize) {
            return { valid: false, error: `Fichier trop volumineux` };
        }

        if (this.audioBlob.size === 0) {
            return { valid: false, error: 'Enregistrement vide' };
        }

        return { valid: true, error: null };
    }
}

// Initialiser les enregistreurs audio
const audioRecorders = new Map();

function initAudioRecorders() {
    const recordingSections = document.querySelectorAll('.recording-section');
    
    recordingSections.forEach(section => {
        const sectionId = section.getAttribute('data-section');
        const recorder = new AudioRecorder(section);
        audioRecorders.set(sectionId, recorder);
    });
}

// ===== COMPTEUR DE SECTIONS =====
function updateSectionCount() {
    const mode = appState.currentMode;
    const sections = sectionsConfig[mode];
    
    if (!sections) return;
    
    let count = 0;

    sections.forEach(sectionId => {
        const recorder = audioRecorders.get(sectionId);
        if (recorder && recorder.hasRecording()) {
            count++;
        }
    });

    // Mettre à jour l'affichage pour le mode courant
    const countElement = document.querySelector(`.sections-count[data-mode="${mode}"]`);
    if (countElement) {
        countElement.textContent = `${count} section(s) enregistrée(s)`;
    }

    // Activer/désactiver le bouton d'envoi
    const submitBtn = mode === 'normal' 
        ? document.getElementById('submitNormal')
        : document.getElementById('submitTest');
    
    if (submitBtn) {
        submitBtn.disabled = count === 0;
    }
}

// ===== RÉCAPITULATIF AVANT ENVOI =====
function showSendSummary(mode) {
    const isTest = mode === 'test';
    const numeroDossier = document.getElementById(isTest ? 'numeroDossierTest' : 'numeroDossier')?.value || '';
    const nomPatient = document.getElementById(isTest ? 'nomPatientTest' : 'nomPatient')?.value || '';
    const sections = isTest ? ['clinique', 'antecedents', 'biologie'] : ['partie1', 'partie2', 'partie3', 'partie4'];
    
    let summary = `📋 Récapitulatif (${mode.toUpperCase()}):\n\n`;
    summary += `👤 Patient: ${numeroDossier} - ${nomPatient}\n`;
    summary += `📊 Sections enregistrées:\n`;
    
    let sectionCount = 0;
    sections.forEach(sectionId => {
        const recorder = audioRecorders.get(sectionId);
        if (recorder && recorder.hasRecording()) {
            const validation = recorder.validateRecording();
            sectionCount++;
            const size = recorder.audioBlob ? (recorder.audioBlob.size / 1024).toFixed(1) : '0';
            summary += `   ✅ ${sectionId}: ${size}KB\n`;
        }
    });
    
    if (sectionCount === 0) {
        summary += '   ❌ Aucune section enregistrée\n';
    }
    
    return summary;
}

// ===== ENVOI DES DONNÉES =====
async function sendData(mode) {
    try {
        const submitBtn = mode === 'normal' 
            ? document.getElementById('submitNormal')
            : document.getElementById('submitTest');
        
        if (!submitBtn) {
            console.error('Bouton d\'envoi non trouvé pour le mode:', mode);
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours...';

        const summary = showSendSummary(mode);
        console.log('📋', summary);
        Toast.info('Vérification des données...', 'Préparation', 2000);

        const payload = await preparePayload(mode);
        
        if (!payload) {
            const errorMsg = mode === 'normal' 
                ? 'Veuillez remplir tous les champs obligatoires et enregistrer au moins une section.'
                : 'Veuillez remplir le numéro de dossier et le nom du patient, et enregistrer au moins une section.';
            
            Toast.warning(errorMsg, 'Champs manquants');
            submitBtn.disabled = false;
            submitBtn.textContent = mode === 'normal' ? 'Envoyer les données' : 'Envoyer les données Test';
            return;
        }

        const hasRecordings = Object.keys(payload.sections || {}).length > 0;
        if (!hasRecordings) {
            Toast.warning('Veuillez enregistrer au moins une section.', 'Aucun enregistrement');
            submitBtn.disabled = false;
            submitBtn.textContent = mode === 'normal' ? 'Envoyer les données' : 'Envoyer les données Test';
            return;
        }

        const endpoint = mode === 'normal' ? CONFIG.ENDPOINTS.NORMAL : CONFIG.ENDPOINTS.TEST;

        console.log('🔄 Envoi vers:', endpoint);
        submitBtn.textContent = 'Transmission en cours...';

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
                setTimeout(() => reject(new Error('Timeout')), CONFIG.REQUEST_TIMEOUT)
            )
        ]);

        if (response.ok) {
            Toast.success('Vos données ont été envoyées avec succès !', 'Envoi réussi');
            
            if (mode === 'test') {
                const googleSheetCard = document.getElementById('googleSheetCard');
                if (googleSheetCard) {
                    googleSheetCard.style.display = 'block';
                    googleSheetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                
                setTimeout(() => {
                    Toast.info('Consultez le Google Sheet pour voir vos données.', 'Résultats disponibles', 8000);
                }, 1000);
            } else {
                resetForm(mode);
                AutoSave.clear();
                Toast.success('Formulaire réinitialisé.', 'Prêt', 3000);
            }
        } else {
            let errorMessage = `Erreur serveur (${response.status})`;
            
            if (response.status === 413) {
                errorMessage = 'Fichiers audio trop volumineux.';
            } else if (response.status === 400) {
                errorMessage = 'Données non valides.';
            } else if (response.status >= 500) {
                errorMessage = 'Erreur serveur. Veuillez réessayer.';
            }
            
            Toast.error(errorMessage, 'Erreur d\'envoi');
        }

    } catch (error) {
        console.error('Erreur lors de l\'envoi:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            Toast.error('Impossible de contacter le serveur.', 'Erreur réseau');
        } else if (error.message.includes('Timeout')) {
            Toast.error('La connexion a pris trop de temps.', 'Timeout');
        } else {
            Toast.error(`Erreur: ${error.message}`, 'Erreur technique');
        }
    } finally {
        const submitBtn = mode === 'normal' 
            ? document.getElementById('submitNormal')
            : document.getElementById('submitTest');
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = mode === 'normal' ? 'Envoyer les données' : 'Envoyer les données Test';
        }
    }
}

async function preparePayload(mode) {
    const payload = {
        mode: mode,
        recordedAt: new Date().toISOString(),
        sections: {}
    };

    try {
        if (mode === 'normal') {
            const username = document.getElementById('username')?.value.trim();
            const accessCode = document.getElementById('accessCode')?.value.trim();
            const numeroDossier = document.getElementById('numeroDossier')?.value.trim();
            const nomPatient = document.getElementById('nomPatient')?.value.trim();

            const missingFields = [];
            if (!username) missingFields.push('identifiant');
            if (!accessCode) missingFields.push('code d\'accès');
            if (!numeroDossier) missingFields.push('numéro de dossier');
            if (!nomPatient) missingFields.push('nom du patient');

            if (missingFields.length > 0) {
                console.warn('Champs manquants:', missingFields);
                return null;
            }

            payload.username = username;
            payload.accessCode = accessCode;
            payload.NumeroDeDossier = numeroDossier;
            payload.NomDuPatient = nomPatient;

            const sections = ['partie1', 'partie2', 'partie3', 'partie4'];
            let index = 0;
            let hasValidRecording = false;
            
            for (const sectionId of sections) {
                const recorder = audioRecorders.get(sectionId);
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
                            fileSize: recorder.audioBlob.size
                        };
                        
                        hasValidRecording = true;
                    } catch (sectionError) {
                        console.error(`Erreur section ${sectionId}:`, sectionError);
                    }
                }
            }

            if (!hasValidRecording) return null;

        } else {
            const numeroDossier = document.getElementById('numeroDossierTest')?.value.trim();
            const nomPatient = document.getElementById('nomPatientTest')?.value.trim();

            const missingFields = [];
            if (!numeroDossier) missingFields.push('numéro de dossier');
            if (!nomPatient) missingFields.push('nom du patient');

            if (missingFields.length > 0) return null;

            payload.NumeroDeDossier = numeroDossier;
            payload.NomDuPatient = nomPatient;

            const sections = ['clinique', 'antecedents', 'biologie'];
            let index = 0;
            let hasValidRecording = false;
            
            for (const sectionId of sections) {
                const recorder = audioRecorders.get(sectionId);
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
                            fileSize: recorder.audioBlob.size
                        };
                        
                        hasValidRecording = true;
                    } catch (sectionError) {
                        console.error(`Erreur section ${sectionId}:`, sectionError);
                    }
                }
            }

            if (!hasValidRecording) return null;
        }

        if (Object.keys(payload.sections).length === 0) return null;

        return payload;
        
    } catch (error) {
        console.error('Erreur préparation payload:', error);
        return null;
    }
}

function resetForm(mode) {
    if (mode === 'normal') {
        document.getElementById('username').value = '';
        document.getElementById('accessCode').value = '';
        document.getElementById('numeroDossier').value = '';
        document.getElementById('nomPatient').value = '';
        
        ['numeroDossierCounter', 'nomPatientCounter'].forEach(counterId => {
            const counter = document.getElementById(counterId);
            if (counter) counter.textContent = '0/50';
        });
        
        ['partie1', 'partie2', 'partie3', 'partie4'].forEach(sectionId => {
            const recorder = audioRecorders.get(sectionId);
            if (recorder && recorder.hasRecording()) {
                recorder.resetRecording();
            }
        });
    } else {
        document.getElementById('numeroDossierTest').value = '';
        document.getElementById('nomPatientTest').value = '';
        
        ['numeroDossierTestCounter', 'nomPatientTestCounter'].forEach(counterId => {
            const counter = document.getElementById(counterId);
            if (counter) counter.textContent = '0/50';
        });
        
        ['clinique', 'antecedents', 'biologie'].forEach(sectionId => {
            const recorder = audioRecorders.get(sectionId);
            if (recorder && recorder.hasRecording()) {
                recorder.resetRecording();
            }
        });
    }
    
    updateSectionCount();
}

// ===== MODE DMI - FONCTIONS SPÉCIFIQUES =====
// CORRECTION: Variables renommées pour éviter les conflits avec le mode Test

function validateDMIMode() {
    const numeroDossier = document.getElementById('numeroDossierDMI')?.value.trim();
    const submitBtn = document.getElementById('submitDMI');
    
    if (submitBtn) {
        submitBtn.disabled = !numeroDossier;
    }
}

function initDMIPhotosUpload() {
    // CORRECTION: ID renommé de 'photosUpload' à 'dmiPhotosUpload'
    const photosInput = document.getElementById('dmiPhotosUpload');
    const photosPreview = document.getElementById('dmiPhotosPreview');
    
    if (!photosInput || !photosPreview) return;
    
    photosInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        
        if (dmiUploadedPhotos.length + files.length > CONFIG.MAX_PHOTOS) {
            Toast.warning(`Limite de ${CONFIG.MAX_PHOTOS} photos atteinte.`, 'Limite atteinte');
            return;
        }
        
        files.forEach(file => {
            if (!file.type.startsWith('image/')) {
                Toast.error(`"${file.name}" n'est pas une image valide.`, 'Format non supporté');
                return;
            }
            
            if (file.size > CONFIG.MAX_PHOTO_SIZE) {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                Toast.error(`"${file.name}" est trop volumineux (${sizeMB} MB).`, 'Fichier trop lourd');
                return;
            }
            
            dmiUploadedPhotos.push(file);
        });
        
        photosInput.value = '';
        updateDMIPhotosPreview();
    });
}

function updateDMIPhotosPreview() {
    const photosPreview = document.getElementById('dmiPhotosPreview');
    if (!photosPreview) return;
    
    photosPreview.innerHTML = '';
    
    dmiUploadedPhotos.forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            
            photoItem.innerHTML = `
                <img src="${e.target.result}" alt="Photo ${index + 1}">
                <button class="photo-item-remove" data-index="${index}" title="Supprimer">×</button>
                <div class="photo-item-info">${file.name}</div>
            `;
            
            photosPreview.appendChild(photoItem);
            
            const removeBtn = photoItem.querySelector('.photo-item-remove');
            removeBtn.addEventListener('click', () => {
                dmiUploadedPhotos.splice(index, 1);
                updateDMIPhotosPreview();
            });
        };
        
        reader.readAsDataURL(file);
    });
}

// Convertir un fichier en Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Envoi des données DMI
async function sendDmiData() {
    try {
        const submitBtn = document.getElementById('submitDMI');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours...';

        // CORRECTION: Variables renommées
        const numeroDossier = document.getElementById('numeroDossierDMI')?.value.trim();
        const nomPatient = document.getElementById('nomPatientDMI')?.value.trim();
        const dmiTexte = document.getElementById('dmiTexteLibre')?.value.trim(); // Variable renommée

        if (!numeroDossier) {
            Toast.warning('Le numéro de dossier est obligatoire.', 'Champ requis');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Envoyer les données DMI';
            return;
        }

        // Vérifier qu'il y a du contenu à envoyer
        if (!dmiTexte && dmiUploadedPhotos.length === 0) {
            Toast.warning('Veuillez saisir du texte ou ajouter des photos.', 'Contenu requis');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Envoyer les données DMI';
            return;
        }

        const payload = {
            mode: 'dmi',
            recordedAt: new Date().toISOString(),
            NumeroDeDossier: numeroDossier,
            NomDuPatient: nomPatient,
            dmiTexte: dmiTexte, // CORRECTION: Variable renommée de 'texte' à 'dmiTexte'
            photos: []
        };

        // Convertir les photos en Base64
        for (const file of dmiUploadedPhotos) {
            const base64 = await fileToBase64(file);
            payload.photos.push({
                fileName: file.name,
                mimeType: file.type,
                size: file.size,
                base64: base64
            });
        }

        console.log('🔄 Envoi DMI vers:', CONFIG.ENDPOINTS.DMI);
        console.log('📊 Payload DMI:', {
            mode: payload.mode,
            patient: `${payload.NumeroDeDossier} - ${payload.NomDuPatient || 'N/A'}`,
            texteLength: payload.dmiTexte?.length || 0,
            photosCount: payload.photos.length
        });

        submitBtn.textContent = 'Transmission en cours...';

        const response = await Promise.race([
            fetch(CONFIG.ENDPOINTS.DMI, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), CONFIG.REQUEST_TIMEOUT)
            )
        ]);

        if (response.ok) {
            Toast.success('Données DMI envoyées avec succès !', 'Envoi réussi');
            
            if (confirm('Voulez-vous réinitialiser le formulaire DMI ?')) {
                resetDmiForm();
            }
        } else {
            const errorText = await response.text();
            Toast.error(`Erreur serveur (${response.status}). Veuillez réessayer.`, 'Erreur d\'envoi');
            console.error('Détails:', errorText);
        }

    } catch (error) {
        console.error('Erreur lors de l\'envoi DMI:', error);
        
        if (error.message.includes('Timeout')) {
            Toast.error('La connexion a pris trop de temps.', 'Timeout');
        } else {
            Toast.error('Impossible de contacter le serveur.', 'Erreur réseau');
        }
    } finally {
        const submitBtn = document.getElementById('submitDMI');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Envoyer les données DMI';
    }
}

// Réinitialiser le formulaire mode DMI
function resetDmiForm() {
    document.getElementById('numeroDossierDMI').value = '';
    document.getElementById('nomPatientDMI').value = '';
    document.getElementById('dmiTexteLibre').value = ''; // Variable renommée
    document.getElementById('dmiTexteLibreCounter').textContent = '0';
    document.getElementById('numeroDossierDMICounter').textContent = '0/50';
    document.getElementById('nomPatientDMICounter').textContent = '0/100';
    
    dmiUploadedPhotos = [];
    updateDMIPhotosPreview();
    validateDMIMode();
}

// ===== GESTION DE LA SAUVEGARDE DES DONNÉES D'AUTHENTIFICATION =====
const AuthManager = {
    STORAGE_KEY: 'dictamed_auth_credentials',
    
    saveCredentials() {
        const username = document.getElementById('username')?.value.trim();
        const accessCode = document.getElementById('accessCode')?.value.trim();
        const rememberAuth = document.getElementById('rememberAuth')?.checked;
        
        if (rememberAuth && username && accessCode) {
            const credentials = {
                username: username,
                accessCode: accessCode,
                savedAt: new Date().toISOString()
            };
            
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(credentials));
                Toast.success('Identifiants enregistrés.', 'Sauvegarde réussie');
            } catch (e) {
                console.error('Erreur sauvegarde:', e);
                Toast.error('Impossible de sauvegarder.', 'Erreur');
            }
        } else if (!rememberAuth) {
            this.clearCredentials();
        }
    },
    
    restoreCredentials() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const credentials = JSON.parse(saved);
                const usernameInput = document.getElementById('username');
                const accessCodeInput = document.getElementById('accessCode');
                const rememberAuthCheckbox = document.getElementById('rememberAuth');
                
                if (usernameInput && accessCodeInput && rememberAuthCheckbox) {
                    usernameInput.value = credentials.username || '';
                    accessCodeInput.value = credentials.accessCode || '';
                    rememberAuthCheckbox.checked = true;
                }
            }
        } catch (e) {
            console.error('Erreur restauration:', e);
        }
    },
    
    clearCredentials() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (e) {
            console.error('Erreur effacement:', e);
        }
    },
    
    init() {
        this.restoreCredentials();
        
        const rememberAuthCheckbox = document.getElementById('rememberAuth');
        if (rememberAuthCheckbox) {
            rememberAuthCheckbox.addEventListener('change', () => {
                if (rememberAuthCheckbox.checked) {
                    this.saveCredentials();
                } else {
                    this.clearCredentials();
                    Toast.info('Identifiants ne seront plus enregistrés.', 'Information');
                }
            });
        }
        
        const usernameInput = document.getElementById('username');
        const accessCodeInput = document.getElementById('accessCode');
        
        [usernameInput, accessCodeInput].forEach(input => {
            if (input) {
                input.addEventListener('blur', () => {
                    const rememberAuth = document.getElementById('rememberAuth')?.checked;
                    if (rememberAuth) {
                        this.saveCredentials();
                    }
                });
            }
        });
    }
};

// ===== MASQUER LE MESSAGE DE SWIPE APRÈS INTERACTION =====
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
        
        // Masquer après 10 secondes si pas de scroll
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

// ===== INITIALISATION PRINCIPALE =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initialisation de DictaMed...');
    
    // Initialiser le mode selon l'onglet actif
    initializeMode();
    
    // Initialiser les systèmes de base
    Toast.init();
    AutoSave.init();
    
    // Initialiser les composants
    initTabs();
    initCharCounters();
    initOptionalSection();
    initAudioRecorders();
    initDMIPhotosUpload(); // CORRECTION: Fonction renommée
    initSwipeHint();
    
    updateSectionCount();
    validateDMIMode();

    // Événements pour les boutons d'envoi
    const submitNormalBtn = document.getElementById('submitNormal');
    const submitTestBtn = document.getElementById('submitTest');
    const submitDmiBtn = document.getElementById('submitDMI');

    if (submitNormalBtn) {
        submitNormalBtn.addEventListener('click', () => {
            Loading.show('Envoi en cours...');
            sendData('normal').finally(() => Loading.hide());
        });
    }

    if (submitTestBtn) {
        submitTestBtn.addEventListener('click', () => {
            Loading.show('Envoi en cours...');
            sendData('test').finally(() => Loading.hide());
        });
    }

    if (submitDmiBtn) {
        submitDmiBtn.addEventListener('click', () => {
            Loading.show('Envoi en cours...');
            sendDmiData().finally(() => Loading.hide());
        });
    }

    // Initialiser AuthManager
    AuthManager.init();

    console.log('✅ DictaMed initialisé avec succès!');
});
