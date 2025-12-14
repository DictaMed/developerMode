/**
 * DictaMed - Webhook Configuration
 * Version: 5.0.0
 *
 * FICHIER À MODIFIER POUR CHANGER LES WEBHOOKS
 *
 * À chaque fois que vous voulez changer les URLs des webhooks,
 * modifiez UNIQUEMENT ce fichier et aucun autre.
 */

// ===== WEBHOOKS N8N CONFIGURATION =====
// Modifiez ces URLs pour pointer vers vos webhooks n8n

const WEBHOOKS_CONFIG = {
    // Webhook pour les modes NORMAL et DMI
    // Change this URL to your n8n webhook for normal/dmi modes
    default: 'https://n8n.srv1104707.hstgr.cloud/webhook-test/DeveloperMode',

    // Webhook pour le mode TEST (optionnel)
    // Change this URL to your n8n webhook for test mode
    test: 'https://n8n.srv1104707.hstgr.cloud/webhook-test/DeveloperMode'
};

/**
 * Appliquer la configuration des webhooks à APP_CONFIG
 * Cette fonction est appelée automatiquement au chargement
 */
function initializeWebhookConfig() {
    if (window.APP_CONFIG) {
        window.APP_CONFIG.WEBHOOK_ENDPOINTS = {
            default: WEBHOOKS_CONFIG.default,
            test: WEBHOOKS_CONFIG.test
        };
        console.log('✅ Webhook configuration loaded:', {
            default: WEBHOOKS_CONFIG.default,
            test: WEBHOOKS_CONFIG.test
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
