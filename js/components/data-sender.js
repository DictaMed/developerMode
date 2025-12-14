/**
 * DictaMed - Système d'envoi de données
 * Version: 2.2 - Multi-inputs (Audio, Texte, Photos) avec agent OpenAI
 * Supporte 3 types d'entrée avec logique conditionnelle n8n v2.0
 */

class DataSender {
    constructor(appState, audioRecorderManager) {
        this.appState = appState;
        this.audioRecorderManager = audioRecorderManager;
        this.isSending = false;
        this.logger = window.logger?.createLogger('DataSender') || console;
    }

    /**
     * v2.0: Déterminer le type d'entrée basé sur les données disponibles
     */
    determineInputType(recordingData) {
        if (recordingData && recordingData.audioData) return 'audio';
        if (recordingData && recordingData.audioBlob) return 'audio';
        if (recordingData && recordingData.text) return 'text';
        if (recordingData && recordingData.photoData) return 'photo';
        if (recordingData && recordingData.photoBlob) return 'photo';
        return 'unknown';
    }

    /**
     * v2.0: Valider les données selon le type d'entrée
     */
    validateInputData(inputType, data) {
        const result = { valid: true, errors: [] };

        if (inputType === 'audio') {
            if (!data.audioData && !data.audioBlob) result.errors.push('Audio data manquant');
            if (!data.duration && data.duration !== 0) result.errors.push('Durée audio manquante');
            if (!data.format) result.errors.push('Format audio manquant');
        } else if (inputType === 'text') {
            if (!data.text) result.errors.push('Texte manquant');
            if (data.text && data.text.trim().length < 5) result.errors.push('Texte trop court (min 5 caractères)');
            if (data.text && data.text.length > 50000) result.errors.push('Texte trop long (max 50000 caractères)');
        } else if (inputType === 'photo') {
            if (!data.photoData && !data.photoBlob) result.errors.push('Photo data manquante');
            if (!data.mimeType) result.errors.push('MIME type manquant');
            if (data.mimeType && !window.APP_CONFIG.PHOTO_CONFIG.allowedMimes.includes(data.mimeType)) {
                result.errors.push(`Format invalide: ${data.mimeType}`);
            }
        }

        result.valid = result.errors.length === 0;
        return result;
    }

    /**
     * v2.0: Traiter les données audio (compression si nécessaire)
     */
    async processAudioData(audioBlob, duration) {
        this.logger.log('🎵 Traitement audio...');

        if (!audioBlob) {
            throw new Error('Audio blob manquant');
        }

        try {
            const sizeInMB = (audioBlob.size / 1024 / 1024).toFixed(2);
            this.logger.log(`📦 Taille originale: ${sizeInMB}MB`);

            // Convertir en base64
            const base64 = await this.blobToBase64(audioBlob);

            return {
                audioData: base64,
                duration: duration,
                format: 'webm',
                size: sizeInMB
            };
        } catch (error) {
            this.logger.error('❌ Erreur audio:', error);
            throw error;
        }
    }

    /**
     * v2.0: Traiter les données texte (nettoyage basique)
     */
    processTextData(text) {
        this.logger.log('📝 Traitement texte...');

        if (!text || text.trim().length === 0) {
            throw new Error('Texte vide');
        }

        return {
            text: text.trim(),
            format: 'text/plain',
            length: text.length
        };
    }

    /**
     * v2.0: Traiter les données photo (validation et base64)
     */
    async processPhotoData(photoBlob, mimeType, description = '') {
        this.logger.log('📷 Traitement photo...');

        try {
            // Valider format
            const allowedTypes = window.APP_CONFIG.PHOTO_CONFIG.allowedMimes;
            if (!allowedTypes.includes(mimeType)) {
                throw new Error(`Format invalide: ${mimeType}`);
            }

            // Valider taille
            const sizeInMB = (photoBlob.size / 1024 / 1024).toFixed(2);
            if (photoBlob.size > window.APP_CONFIG.PHOTO_CONFIG.maxSizeBytes) {
                throw new Error(`Image trop grosse: ${sizeInMB}MB (max ${window.APP_CONFIG.PHOTO_CONFIG.maxSizeBytes / 1024 / 1024}MB)`);
            }

            // Convertir en base64
            const base64 = await this.blobToBase64(photoBlob);

            return {
                photoData: base64,
                mimeType: mimeType,
                description: description.trim(),
                size: sizeInMB
            };
        } catch (error) {
            this.logger.error('❌ Erreur photo:', error);
            throw error;
        }
    }

