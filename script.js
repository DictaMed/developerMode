// État global de l'application
const appState = {
    currentMode: 'normal',
    recordings: {
        normal: {},
        test: {}
    },
    autoSaveInterval: null,
    lastSaveTime: null
};

// Initialiser le mode actuel au démarrage selon l'onglet actif
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

// ===== SYSTÈME DE TOAST NOTIFICATIONS (UNIQUEMENT ERREURS) =====
const Toast = {
    container: null,
    
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'error', title = '', duration = 5000) {
        this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            error: '✕',
            warning: '⚠'
        };
        
        const defaultTitles = {
            error: 'Erreur',
            warning: 'Attention'
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
    
    error(message, title = '') {
        return this.show(message, 'error', title);
    },
    
    warning(message, title = '') {
        return this.show(message, 'warning', title);
    }
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

// ===== AUTO-SAVE (UNIQUEMENT AUTHENTIFICATION) =====
const AutoSave = {
    init() {
        this.restore();
        this.startAutoSave();
    },
    
    save() {
        try {
            const mode = appState.currentMode;
            
            if (mode === 'normal') {
                const rememberAuth = document.getElementById('rememberAuth')?.checked;
                if (rememberAuth) {
                    const username = document.getElementById('username')?.value || '';
                    const accessCode = document.getElementById('accessCode')?.value || '';
                    
                    if (username && accessCode) {
                        const data = {
                            mode,
                            timestamp: Date.now(),
                            forms: { username, accessCode }
                        };
                        localStorage.setItem('dictamed_autosave', JSON.stringify(data));
                        appState.lastSaveTime = Date.now();
                    }
                }
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
    },
    
    restore() {
        try {
            const saved = localStorage.getItem('dictamed_autosave');
            if (!saved) return;
            
            const data = JSON.parse(saved);
            
            const dayInMs = 24 * 60 * 60 * 1000;
            if (Date.now() - data.timestamp > dayInMs) {
                localStorage.removeItem('dictamed_autosave');
                return;
            }
            
            if (data.mode === 'normal' && document.getElementById('username')) {
                Object.entries(data.forms).forEach(([key, value]) => {
                    const element = document.getElementById(key);
                    if (element && value) {
                        element.value = value;
                        element.dispatchEvent(new Event('input'));
                    }
                });
            }
        } catch (error) {
            console.error('Erreur lors de la restauration:', error);
        }
    },
    
    startAutoSave() {
        appState.autoSaveInterval = setInterval(() => {
            this.save();
        }, 30000);
    },
    
    clear() {
        localStorage.removeItem('dictamed_autosave');
    }
};

// Configuration des sections par mode
const sectionsConfig = {
    normal: ['partie1', 'partie2', 'partie3', 'partie4'],
    test: ['clinique', 'antecedents', 'biologie']
};

// Gestion des photos pour le mode mode DMI
let uploadedPhotos = [];

// ===== NAVIGATION PAR ONGLETS =====
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
    document.getElementById(tabId)?.classList.add('active');

    if (tabId === 'mode-normal') {
        appState.currentMode = 'normal';
    } else if (tabId === 'mode-test') {
        appState.currentMode = 'test';
    }
}

window.switchTab = switchTab;

// ===== COMPTEUR DE CARACTÈRES =====
function initCharCounters() {
    const inputs = [
        { id: 'numeroDossier', counterId: 'numeroDossierCounter' },
        { id: 'nomPatient', counterId: 'nomPatientCounter' },
        { id: 'numeroDossierTest', counterId: 'numeroDossierTestCounter' },
        { id: 'nomPatientTest', counterId: 'nomPatientTestCounter' },
        { id: 'numeroDossierTexte', counterId: 'numeroDossierTexteCounter' },
        { id: 'nomPatientTexte', counterId: 'nomPatientTexteCounter' }
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

                if (id === 'numeroDossierTexte') {
                    validateTexteMode();
                }
            });
        }
    });

    const texteLibre = document.getElementById('texteLibre');
    const texteLibreCounter = document.getElementById('texteLibreCounter');
    if (texteLibre && texteLibreCounter) {
        texteLibre.addEventListener('input', () => {
            texteLibreCounter.textContent = texteLibre.value.length;
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
                throw new Error('Votre navigateur ne supporte pas l\'enregistrement audio. Veuillez utiliser un navigateur moderne (Chrome, Firefox, Edge, Safari).');
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
            console.log('Format audio utilisé:', mimeType);
            
            const options = mimeType ? { mimeType, audioBitsPerSecond: 128000 } : {};
            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.audioChunks = [];

            this.mediaRecorder.addEventListener('dataavailable', event => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                    console.log(`📦 Chunk audio capturé: ${event.data.size} bytes`);
                }
            });

            this.mediaRecorder.addEventListener('stop', () => {
                this.audioBlob = new Blob(this.audioChunks, { type: mimeType || 'audio/webm' });
                const audioUrl = URL.createObjectURL(this.audioBlob);
                this.audioPlayer.src = audioUrl;
                this.audioPlayer.classList.remove('hidden');
                
                const sizeMB = (this.audioBlob.size / (1024 * 1024)).toFixed(2);
                console.log(`✅ Enregistrement terminé: ${sizeMB} MB`);
                
                updateSectionCount();
            });

            this.mediaRecorder.addEventListener('error', (event) => {
                console.error('Erreur MediaRecorder:', event.error);
                Toast.error('Une erreur est survenue lors de l\'enregistrement. Veuillez réessayer.', 'Erreur d\'enregistrement');
                this.resetRecording();
            });

            this.mediaRecorder.start(1000);
            console.log(`🎙️ Enregistrement démarré avec timeslice=1000ms`);
            
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
                errorMessage = '🎤 Accès refusé au microphone.\n\nVeuillez autoriser l\'accès au microphone dans les paramètres de votre navigateur et réessayer.';
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage = '🎤 Aucun microphone détecté.\n\nVeuillez connecter un microphone et réessayer.';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage = '🎤 Microphone déjà utilisé.\n\nFermez les autres applications utilisant le microphone et réessayer.';
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
        if (confirm('⚠️ Êtes-vous sûr de vouloir supprimer cet enregistrement ?\n\nCette action est irréversible.')) {
            this.resetRecording();
        }
    }

    resetRecording() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.mediaRecorder) {
            this.mediaRecorder = null;
        }

        this.audioChunks = [];
        this.audioBlob = null;
        this.pausedTime = 0;
        this.stopTimer();

        this.timer.textContent = '00:00';
        this.audioPlayer.src = '';
        this.audioPlayer.classList.add('hidden');
        this.recordedBadge.classList.add('hidden');

        this.updateStatus('ready', 'Prêt');
        this.btnRecord.classList.remove('hidden');
        this.btnPause.classList.add('hidden');
        this.btnStop.classList.add('hidden');
        this.btnReplay.classList.add('hidden');
        this.btnDelete.classList.add('hidden');

        this.section.classList.remove('recorded', 'is-recording', 'is-paused');
        
        updateSectionCount();
    }

    startTimer() {
        const MAX_DURATION = 120;
        
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            this.timer.textContent = 
                `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
            
            if (seconds >= MAX_DURATION) {
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
        return this.audioBlob ? this.audioBlob.type : 'audio/mpeg';
    }

    hasRecording() {
        return this.audioBlob !== null;
    }
}

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
    let count = 0;

    sections.forEach(sectionId => {
        const recorder = audioRecorders.get(sectionId);
        if (recorder && recorder.hasRecording()) {
            count++;
        }
    });

    const countElements = document.querySelectorAll('.sections-count');
    countElements.forEach(el => {
        if (el.closest(`#mode-${mode}`)) {
            el.textContent = `${count} section(s) enregistrée(s)`;
        }
    });

    const submitBtn = mode === 'normal' 
        ? document.getElementById('submitNormal')
        : document.getElementById('submitTest');
    
    if (submitBtn) {
        submitBtn.disabled = count === 0;
    }
}

