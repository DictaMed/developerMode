/**
 * DictaMed - Configuration centralisée d'authentification sécurisée
 * Version: 3.0.0 - Configuration environnementale avec sécurité renforcée
 */

class AuthConfigManager {
    constructor() {
        this.config = null;
        this.environment = this.detectEnvironment();
        this.isLoaded = false;
    }

    /**
     * Détection de l'environnement d'exécution
     */
    detectEnvironment() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        } else if (hostname.includes('staging') || hostname.includes('test')) {
            return 'staging';
        } else if (protocol === 'https:' && hostname.includes('dictamed')) {
            return 'production';
        }
        
        return 'unknown';
    }

    /**
     * Chargement de la configuration depuis l'environnement
     */
    async loadConfig() {
        if (this.isLoaded) return this.config;

        try {
            // Essayer de charger depuis les variables d'environnement (production)
            if (typeof window !== 'undefined' && window.FIREBASE_CONFIG) {
                this.config = this.validateConfig(window.FIREBASE_CONFIG);
            } else {
                // Fallback: configuration par défaut (development)
                this.config = this.getDefaultConfig();
            }

            this.isLoaded = true;
            console.log(`🔧 Auth config loaded for environment: ${this.environment}`);
            return this.config;

        } catch (error) {
            console.error('❌ Failed to load auth config:', error);
            throw new Error('Configuration d\'authentification invalide');
        }
    }

    /**
     * Configuration par défaut pour le développement
     */
    getDefaultConfig() {
        return {
            apiKey: this.getEnvironmentVariable('FIREBASE_API_KEY', 'AIzaSyC9XYvHxbp3VW0PCW0W7xfoWuiMxsjoUZE'),
            authDomain: this.getEnvironmentVariable('FIREBASE_AUTH_DOMAIN', 'dictamed2025.firebaseapp.com'),
            projectId: this.getEnvironmentVariable('FIREBASE_PROJECT_ID', 'dictamed2025'),
            storageBucket: this.getEnvironmentVariable('FIREBASE_STORAGE_BUCKET', 'dictamed2025.firebasestorage.app'),
            messagingSenderId: this.getEnvironmentVariable('FIREBASE_MESSAGING_SENDER_ID', '242034923776'),
            appId: this.getEnvironmentVariable('FIREBASE_APP_ID', '1:242034923776:web:bd315e890c715b1d263be5'),
            measurementId: this.getEnvironmentVariable('FIREBASE_MEASUREMENT_ID', 'G-1B8DZ4B73R'),
            environment: this.environment,
            security: {
                enable2FA: true,
                sessionTimeout: 30 * 60 * 1000, // 30 minutes
                maxLoginAttempts: 5,
                lockoutDuration: 15 * 60 * 1000, // 15 minutes
                enableDeviceTracking: true,
                enableAuditLogging: true,
                maxConcurrentSessions: 3,
                passwordMinLength: 8,
                requireEmailVerification: true
            },
            features: {
                googleAuth: true,
                anonymousAuth: false,
                phoneAuth: false,
                customClaims: true,
                multiFactorAuth: true
            },
            endpoints: {
                apiBase: this.getEnvironmentVariable('API_BASE_URL', 'https://api.dictamed.fr'),
                webhookBase: this.getEnvironmentVariable('WEBHOOK_BASE_URL', 'https://hooks.dictamed.fr'),
                supportEmail: 'support@dictamed.fr'
            },
            admin: {
                emails: ['akio963@gmail.com'],
                roles: {
                    super_admin: ['akio963@gmail.com'],
                    admin: ['akio963@gmail.com']
                }
            }
        };
    }

    /**
     * Récupération sécurisée d'une variable d'environnement
     */
    getEnvironmentVariable(name, defaultValue = null) {
        // En production, ces variables seraient définies côté serveur
        // et récupérées de manière sécurisée
        
        // Vérifier les meta tags
        const metaTag = document.querySelector(`meta[name="${name}"]`);
        if (metaTag) {
            return metaTag.getAttribute('content');
        }
        
        // Vérifier les attributs data
        const dataAttr = document.querySelector(`[data-${name.toLowerCase()}]`);
        if (dataAttr) {
            return dataAttr.getAttribute(`data-${name.toLowerCase()}`);
        }
        
        // Fallback vers la valeur par défaut
        return defaultValue;
    }

    /**
     * Validation de la configuration
     */
    validateConfig(config) {
        const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
        const missingFields = requiredFields.filter(field => !config[field]);
        
        if (missingFields.length > 0) {
            throw new Error(`Configuration incomplète: ${missingFields.join(', ')}`);
        }

        // Validation du format des champs
        if (!config.apiKey.startsWith('AIza')) {
            throw new Error('Format de clé API invalide');
        }

        if (!config.authDomain.includes('firebaseapp.com') && this.environment === 'production') {
            console.warn('Auth domain might be incorrect for production');
        }

        if (!config.projectId || config.projectId.length < 3) {
            throw new Error('Project ID invalide');
        }

        return config;
    }

    /**
     * Obtention de la configuration complète
     */
    async getConfig() {
        if (!this.config) {
            await this.loadConfig();
        }
        return this.config;
    }

    /**
     * Obtention d'une partie spécifique de la configuration
     */
    async getConfigSection(section) {
        const config = await this.getConfig();
        return config[section] || null;
    }

    /**
     * Vérification si une fonctionnalité est activée
     */
    async isFeatureEnabled(feature) {
        const features = await this.getConfigSection('features');
        return features ? features[feature] === true : false;
    }

    /**
     * Vérification si un utilisateur est admin
     */
    async isAdminUser(email) {
        const admin = await this.getConfigSection('admin');
        return admin ? admin.emails.includes(email) : false;
    }

    /**
     * Obtention des paramètres de sécurité
     */
    async getSecurityConfig() {
        return await this.getConfigSection('security');
    }

    /**
     * Mise à jour dynamique de la configuration (admin uniquement)
     */
    async updateConfig(newConfig, userEmail) {
        const isAdmin = await this.isAdminUser(userEmail);
        if (!isAdmin) {
            throw new Error('Permissions insuffisantes pour modifier la configuration');
        }

        // Valider la nouvelle configuration
        const validatedConfig = this.validateConfig({ ...this.config, ...newConfig });
        
        // Log de l'événement de sécurité
        if (window.authSecurityManager) {
            window.authSecurityManager.logSecurityEvent('config_updated', {
                updatedBy: userEmail,
                changes: Object.keys(newConfig),
                timestamp: Date.now()
            });
        }

        this.config = validatedConfig;
        this.isLoaded = true;

        return validatedConfig;
    }

    /**
     * Initialisation sécurisée de Firebase avec la configuration
     */
    async initializeFirebase() {
        const config = await this.getConfig();
        
        try {
            // Validation finale avant initialisation
            this.validateConfig(config);
            
            // Initialiser Firebase
            const app = firebase.initializeApp({
                apiKey: config.apiKey,
                authDomain: config.authDomain,
                projectId: config.projectId,
                storageBucket: config.storageBucket,
                messagingSenderId: config.messagingSenderId,
                appId: config.appId,
                measurementId: config.measurementId
            });

            console.log('✅ Firebase initialized with secure config');
            console.log(`📊 Project: ${config.projectId}`);
            console.log(`🔒 Environment: ${config.environment}`);
            
            return app;
            
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            throw new Error(`Échec de l'initialisation Firebase: ${error.message}`);
        }
    }

    /**
     * Export sécurisé de la configuration (sans données sensibles)
     */
    async exportSafeConfig() {
        const config = await this.getConfig();
        return {
            environment: config.environment,
            features: config.features,
            endpoints: {
                apiBase: config.endpoints.apiBase,
                webhookBase: config.endpoints.webhookBase,
                supportEmail: config.endpoints.supportEmail
            },
            security: {
                sessionTimeout: config.security.sessionTimeout,
                maxLoginAttempts: config.security.maxLoginAttempts,
                enable2FA: config.security.enable2FA,
                enableDeviceTracking: config.security.enableDeviceTracking
            }
        };
    }

    /**
     * Nettoyage des données sensibles de la configuration
     */
    sanitizeConfig(config) {
        const sanitized = { ...config };
        
        // Supprimer les champs sensibles
        delete sanitized.apiKey;
        delete sanitized.projectId;
        delete sanitized.appId;
        
        return sanitized;
    }

    /**
     * Génération d'un rapport de configuration
     */
    async generateConfigReport() {
        const config = await this.getConfig();
        const report = {
            environment: config.environment,
            timestamp: new Date().toISOString(),
            security: {
                twoFactorEnabled: config.security.enable2FA,
                deviceTrackingEnabled: config.security.enableDeviceTracking,
                auditLoggingEnabled: config.security.enableAuditLogging,
                sessionTimeout: config.security.sessionTimeout,
                maxLoginAttempts: config.security.maxLoginAttempts
            },
            features: {
                googleAuth: config.features.googleAuth,
                anonymousAuth: config.features.anonymousAuth,
                phoneAuth: config.features.phoneAuth,
                multiFactorAuth: config.features.multiFactorAuth
            },
            endpoints: {
                apiBase: config.endpoints.apiBase,
                webhookBase: config.endpoints.webhookBase
            },
            admin: {
                adminCount: config.admin.emails.length,
                hasSuperAdmins: config.admin.roles.super_admin.length > 0
            }
        };
        
        return report;
    }
}

// Instance singleton
let authConfigManagerInstance = null;

function getAuthConfigManager() {
    if (!authConfigManagerInstance) {
        authConfigManagerInstance = new AuthConfigManager();
    }
    return authConfigManagerInstance;
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthConfigManager;
} else {
    window.AuthConfigManager = AuthConfigManager;
    window.getAuthConfigManager = getAuthConfigManager;
}

// Initialisation automatique
if (typeof window !== 'undefined') {
    window.authConfigManager = getAuthConfigManager();
}