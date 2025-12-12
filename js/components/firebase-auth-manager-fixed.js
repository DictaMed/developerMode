/**
 * DictaMed - Gestionnaire d'authentification Firebase (Version Corrigée)
 * Version: 4.2.0 - Correction pour les erreurs Firebase SDK
 */

class FirebaseAuthManager {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.auth = null;
        this.rateLimitMap = new Map(); // Rate limiting par IP/email
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.retryAttempts = new Map(); // Retry attempts tracking
    }

    static async init() {
        try {
            console.log('🔧 FirebaseAuthManager v4.2.0 init() started');
            
            // Attendre que Firebase soit disponible
            await FirebaseAuthManager.waitForFirebase();
            
            // Initialiser l'instance
            const authManager = new FirebaseAuthManager();
            authManager.auth = window.firebase.auth;
            
            // Configuration Firebase Auth avec gestion d'erreurs
            try {
                const onAuthStateChanged = window.firebase.onAuthStateChanged || window.firebase.auth().onAuthStateChanged;
                if (typeof onAuthStateChanged !== 'function') {
                    throw new Error('onAuthStateChanged function not available');
                }
                
                onAuthStateChanged(authManager.auth, (user) => {
                    if (user) {
                        console.log('✅ User authenticated:', user.email);
                        authManager.currentUser = user;
                        authManager.updateAuthUI(user);
                        authManager.handleAuthSuccess(user);
                    } else {
                        console.log('ℹ️ User not authenticated');
                        authManager.currentUser = null;
                        authManager.updateAuthUI(null);
                        authManager.handleAuthLogout();
                    }
                });
            } catch (authError) {
                console.error('❌ Erreur configuration Auth:', authError);
                FirebaseAuthManager.showErrorMessage(authError);
                return;
            }

            authManager.isInitialized = true;
            console.log('✅ FirebaseAuthManager v4.2.0 init() completed');
            
            // Tester l'état d'authentification
            FirebaseAuthManager.testAuthStatus();
            
        } catch (error) {
            console.error('❌ FirebaseAuthManager init() failed:', error);
            FirebaseAuthManager.showErrorMessage(error);
        }
    }

    /**
     * Attendre que Firebase soit disponible
     */
    static async waitForFirebase(timeout = 10000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            if (typeof window.firebase !== 'undefined' && 
                window.firebase.auth && 
                typeof window.firebase.auth === 'function') {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        throw new Error('Firebase not available after timeout');
    }

    /**
     * Vérification de rate limiting pour éviter les attaques par force brute
     */
    checkRateLimit(identifier, maxAttempts = 5, timeWindow = 15 * 60 * 1000) {
        const now = Date.now();
        const attempts = this.rateLimitMap.get(identifier) || [];
        
        // Nettoyer les anciennes tentatives
        const recentAttempts = attempts.filter(timestamp => now - timestamp < timeWindow);
        
        if (recentAttempts.length >= maxAttempts) {
            const waitTime = timeWindow - (now - recentAttempts[0]);
            throw new Error(`Trop de tentatives. Réessayez dans ${Math.ceil(waitTime / 1000)} secondes.`);
        }
        
        // Ajouter la tentative actuelle
        recentAttempts.push(now);
        this.rateLimitMap.set(identifier, recentAttempts);
        
        return true;
    }

    /**
     * Validation renforcée des données d'entrée
     */
    validateInput(email, password, displayName = null) {
        const errors = [];

        // Validation email
        if (!email || typeof email !== 'string') {
            errors.push('L\'adresse email est requise');
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                errors.push('L\'adresse email n\'est pas valide');
            }
        }

        // Validation mot de passe
        if (!password || typeof password !== 'string') {
            errors.push('Le mot de passe est requis');
        } else {
            if (password.length < 6) {
                errors.push('Le mot de passe doit contenir au moins 6 caractères');
            }
            if (password.length > 128) {
                errors.push('Le mot de passe ne peut pas dépasser 128 caractères');
            }
        }

        // Validation nom d'affichage (optionnel)
        if (displayName && typeof displayName === 'string') {
            if (displayName.length < 2 || displayName.length > 50) {
                errors.push('Le nom d\'affichage doit contenir entre 2 et 50 caractères');
            }
        }

        if (errors.length > 0) {
            throw new Error(errors.join('. '));
        }

        return true;
    }

    /**
     * Évaluation de la force du mot de passe
     */
    evaluatePasswordStrength(password) {
        let score = 0;
        const feedback = [];

        if (password.length >= 8) score += 1;
        else feedback.push('Utilisez au moins 8 caractères');

        if (/[a-z]/.test(password)) score += 1;
        else feedback.push('Ajoutez des lettres minuscules');

        if (/[A-Z]/.test(password)) score += 1;
        else feedback.push('Ajoutez des lettres majuscules');

        if (/[0-9]/.test(password)) score += 1;
        else feedback.push('Ajoutez des chiffres');

        if (/[^a-zA-Z0-9]/.test(password)) score += 1;
        else feedback.push('Ajoutez des caractères spéciaux');

        let strength = 'Très faible';
        if (score >= 4) strength = 'Fort';
        else if (score >= 3) strength = 'Moyen';
        else if (score >= 2) strength = 'Faible';

        return { score, strength, feedback };
    }

    static async testAuthStatus() {
        console.log('🧪 Testing Firebase Auth status (Version corrigée)...');
        
        try {
            if (typeof window.firebase === 'undefined' || !window.firebase.auth) {
                console.error('❌ Firebase not available');
                return false;
            }

            // Test de l'authentification
            const currentUser = window.firebase.auth().currentUser;
            console.log('👤 Current user:', currentUser ? currentUser.email : 'none');

            return true;
        } catch (error) {
            console.error('❌ Auth status test failed:', error);
            return false;
        }
    }

    static showFallbackMessage() {
        const message = `
        🔧 Firebase Auth en mode fallback
        
        Les fonctionnalités d'authentification sont limitées.
        Pour activer l'authentification complète :
        
        1. Vérifiez que Firebase Auth est activé dans la console
        2. Activez le provider "Email/Password"
        3. Configurez les domaines autorisés
        `;
        console.warn(message);
        
        if (window.notificationSystem) {
            window.notificationSystem.info(
                'Authentification Firebase non configurée. Certaines fonctionnalités sont limitées.',
                'Configuration Firebase'
            );
        }
    }

    static showErrorMessage(error) {
        const message = `Erreur d'authentification Firebase: ${error.message}`;
        console.error(message);
        
        if (window.notificationSystem) {
            window.notificationSystem.error(message, 'Erreur Authentification');
        } else {
            alert(message);
        }
    }

    static updateAuthUI(user) {
        const authButton = document.getElementById('authButton');
        const authButtonText = document.getElementById('authButtonText');
        
        if (authButton && authButtonText) {
            if (user) {
                authButtonText.textContent = user.displayName || user.email || 'Connecté';
                authButton.classList.add('authenticated');
            } else {
                authButtonText.textContent = 'Connexion';
                authButton.classList.remove('authenticated');
            }
        }
    }

    /**
     * Gestion des événements d'authentification réussie
     */
    handleAuthSuccess(user) {
        // Logger l'événement (en production, envoyer vers analytics)
        console.log('🔐 Auth success event:', {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            timestamp: new Date().toISOString()
        });

        // Sauvegarder la session
        this.saveSession(user);
        
        // Dispatcher un événement personnalisé pour informer les autres composants
        this.dispatchAuthStateChange('authenticated', user);
    }

    /**
     * Gestion des événements de déconnexion
     */
    handleAuthLogout() {
        // Nettoyer la session
        this.clearSession();
        
        // Logger l'événement
        console.log('🚪 Auth logout event:', {
            timestamp: new Date().toISOString()
        });
        
        // Dispatcher un événement personnalisé pour informer les autres composants
        this.dispatchAuthStateChange('loggedOut', null);
    }

    /**
     * Dispatcher un événement de changement d'état d'authentification
     */
    dispatchAuthStateChange(state, user) {
        const authEvent = new CustomEvent('authStateChanged', {
            detail: {
                state: state,
                user: user,
                timestamp: new Date().toISOString()
            }
        });
        window.dispatchEvent(authEvent);
        
        // Notifier aussi le gestionnaire de navigation admin
        if (window.adminNavigationManager && typeof window.adminNavigationManager.forceCheck === 'function') {
            window.adminNavigationManager.forceCheck();
        }
        
        console.log('📡 Auth state change event dispatched:', state);
    }

    /**
     * Sauvegarde de session avec timeout
     */
    saveSession(user) {
        const sessionData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            loginTime: Date.now(),
            timeout: this.sessionTimeout
        };
        
        localStorage.setItem('dictamed_session', JSON.stringify(sessionData));
    }

    /**
     * Nettoyage de session
     */
    clearSession() {
        localStorage.removeItem('dictamed_session');
    }

    /**
     * Vérification de session expirée
     */
    checkSessionTimeout() {
        const sessionData = localStorage.getItem('dictamed_session');
        if (!sessionData) return false;

        try {
            const session = JSON.parse(sessionData);
            const now = Date.now();
            const sessionAge = now - session.loginTime;

            if (sessionAge > session.timeout) {
                this.clearSession();
                return false;
            }

            return true;
        } catch (error) {
            this.clearSession();
            return false;
        }
    }

    static isAuthenticated() {
        try {
            if (typeof window.firebase !== 'undefined' && window.firebase.auth) {
                const user = window.firebase.auth().currentUser;
                return user !== null;
            }
            return false;
        } catch (error) {
            console.warn('FirebaseAuthManager.isAuthenticated() error:', error);
            return false;
        }
    }

    static getCurrentUser() {
        try {
            if (typeof window.firebase !== 'undefined' && window.firebase.auth) {
                const user = window.firebase.auth().currentUser;
                if (user) {
                    return {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        emailVerified: user.emailVerified
                    };
                }
            }
            return null;
        } catch (error) {
            console.warn('FirebaseAuthManager.getCurrentUser() error:', error);
            return null;
        }
    }

    static async signIn(email, password) {
        try {
            console.log('🔐 Attempting sign in for:', email);
            
            const authManager = FirebaseAuthManager.getInstance();
            
            // Vérifications de sécurité
            authManager.checkRateLimit(email);
            authManager.validateInput(email, password);
            
            if (typeof window.firebase === 'undefined' || !window.firebase.auth) {
                throw new Error('Firebase Auth not available');
            }

            const { signInWithEmailAndPassword } = window.firebase;
            const result = await signInWithEmailAndPassword(window.firebase.auth(), email, password);
            console.log('✅ Sign in successful:', result.user.email);
            
            return {
                success: true,
                user: result.user
            };
        } catch (error) {
            console.error('❌ Sign in error:', error);
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    }

    static async signOut() {
        try {
            const authManager = FirebaseAuthManager.getInstance();
            
            if (typeof window.firebase !== 'undefined' && window.firebase.auth) {
                const { signOut } = window.firebase;
                await signOut(window.firebase.auth());
                authManager.clearSession();
                console.log('✅ Sign out successful');
                return { success: true };
            }
            return { success: false, error: 'Firebase not available' };
        } catch (error) {
            console.error('❌ Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Singleton pattern pour obtenir l'instance
     */
    static getInstance() {
        if (!this.instance) {
            this.instance = new FirebaseAuthManager();
        }
        return this.instance;
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseAuthManager;
} else {
    window.FirebaseAuthManager = FirebaseAuthManager;
}

// Initialisation automatique quand le DOM est chargé
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => FirebaseAuthManager.init());
    } else {
        // DOM déjà chargé
        setTimeout(() => FirebaseAuthManager.init(), 100);
    }
}