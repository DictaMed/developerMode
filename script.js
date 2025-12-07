// État global de l'application
const appState = {
    currentMode: 'normal', // 'normal' ou 'test'
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
        if (tabId === 'home') {
            appState.currentMode = 'home';
        } else if (tabId === 'mode-normal') {
            appState.currentMode = 'normal';
        } else if (tabId === 'mode-test') {
            appState.currentMode = 'test';
        }
    } else {
        // Par défaut, utiliser le mode home
        appState.currentMode = 'home';
    }
    console.log('Mode initial:', appState.currentMode);
}

// ===== SYSTÈME DE TOAST NOTIFICATIONS (Désactivé) =====
const Toast = {
    init() {},
    show() {},
    remove() {},
    success() {},
    error() {},
    warning() {},
    info() {}
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
        // Créer l'indicateur
        if (!this.indicator) {
            this.indicator = document.createElement('div');
            this.indicator.className = 'autosave-indicator';
            this.indicator.innerHTML = '<div class="icon"></div><span class="text">Sauvegarde automatique</span>';
            document.body.appendChild(this.indicator);
        }
        
        // Restaurer les données sauvegardées
        this.restore();
        
        // Démarrer l'auto-save
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
            
            // Mode normal - no authentication fields to save anymore
            // Ne rien sauvegarder en mode test
            
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
            
            // Authentication fields removed - no restoration needed
        } catch (error) {
            console.error('Erreur lors de la restauration:', error);
        }
    },
    
    startAutoSave() {
        // Sauvegarder toutes les 30 secondes
        appState.autoSaveInterval = setInterval(() => {
            this.save();
        }, 30000);
        
        // Authentication fields removed - no auto-save listeners needed
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
    // Désactiver tous les onglets et contenus
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Activer l'onglet et le contenu sélectionnés
    document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
    document.getElementById(tabId)?.classList.add('active');

    // Synchroniser les boutons de navigation fixes
    updateFixedNavButtons(tabId);

    // Mettre à jour le mode actuel
    if (tabId === 'home') {
        appState.currentMode = 'home';
    } else if (tabId === 'mode-normal') {
        appState.currentMode = 'normal';
    } else if (tabId === 'mode-test') {
        appState.currentMode = 'test';
    }
}