// ===== ENVOI DES DONNÉES =====
async function sendData(mode) {
    try {
        const submitBtn = mode === 'normal' 
            ? document.getElementById('submitNormal')
            : document.getElementById('submitTest');
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours...';

        const payload = await preparePayload(mode);
        
        if (!payload) {
            Toast.warning('Veuillez remplir tous les champs obligatoires avant d\'envoyer.', 'Champs manquants');
            submitBtn.disabled = false;
            submitBtn.textContent = mode === 'normal' ? 'Envoyer les données' : 'Envoyer les données Test';
            return;
        }

        const endpoint = mode === 'normal'
            ? 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedNormalMode'
            : 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            if (mode === 'test') {
                const googleSheetCard = document.getElementById('googleSheetCard');
                if (googleSheetCard) {
                    googleSheetCard.style.display = 'block';
                    googleSheetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                resetForm(mode);
                AutoSave.clear();
            }
        } else {
            const errorText = await response.text();
            Toast.error(`Le serveur a renvoyé une erreur (${response.status}). Veuillez réessayer ou contactez le support.`, 'Erreur d\'envoi');
            console.error('Détails:', errorText);
        }

    } catch (error) {
        console.error('Erreur lors de l\'envoi:', error);
        Toast.error('Impossible de contacter le serveur. Vérifiez votre connexion Internet.', 'Erreur réseau');
    } finally {
        const submitBtn = mode === 'normal' 
            ? document.getElementById('submitNormal')
            : document.getElementById('submitTest');
        submitBtn.disabled = false;
        submitBtn.textContent = mode === 'normal' ? 'Envoyer les données' : 'Envoyer les données Test';
    }
}

