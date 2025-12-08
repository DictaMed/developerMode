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
        const endpoint = window.APP_CONFIG?.ENDPOINTS?.[mode];
        
        if (!endpoint) {
            throw new Error(`Endpoint non configuré pour le mode: ${mode}`);
        }

        try {
            console.log(`Envoi des données vers: ${endpoint}`);
            
            // For demo purposes, we'll simulate the API call
            // In production, this would be a real API call
            const response = await this.simulateApiCall(data, endpoint);
            
            return response;
        } catch (error) {
            console.error('Erreur lors de l\'envoi vers l\'endpoint:', error);
            throw new Error('Erreur réseau: ' + error.message);
        }
    }

    async simulateApiCall(data, endpoint) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Simulate random success/failure for demo
        const success = Math.random() > 0.1; // 90% success rate
        
        if (success) {
            return {
                success: true,
                message: 'Données envoyées avec succès',
                dataId: 'demo_' + Date.now(),
                timestamp: new Date().toISOString()
            };
        } else {
            throw new Error('Erreur simulée du serveur');
        }
    }

    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
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