// Fonction pour synchroniser les boutons de navigation fixes
function updateFixedNavButtons(activeTabId) {
    const fixedNavBtns = document.querySelectorAll('.fixed-nav-btn');
    fixedNavBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === activeTabId) {
            btn.classList.add('active');
        }
    });
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

                // Changer la couleur selon le niveau
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

    // Compteur pour le textarea
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
            // Vérifier la compatibilité du navigateur
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Votre navigateur ne supporte pas l\'enregistrement audio. Veuillez utiliser un navigateur moderne (Chrome, Firefox, Edge, Safari).');
            }

            // Afficher un indicateur de chargement
            this.updateStatus('loading', '⏳ Accès au microphone...');
            this.btnRecord.disabled = true;

            // Demander l'accès au microphone avec paramètres optimisés
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100,
                    channelCount: 1  // Mono pour réduire la taille
                }
            });

            // Déterminer le format audio supporté
            const mimeType = this.getSupportedMimeType();
            console.log('Format audio utilisé:', mimeType);
            
            // Créer le MediaRecorder avec options optimisées
            const options = mimeType ? { mimeType, audioBitsPerSecond: 128000 } : {};
            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.audioChunks = [];

            // Événement pour collecter les données audio
            this.mediaRecorder.addEventListener('dataavailable', event => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                    console.log(`📦 Partie 1 - Chunk audio capturé: ${event.data.size} bytes, Total chunks: ${this.audioChunks.length}`);
                }
            });

            // Événement de fin d'enregistrement
            this.mediaRecorder.addEventListener('stop', () => {
                this.audioBlob = new Blob(this.audioChunks, { type: mimeType || 'audio/webm' });
                const audioUrl = URL.createObjectURL(this.audioBlob);
                this.audioPlayer.src = audioUrl;
                this.audioPlayer.classList.remove('hidden');
                
                // Afficher la taille du fichier
                const sizeMB = (this.audioBlob.size / (1024 * 1024)).toFixed(2);
                console.log(`✅ Partie 1 - Enregistrement terminé: ${sizeMB} MB, Chunks collectés: ${this.audioChunks.length}`);
                
                // Mettre à jour le compteur de sections maintenant que audioBlob est défini
                updateSectionCount();
            });

            // Gestion des erreurs pendant l'enregistrement
            this.mediaRecorder.addEventListener('error', (event) => {
                console.error('Erreur MediaRecorder:', event.error);
                Toast.error('Une erreur est survenue lors de l\'enregistrement. Veuillez réessayer.', 'Erreur d\'enregistrement');
                this.resetRecording();
            });

            // Commencer l'enregistrement avec timeslice pour capturer les données toutes les secondes
            this.mediaRecorder.start(1000);
            console.log(`🎙️ Partie 1 - Enregistrement démarré avec timeslice=1000ms`);
            
            this.startTime = Date.now() - this.pausedTime;
            this.startTimer();
            
            // Mettre à jour l'UI
            this.updateStatus('recording', '🔴 En cours');
            this.btnRecord.classList.add('hidden');
            this.btnRecord.disabled = false;
            this.btnPause.classList.remove('hidden');
            this.btnStop.classList.remove('hidden');
            
            // Ajouter un indicateur visuel d'enregistrement
            this.section.classList.add('is-recording');

        } catch (error) {
            console.error('Erreur d\'accès au microphone:', error);
            
            // Messages d'erreur personnalisés
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
            
            // Arrêter tous les tracks du stream
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }

            // Mettre à jour l'UI (correction: ne plus afficher "Enregistré" dans le status badge)
            this.updateStatus('ready', 'Prêt');
            this.btnRecord.classList.add('hidden');
            this.btnPause.classList.add('hidden');
            this.btnPause.textContent = '⏸️ Pause'; // Reset le texte
            this.btnPause.classList.remove('btn-resume');
            this.btnStop.classList.add('hidden');
            this.btnReplay.classList.remove('hidden');
            this.btnDelete.classList.remove('hidden');
            this.recordedBadge.classList.remove('hidden'); // Badge vert unique
            
            // Marquer la section comme enregistrée
            this.section.classList.remove('is-recording', 'is-paused');
            this.section.classList.add('recorded');
            
            // NOTE: updateSectionCount() est appelé dans l'événement 'stop' du MediaRecorder
            // pour s'assurer que audioBlob est défini avant de compter
            
            // Feedback sonore optionnel (vibration sur mobile)
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
        // Arrêter le stream si actif
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        // Arrêter le MediaRecorder si actif
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        // Réinitialiser l'état
        this.audioBlob = null;
        this.audioChunks = [];
        this.pausedTime = 0;
        this.timer.textContent = '00:00';
        this.audioPlayer.src = '';
        this.audioPlayer.classList.add('hidden');
        this.stopTimer();
        
        // Réinitialiser l'UI
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
        
        // Retirer tous les marquages
        this.section.classList.remove('recorded', 'is-recording', 'is-paused');
        
        // Mettre à jour le compteur de sections
        updateSectionCount();
    }

    startTimer() {
        const MAX_DURATION = 120; // 2 minutes = 120 secondes
        
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            this.timer.textContent = 
                `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
            
            // Arrêt automatique après 2 minutes
            if (seconds >= MAX_DURATION) {
                Toast.info('Durée maximale de 2 minutes atteinte. Enregistrement arrêté automatiquement.', 'Limite atteinte', 5000);
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
        // Liste des formats par ordre de préférence (MP3 en priorité)
        const types = [
            'audio/mpeg',              // MP3 - Priorité maximale
            'audio/mp4',               // M4A/AAC
            'audio/webm;codecs=opus',  // WebM Opus
            'audio/webm',              // WebM
            'audio/ogg;codecs=opus',   // Ogg Opus
            'audio/wav'                // WAV (fallback)
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        // Fallback : laisser le navigateur choisir
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
        return 'webm'; // Format par défaut moderne
    }

    getMimeType() {
        return this.audioBlob ? this.audioBlob.type : 'audio/mpeg';
    }

    hasRecording() {
        return this.audioBlob !== null;
    }

    // Nouvelle méthode pour valider l'enregistrement avant envoi
    validateRecording() {
        if (!this.audioBlob) {
            return { valid: false, error: 'Aucun enregistrement disponible' };
        }

        // Vérifier la taille (max 50MB pour éviter les timeouts)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (this.audioBlob.size > maxSize) {
            const sizeMB = (this.audioBlob.size / (1024 * 1024)).toFixed(1);
            return { 
                valid: false, 
                error: `Enregistrement trop volumineux (${sizeMB}MB). Limite: 50MB.` 
            };
        }

        // Vérifier que le blob n'est pas vide
        if (this.audioBlob.size === 0) {
            return { valid: false, error: 'Enregistrement vide' };
        }

        // Vérifier le format audio
        const validTypes = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav'];
        if (!validTypes.includes(this.audioBlob.type)) {
            console.warn(`Format audio non standard: ${this.audioBlob.type}, mais continuation...`);
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
    
    // Ne pas mettre à jour le compteur si on est sur la page d'accueil
    if (mode === 'home') {
        return;
    }
    
    const sections = sectionsConfig[mode];
    let count = 0;

    sections.forEach(sectionId => {
        const recorder = audioRecorders.get(sectionId);
        if (recorder && recorder.hasRecording()) {
            count++;
        }
    });

    // Mettre à jour l'affichage
    const countElements = document.querySelectorAll('.sections-count');
    countElements.forEach(el => {
        if (el.closest(`#mode-${mode}`)) {
            el.textContent = `${count} section(s) enregistrée(s)`;
        }
    });

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
    const numeroDossier = document.getElementById(isTest ? 'numeroDossierTest' : 'numeroDossier').value;
    const nomPatient = document.getElementById(isTest ? 'nomPatientTest' : 'nomPatient').value;
    const sections = isTest ? ['clinique', 'antecedents', 'biologie'] : ['partie1', 'partie2', 'partie3', 'partie4'];
    
    let summary = `📋 Récapitulatif avant envoi (${mode.toUpperCase()}):\n\n`;
    summary += `👤 Patient: ${numeroDossier} - ${nomPatient}\n`;
    summary += `📊 Sections enregistrées:\n`;
    
    let sectionCount = 0;
    sections.forEach(sectionId => {
        const recorder = audioRecorders.get(sectionId);
        if (recorder && recorder.hasRecording()) {
            const validation = recorder.validateRecording();
            sectionCount++;
            const size = recorder.audioBlob ? (recorder.audioBlob.size / 1024).toFixed(1) : '0';
            summary += `   ✅ ${sectionId}: ${size}KB ${validation.valid ? '' : `(⚠️ ${validation.error})`}\n`;
        }
    });
    
    if (sectionCount === 0) {
        summary += '   ❌ Aucune section enregistrée\n';
    }
    
    summary += `\n🎯 ${sectionCount} section(s) prête(s) pour l'envoi`;
    
    return summary;
}