async function preparePayload(mode) {
    const payload = {
        mode: mode,
        recordedAt: new Date().toISOString(),
        sections: {}
    };

    if (mode === 'normal') {
        const username = document.getElementById('username').value.trim();
        const accessCode = document.getElementById('accessCode').value.trim();
        const numeroDossier = document.getElementById('numeroDossier').value.trim();
        const nomPatient = document.getElementById('nomPatient').value.trim();

        if (!username || !accessCode || !numeroDossier || !nomPatient) {
            return null;
        }

        payload.username = username;
        payload.accessCode = accessCode;
        payload.NumeroDeDossier = numeroDossier;
        payload.NomDuPatient = nomPatient;

        const sections = ['partie1', 'partie2', 'partie3', 'partie4'];
        let index = 0;
        
        for (const sectionId of sections) {
            const recorder = audioRecorders.get(sectionId);
            if (recorder && recorder.hasRecording()) {
                index++;
                const base64 = await recorder.getBase64Audio();
                const format = recorder.getAudioFormat();
                
                payload.sections[sectionId] = {
                    audioBase64: base64,
                    fileName: `msgVocal${index}.${format}`,
                    mimeType: recorder.getMimeType(),
                    format: format
                };
            }
        }

    } else {
        const numeroDossier = document.getElementById('numeroDossierTest').value.trim();
        const nomPatient = document.getElementById('nomPatientTest').value.trim();

        if (!numeroDossier || !nomPatient) {
            return null;
        }

        payload.NumeroDeDossier = numeroDossier;
        payload.NomDuPatient = nomPatient;

        const sections = ['clinique', 'antecedents', 'biologie'];
        let index = 0;
        
        for (const sectionId of sections) {
            const recorder = audioRecorders.get(sectionId);
            if (recorder && recorder.hasRecording()) {
                index++;
                const base64 = await recorder.getBase64Audio();
                const format = recorder.getAudioFormat();
                
                payload.sections[sectionId] = {
                    audioBase64: base64,
                    fileName: `msgVocal${index}.${format}`,
                    mimeType: recorder.getMimeType(),
                    format: format
                };
            }
        }
    }

    return payload;
}

