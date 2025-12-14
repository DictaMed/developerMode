/**
 * DictaMed - Système d'envoi de données
 * Version: 2.1 - Système centralisé d'envoi des données
 */

class DataSender {
    constructor(appState, audioRecorderManager) {
        this.appState = appState;
        this.audioRecorderManager = audioRecorderManager;
        this.isSending = false;
    }

    async send(mode) {
        if (this.isSending) {
            console.warn('Envoi déjà en cours...');
            return Promise.resolve();
        }

        this.isSending = true;
        const logger = window.logger?.createLogger('DataSender') || console;

        try {
            logger.info(`Début de l'envoi en mode: ${mode}`);

            // Collect data based on mode
            const data = await this.collectData(mode);
            
            // Validate data
            if (!this.validateData(data, mode)) {
                throw new Error('Données invalides pour l\'envoi');
            }

            // Send data to appropriate endpoint
            const result = await this.sendToEndpoint(data, mode);
            
            logger.info('Données envoyées avec succès', { result });
            
            // Show success notification
            if (window.notificationSystem) {
                window.notificationSystem.success(
                    'Données envoyées avec succès!',
                    'Envoi terminé'
                );
            }

            // Show Google Sheet result for test mode
            if (mode === window.APP_CONFIG.MODES.TEST) {
                this.showGoogleSheetResult();
            }

            return result;

        } catch (error) {
            logger.error('Erreur lors de l\'envoi des données', {
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

    async sendToEndpoint(data, mode) {
        try {
            // Récupérer l'utilisateur actuel
            const currentUser = window.FirebaseAuthManager?.getCurrentUser?.() || null;

            if (!currentUser) {
                throw new Error('User not authenticated. Please sign in first.');
            }

            // Déterminer le webhook en fonction du mode
            let endpoint;
            if (mode === window.APP_CONFIG.MODES.TEST) {
                // Mode TEST: webhook séparé
                endpoint = window.APP_CONFIG.WEBHOOK_ENDPOINTS.test;
            } else {
                // Mode NORMAL et DMI: webhook partagé
                endpoint = window.APP_CONFIG.WEBHOOK_ENDPOINTS.default;
            }

            if (!endpoint) {
                throw new Error(`Webhook endpoint not configured for mode: ${mode}`);
            }

            // Enrichir les données avec les informations utilisateur
            const payload = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName || '',
                mode: mode,
                timestamp: new Date().toISOString(),
                ...data // Inclut patientInfo, recordings, metadata
            };

            console.log(`DataSender: Sending to endpoint: ${endpoint} (mode: ${mode})`);

            // Faire l'appel réel à l'API
            const response = await this.makeApiCall(endpoint, payload);

            console.log('DataSender: Données envoyées avec succès', response);
            return response;

        } catch (error) {
            console.error('Erreur lors de l\'envoi vers l\'endpoint:', error);
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