/**
 * DictaMed - Multi-Input Handler v2.0
 * Gère les 3 types d'entrée: Audio, Texte, Photos
 * Wrapper unifié pour envoyer données via DataSender
 */

class MultiInputHandler {
    constructor(dataSender) {
        this.dataSender = dataSender;
        this.logger = window.logger?.createLogger('MultiInputHandler') || console;
        this.supportedTypes = {
            AUDIO: 'audio',
            TEXT: 'text',
            PHOTO: 'photo'
        };
    }

    /**
     * Traiter et envoyer des données selon le type
     * Interface unifiée pour tous les composants
     */
    async handleAndSend(recordingData, mode = 'normal') {
        try {
            this.logger.info('🚀 Début traitement multi-input');

            // Déterminer le type
            const inputType = this.dataSender.determineInputType(recordingData);

            if (inputType === 'unknown') {
                throw new Error('Type d\'entrée non déterminé. Vérifiez les données.');
            }

            this.logger.info(`📊 Type détecté: ${inputType}`);

            // Envoyer via DataSender (gère validation + traitement + envoi)
            const result = await this.dataSender.sendRecordingData(recordingData, mode);

            this.logger.info(`✅ ${inputType.toUpperCase()} traité et envoyé`);
            return result;

        } catch (error) {
            this.logger.error('❌ Erreur traitement:', error);
            throw error;
        }
    }

    /**
     * Handler spécialisé pour audio
     */
    async handleAudio(audioBlob, duration, mode = 'normal') {
        if (!audioBlob) {
            throw new Error('Audio blob manquant');
        }

        const recordingData = {
            audioBlob: audioBlob,
            duration: duration,
            format: 'webm'
        };

        return this.handleAndSend(recordingData, mode);
    }

    /**
     * Handler spécialisé pour texte
     */
    async handleText(text, mode = 'normal') {
        if (!text || text.trim().length === 0) {
            throw new Error('Texte vide');
        }

        const recordingData = {
            text: text,
            format: 'text/plain'
        };

        return this.handleAndSend(recordingData, mode);
    }

    /**
     * Handler spécialisé pour photo
     */
    async handlePhoto(photoBlob, mimeType, description = '', mode = 'normal') {
        if (!photoBlob) {
            throw new Error('Photo blob manquante');
        }

        if (!mimeType) {
            throw new Error('MIME type manquant');
        }

        const recordingData = {
            photoBlob: photoBlob,
            mimeType: mimeType,
            description: description
        };

        return this.handleAndSend(recordingData, mode);
    }

    /**
     * Valider un type d'entrée
     */
    validateInputType(inputType) {
        return Object.values(this.supportedTypes).includes(inputType);
    }

    /**
     * Obtenir les types supportés
     */
    getSupportedTypes() {
        return Object.values(this.supportedTypes);
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiInputHandler;
} else {
    window.MultiInputHandler = MultiInputHandler;
}