// ===== ENVOI DES DONNÉES AMÉLIORÉ =====
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

        // Afficher le récapitulatif avant envoi
        const summary = showSendSummary(mode);
        console.log('📋', summary);
        Toast.info('Vérification des données avant envoi...', 'Préparation', 2000);

        // Préparer le payload avec gestion d'erreur améliorée
        const payload = await preparePayload(mode);
        
        if (!payload) {
            const errorMsg = 'Veuillez remplir le numéro de dossier et le nom du patient, et enregistrer au moins une section.';
            
            Toast.warning(errorMsg, 'Champs manquants');
            submitBtn.disabled = false;
            submitBtn.textContent = mode === 'normal' ? 'Envoyer les données' : 'Envoyer les données Test';
            return;
        }

        // Vérifier qu'il y a des sections enregistrées
        const hasRecordings = Object.keys(payload.sections || {}).length > 0;
        if (!hasRecordings) {
            Toast.warning('Veuillez enregistrer au moins une section avant d\'envoyer.', 'Aucun enregistrement');
            submitBtn.disabled = false;
            submitBtn.textContent = mode === 'normal' ? 'Envoyer les données' : 'Envoyer les données Test';
            return;
        }

        // Déterminer l'endpoint
        const endpoint = mode === 'normal'
            ? 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedNormalMode'
            : 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed';

        console.log('🔄 Envoi des données vers:', endpoint);
        console.log('📊 Payload:', {
            mode: payload.mode,
            patient: payload.NumeroDeDossier ? `${payload.NumeroDeDossier} - ${payload.NomDuPatient || 'N/A'}` : 'N/A',
            sectionsCount: Object.keys(payload.sections || {}).length
        });

        // Mettre à jour le statut
        submitBtn.textContent = 'Transmission en cours...';

        // Envoyer les données avec timeout et retry
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
                setTimeout(() => reject(new Error('Timeout après 30 secondes')), 30000)
            )
        ]);

        console.log('📡 Réponse reçue:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });

        if (response.ok) {
            Toast.success('Votre dossier a été envoyé et traité avec succès !', 'Envoi réussi');
            
            if (mode === 'test') {
                // Mode Test : Afficher le Google Sheet et notification
                const googleSheetCard = document.getElementById('googleSheetCard');
                if (googleSheetCard) {
                    googleSheetCard.style.display = 'block';
                    // Faire défiler vers la carte Google Sheet
                    googleSheetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                
                // Notification pour consulter le Google Sheet
                setTimeout(() => {
                    Toast.info('Consultez le Google Sheet pour voir vos données transcrites en temps réel.', 'Résultats disponibles', 8000);
                }, 1000);
                
                // NE PAS réinitialiser en mode test pour permettre de voir les résultats
            } else {
                // Mode Normal : Réinitialiser automatiquement
                resetForm(mode);
                AutoSave.clear();
                Toast.success('Formulaire réinitialisé pour un nouveau patient.', 'Prêt', 3000);
            }
        } else {
            // Gérer les erreurs HTTP
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
            
            Toast.error(errorMessage, 'Erreur d\'envoi');
        }

    } catch (error) {
        console.error('Erreur lors de l\'envoi:', error);
        
        // Messages d'erreur plus spécifiques
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            Toast.error('Impossible de contacter le serveur. Vérifiez votre connexion Internet et réessayez.', 'Erreur réseau');
        } else if (error.message.includes('Timeout')) {
            Toast.error('La connexion a pris trop de temps. Vérifiez votre connexion et réessayez.', 'Timeout');
        } else {
            Toast.error(`Une erreur inattendue s'est produite: ${error.message}`, 'Erreur technique');
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
        // Ajouter l'email de l'utilisateur Firebase s'il est connecté
        const currentUser = FirebaseAuthManager.getCurrentUser();
        if (currentUser && currentUser.email) {
            payload.userEmail = currentUser.email;
            console.log('Email utilisateur Firebase ajouté au payload:', currentUser.email);
        }

        if (mode === 'normal') {
            // Mode Normal - Validation simplifiée (no authentication required)
            const numeroDossier = document.getElementById('numeroDossier')?.value.trim();
            const nomPatient = document.getElementById('nomPatient')?.value.trim();

            // Validation des champs obligatoires
            const missingFields = [];
            if (!numeroDossier) missingFields.push('numéro de dossier');
            if (!nomPatient) missingFields.push('nom du patient');

            if (missingFields.length > 0) {
                console.warn('Champs manquants:', missingFields);
                return null;
            }

            payload.NumeroDeDossier = numeroDossier;
            payload.NomDuPatient = nomPatient;

            // Collecter les enregistrements avec gestion d'erreur
            const sections = ['partie1', 'partie2', 'partie3', 'partie4'];
            let index = 0;
            let hasValidRecording = false;
            
            for (const sectionId of sections) {
                const recorder = audioRecorders.get(sectionId);
                if (recorder && recorder.hasRecording()) {
                    try {
                        // Validation de l'enregistrement
                        const validation = recorder.validateRecording();
                        if (!validation.valid) {
                            console.warn(`Section ${sectionId} invalide:`, validation.error);
                            continue;
                        }
                        
                        index++;
                        const base64 = await recorder.getBase64Audio();
                        const format = recorder.getAudioFormat();
                        const mimeType = recorder.getMimeType();
                        
                        // Vérifications de sécurité supplémentaires
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
                        console.log(`✅ Section ${sectionId} préparée (${format}, ${(base64.length/1024).toFixed(1)}KB, ${(recorder.audioBlob.size/1024).toFixed(1)}KB)`);
                    } catch (sectionError) {
                        console.error(`Erreur lors de la préparation de la section ${sectionId}:`, sectionError);
                        // Continuer avec les autres sections
                    }
                }
            }

            if (!hasValidRecording) {
                console.warn('Aucune section enregistrée trouvée');
                return null;
            }

        } else {
            // Mode Test - Validation simplifiée
            const numeroDossier = document.getElementById('numeroDossierTest')?.value.trim();
            const nomPatient = document.getElementById('nomPatientTest')?.value.trim();

            const missingFields = [];
            if (!numeroDossier) missingFields.push('numéro de dossier');
            if (!nomPatient) missingFields.push('nom du patient');

            if (missingFields.length > 0) {
                console.warn('Champs manquants en mode test:', missingFields);
                return null;
            }

            payload.NumeroDeDossier = numeroDossier;
            payload.NomDuPatient = nomPatient;

            // Collecter les enregistrements avec gestion d'erreur
            const sections = ['clinique', 'antecedents', 'biologie'];
            let index = 0;
            let hasValidRecording = false;
            
            for (const sectionId of sections) {
                const recorder = audioRecorders.get(sectionId);
                if (recorder && recorder.hasRecording()) {
                    try {
                        // Validation de l'enregistrement
                        const validation = recorder.validateRecording();
                        if (!validation.valid) {
                            console.warn(`Section ${sectionId} invalide:`, validation.error);
                            continue;
                        }
                        
                        index++;
                        const base64 = await recorder.getBase64Audio();
                        const format = recorder.getAudioFormat();
                        const mimeType = recorder.getMimeType();
                        
                        // Vérifications de sécurité supplémentaires
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
                        console.log(`✅ Section ${sectionId} préparée (${format}, ${(base64.length/1024).toFixed(1)}KB, ${(recorder.audioBlob.size/1024).toFixed(1)}KB)`);
                    } catch (sectionError) {
                        console.error(`Erreur lors de la préparation de la section ${sectionId}:`, sectionError);
                        // Continuer avec les autres sections
                    }
                }
            }

            if (!hasValidRecording) {
                console.warn('Aucune section enregistrée trouvée en mode test');
                return null;
            }
        }

        // Validation finale du payload
        if (Object.keys(payload.sections).length === 0) {
            console.warn('Payload créé mais sans sections valides');
            return null;
        }

        console.log(`🎯 Payload préparé pour le mode ${mode}:`, {
            patient: `${payload.NumeroDeDossier} - ${payload.NomDuPatient}`,
            sections: Object.keys(payload.sections).length,
            timestamp: payload.recordedAt
        });

        return payload;
        
    } catch (error) {
        console.error('Erreur lors de la préparation du payload:', error);
        return null;
    }
}

