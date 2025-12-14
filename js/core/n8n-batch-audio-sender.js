/**
 * DictaMed - n8n Batch Audio Sender
 * Solution A: Traitement multi-audios en un seul webhook
 *
 * Version: 1.0
 * Date: 2025-12-14
 *
 * Usage:
 *   const sender = new N8nBatchAudioSender(config);
 *   await sender.submitAudioBatch(audioFiles);
 */

class N8nBatchAudioSender {
  /**
   * Initialiser le sender avec la configuration
   * @param {Object} config
   * @param {string} config.webhookUrl - URL du webhook n8n
   * @param {Object} config.userInfo - Infos utilisateur
   * @param {Object} config.notificationSystem - Système de notifications (optionnel)
   * @param {boolean} config.verbose - Logs détaillés (default: true)
   */
  constructor(config) {
    this.webhookUrl = config.webhookUrl || 'https://n8n.example.com/webhook/dictamed-audio-batch';
    this.userInfo = config.userInfo;
    this.notificationSystem = config.notificationSystem;
    this.verbose = config.verbose !== false;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;

    // Validation
    if (!this.webhookUrl) {
      throw new Error('webhookUrl is required in config');
    }
    if (!this.userInfo || !this.userInfo.uid) {
      throw new Error('userInfo with uid is required in config');
    }

    this.log('✅ N8nBatchAudioSender initialized');
  }

  /**
   * Soumettre un batch d'audios pour traitement
   * @param {Array<AudioFile>} audioFiles - Array de fichiers audio
   * @param {Object} options - Options additionnelles
   * @returns {Promise<Object>} Résultat du traitement
   *
   * @example
   * const audioFiles = [
   *   { blob: blob1, duration: 45, sectionId: 'section_1' },
   *   { blob: blob2, duration: 60, sectionId: 'section_2' }
   * ];
   * const result = await sender.submitAudioBatch(audioFiles);
   */
  async submitAudioBatch(audioFiles, options = {}) {
    try {
      this.log(`📤 Starting batch submission for ${audioFiles.length} audio files`);

      // Validation
      if (!audioFiles || audioFiles.length === 0) {
        throw new Error('audioFiles must be a non-empty array');
      }

      // Convertir les blobs en base64
      this.log('🔄 Converting audio blobs to base64...');
      const audioFilesBase64 = await this.convertAudioFilesToBase64(audioFiles);

      // Préparer le payload
      this.log('📋 Preparing webhook payload...');
      const payload = this.buildPayload(audioFilesBase64, options);

      // Envoyer avec retry logic
      this.log('🚀 Sending to n8n webhook...');
      const result = await this.sendWithRetry(payload);

      // Succès
      this.showNotification(
        `✅ ${result.processed} fichiers audio traités avec succès`,
        'success'
      );

      return result;
    } catch (error) {
      this.log('❌ Batch submission failed:', error);
      this.showNotification(
        `❌ Erreur: ${error.message}`,
        'error'
      );
      throw error;
    }
  }

  /**
   * Convertir les blobs audio en base64
   * @private
   */
  async convertAudioFilesToBase64(audioFiles) {
    return Promise.all(
      audioFiles.map(async (file, index) => {
        try {
          this.log(`  → Converting file ${index + 1}/${audioFiles.length}...`);
          const base64 = await this.blobToBase64(file.blob);

          return {
            audioData: base64,
            duration: file.duration || 0,
            sectionId: file.sectionId || `section_${index + 1}`,
            format: file.format || 'webm'
          };
        } catch (error) {
          throw new Error(`Failed to convert file ${index + 1}: ${error.message}`);
        }
      })
    );
  }

  /**
   * Construire le payload pour n8n
   * @private
   */
  buildPayload(audioFilesBase64, options) {
    return {
      // Infos utilisateur (du config)
      uid: this.userInfo.uid,
      email: this.userInfo.email,
      displayName: this.userInfo.displayName || 'Unknown',
      mode: this.userInfo.mode || 'normal',

      // Infos patient (options)
      patientInfo: options.patientInfo || {
        numeroDossier: options.patientDossier || '',
        nomPatient: options.patientName || ''
      },

      // Prompt personnalisé
      prompt: options.prompt || this.getDefaultPrompt(),

      // Array de fichiers audio
      audioFiles: audioFilesBase64,

      // Métadonnées
      metadata: {
        timestamp: new Date().toISOString(),
        clientVersion: '1.0',
        fileCount: audioFilesBase64.length,
        totalDuration: audioFilesBase64.reduce((sum, f) => sum + f.duration, 0)
      }
    };
  }