function resetForm(mode) {
    if (mode === 'normal') {
        document.getElementById('username').value = '';
        document.getElementById('accessCode').value = '';
        document.getElementById('numeroDossier').value = '';
        document.getElementById('nomPatient').value = '';
        
        const counters = [
            { input: 'numeroDossier', counter: 'numeroDossierCounter' },
            { input: 'nomPatient', counter: 'nomPatientCounter' }
        ];
        counters.forEach(({ counter }) => {
            const counterEl = document.getElementById(counter);
            if (counterEl) counterEl.textContent = '0/50';
        });
        
        const sections = ['partie1', 'partie2', 'partie3', 'partie4'];
        sections.forEach(sectionId => {
            const recorder = audioRecorders.get(sectionId);
            if (recorder && recorder.hasRecording()) {
                recorder.resetRecording();
            }
        });
    } else {
        document.getElementById('numeroDossierTest').value = '';
        document.getElementById('nomPatientTest').value = '';
        
        const counters = [
            { input: 'numeroDossierTest', counter: 'numeroDossierTestCounter' },
            { input: 'nomPatientTest', counter: 'nomPatientTestCounter' }
        ];
        counters.forEach(({ counter }) => {
            const counterEl = document.getElementById(counter);
            if (counterEl) counterEl.textContent = '0/50';
        });
        
        const sections = ['clinique', 'antecedents', 'biologie'];
        sections.forEach(sectionId => {
            const recorder = audioRecorders.get(sectionId);
            if (recorder && recorder.hasRecording()) {
                recorder.resetRecording();
            }
        });
    }
    
    updateSectionCount();
}

// ===== MODE SAISIE TEXTE =====
function validateTexteMode() {
    const numeroDossier = document.getElementById('numeroDossierTexte').value.trim();
    const submitBtn = document.getElementById('submitTexte');
    
    if (submitBtn) {
        submitBtn.disabled = !numeroDossier;
    }
}

function initPhotoUpload() {
    const photoInput = document.getElementById('photosUpload');
    const preview = document.getElementById('photosPreview');
    
    if (!photoInput || !preview) return;
    
    photoInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        
        if (uploadedPhotos.length + files.length > 5) {
            Toast.warning('Vous avez atteint la limite de 5 photos. Supprimez des photos existantes pour en ajouter de nouvelles.', 'Limite atteinte');
            return;
        }
        
        files.forEach(file => {
            if (!file.type.startsWith('image/')) {
                Toast.error(`Le fichier "${file.name}" n'est pas une image valide.`, 'Format non supporté');
                return;
            }
            
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            if (file.size > 10 * 1024 * 1024) {
                Toast.error(`Le fichier "${file.name}" est trop volumineux (${sizeMB} MB). Limite : 10 MB.`, 'Fichier trop lourd');
                return;
            }
            
            uploadedPhotos.push(file);
            displayPhoto(file);
        });
        
        photoInput.value = '';
    });
}

function displayPhoto(file) {
    const preview = document.getElementById('photosPreview');
    if (!preview) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.innerHTML = `
            <img src="${e.target.result}" alt="${file.name}">
            <button class="btn-remove-photo" aria-label="Supprimer la photo">×</button>
        `;
        
        const removeBtn = photoItem.querySelector('.btn-remove-photo');
        removeBtn.addEventListener('click', () => {
            const index = uploadedPhotos.indexOf(file);
            if (index > -1) {
                uploadedPhotos.splice(index, 1);
            }
            photoItem.remove();
        });
        
        preview.appendChild(photoItem);
    };
    reader.readAsDataURL(file);
}