    /**
     * v2.0: Construire le payload unifié pour tous les types
     */
    buildPayload(recordingData, currentUser, mode) {
        const inputType = this.determineInputType(recordingData);

        // Valider les données
        const validation = this.validateInputData(inputType, recordingData);
        if (!validation.valid) {
            throw new Error(`Données invalides (${inputType}): ${validation.errors.join(', ')}`);
        }

        // Construire le wrapper "data"
        let dataWrapper = {};
        if (inputType === 'audio') {
            dataWrapper = {
                audioData: recordingData.audioData,
                duration: recordingData.duration,
                format: recordingData.format || 'webm'
            };
        } else if (inputType === 'text') {
            dataWrapper = {
                text: recordingData.text,
                format: recordingData.format || 'text/plain'
            };
        } else if (inputType === 'photo') {
            dataWrapper = {
                photoData: recordingData.photoData,
                mimeType: recordingData.mimeType,
                description: recordingData.description || ''
            };
        }

        // Construire le payload complet
        const payload = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || 'Anonymous',
            mode: mode,
            timestamp: new Date().toISOString(),
            patientInfo: this.collectPatientInfo(mode),
            inputType: inputType,
            data: dataWrapper,
            metadata: {
                appVersion: '2.2.0',
                clientType: this.getClientType(),
                userAgent: navigator.userAgent
            }
        };

