import { Toast } from './utils.js';
import { CONFIG } from './config.js';
import { updateSectionCount } from './ui.js';

// ===== ENREGISTREMENT AUDIO =====
export class AudioRecorder {
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
        const MAX_DURATION = CONFIG.LIMITS.MAX_AUDIO_DURATION;

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
        const maxSize = CONFIG.LIMITS.MAX_AUDIO_SIZE;
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
