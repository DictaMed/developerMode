/**
 * Secure Firebase Configuration for DictaMed
 * This version addresses security vulnerabilities in the original implementation
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    connectAuthEmulator 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    connectFirestoreEmulator 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/**
 * Environment-based configuration
 * In production, these should be injected as environment variables
 */
const ENV = {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    STAGING: 'staging'
};

const CURRENT_ENV = process.env.NODE_ENV || ENV.DEVELOPMENT;

/**
 * Firebase project configurations for different environments
 * Note: In production, use Firebase App Check and security rules
 */
const FIREBASE_CONFIGS = {
    [ENV.DEVELOPMENT]: {
        // Development config (restrict API key)
        apiKey: "AIzaSyDemo_Development_Key_Only",
        authDomain: "dictamed-dev.firebaseapp.com",
        projectId: "dictamed-dev",
        storageBucket: "dictamed-dev.firebasestorage.app",
        messagingSenderId: "123456789012",
        appId: "1:123456789012:web:demo123"
    },
    [ENV.PRODUCTION]: {
        // Production config with proper restrictions
        // API key should be restricted by HTTP referrers, domain, and IP
        apiKey: process.env.FIREBASE_API_KEY || "AIzaSyProduction_Key_With_Restrictions",
        authDomain: "dictamed-2025.firebaseapp.com",
        projectId: "dictamed-2025",
        storageBucket: "dictamed-2025.firebasestorage.app",
        messagingSenderId: "565675197934",
        appId: "1:565675197934:web:d3bd5a9f86d274e581baff",
        measurementId: "G-R3MN277B7F"
    }
};

/**
 * Get current environment configuration
 */
function getFirebaseConfig() {
    const config = FIREBASE_CONFIGS[CURRENT_ENV];
    
    if (!config) {
        throw new Error(`Invalid environment: ${CURRENT_ENV}`);
    }
    
    return config;
}

/**
 * Validate Firebase configuration before initialization
 */
function validateConfig(config) {
    const required = ['apiKey', 'authDomain', 'projectId'];
    const missing = required.filter(key => !config[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required Firebase config: ${missing.join(', ')}`);
    }
    
    // Validate API key format (basic check)
    if (!config.apiKey.startsWith('AIzaSy')) {
        throw new Error('Invalid API key format');
    }
    
    return true;
}

/**
 * Initialize Firebase with security best practices
 */
class SecureFirebaseApp {
    constructor() {
        this.app = null;
        this.auth = null;
        this.db = null;
        this.initialized = false;
    }
    
    async initialize() {
        if (this.initialized) {
            console.warn('Firebase already initialized');
            return;
        }
        
        try {
            const config = getFirebaseConfig();
            validateConfig(config);
            
            // Initialize Firebase app
            this.app = initializeApp(config);
            this.auth = getAuth(this.app);
            this.db = getFirestore(this.app);
            
            // Configure emulators for development
            if (CURRENT_ENV === ENV.DEVELOPMENT) {
                this.setupEmulators();
            }
            
            // Enable App Check for production
            if (CURRENT_ENV === ENV.PRODUCTION) {
                await this.setupAppCheck();
            }
            
            this.initialized = true;
            console.log(`✅ Firebase initialized for ${CURRENT_ENV}`);
            
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Setup emulators for development
     */
    setupEmulators() {
        try {
            // Only connect to emulators on localhost
            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                console.log('🔧 Connecting to Firebase emulators...');
                connectAuthEmulator(this.auth, 'http://localhost:9099', { disableWarnings: true });
                connectFirestoreEmulator(this.db, 'localhost', 8080);
            }
        } catch (error) {
            console.warn('⚠️ Emulator connection failed:', error.message);
        }
    }
    
    /**
     * Setup Firebase App Check for security
     */
    async setupAppCheck() {
        try {
            // Import App Check dynamically to reduce initial bundle size
            const { initializeAppCheck, ReCaptchaV3Provider } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js'
            );
            
            const appCheck = initializeAppCheck(this.app, {
                provider: new ReCaptchaV3Provider('6LdC3a8ZAAAAAJBm9B7KQqJ7Yf9hQ8s9K9v6K9L9'), // Use your reCAPTCHA key
                isTokenAutoRefreshEnabled: true
            });
            
            console.log('✅ Firebase App Check initialized');
        } catch (error) {
            console.warn('⚠️ App Check initialization failed:', error);
        }
    }
    
    /**
     * Get Firebase services with null checks
     */
    getServices() {
        if (!this.initialized) {
            throw new Error('Firebase not initialized. Call initialize() first.');
        }
        
        return {
            app: this.app,
            auth: this.auth,
            db: this.db
        };
    }
    
    /**
     * Cleanup Firebase connections
     */
    async cleanup() {
        try {
            if (this.app) {
                const { getApps, getApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
                const apps = getApps();
                
                if (apps.length > 0) {
                    const app = getApp();
                    const { deleteApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
                    await deleteApp(app);
                }
                
                this.initialized = false;
                console.log('🧹 Firebase cleanup completed');
            }
        } catch (error) {
            console.error('❌ Firebase cleanup failed:', error);
        }
    }
}

// Export singleton instance
export const secureFirebase = new SecureFirebaseApp();

// Export configuration for debugging (development only)
if (CURRENT_ENV === ENV.DEVELOPMENT) {
    window.firebaseDebug = {
        config: getFirebaseConfig(),
        env: CURRENT_ENV,
        getServices: () => secureFirebase.getServices(),
        cleanup: () => secureFirebase.cleanup()
    };
}

// Environment export for other modules
export { CURRENT_ENV, ENV };