  /**
   * Envoyer avec retry logic
   * @private
   */
  async sendWithRetry(payload, attempt = 1) {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.status || result.status !== 'success') {
        throw new Error(`Server returned error: ${result.message || 'Unknown error'}`);
      }

      this.log(`✅ Webhook response received: ${result.processed} files processed`);
      return result;
    } catch (error) {
      if (attempt < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        this.log(`⏳ Retry attempt ${attempt + 1}/${this.maxRetries} in ${delay}ms...`);

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendWithRetry(payload, attempt + 1);
      } else {
        throw new Error(`Failed after ${this.maxRetries} attempts: ${error.message}`);
      }
    }
  }

  /**
   * Helper: Convertir Blob en Base64
   * @private
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const base64 = reader.result.split(',')[1];
          if (!base64) {
            reject(new Error('Failed to extract base64 from blob'));
          } else {
            resolve(base64);
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read blob'));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Obtenir le prompt par défaut
   * @private
   */
  getDefaultPrompt() {
    return 'Résume cette consultation médicale de manière structurée. ' +
           'Inclus: symptômes, diagnostic, traitement prescrit, notes importantes.';
  }

  /**
   * Afficher une notification
   * @private
   */
  showNotification(message, type = 'info') {
    this.log(`[${type.toUpperCase()}] ${message}`);

    if (this.notificationSystem) {
      try {
        if (typeof this.notificationSystem[type] === 'function') {
          this.notificationSystem[type](message);
        } else {
          console.warn(`Notification system doesn't have method: ${type}`);
        }
      } catch (error) {
        console.error('Notification system error:', error);
      }
    }
  }

  /**
   * Logger avec préfixe
   * @private
   */
  log(...args) {
    if (this.verbose) {
      console.log('[N8nBatchAudioSender]', ...args);
    }
  }

  /**
   * Obtenir les statistiques de configuration
   */
  getConfig() {
    return {
      webhookUrl: this.webhookUrl,
      userId: this.userInfo.uid,
      userEmail: this.userInfo.email,
      mode: this.userInfo.mode || 'normal',
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay
    };
  }
}

/**
 * Exemple d'intégration dans DictaMed
 */
class DictaMedN8nIntegration {
  /**
   * Initialiser l'intégration n8n
   * @param {Object} userInfo - Infos utilisateur actuels
   * @param {Object} notificationSystem - Système de notifications DictaMed
   */
  static initialize(userInfo, notificationSystem) {
    window.n8nAudioSender = new N8nBatchAudioSender({
      webhookUrl: window.APP_CONFIG?.N8N_WEBHOOK_URL ||
                  'https://your-n8n-instance.com/webhook/dictamed-audio-batch',
      userInfo: userInfo,
      notificationSystem: notificationSystem,
      verbose: window.location.hostname === 'localhost'
    });

    console.log('✅ n8n Audio Sender initialized');
  }

  /**
   * Envoyer un batch d'audios depuis le mode Test ou Normal
   * @param {Array} recordingsSections - Sections avec audios
   * @param {Object} metadata - Infos supplémentaires
   */
  static async submitRecordings(recordingsSections, metadata = {}) {
    if (!window.n8nAudioSender) {
      throw new Error('N8nAudioSender not initialized');
    }

    // Convertir les sections en audioFiles array
    const audioFiles = recordingsSections.map(section => ({
      blob: section.audioBlob,
      duration: section.duration || 0,
      sectionId: section.sectionId || `section_${section.index}`,
      format: 'webm'
    }));

    // Soumettre le batch
    return window.n8nAudioSender.submitAudioBatch(audioFiles, {
      prompt: metadata.prompt || undefined,
      patientInfo: metadata.patientInfo || undefined,
      patientDossier: metadata.patientDossier || '',
      patientName: metadata.patientName || ''
    });
  }
}

// Export pour usage en modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { N8nBatchAudioSender, DictaMedN8nIntegration };
}
