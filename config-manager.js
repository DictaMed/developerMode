/**
 * Unified Configuration Management System for DictaMed
 * Addresses hard-coded values and provides centralized configuration
 */

/**
 * Environment detection
 */
const ENVIRONMENTS = {
    DEVELOPMENT: 'development',
    STAGING: 'staging',
    PRODUCTION: 'production'
};

const CURRENT_ENV = process.env.NODE_ENV || ENVIRONMENTS.DEVELOPMENT;

/**
 * Application Configuration
 */
class AppConfig {
    constructor() {
        this.config = this.loadConfig();
        this.validateConfig();
    }
    
    /**
     * Load configuration based on environment
     */
    loadConfig() {
        const configs = {
            [ENVIRONMENTS.DEVELOPMENT]: {
                // Development configuration
                endpoints: {
                    NORMAL: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedNormalMode',
                    TEST: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed',
                    DMI: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedDMI'
                },
                auth: {
                    requiredForNormalMode: false, // Disabled for easier testing
                    requiredForDmiMode: false,
                    publicModes: ['test'],
                    maxLoginAttempts: 10,
                    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
                    sessionTimeout: 24 * 60 * 60 * 1000 // 24 hours
                },
                recording: {
                    maxDuration: 180, // 3 minutes for testing
                    maxFileSize: 50 * 1024 * 1024, // 50MB
                    supportedFormats: ['audio/webm', 'audio/mp4', 'audio/ogg'],
                    autoSaveInterval: 30000, // 30 seconds
                    requestTimeout: 30000 // 30 seconds
                },
                dmi: {
                    maxPhotos: 5,
                    maxPhotoSize: 10 * 1024 * 1024, // 10MB
                    supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
                    maxTextLength: 50000 // 50k characters
                },
                ui: {
                    theme: 'light',
                    animations: true,
                    debugMode: true,
                    showAdvancedFeatures: true
                },
                security: {
                    enableCSP: false,
                    enableAppCheck: false,
                    sanitizeInputs: true,
                    validateFileTypes: true
                }
            },
            
            [ENVIRONMENTS.STAGING]: {
                // Staging configuration
                endpoints: {
                    NORMAL: process.env.STAGING_NORMAL_ENDPOINT || 'https://staging-n8n.srv1104707.hstgr.cloud/webhook/DictaMedNormalMode',
                    TEST: process.env.STAGING_TEST_ENDPOINT || 'https://staging-n8n.srv1104707.hstgr.cloud/webhook/DictaMed',
                    DMI: process.env.STAGING_DMI_ENDPOINT || 'https://staging-n8n.srv1104707.hstgr.cloud/webhook/DictaMedDMI'
                },
                auth: {
                    requiredForNormalMode: true,
                    requiredForDmiMode: true,
                    publicModes: ['test'],
                    maxLoginAttempts: 5,
                    rateLimitWindow: 10 * 60 * 1000, // 10 minutes
                    sessionTimeout: 12 * 60 * 60 * 1000 // 12 hours
                },
                recording: {
                    maxDuration: 120, // 2 minutes
                    maxFileSize: 25 * 1024 * 1024, // 25MB
                    supportedFormats: ['audio/webm', 'audio/mp4'],
                    autoSaveInterval: 60000, // 1 minute
                    requestTimeout: 45000 // 45 seconds
                },
                dmi: {
                    maxPhotos: 3,
                    maxPhotoSize: 5 * 1024 * 1024, // 5MB
                    supportedImageTypes: ['image/jpeg', 'image/png'],
                    maxTextLength: 25000 // 25k characters
                },
                ui: {
                    theme: 'light',
                    animations: true,
                    debugMode: true,
                    showAdvancedFeatures: false
                },
                security: {
                    enableCSP: true,
                    enableAppCheck: true,
                    sanitizeInputs: true,
                    validateFileTypes: true
                }
            },
            
            [ENVIRONMENTS.PRODUCTION]: {
                // Production configuration
                endpoints: {
                    NORMAL: process.env.PROD_NORMAL_ENDPOINT || 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedNormalMode',
                    TEST: process.env.PROD_TEST_ENDPOINT || 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed',
                    DMI: process.env.PROD_DMI_ENDPOINT || 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedDMI'
                },
                auth: {
                    requiredForNormalMode: true,
                    requiredForDmiMode: true,
                    publicModes: ['test'],
                    maxLoginAttempts: 3,
                    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
                    sessionTimeout: 8 * 60 * 60 * 1000 // 8 hours
                },
                recording: {
                    maxDuration: 120, // 2 minutes
                    maxFileSize: 20 * 1024 * 1024, // 20MB
                    supportedFormats: ['audio/webm'],
                    autoSaveInterval: 120000, // 2 minutes
                    requestTimeout: 60000 // 60 seconds
                },
                dmi: {
                    maxPhotos: 3,
                    maxPhotoSize: 5 * 1024 * 1024, // 5MB
                    supportedImageTypes: ['image/jpeg', 'image/png'],
                    maxTextLength: 20000 // 20k characters
                },
                ui: {
                    theme: 'light',
                    animations: false,
                    debugMode: false,
                    showAdvancedFeatures: false
                },
                security: {
                    enableCSP: true,
                    enableAppCheck: true,
                    sanitizeInputs: true,
                    validateFileTypes: true
                }
            }
        };
        
        return configs[CURRENT_ENV] || configs[ENVIRONMENTS.DEVELOPMENT];
    }
    