function resetForm(mode) {
    if (mode === 'normal') {
        document.getElementById('numeroDossier').value = '';
        document.getElementById('nomPatient').value = '';
        
        // Réinitialiser les compteurs de caractères
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
        
        // Réinitialiser les compteurs de caractères
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

// Validation du mode DMI
function validateDMIMode() {
    const numeroDossier = document.getElementById('numeroDossierDMI').value.trim();
    const submitBtn = document.getElementById('submitDMI');
    
    if (submitBtn) {
        submitBtn.disabled = !numeroDossier;
    }
}

// Gestion de l'upload de photos
function initPhotosUpload() {
    const photosInput = document.getElementById('photosUpload');
    const photosPreview = document.getElementById('photosPreview');
    
    if (!photosInput || !photosPreview) return;
    
    photosInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        
        // Limiter à 5 photos
        if (uploadedPhotos.length + files.length > 5) {
            Toast.warning(`Vous avez atteint la limite de 5 photos. Supprimez des photos existantes pour en ajouter de nouvelles.`, 'Limite atteinte');
            return;
        }
        
        // Vérifier la taille et le format de chaque fichier
        files.forEach(file => {
            // Vérifier le format
            if (!file.type.startsWith('image/')) {
                Toast.error(`Le fichier "${file.name}" n'est pas une image valide.`, 'Format non supporté');
                return;
            }
            
            // Vérifier la taille (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                Toast.error(`Le fichier "${file.name}" est trop volumineux (${sizeMB} MB). Limite : 10 MB.`, 'Fichier trop lourd');
                return;
            }
            
            // Ajouter la photo
            uploadedPhotos.push(file);
        });
        
        // Réinitialiser l'input
        photosInput.value = '';
        
        // Mettre à jour la prévisualisation
        updatePhotosPreview();
    });
}

