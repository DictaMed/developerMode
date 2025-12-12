/**
 * DictaMed - Gestionnaire d'authentification Firebase complet
 * Version: 2.0.0 - Architecture modulaire avec sécurité renforcée
 */

class FirebaseAuthManager {
    constructor() {
        this.auth = null;
        this.currentUser = null;
        this.isInitialized = false;
        this.authStateListeners = [];
        this.pendingOperations = new Map();
        
        // Configuration des règles de sécurité
        this.securityConfig = {
            maxLoginAttempts: 5,
            lockoutDuration: 15 * 60 * 1000, // 15 minutes
            sessionTimeout: 30 * 60 * 1000, // 30 minutes
            passwordMinLength: 8,
            requireEmailVerification: true
        };
    }

    /**
     * Initialisation du gestionnaire Firebase Auth
     */
    async init() {
        try {
            console.log('🔥 FirebaseAuthManager v2.0.0 init() started');
            
            // Attendre que Firebase soit initialisé
            await this.waitForFirebase();
            
            // Initialiser Firebase Auth
            this.auth = firebase.auth();
            
            // Configurer la persistence
            await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            
            // Configurer les paramètres de sécurité
            this.configureSecuritySettings();
            
            // Écouter les changements d'état d'authentification
            this.setupAuthStateListener();
            
            // Vérifier l'utilisateur existant
            this.checkExistingUser();
            
            this.isInitialized = true;
            console.log('✅ FirebaseAuthManager v2.0.0 initialized successfully');
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ FirebaseAuthManager init failed:', error);
            return { 
                success: false, 
                error: error.message,
                needsConfigUpdate: this.isConfigError(error)
            };
        }
    }

    /**
     * Attendre que Firebase soit initialisé
     */
    async waitForFirebase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 secondes maximum
            
