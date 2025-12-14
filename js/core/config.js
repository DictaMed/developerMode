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

    // ===== v2.0: INPUT TYPES =====
    INPUT_TYPES: {
        AUDIO: 'audio',
        TEXT: 'text',
        PHOTO: 'photo'
    },

    // ===== v2.0: AUDIO CONFIGURATION =====
    AUDIO_CONFIG: {
        maxDuration: 300,                    // 5 minutes
        maxSizeBytes: 25 * 1024 * 1024,      // 25MB
        compression: {
            enabled: true,
            targetSizeBytes: 5 * 1024 * 1024, // 5MB compressed
            sampleRate: 16000                 // Whisper optimal
        }
    },

    // ===== v2.0: TEXT CONFIGURATION =====
    TEXT_CONFIG: {
        minLength: 5,
        maxLength: 50000,
        allowedFormats: ['text/plain']
    },

    // ===== v2.0: PHOTO CONFIGURATION =====
    PHOTO_CONFIG: {
        maxSizeBytes: 20 * 1024 * 1024,      // 20MB
        maxCount: 5,
        allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
        compression: {
            enabled: true,
            targetSizeBytes: 5 * 1024 * 1024  // 5MB compressed
        }
    },

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
    // Webhooks n8n centralisés - À MODIFIER dans js/config/webhooks-config.js
    // Ce fichier est importé depuis js/config/webhooks-config.js
    WEBHOOK_ENDPOINTS: null, // Will be set by webhooks-config.js
    API_TIMEOUT: 30000, // 30 secondes
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