// Mettre à jour la prévisualisation des photos
function updatePhotosPreview() {
    const photosPreview = document.getElementById('photosPreview');
    if (!photosPreview) return;
    
    photosPreview.innerHTML = '';
    
    uploadedPhotos.forEach((file, index) => {
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
            
            // Ajouter l'événement de suppression
            const removeBtn = photoItem.querySelector('.photo-item-remove');
            removeBtn.addEventListener('click', () => {
                uploadedPhotos.splice(index, 1);
                updatePhotosPreview();
            });
        };
        
        reader.readAsDataURL(file);
    });
}

// Envoi des données du mode DMI
async function sendDmiData() {
    try {
        const submitBtn = document.getElementById('submitDMI');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours...';

        // Préparer le payload
        const numeroDossier = document.getElementById('numeroDossierDMI').value.trim();
        const nomPatient = document.getElementById('nomPatientDMI').value.trim();
        const texteLibre = document.getElementById('texteLibre').value.trim();

        if (!numeroDossier) {
            Toast.warning('Le numéro de dossier est obligatoire pour envoyer les données.', 'Champ requis');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Envoyer les données DMI';
            return;
        }

        const payload = {
            mode: 'dmi',
            recordedAt: new Date().toISOString(),
            NumeroDeDossier: numeroDossier,
            NomDuPatient: nomPatient,
            texte: texteLibre,
            photos: []
        };

        // Ajouter l'email de l'utilisateur Firebase s'il est connecté
        const currentUser = FirebaseAuthManager.getCurrentUser();
        if (currentUser && currentUser.email) {
            payload.userEmail = currentUser.email;
            console.log('Email utilisateur Firebase ajouté au payload DMI:', currentUser.email);
        }

        // Convertir les photos en Base64
        for (const file of uploadedPhotos) {
            const base64 = await fileToBase64(file);
            payload.photos.push({
                fileName: file.name,
                mimeType: file.type,
                size: file.size,
                base64: base64
            });
        }

        // Envoyer au webhook du mode test (same as mode test)
        const endpoint = 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            Toast.success('Vos données DMI ont été envoyées avec succès !', 'Envoi réussi');
            
            // Réinitialiser le formulaire si souhaité
            if (confirm('Voulez-vous réinitialiser le formulaire DMI ?')) {
                resetDmiForm();
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
        const submitBtn = document.getElementById('submitDMI');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Envoyer les données DMI';
    }
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

// Réinitialiser le formulaire mode DMI
function resetDmiForm() {
    document.getElementById('numeroDossierDMI').value = '';
    document.getElementById('nomPatientDMI').value = '';
    document.getElementById('texteLibre').value = '';
    document.getElementById('texteLibreCounter').textContent = '0';
    uploadedPhotos = [];
    updatePhotosPreview();
    validateDMIMode();
}

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initialisation de DictaMed...');
    
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
    initPhotosUpload();
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

    // Message de bienvenue supprimé à la demande de l'utilisateur

    console.log('✅ DictaMed initialisé avec succès!');
});