            const checkFirebase = () => {
                attempts++;
                
                if (typeof firebase !== 'undefined' && firebase.auth) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Firebase SDK not loaded within timeout'));
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            
            checkFirebase();
        });
    }

    /**
     * Configuration des paramètres de sécurité
     */
    configureSecuritySettings() {
        if (!this.auth) return;
        
        // Configuration de la langue
        this.auth.languageCode = 'fr';
        
        // Configuration des paramètres de sécurité
        this.auth.useDeviceLanguage();
    }

    /**
     * Configuration de l'écouteur d'état d'authentification
     */
    setupAuthStateListener() {
        if (!this.auth) return;
        
        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.notifyAuthStateListeners(user);
            
            if (user) {
                console.log('✅ User authenticated:', user.email);
                this.logSecurityEvent('user_login', { userId: user.uid });
            } else {
                console.log('👋 User logged out');
                this.logSecurityEvent('user_logout');
            }
        });
    }

    /**
     * Vérification de l'utilisateur existant
     */
    checkExistingUser() {
        if (this.auth && this.auth.currentUser) {
            this.currentUser = this.auth.currentUser;
            this.notifyAuthStateListeners(this.currentUser);
        }
    }

    /**
     * Inscription avec email et mot de passe
     */
    async signUp(email, password) {
        try {
            this.validateOperation('signup', email);
            
            // Validation des données
            const validation = this.validateSignUpData(email, password);
            if (!validation.isValid) {
                return { success: false, error: validation.error };
            }

            // Créer le compte utilisateur
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Envoyer l'email de vérification si requis
            if (this.securityConfig.requireEmailVerification) {
                await user.sendEmailVerification();
                return { 
                    success: true, 
                    emailSent: true,
                    user: this.sanitizeUser(user)
                };
            }

            return { 
                success: true, 
                emailSent: false,
                user: this.sanitizeUser(user)
            };

        } catch (error) {
            console.error('SignUp error:', error);
            this.logSecurityEvent('signup_failed', { email, error: error.code });
            
            return {
                success: false,
                error: this.getErrorMessage(error),
                needsConfigUpdate: this.isConfigError(error)
            };
        }
    }

    /**
     * Connexion avec email et mot de passe
     */
    async signIn(email, password) {
        try {
            this.validateOperation('signin', email);
            
            // Validation des données
            const validation = this.validateSignInData(email, password);
            if (!validation.isValid) {
                return { success: false, error: validation.error };
            }

            // Vérifier le rate limiting
            this.checkRateLimit('signin', email);

            // Connexion
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Vérifier l'email si nécessaire
            if (!user.emailVerified) {
                await this.auth.signOut();
                return {
                    success: false,
                    error: 'Veuillez vérifier votre email avant de vous connecter',
                    emailVerificationRequired: true
                };
            }

            this.logSecurityEvent('signin_success', { userId: user.uid, email: user.email });

            return { 
                success: true, 
                user: this.sanitizeUser(user)
            };

        } catch (error) {
            console.error('SignIn error:', error);
            this.logSecurityEvent('signin_failed', { email, error: error.code });
            
            // Gestion des tentatives échouées
            this.recordFailedAttempt('signin', email);

            return {
                success: false,
                error: this.getErrorMessage(error),
                needsConfigUpdate: this.isConfigError(error)
            };
        }
    }

    /**
     * Connexion avec Google
     */
    async signInWithGoogle() {
        try {
            this.validateOperation('google_signin');
            
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');

            const result = await this.auth.signInWithPopup(provider);
            const user = result.user;

            this.logSecurityEvent('google_signin_success', { userId: user.uid, email: user.email });

            return { 
                success: true, 
                user: this.sanitizeUser(user)
            };

        } catch (error) {
            console.error('Google SignIn error:', error);
            this.logSecurityEvent('google_signin_failed', { error: error.code });
            
            return {
                success: false,
                error: this.getErrorMessage(error),
                needsConfigUpdate: this.isConfigError(error)
            };
        }
    }

    /**
     * Déconnexion
     */
    async signOut() {
        try {
            if (this.currentUser) {
                this.logSecurityEvent('user_logout', { userId: this.currentUser.uid });
            }
            
            await this.auth.signOut();
            
            return { success: true };
            
        } catch (error) {
            console.error('SignOut error:', error);
            return { 
                success: false, 
                error: this.getErrorMessage(error) 
            };
        }
    }

    /**
     * Réinitialisation du mot de passe
     */
    async sendPasswordResetEmail(email) {
        try {
            this.validateOperation('password_reset', email);
            
            await this.auth.sendPasswordResetEmail(email);
            
            this.logSecurityEvent('password_reset_requested', { email });
            
            return { success: true };
            
        } catch (error) {
            console.error('Password reset error:', error);
            this.logSecurityEvent('password_reset_failed', { email, error: error.code });
            
            return {
                success: false,
                error: this.getErrorMessage(error),
                needsConfigUpdate: this.isConfigError(error)
            };
        }
    }

    /**
     * Vérification de l'email
     */
    async sendEmailVerification() {
        try {
            if (!this.currentUser) {
                return { success: false, error: 'Aucun utilisateur connecté' };
            }

            await this.currentUser.sendEmailVerification();
            
            return { success: true };
            
        } catch (error) {
            console.error('Email verification error:', error);
            return { 
                success: false, 
                error: this.getErrorMessage(error) 
            };
        }
    }

    /**
     * Mise à jour du profil utilisateur
     */
    async updateProfile(updates) {
        try {
            if (!this.currentUser) {
                return { success: false, error: 'Aucun utilisateur connecté' };
            }

            await this.currentUser.updateProfile(updates);
            
            this.logSecurityEvent('profile_updated', { userId: this.currentUser.uid });
            
            return { success: true };
            
        } catch (error) {
            console.error('Profile update error:', error);
            return { 
                success: false, 
                error: this.getErrorMessage(error) 
            };
        }
    }

    /**
     * Suppression du compte utilisateur
     */
    async deleteAccount() {
        try {
            if (!this.currentUser) {
                return { success: false, error: 'Aucun utilisateur connecté' };
            }

            const userId = this.currentUser.uid;
            await this.currentUser.delete();
            
            this.logSecurityEvent('account_deleted', { userId });
            
            return { success: true };
            
        } catch (error) {
            console.error('Account deletion error:', error);
            return { 
                success: false, 
                error: this.getErrorMessage(error) 
            };
        }
    }

    /**
     * Obtention de l'utilisateur actuel
     */
    getCurrentUser() {
        return this.currentUser ? this.sanitizeUser(this.currentUser) : null;
    }

    /**
     * Vérification de l'état d'authentification
     */
    isAuthenticated() {
        return !!this.currentUser;
    }

    /**
     * Évaluation de la force du mot de passe
     */
    evaluatePasswordStrength(password) {
        const feedback = [];
        let score = 0;
        let strength = 'Très faible';

        // Longueur
        if (password.length >= 8) {
            score++;
        } else {
            feedback.push('Le mot de passe doit contenir au moins 8 caractères');
        }

        // Minuscules
        if (/[a-z]/.test(password)) {
            score++;
        } else {
            feedback.push('Ajoutez des lettres minuscules');
        }

        // Majuscules
        if (/[A-Z]/.test(password)) {
            score++;
        } else {
            feedback.push('Ajoutez des lettres majuscules');
        }

        // Chiffres
        if (/\d/.test(password)) {
            score++;
        } else {
            feedback.push('Ajoutez des chiffres');
        }

        // Caractères spéciaux
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            score++;
        } else {
            feedback.push('Ajoutez des caractères spéciaux');
        }

        // Déterminer la force
        if (score >= 5) strength = 'Très fort';
        else if (score >= 4) strength = 'Fort';
        else if (score >= 3) strength = 'Moyen';
        else if (score >= 2) strength = 'Faible';

        return { score, strength, feedback };
    }

    /**
     * Validation des données d'inscription
     */
    validateSignUpData(email, password) {
        if (!email) {
            return { isValid: false, error: 'L\'adresse email est requise' };
        }

        if (!this.isValidEmail(email)) {
            return { isValid: false, error: 'Format d\'email invalide' };
        }

        if (!password) {
            return { isValid: false, error: 'Le mot de passe est requis' };
        }

        if (password.length < this.securityConfig.passwordMinLength) {
            return { 
                isValid: false, 
                error: `Le mot de passe doit contenir au moins ${this.securityConfig.passwordMinLength} caractères` 
            };
        }

        const strength = this.evaluatePasswordStrength(password);
        if (strength.score < 2) {
            return { isValid: false, error: 'Le mot de passe est trop faible' };
        }

        return { isValid: true };
    }

    /**
     * Validation des données de connexion
     */
    validateSignInData(email, password) {
        if (!email) {
            return { isValid: false, error: 'L\'adresse email est requise' };
        }

        if (!this.isValidEmail(email)) {
            return { isValid: false, error: 'Format d\'email invalide' };
        }

        if (!password) {
            return { isValid: false, error: 'Le mot de passe est requis' };
        }

        return { isValid: true };
    }

    /**
     * Validation des opérations
     */
    validateOperation(operation, identifier = null) {
        if (!this.isInitialized) {
            throw new Error('FirebaseAuthManager not initialized');
        }

        if (this.isOperationBlocked(operation, identifier)) {
            throw new Error('Operation temporarily blocked due to too many failed attempts');
        }
    }

    /**
     * Vérification du rate limiting
     */
    checkRateLimit(operation, identifier) {
        const key = `${operation}_${identifier}`;
        const attempts = this.getFailedAttempts(key);
        
        if (attempts.length >= this.securityConfig.maxLoginAttempts) {
            const oldestAttempt = attempts[0];
            const timeSinceOldest = Date.now() - oldestAttempt;
            
            if (timeSinceOldest < this.securityConfig.lockoutDuration) {
                const remainingTime = this.securityConfig.lockoutDuration - timeSinceOldest;
                const minutes = Math.ceil(remainingTime / (60 * 1000));
                throw new Error(`Trop de tentatives. Réessayez dans ${minutes} minute(s).`);
            } else {
                // Reset les tentatives après la durée de blocage
                this.clearFailedAttempts(key);
            }
        }
    }

    /**
     * Enregistrement des tentatives échouées
     */
    recordFailedAttempt(operation, identifier) {
        const key = `${operation}_${identifier}`;
        const attempts = this.getFailedAttempts(key);
        attempts.push(Date.now());
        
        // Garder seulement les tentatives dans la fenêtre de temps
        const recentAttempts = attempts.filter(
            timestamp => Date.now() - timestamp < this.securityConfig.lockoutDuration
        );
        
        localStorage.setItem(`failed_attempts_${key}`, JSON.stringify(recentAttempts));
    }

    /**
     * Obtention des tentatives échouées
     */
    getFailedAttempts(key) {
        try {
            const stored = localStorage.getItem(`failed_attempts_${key}`);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    /**
     * Nettoyage des tentatives échouées
     */
    clearFailedAttempts(key) {
        localStorage.removeItem(`failed_attempts_${key}`);
    }

    /**
     * Vérification si une opération est bloquée
     */
    isOperationBlocked(operation, identifier) {
        if (!identifier) return false;
        
        const key = `${operation}_${identifier}`;
        const attempts = this.getFailedAttempts(key);
        
        return attempts.length >= this.securityConfig.maxLoginAttempts;
    }

    /**
     * Validation d'email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Nettoyage des données utilisateur pour la sécurité
     */
    sanitizeUser(user) {
        if (!user) return null;
        
        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            phoneNumber: user.phoneNumber,
            providerId: user.providerId,
            providerData: user.providerData?.map(provider => ({
                providerId: provider.providerId,
                displayName: provider.displayName,
                photoURL: provider.photoURL,
                email: provider.email
            })),
            metadata: {
                creationTime: user.metadata?.creationTime,
                lastSignInTime: user.metadata?.lastSignInTime
            }
        };
    }

    /**
     * Conversion des erreurs Firebase en messages utilisateur
     */
    getErrorMessage(error) {
        const errorMap = {
            'auth/user-not-found': 'Aucun compte trouvé avec cet email',
            'auth/wrong-password': 'Mot de passe incorrect',
            'auth/email-already-in-use': 'Cet email est déjà utilisé',
            'auth/weak-password': 'Le mot de passe est trop faible',
            'auth/invalid-email': 'Format d\'email invalide',
            'auth/user-disabled': 'Ce compte a été désactivé',
            'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard',
            'auth/network-request-failed': 'Erreur de connexion. Vérifiez votre connexion internet',
            'auth/popup-closed-by-user': 'Connexion annulée par l\'utilisateur',
            'auth/popup-blocked': 'Popup bloquée par le navigateur',
            'auth/operation-not-allowed': 'Cette méthode de connexion n\'est pas activée',
            'auth/requires-recent-login': 'Cette opération nécessite une authentification récente',
            'auth/invalid-action-code': 'Code d\'action invalide ou expiré'
        };

        return errorMap[error.code] || error.message || 'Une erreur est survenue';
    }

    /**
     * Vérification si c'est une erreur de configuration
     */
    isConfigError(error) {
        const configErrors = [
            'auth/invalid-api-key',
            'auth/invalid-app-id',
            'auth/invalid-auth-domain',
            'auth/project-not-found'
        ];
        
        return configErrors.includes(error.code);
    }

    /**
     * Journalisation des événements de sécurité
     */
    logSecurityEvent(eventType, data) {
        if (window.authSecurityManager && window.authSecurityManager.logSecurityEvent) {
            window.authSecurityManager.logSecurityEvent(eventType, data);
        }
    }

    /**
     * Ajout d'un écouteur d'état d'authentification
     */
    addAuthStateListener(callback) {
        if (typeof callback === 'function') {
            this.authStateListeners.push(callback);
        }
    }

    /**
     * Suppression d'un écouteur d'état d'authentification
     */
    removeAuthStateListener(callback) {
        const index = this.authStateListeners.indexOf(callback);
        if (index > -1) {
            this.authStateListeners.splice(index, 1);
        }
    }

    /**
     * Notification des écouteurs d'état d'authentification
     */
    notifyAuthStateListeners(user) {
        this.authStateListeners.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Auth state listener error:', error);
            }
        });
    }

    /**
     * Instance singleton
     */
    static getInstance() {
        if (!FirebaseAuthManager.instance) {
            FirebaseAuthManager.instance = new FirebaseAuthManager();
        }
        return FirebaseAuthManager.instance;
    }

    /**
     * Nettoyage des ressources
     */
    cleanup() {
        this.authStateListeners = [];
        this.pendingOperations.clear();
        
        if (this.auth) {
            this.auth.useDeviceLanguage();
        }
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseAuthManager;
} else {
    window.FirebaseAuthManager = FirebaseAuthManager;
}

// Initialisation automatique quand Firebase est prêt
if (typeof window !== 'undefined') {
    // Créer l'instance globale
    window.FirebaseAuthManager = FirebaseAuthManager.getInstance();
    
    // Initialiser quand Firebase est chargé
    if (typeof firebase !== 'undefined') {
        window.FirebaseAuthManager.init().then(result => {
            if (!result.success) {
                console.error('Failed to initialize FirebaseAuthManager:', result.error);
            }
        });
    } else {
        // Écouter l'événement firebaseReady
        window.addEventListener('firebaseReady', () => {
            window.FirebaseAuthManager.init().then(result => {
                if (!result.success) {
                    console.error('Failed to initialize FirebaseAuthManager:', result.error);
                }
            });
        });
    }
}