async function sendTexteData() {
    const numeroDossier = document.getElementById('numeroDossierTexte').value.trim();
    
    if (!numeroDossier) {
        Toast.warning('Le numéro de dossier est obligatoire pour envoyer les données.', 'Champ requis');
        return;
    }
    
    const nomPatient = document.getElementById('nomPatientTexte').value.trim();
    const texte = document.getElementById('texteLibre').value.trim();
    
    const payload = {
        mode: 'texte',
        NumeroDeDossier: numeroDossier,
        NomDuPatient: nomPatient,
        texte: texte,
        photos: []
    };
    
    for (const file of uploadedPhotos) {
        const base64 = await fileToBase64(file);
        payload.photos.push({
            fileName: file.name,
            mimeType: file.type,
            data: base64
        });
    }
    
    try {
        const submitBtn = document.getElementById('submitTexte');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours...';
        
        const response = await fetch('https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedTexteMode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            document.getElementById('numeroDossierTexte').value = '';
            document.getElementById('nomPatientTexte').value = '';
            document.getElementById('texteLibre').value = '';
            document.getElementById('photosPreview').innerHTML = '';
            uploadedPhotos = [];
        } else {
            Toast.error(`Le serveur a renvoyé une erreur (${response.status}). Veuillez réessayer ou contactez le support.`, 'Erreur d\'envoi');
        }
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Envoyer les données';
        
    } catch (error) {
        console.error('Erreur:', error);
        Toast.error('Impossible de contacter le serveur. Vérifiez votre connexion Internet.', 'Erreur réseau');
    }
}

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

// ===== BOUTONS D'ENVOI =====
function initSubmitButtons() {
    const submitNormal = document.getElementById('submitNormal');
    const submitTest = document.getElementById('submitTest');
    const submitTexte = document.getElementById('submitTexte');
    
    if (submitNormal) {
        submitNormal.addEventListener('click', () => sendData('normal'));
    }
    
    if (submitTest) {
        submitTest.addEventListener('click', () => sendData('test'));
    }
    
    if (submitTexte) {
        submitTexte.addEventListener('click', sendTexteData);
    }
}

// ===== GESTION AUTHENTIFICATION =====
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
                console.log('✅ Identifiants sauvegardés');
            } catch (e) {
                console.error('Erreur lors de la sauvegarde:', e);
                Toast.error('Impossible de sauvegarder vos identifiants.', 'Erreur');
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
                    
                    console.log('✅ Identifiants restaurés');
                }
            }
        } catch (e) {
            console.error('Erreur lors de la restauration:', e);
        }
    },
    
    clearCredentials() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            console.log('🗑️ Identifiants effacés');
        } catch (e) {
            console.error('Erreur lors de l\'effacement:', e);
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

// ===== PWA SERVICE WORKER =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('✅ Service Worker enregistré:', registration.scope);
                
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🔄 Nouvelle version détectée');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('✨ Nouvelle version disponible');
                        }
                    });
                });
            })
            .catch((error) => {
                console.error('❌ Échec Service Worker:', error);
            });
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            window.location.reload();
            refreshing = true;
        }
    });
}

// ===== INSTALLATION PWA =====
let deferredPrompt;
const installButton = document.getElementById('installPwaBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💾 Installation PWA disponible');
    e.preventDefault();
    deferredPrompt = e;
    
    if (installButton) {
        installButton.classList.remove('hidden');
        
        setTimeout(() => {
            installButton.style.opacity = '0';
            installButton.style.transform = 'scale(0.9)';
            installButton.style.transition = 'all 0.3s ease';
            requestAnimationFrame(() => {
                installButton.style.opacity = '1';
                installButton.style.transform = 'scale(1)';
            });
        }, 100);
    }
});

if (installButton) {
    installButton.addEventListener('click', async () => {
        if (!deferredPrompt) {
            return;
        }
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Installation PWA: ${outcome}`);
        
        deferredPrompt = null;
        installButton.classList.add('hidden');
    });
}

window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installée');
    deferredPrompt = null;
    if (installButton) {
        installButton.classList.add('hidden');
    }
});

// ===== MASQUER LE MESSAGE DE SWIPE =====
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
    
    setTimeout(() => {
        if (!hasScrolled && swipeHint) {
            swipeHint.style.animation = 'fadeOut 0.5s ease forwards';
            setTimeout(() => {
                swipeHint.style.display = 'none';
            }, 500);
        }
    }, 10000);
}

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initialisation DictaMed...');
    
    Toast.init();
    initializeMode();
    initTabs();
    initCharCounters();
    initOptionalSection();
    initAudioRecorders();
    initSubmitButtons();
    initPhotoUpload();
    AuthManager.init();
    AutoSave.init();
    updateSectionCount();
    
    console.log('✅ DictaMed initialisé');
});