        return payload;
    }

    /**
     * Déterminer le type de client
     */
    getClientType() {
        if (/mobile|android|iphone/i.test(navigator.userAgent)) return 'mobile';
        if (/tablet|ipad/i.test(navigator.userAgent)) return 'tablet';
        return 'desktop';
    }

    /**
     * v2.0: Envoyer des données directement (audio, texte ou photo)
     * API simple pour support 3 types d'entrée
     */
    async sendRecordingData(recordingData, mode = 'normal') {
        if (this.isSending) {
            this.logger.warn('Envoi déjà en cours...');
            return Promise.resolve();
        }

        this.isSending = true;

        try {
            this.logger.info(`🚀 Début envoi ${mode} - Type: ${this.determineInputType(recordingData)}`);

            // 1. Récupérer l'utilisateur actuel
            const currentUser = window.FirebaseAuthManager?.getCurrentUser?.() || null;
            if (!currentUser) {
                throw new Error('Utilisateur non authentifié. Veuillez vous connecter.');
            }

            // 2. Traiter les données selon le type
            let processedData;
            const inputType = this.determineInputType(recordingData);

            if (inputType === 'audio' && recordingData.audioBlob) {
                processedData = await this.processAudioData(
                    recordingData.audioBlob,
                    recordingData.duration
                );
            } else if (inputType === 'text') {
                processedData = this.processTextData(recordingData.text);
            } else if (inputType === 'photo' && recordingData.photoBlob) {
                processedData = await this.processPhotoData(
                    recordingData.photoBlob,
                    recordingData.mimeType,
                    recordingData.description
                );
            } else {
                throw new Error('Type d\'entrée non supporté ou données manquantes');
            }

            // 3. Construire le payload
            const payload = this.buildPayload(processedData, currentUser, mode);

            // 4. Envoyer
            const result = await this.sendToEndpoint(payload, mode);

            this.logger.info('✅ Données envoyées avec succès', { result });

            // Notifications
            if (window.notificationSystem) {
                window.notificationSystem.success(
                    `✅ ${inputType.toUpperCase()} envoyé avec succès!`,
                    'Envoi terminé'
                );
            }

            return result;

        } catch (error) {
            this.logger.error('❌ Erreur lors de l\'envoi:', {
                error: error.message,
                stack: error.stack,
                mode
            });

            if (window.notificationSystem) {
                window.notificationSystem.error(
                    `❌ Erreur lors de l'envoi: ${error.message}`,
                    'Erreur'
                );
            }

            throw error;
        } finally {
            this.isSending = false;
        }
    }

    /**
     * Méthode classique: envoyer les enregistrements audio (mode hérité)
     * v2.2.1: Envoyer CHAQUE audio séparément au webhook (comme les photos en DMI)
     */
    async send(mode) {
        if (this.isSending) {
            console.warn('Envoi déjà en cours...');
            return Promise.resolve();
        }

        this.isSending = true;
        const logger = window.logger?.createLogger('DataSender') || console;

        try {
            logger.info(`🎵 Début de l'envoi en mode: ${mode}`);

            // Check authentication
            const currentUser = window.FirebaseAuthManager?.getCurrentUser?.() || null;
            if (!currentUser) {
                throw new Error('Utilisateur non authentifié. Veuillez vous connecter.');
            }

            // Collect data based on mode
            const data = await this.collectData(mode);

            // Validate data
            if (!this.validateData(data, mode)) {
                throw new Error('Données invalides pour l\'envoi');
            }

            console.log(`📤 Audio: Envoi de ${data.recordings.length} enregistrement(s)...`);

            // 🔑 Envoyer CHAQUE enregistrement séparément (pas tous ensemble)
            const results = [];

            for (let i = 0; i < data.recordings.length; i++) {
                const recording = data.recordings[i];

                try {
                    // Créer un payload pour cet enregistrement spécifique
                    const audioPayload = {
                        uid: currentUser.uid,
                        email: currentUser.email,
                        displayName: currentUser.displayName || '',
                        mode: mode,
                        fileType: 'audio',
                        inputType: 'audio',
                        timestamp: new Date().toISOString(),
                        patientInfo: data.patientInfo,

                        // Infos d'indexation pour tracer la progression
                        audioIndex: i + 1,
                        totalAudios: data.recordings.length,

                        // L'enregistrement actuel
                        recording: recording,

                        // Métadonnées
                        metadata: data.metadata
                    };

                    console.log(`📤 Audio ${i + 1}/${data.recordings.length}: Envoi ${recording.sectionId}...`);

                    // Envoyer cet audio au webhook
                    const result = await this.sendToEndpoint(audioPayload, mode);
                    results.push({
                        sectionId: recording.sectionId,
                        success: true,
                        result: result
                    });

                    console.log(`✅ Audio ${i + 1}/${data.recordings.length} envoyé: ${recording.sectionId}`);

                } catch (audioError) {
                    logger.error(`❌ Erreur audio ${i + 1}/${data.recordings.length}: ${recording.sectionId}`, audioError);
                    results.push({
                        sectionId: recording.sectionId,
                        success: false,
                        error: audioError.message
                    });
                }
            }

            // Vérifier si au moins un audio a été envoyé avec succès
            const successCount = results.filter(r => r.success).length;

            if (successCount > 0) {
                logger.info(`✅ Envoi réussi: ${successCount}/${data.recordings.length} enregistrement(s)`);

                // Show success notification
                if (window.notificationSystem) {
                    window.notificationSystem.success(
                        `✅ ${successCount} enregistrement(s) envoyé(s) avec succès!`,
                        'Envoi terminé'
                    );
                }

                // Show Google Sheet result for test mode
                if (mode === window.APP_CONFIG.MODES.TEST) {
                    this.showGoogleSheetResult();
                }

                return {
                    success: true,
                    totalAudios: data.recordings.length,
                    successCount: successCount,
                    results: results
                };
            } else {
                throw new Error(`Tous les enregistrements ont échoué à l'envoi`);
            }

        } catch (error) {
            logger.error('❌ Erreur lors de l\'envoi des données', {
                error: error.message,
                stack: error.stack,
                mode
            });

            if (window.notificationSystem) {
                window.notificationSystem.error(
                    'Erreur lors de l\'envoi des données: ' + error.message,
                    'Erreur d\'envoi'
                );
            }

            throw error;
        } finally {
            this.isSending = false;
        }
    }

    async collectData(mode) {
        const data = {
            mode: mode,
            inputType: 'audio', // ✅ Primary input type for Normal and Test modes
            inputTypes: ['audio'], // ✅ List of all input types in this payload
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            patientInfo: {},
            recordings: [],
            metadata: {}
        };

        try {
            // Collect patient information based on mode
            data.patientInfo = this.collectPatientInfo(mode);

            // Collect recordings
            data.recordings = await this.collectRecordings(mode);

            // Collect metadata
            data.metadata = this.collectMetadata(mode);

            // Log payload structure
            console.log(`DataSender: Payload structure for ${mode}:`, {
                inputType: data.inputType,
                inputTypes: data.inputTypes,
                recordingCount: data.recordings.length,
                hasPatientInfo: Object.keys(data.patientInfo).length > 0
            });

            return data;
        } catch (error) {
            console.error('Erreur lors de la collecte des données:', error);
            throw new Error('Impossible de collecter les données: ' + error.message);
        }
    }

    collectPatientInfo(mode) {
        const patientInfo = {};

        try {
            if (mode === window.APP_CONFIG.MODES.TEST) {
                // Test mode patient info
                patientInfo.numeroDossier = document.getElementById('numeroDossierTest')?.value?.trim() || '';
                patientInfo.nomPatient = document.getElementById('nomPatientTest')?.value?.trim() || '';
            } else if (mode === window.APP_CONFIG.MODES.NORMAL) {
                // Normal mode patient info
                patientInfo.numeroDossier = document.getElementById('numeroDossier')?.value?.trim() || '';
                patientInfo.nomPatient = document.getElementById('nomPatient')?.value?.trim() || '';
            }

            return patientInfo;
        } catch (error) {
            console.error('Erreur lors de la collecte des infos patient:', error);
            return {};
        }
    }

    async collectRecordings(mode) {
        const recordings = [];
        const sections = window.APP_CONFIG?.SECTIONS?.[mode] || [];

        try {
            // Vérification des prérequis
            if (!this.audioRecorderManager) {
                console.warn('DataSender: AudioRecorderManager not available');
                return recordings;
            }

            if (!Array.isArray(sections) || sections.length === 0) {
                console.warn(`DataSender: No sections defined for mode: ${mode}`);
                return recordings;
            }

            console.log(`DataSender: Collecting recordings for ${sections.length} sections in mode ${mode}`);

            for (const sectionId of sections) {
                try {
                    // Validation du sectionId
                    if (!sectionId || typeof sectionId !== 'string') {
                        console.warn('DataSender: Invalid sectionId:', sectionId);
                        continue;
                    }

                    const recorder = this.audioRecorderManager.getRecorder(sectionId);
                    
                    if (!recorder) {
                        console.warn(`DataSender: No recorder found for section: ${sectionId}`);
                        continue;
                    }

                    // Vérification que le recorder a la méthode hasRecording
                    if (typeof recorder.hasRecording !== 'function') {
                        console.warn(`DataSender: Recorder for section ${sectionId} missing hasRecording method`);
                        continue;
                    }

                    if (recorder.hasRecording()) {
                        // Création d'un objet recording cohérent et complet
                        const recording = {
                            sectionId: sectionId,
                            sectionIndex: sections.indexOf(sectionId) + 1,
                            inputType: 'audio', // ✅ Specify data type: audio
                            duration: this.safeGetRecordingDuration(recorder),
                            size: this.safeGetRecordingSize(recorder),
                            format: this.safeGetRecordingFormat(recorder),
                            timestamp: new Date().toISOString(),
                            audioData: null, // Sera rempli si nécessaire
                            metadata: {
                                hasAudioData: !!recorder.audioBlob,
                                blobType: recorder.audioBlob?.type || 'unknown'
                            }
                        };

                        // Convert audio to base64 if needed (optionnel pour réduire la taille des données)
                        if (recorder.audioBlob && recorder.audioBlob.size > 0) {
                            try {
                                // Pour les gros fichiers, on pourrait ne pas inclure l'audio dans le payload initial
                                if (recorder.audioBlob.size <= 5 * 1024 * 1024) { // 5MB limit
                                    recording.audioData = await this.blobToBase64(recorder.audioBlob);
                                } else {
                                    console.log(`DataSender: Skipping audio data for ${sectionId} (file too large: ${recorder.audioBlob.size} bytes)`);
                                }
                            } catch (error) {
                                console.warn(`DataSender: Error converting audio to base64 for ${sectionId}:`, error);
                                // Continue sans les données audio
                            }
                        }

                        recordings.push(recording);
                        console.log(`DataSender: Added recording for section ${sectionId}`);
                    }
                } catch (sectionError) {
                    console.error(`DataSender: Error processing section ${sectionId}:`, sectionError);
                    // Continue avec les autres sections au lieu d'arrêter tout
                }
            }

            console.log(`DataSender: Collected ${recordings.length} recordings out of ${sections.length} sections`);
            return recordings;
        } catch (error) {
            console.error('DataSender: Critical error in collectRecordings:', error);
            return [];
        }
    }

    /**
     * Récupération sécurisée de la durée d'enregistrement
     */
    safeGetRecordingDuration(recorder) {
        try {
            if (recorder.getDuration && typeof recorder.getDuration === 'function') {
                const duration = recorder.getDuration();
                return typeof duration === 'number' && duration >= 0 ? duration : 0;
            }
            return 0;
        } catch (error) {
            console.warn('DataSender: Error getting recording duration:', error);
            return 0;
        }
    }

    /**
     * Récupération sécurisée de la taille d'enregistrement
     */
    safeGetRecordingSize(recorder) {
        try {
            return recorder.audioBlob?.size || 0;
        } catch (error) {
            console.warn('DataSender: Error getting recording size:', error);
            return 0;
        }
    }

    /**
     * Récupération sécurisée du format d'enregistrement
     */
    safeGetRecordingFormat(recorder) {
        try {
            if (recorder.getAudioFormat && typeof recorder.getAudioFormat === 'function') {
                return recorder.getAudioFormat();
            }
            return recorder.audioBlob?.type?.split('/')[1] || 'unknown';
        } catch (error) {
            console.warn('DataSender: Error getting recording format:', error);
            return 'unknown';
        }
    }

    collectMetadata(mode) {
        return {
            totalRecordings: this.audioRecorderManager?.getSectionCount() || 0,
            browserInfo: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform
            },
            sessionInfo: {
                startTime: this.appState?.sessionStartTime || new Date().toISOString(),
                currentTime: new Date().toISOString()
            }
        };
    }

    validateData(data, mode) {
        try {
            // Basic validation
            if (!data || typeof data !== 'object') {
                return false;
            }

            // Mode-specific validation
            if (mode === window.APP_CONFIG.MODES.TEST || mode === window.APP_CONFIG.MODES.NORMAL) {
                if (!data.patientInfo.numeroDossier || !data.patientInfo.nomPatient) {
                    console.warn('Informations patient manquantes');
                    return false;
                }
            }

            // Check if there are recordings
            if (!data.recordings || data.recordings.length === 0) {
                console.warn('Aucun enregistrement trouvé');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Erreur lors de la validation des données:', error);
            return false;
        }
    }

    /**
     * Envoyer les données au webhook n8n
     * Supporte deux formats: ancien (data) et nouveau (payload v2.0)
     */
    async sendToEndpoint(data, mode) {
        try {
            let payload = data;

            // v2.0: Si data est un payload complet (contient uid, inputType, data wrapper)
            if (data && data.uid && data.inputType && data.data) {
                // Payload v2.0: déjà formaté, utiliser tel quel
                payload = data;
                console.log(`✅ v2.0 Payload detected: ${data.inputType}`);
            } else {
                // Format classique: enrichir avec user info
                const currentUser = window.FirebaseAuthManager?.getCurrentUser?.() || null;

                if (!currentUser) {
                    throw new Error('User not authenticated. Please sign in first.');
                }

                payload = {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName || '',
                    mode: mode,
                    timestamp: new Date().toISOString(),
                    ...data // Inclut patientInfo, recordings, metadata
                };
            }

            // 🔑 Déterminer le webhook en fonction du TYPE DE FICHIER (audio, text, photo)
            // Webhooks sont organisés par type de données, pas par mode
            const fileType = payload.inputType || 'audio'; // Default to 'audio'
            const endpoint = window.APP_CONFIG.WEBHOOK_ENDPOINTS?.[fileType];

            if (!endpoint) {
                throw new Error(
                    `❌ Webhook endpoint not configured for file type: ${fileType}. ` +
                    `Please configure it in js/config/webhooks-config.js`
                );
            }

            console.log(`✅ DataSender: Using webhook for file type: ${fileType}`);
            console.log(`DataSender: Webhook endpoint: ${endpoint}`);
            console.log(`DataSender: Mode: ${mode}, File Type: ${fileType}`);

            // Faire l'appel réel à l'API
            const response = await this.makeApiCall(endpoint, payload);

            console.log('✅ DataSender: Données envoyées avec succès', response);
            return response;

        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi vers l\'endpoint:', error);
            throw new Error(`Failed to send data: ${error.message}`);
        }
    }

    async makeApiCall(endpoint, payload) {
        try {
            // BUG FIX #9: Implement proper timeout using AbortController
            // Note: fetch timeout parameter is NOT standard, so use AbortController instead
            const controller = new AbortController();
            const timeoutId = setTimeout(
                () => controller.abort(),
                window.APP_CONFIG.API_TIMEOUT || 30000
            );

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP ${response.status}: ${errorText}`);

                if (response.status === 404) {
                    throw new Error('User not configured in n8n workflow. Contact administrator.');
                } else if (response.status === 500) {
                    throw new Error('Server error. Please try again later.');
                } else {
                    throw new Error(`HTTP Error: ${response.status}`);
                }
            }

            const result = await response.json();
            return {
                success: true,
                message: 'Données envoyées avec succès',
                ...result,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout. Please check your internet connection and try again.');
            }
            if (error instanceof TypeError) {
                throw new Error('Network error. Please check your internet connection.');
            }
            throw error;
        }
    }

    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                try {
                    if (!reader.result) {
                        reject(new Error('FileReader result is empty'));
                        return;
                    }
                    const parts = reader.result.split(',');
                    if (parts.length < 2) {
                        reject(new Error('Invalid base64 format from FileReader'));
                        return;
                    }
                    const base64 = parts[1];
                    if (!base64) {
                        reject(new Error('Base64 data is empty'));
                        return;
                    }
                    resolve(base64);
                } catch (error) {
                    reject(new Error(`Failed to convert blob to base64: ${error.message}`));
                }
            };
            reader.onerror = () => {
                reject(new Error(`FileReader error: ${reader.error}`));
            };
            reader.readAsDataURL(blob);
        });
    }

    showGoogleSheetResult() {
        try {
            const googleSheetCard = document.getElementById('googleSheetCard');
            if (googleSheetCard) {
                googleSheetCard.style.display = 'block';
                if (typeof googleSheetCard.scrollIntoView === 'function') {
                    googleSheetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        } catch (error) {
            console.error('Erreur lors de l\'affichage du résultat Google Sheet:', error);
        }
    }

    isCurrentlySending() {
        return this.isSending;
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataSender;
} else {
    window.DataSender = DataSender;
}