    /**
     * Validate configuration integrity
     */
    validateConfig() {
        const errors = [];
        
        // Validate endpoints
        if (!this.config.endpoints || typeof this.config.endpoints !== 'object') {
            errors.push('Invalid endpoints configuration');
        } else {
            ['NORMAL', 'TEST', 'DMI'].forEach(endpoint => {
                if (!this.config.endpoints[endpoint]) {
                    errors.push(`Missing endpoint: ${endpoint}`);
                } else if (!this.isValidUrl(this.config.endpoints[endpoint])) {
                    errors.push(`Invalid URL for endpoint: ${endpoint}`);
                }
            });
        }
        
        // Validate auth settings
        if (!Array.isArray(this.config.auth.publicModes)) {
            errors.push('Auth publicModes must be an array');
        }
        
        if (typeof this.config.auth.maxLoginAttempts !== 'number' || this.config.auth.maxLoginAttempts < 1) {
            errors.push('Auth maxLoginAttempts must be a positive number');
        }
        
        // Validate recording settings
        if (typeof this.config.recording.maxDuration !== 'number' || this.config.recording.maxDuration < 30) {
            errors.push('Recording maxDuration must be at least 30 seconds');
        }
        
        if (typeof this.config.recording.maxFileSize !== 'number' || this.config.recording.maxFileSize < 1024 * 1024) {
            errors.push('Recording maxFileSize must be at least 1MB');
        }
        
        // Validate DMI settings
        if (typeof this.config.dmi.maxPhotos !== 'number' || this.config.dmi.maxPhotos < 1 || this.config.dmi.maxPhotos > 10) {
            errors.push('DMI maxPhotos must be between 1 and 10');
        }
        
        if (errors.length > 0) {
            throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
        }
        
        console.log(`✅ Configuration validated for ${CURRENT_ENV} environment`);
    }
    
    /**
     * Basic URL validation
     */
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    /**
     * Get configuration value with dot notation support
     */
    get(path, defaultValue = undefined) {
        const keys = path.split('.');
        let current = this.config;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }
        
        return current;
    }
    
    /**
     * Check if current environment matches
     */
    isEnvironment(env) {
        return CURRENT_ENV === env;
    }
    
    /**
     * Check if feature is enabled
     */
    isFeatureEnabled(feature) {
        return this.get(`features.${feature}`, false);
    }
    
    /**
     * Get all configuration (use cautiously)
     */
    getAll() {
        return { ...this.config };
    }
    
    /**
     * Override configuration (for testing)
     */
    override(path, value) {
        const keys = path.split('.');
        let current = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current) || typeof current[keys[i]] !== 'object') {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
    }
    
    /**
     * Reset to original configuration
     */
    reset() {
        this.config = this.loadConfig();
        this.validateConfig();
    }
    
    /**
     * Export configuration for debugging
     */
    export() {
        return {
            environment: CURRENT_ENV,
            config: this.getAll(),
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Constants that should not change based on environment
 */
export const APP_CONSTANTS = {
    APP_NAME: 'DictaMed',
    APP_VERSION: '1.0.0',
    SUPPORTED_LOCALES: ['fr', 'en'],
    DEFAULT_LOCALE: 'fr',
    
    // Firebase collection names
    FIREBASE_COLLECTIONS: {
        USERS: 'users',
        SESSIONS: 'sessions',
        RECORDINGS: 'recordings',
        AUDIT_LOGS: 'audit_logs'
    },
    
    // Error codes
    ERROR_CODES: {
        NETWORK_ERROR: 'NETWORK_ERROR',
        AUTHENTICATION_FAILED: 'AUTH_FAILED',
        VALIDATION_ERROR: 'VALIDATION_ERROR',
        RATE_LIMIT_EXCEEDED: 'RATE_LIMIT',
        FILE_TOO_LARGE: 'FILE_TOO_LARGE',
        UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT'
    },
    
    // File type constants
    AUDIO_FORMATS: ['webm', 'mp4', 'ogg', 'wav', 'mp3'],
    IMAGE_FORMATS: ['jpeg', 'jpg', 'png', 'webp', 'gif'],
    
    // Storage keys
    STORAGE_KEYS: {
        AUTOSAVE: 'dictamed_autosave',
        AUTH_STATE: 'dictamed_firebase_auth',
        USER_PREFERENCES: 'dictamed_user_prefs',
        DEBUG_SETTINGS: 'dictamed_debug'
    },
    
    // Animation durations (in ms)
    ANIMATIONS: {
        FAST: 150,
        NORMAL: 300,
        SLOW: 500,
        LOADING: 800
    }
};

/**
 * Create and export singleton instance
 */
export const appConfig = new AppConfig();

// Debug utilities
if (appConfig.get('ui.debugMode')) {
    window.configDebug = {
        get: (path) => appConfig.get(path),
        isEnv: (env) => appConfig.isEnvironment(env),
        export: () => appConfig.export(),
        override: (path, value) => appConfig.override(path, value),
        reset: () => appConfig.reset()
    };
    
    console.log('🔧 Config debug utilities available:', window.configDebug);
}

// Environment indicator
console.log(`🚀 DictaMed running in ${CURRENT_ENV} mode`);
if (CURRENT_ENV !== ENVIRONMENTS.PRODUCTION) {
    console.log('🔍 Debug mode enabled - development features active');
}