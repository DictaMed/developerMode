/**
 * DictaMed - Webhook Configuration by File Type
 * Version: 5.1.0
 *
 * FICHIER À MODIFIER POUR CHANGER LES WEBHOOKS
 *
 * À chaque fois que vous voulez changer les URLs des webhooks,
 * modifiez UNIQUEMENT ce fichier et aucun autre.
 *
 * Webhooks sont organisés par TYPE DE FICHIER:
 * - audio: Pour les fichiers audio enregistrés (modes NORMAL, TEST, DMI)
 * - text: Pour les textes libres (mode DMI uniquement)
 * - photo: Pour les photos (mode DMI uniquement)
 */

// ===== WEBHOOKS N8N CONFIGURATION BY FILE TYPE =====
// Modifiez ces URLs pour pointer vers vos webhooks n8n
// Laissez VIDE ("") si vous n'utilisez pas ce type de fichier

const WEBHOOKS_CONFIG = {
    // Webhook pour les fichiers AUDIO enregistrés
    // Utilisé dans: Mode NORMAL, Mode TEST, Mode DMI
    // Change this URL to your n8n webhook for audio files
    audio: 'https://n8n.srv1104707.hstgr.cloud/webhook/Audio',

    // Webhook pour les TEXTES libres
    // Utilisé dans: Mode DMI uniquement
    // Change this URL to your n8n webhook for text data
    text: 'https://n8n.srv1104707.hstgr.cloud/webhook-test/text',

    // Webhook pour les PHOTOS
    // Utilisé dans: Mode DMI uniquement
    // Change this URL to your n8n webhook for photos
    photo: 'https://n8n.srv1104707.hstgr.cloud/webhook-test/photos'
};

/**
 * Appliquer la configuration des webhooks à APP_CONFIG
 * Cette fonction est appelée automatiquement au chargement
 */
function initializeWebhookConfig() {
    if (window.APP_CONFIG) {
        // Mapper les webhooks par type de fichier
        window.APP_CONFIG.WEBHOOK_ENDPOINTS = {
            audio: WEBHOOKS_CONFIG.audio,
            text: WEBHOOKS_CONFIG.text,
            photo: WEBHOOKS_CONFIG.photo
        };

        console.log('✅ Webhook configuration loaded (by file type):', {
            audio: WEBHOOKS_CONFIG.audio || '(empty)',
            text: WEBHOOKS_CONFIG.text || '(empty)',
            photo: WEBHOOKS_CONFIG.photo || '(empty)'
        });
    } else {
        console.warn('⚠️ APP_CONFIG not found. Webhook configuration will be set later.');
    }
}

// Initialiser immédiatement si APP_CONFIG est disponible
if (typeof window !== 'undefined') {
    // Attendre que APP_CONFIG soit chargé
    if (window.APP_CONFIG) {
        initializeWebhookConfig();
    } else {
        // Sinon, attendre 100ms et réessayer
        setTimeout(initializeWebhookConfig, 100);
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WEBHOOKS_CONFIG, initializeWebhookConfig };
} else {
    window.WEBHOOKS_CONFIG = WEBHOOKS_CONFIG;
    window.initializeWebhookConfig = initializeWebhookConfig;
}