// ===== AUTHENTICATION MANAGER REMOVED =====
/* Authentication fields and AuthManager removed as requested */




// ===== MASQUER LE MESSAGE DE SWIPE APRÈS INTERACTION =====
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
    
    // Masquer également après 10 secondes si pas de scroll
    setTimeout(() => {
        if (!hasScrolled && swipeHint) {
            swipeHint.style.animation = 'fadeOut 0.5s ease forwards';
            setTimeout(() => {
                swipeHint.style.display = 'none';
            }, 500);
        }
    }, 10000);

// ===== GESTION DU MODAL D'AUTHENTIFICATION =====

// Fonctions globales pour le modal
function toggleAuthModal() {
    const authModal = document.getElementById('authModal');
    if (!authModal) return;
    
    if (authModal.classList.contains('hidden')) {
        openAuthModal();
    } else {
        closeAuthModal();
    }
}

function openAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.classList.remove('hidden');
        // Focus sur le premier input
        const firstInput = authModal.querySelector('input[type="email"]');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.classList.add('hidden');
    }
}

// Rendre les fonctions globales
window.toggleAuthModal = toggleAuthModal;
window.closeAuthModal = closeAuthModal;

// ===== FIREBASE AUTHENTIFICATION MANAGER =====

// Gestionnaire d'authentification Firebase
const FirebaseAuthManager = {
    currentUser: null,
    isInitializing: true,
    
    // Initialisation du gestionnaire
    init() {
        console.log('Initialisation Firebase Auth...');
        
        // Attendre que Firebase soit chargé
        if (typeof firebase === 'undefined') {
            console.error('Firebase n\'est pas chargé');
            return;
        }
        
        // Configuration Google Auth
        this.setupGoogleAuth();
        
        // Écouter les changements d'état d'authentification
        firebase.auth().onAuthStateChanged((user) => {
            this.handleAuthStateChanged(user);
        });
        
        // Initialiser les événements UI
        this.initUIEvents();
        
        // Vérifier l'état initial
        this.currentUser = firebase.auth().currentUser;
        this.isInitializing = false;
        this.updateUI();
        
        console.log('✅ Firebase Auth initialisé');
    },
    
    // Configuration Google Auth
    setupGoogleAuth() {
        // Google provider configuration
        this.googleProvider = new firebase.auth.GoogleAuthProvider();
        this.googleProvider.addScope('email');
        this.googleProvider.addScope('profile');
    },
    
    // Gestion des changements d'état d'authentification
    handleAuthStateChanged(user) {
        this.currentUser = user;
        this.updateUI();
        
        if (user) {
            console.log('Utilisateur connecté:', user.email);
            Toast.success(`Bienvenue ${user.displayName || user.email} !`, 'Connexion réussie');
            
            // Fermer le modal après connexion
            closeAuthModal();
            
            // Redirection automatique vers le mode normal après connexion
            setTimeout(() => {
                console.log('Redirection automatique vers le mode normal...');
                switchTab('mode-normal');
            }, 1500); // Délai pour laisser le temps à l'utilisateur de voir le message de bienvenue
        } else {
            console.log('Utilisateur déconnecté');
            // Ne plus rediriger automatiquement vers l'accueil
        }
    },
    
    // Initialisation des événements UI
    initUIEvents() {
        // Toggle entre Connexion/Inscription dans le modal
        const modalSignInTab = document.getElementById('modalSignInTab');
        const modalSignUpTab = document.getElementById('modalSignUpTab');
        
        if (modalSignInTab && modalSignUpTab) {
            modalSignInTab.addEventListener('click', () => this.switchAuthMode('signin'));
            modalSignUpTab.addEventListener('click', () => this.switchAuthMode('signup'));
        }
        
        // Formulaire email/mot de passe du modal
        const modalEmailAuthForm = document.getElementById('modalEmailAuthForm');
        if (modalEmailAuthForm) {
            modalEmailAuthForm.addEventListener('submit', (e) => this.handleEmailAuth(e));
        }
        
        // Bouton Google Sign-In du modal
        const modalGoogleSignInBtn = document.getElementById('modalGoogleSignInBtn');
        if (modalGoogleSignInBtn) {
            modalGoogleSignInBtn.addEventListener('click', () => this.signInWithGoogle());
        }
        
        // Bouton de déconnexion du modal
        const modalSignOutBtn = document.getElementById('modalSignOutBtn');
        if (modalSignOutBtn) {
            modalSignOutBtn.addEventListener('click', () => this.signOut());
        }
        
        // Fermer le modal en cliquant en dehors
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) {
                    closeAuthModal();
                }
            });
        }
    },
    
    // Bascule entre les modes Connexion/Inscription
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
        
        // Nettoyer les erreurs
        this.hideAuthError();
    },
    
    // Gestion de l'authentification par email
    async handleEmailAuth(event) {
        event.preventDefault();
        
        const email = document.getElementById('modalEmailInput').value.trim();
        const password = document.getElementById('modalPasswordInput').value;
        const isSignUp = document.getElementById('modalSignUpTab').classList.contains('active');
        
        if (!email || !password) {
            this.showAuthError('Veuillez remplir tous les champs');
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
            // Afficher le chargement
            modalEmailSubmitBtn.disabled = true;
            btnText.textContent = 'Traitement...';
            loadingSpinner.classList.remove('hidden');
            this.hideAuthError();
            
            let result;
            if (isSignUp) {
                // Inscription
                result = await firebase.auth().createUserWithEmailAndPassword(email, password);
                console.log('Compte créé:', result.user.email);
            } else {
                // Connexion
                result = await firebase.auth().signInWithEmailAndPassword(email, password);
                console.log('Connexion réussie:', result.user.email);
            }
            
            // Réinitialiser le formulaire
            document.getElementById('modalEmailAuthForm').reset();
            
        } catch (error) {
            console.error('Erreur authentification email:', error);
            this.handleAuthError(error);
        } finally {
            // Réinitialiser le bouton
            modalEmailSubmitBtn.disabled = false;
            btnText.textContent = isSignUp ? 'Créer un compte' : 'Se connecter';
            loadingSpinner.classList.add('hidden');
        }
    },
    
    // Connexion avec Google
    async signInWithGoogle() {
        const modalGoogleSignInBtn = document.getElementById('modalGoogleSignInBtn');
        const originalText = modalGoogleSignInBtn.textContent;
        
        try {
            // Afficher le chargement
            modalGoogleSignInBtn.disabled = true;
            modalGoogleSignInBtn.textContent = 'Connexion...';
            this.hideAuthError();
            
            const result = await firebase.auth().signInWithPopup(this.googleProvider);
            console.log('Connexion Google réussie:', result.user.email);
            
        } catch (error) {
            console.error('Erreur connexion Google:', error);
            this.handleAuthError(error);
        } finally {
            // Réinitialiser le bouton
            modalGoogleSignInBtn.disabled = false;
            modalGoogleSignInBtn.textContent = originalText;
        }
    },
    
    // Déconnexion
    async signOut() {
        try {
            await firebase.auth().signOut();
            console.log('Déconnexion réussie');
            closeAuthModal(); // Fermer le modal après déconnexion
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            Toast.error('Erreur lors de la déconnexion', 'Erreur');
        }
    },
    
    // Gestion des erreurs d'authentification
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
    
    // Affichage des erreurs
    showAuthError(message) {
        const modalAuthError = document.getElementById('modalAuthError');
        if (modalAuthError) {
            modalAuthError.textContent = message;
            modalAuthError.classList.remove('hidden');
            
            // Masquer automatiquement après 5 secondes
            setTimeout(() => {
                this.hideAuthError();
            }, 5000);
        }
    },
    
    // Masquage des erreurs
    hideAuthError() {
        const modalAuthError = document.getElementById('modalAuthError');
        if (modalAuthError) {
            modalAuthError.classList.add('hidden');
        }
    },
    
    // Mise à jour de l'interface utilisateur
    updateUI() {
        const modalAuthForm = document.getElementById('modalEmailAuthForm');
        const modalUserProfile = document.getElementById('modalUserProfile');
        const authButtonText = document.getElementById('authButtonText');
        
        if (this.currentUser) {
            // Utilisateur connecté - afficher le profil dans le modal
            if (modalAuthForm) modalAuthForm.classList.add('hidden');
            if (modalUserProfile) modalUserProfile.classList.remove('hidden');
            
            // Mettre à jour le bouton d'authentification
            if (authButtonText) {
                authButtonText.textContent = 'Déconnexion';
            }
            
            // Mettre à jour les informations utilisateur
            this.updateUserProfile();
        } else {
            // Utilisateur non connecté - afficher le formulaire dans le modal
            if (modalAuthForm) modalAuthForm.classList.remove('hidden');
            if (modalUserProfile) modalUserProfile.classList.add('hidden');
            
            // Mettre à jour le bouton d'authentification
            if (authButtonText) {
                authButtonText.textContent = 'Connexion';
            }
        }
    },
    
    // Mise à jour des informations du profil utilisateur
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
        
        // Gestion de l'avatar
        if (user.photoURL && modalUserAvatar) {
            // Supprimer l'ancien avatar s'il existe
            const oldImg = modalUserAvatar.querySelector('img');
            if (oldImg) oldImg.remove();
            
            // Ajouter la nouvelle photo
            const img = document.createElement('img');
            img.src = user.photoURL;
            img.alt = 'Avatar utilisateur';
            img.onerror = () => {
                // Si l'image ne se charge pas, utiliser le placeholder
                img.remove();
                modalAvatarPlaceholder.classList.remove('hidden');
            };
            modalUserAvatar.appendChild(img);
            modalAvatarPlaceholder.classList.add('hidden');
        } else if (modalAvatarPlaceholder) {
            modalAvatarPlaceholder.classList.remove('hidden');
            
            // Supprimer les images existantes
            const oldImg = modalUserAvatar.querySelector('img');
            if (oldImg) oldImg.remove();
        }
    },
    
    // Vérification si l'utilisateur est connecté
    isAuthenticated() {
        return this.currentUser !== null;
    },
    
    // Obtention de l'utilisateur actuel
    getCurrentUser() {
        return this.currentUser;
    },
    
    // Vérification si l'initialisation est terminée
    isInitialized() {
        return !this.isInitializing;
    }
};

