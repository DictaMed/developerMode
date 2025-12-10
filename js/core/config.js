/**
 * DictaMed - Configuration de l'application
 * Version: 2.0.0 - Refactorisé pour une meilleure organisation
 */

// ===== APPLICATION CONSTANTS =====
const APP_CONFIG = {
    MAX_RECORDING_DURATION: 120, // 2 minutes in seconds
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    MAX_PHOTOS: 5,
    MAX_PHOTO_SIZE: 10 * 1024 * 1024, // 10MB
    AUTOSAVE_INTERVAL: 30000, // 30 seconds
    AUTOSAVE_RETENTION: 24 * 60 * 60 * 1000, // 24 hours
    TIMEOUT_DURATION: 30000, // 30 seconds
    MODES: {
        NORMAL: 'normal',
        TEST: 'test',
        DMI: 'dmi',
        HOME: 'home'
    },
    SECTIONS: {
        normal: ['partie1', 'partie2', 'partie3', 'partie4'],
        test: ['clinique', 'antecedents', 'biologie']
    },
    ENDPOINTS: {
        normal: null, // Sera récupéré dynamiquement via WebhookManager
        test: null,   // Sera récupéré dynamiquement via WebhookManager
        dmi: null     // Sera récupéré dynamiquement via WebhookManager
    },
    FALLBACK_ENDPOINTS: {
        normal: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedNormalMode',
        test: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed',
        dmi: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed'
    },
    WEBHOOK_CONFIG: {
        CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
        RETRY_ATTEMPTS: 3,
        TIMEOUT: 30000 // 30 secondes
    },
    AUDIO_FORMATS: {
        PRIORITY: [
            'audio/mpeg',              // MP3
            'audio/mp4',               // M4A/AAC
            'audio/webm;codecs=opus',  // WebM Opus
            'audio/webm',              // WebM
            'audio/ogg;codecs=opus',   // Ogg Opus
            'audio/wav'                // WAV
        ]
    }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONFIG;
} else {
    window.APP_CONFIG = APP_CONFIG;
}