// Vérification de l'accès aux onglets selon l'authentification
function checkTabAccess(tabId) {
    // Mode Test toujours accessible
    if (tabId === 'mode-test' || tabId === 'guide' || tabId === 'faq' || tabId === 'home') {
        return true;
    }
    
    // Mode DMI nécessite une authentification, Mode Normal ne le nécessite plus
    if (tabId === 'mode-dmi' && !FirebaseAuthManager.isAuthenticated()) {
        Toast.warning('Veuillez vous connecter pour accéder à ce mode', 'Authentification requise');
        return false;
    }
    
    return true;
}

// Modification de la fonction switchTab pour inclure la vérification d'authentification
const originalSwitchTab = switchTab;
switchTab = function(tabId) {
    // Vérifier l'accès avant de changer d'onglet
    if (!checkTabAccess(tabId)) {
        // Rediriger vers la page d'accueil si accès refusé
        if (tabId === 'mode-normal' || tabId === 'mode-dmi') {
            // Rester sur l'onglet actuel ou aller à l'accueil
            const currentActiveTab = document.querySelector('.tab-btn.active, .fixed-nav-btn.active');
            if (currentActiveTab) {
                const currentTabId = currentActiveTab.getAttribute('data-tab');
                if (currentTabId !== 'home') {
                    originalSwitchTab('home');
                }
            } else {
                originalSwitchTab('home');
            }
        }
        return;
    }
    
    // Exécuter le switchTab original
    originalSwitchTab(tabId);
};

// Initialisation de Firebase Auth au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Attendre un peu que Firebase soit chargé
    setTimeout(() => {
        FirebaseAuthManager.init();
    }, 100);
});
}
