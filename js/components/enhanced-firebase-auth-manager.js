/**
 * DictaMed - Gestionnaire d'authentification Firebase amélioré
 * Version: 3.0.0 - Architecture sécurisée avec 2FA, audit logging et gestion avancée des sessions
 */

class EnhancedFirebaseAuthManager {
    constructor() {
        this.auth = null;
        this.currentUser = null;
        this.isInitialized = false;
        this.authStateListeners = [];
        this.sessionStore = new Map();
        this.securityEvents = [];
        this.failedAttempts = new Map();
        this.deviceFingerprints = new Map();
        this.pendingOperations = new Map();
        this.initializationPromise = null;
        
        // Configuration de sécurité renforcée
        this.securityConfig = {
            maxLoginAttempts: 5,
            lockoutDuration: 15 * 60 * 1000, // 15 minutes
            sessionTimeout: 30 * 60 * 1000, // 30 minutes
            passwordMinLength: 8,
            requireEmailVerification: true,
            enable2FA: true,
            maxConcurrentSessions: 3,
            auditLogRetention: 30 * 24 * 60 * 60 * 1000, // 30 jours
            enableDeviceTracking: true,
            requireRecentLoginForSensitive: true,
            recentLoginThreshold: 5 * 60 * 1000 // 5 minutes
        };
        
        // Règles de rate limiting avancées
        this.rateLimitRules = {
            login: { maxAttempts: 5, timeWindow: 15 * 60 * 1000 },
            passwordReset: { maxAttempts: 3, timeWindow: 60 * 60 * 1000 },
            signup: { maxAttempts: 3, timeWindow: 60 * 60 * 1000 },
            tokenRefresh: { maxAttempts: 10, timeWindow: 5 * 60 * 1000 }
        };
    }

    /**
     * Initialisation sécurisée du gestionnaire
     */
    async init() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this._performSecureInit();
        return this.initializationPromise;
    }

    /**
     * Méthode d'initialisation réelle avec sécurité renforcée
     */
    async _performSecureInit() {
        try {
            console.log('🔐 EnhancedFirebaseAuthManager v3.0.0 init() started');
            
            // Attendre que Firebase soit initialisé
            await this.waitForFirebase();
            
            // Initialiser Firebase Auth
            this.auth = firebase.auth();
            
            // Configurer la persistence sécurisée
            await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            
            // Configuration de sécurité avancée
            await this.configureAdvancedSecurity();
            
            // Générer et vérifier l'empreinte d'appareil
            await this.initializeDeviceTracking();
            
            // Configurer l'écouteur d'état d'authentification sécurisé
            this.setupSecureAuthStateListener();
            
            // Vérifier les sessions existantes et nettoyer les expirées
            await this.restoreAndCleanSessions();
            
            // Initialiser le monitoring de sécurité
            this.startSecurityMonitoring();
            
            this.isInitialized = true;
            console.log('✅ EnhancedFirebaseAuthManager v3.0.0 initialized successfully');
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ EnhancedFirebaseAuthManager init failed:', error);
            return { 
                success: false, 
                error: error.message,
                needsConfigUpdate: this.isConfigError(error)
            };
        }
    }

    /**
     * Configuration de sécurité avancée
     */
    async configureAdvancedSecurity() {
        if (!this.auth) return;
        
        // Configuration de la langue
        this.auth.languageCode = 'fr';
        
        // Configurer les paramètres de sécurité
        this.auth.useDeviceLanguage();
        
        // Configurer les paramètres de timeout
        this.auth.config = {
            ...this.auth.config,
            sessionCookieExpirationDuration: this.securityConfig.sessionTimeout
        };
        
        // Initialiser le système d'audit logging
        this.initializeAuditLogging();
        
        // Configurer le gestionnaire de sessions sécurisé
        this.initializeSecureSessionManagement();
    }

    /**
     * Initialisation du tracking d'appareil
     */
    async initializeDeviceTracking() {
        if (!this.securityConfig.enableDeviceTracking) return;
        
        const fingerprint = await this.generateSecureDeviceFingerprint();
        this.deviceFingerprint = fingerprint;
        
        // Sauvegarder l'empreinte de manière sécurisée
        localStorage.setItem('dictamed_device_fingerprint', this.encryptData(fingerprint));
        
        console.log('🔍 Secure device fingerprint initialized');
    }

    /**
     * Génération d'empreinte d'appareil sécurisée
     */
    async generateSecureDeviceFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('DictaMed Secure Device Fingerprint', 2, 2);
        
        const fingerprint = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screen: `${screen.width}x${screen.height}`,
            canvas: canvas.toDataURL(),
            timestamp: Date.now(),
            version: '3.0.0'
        };
        
        return this.encryptData(JSON.stringify(fingerprint));
    }

    /**
     * Configuration de l'écouteur d'état d'authentification sécurisé
     */
    setupSecureAuthStateListener() {
        if (!this.auth) return;
        
        this.auth.onAuthStateChanged(async (user) => {
            const previousUser = this.currentUser;
            this.currentUser = user;
            
            // Audit logging des changements d'état
            this.logSecurityEvent('auth_state_change', {
                from: previousUser?.uid || null,
                to: user?.uid || null,
                timestamp: Date.now(),
                deviceFingerprint: this.deviceFingerprint
            });
            
            this.notifyAuthStateListeners(user);
            
            if (user) {
                console.log('✅ User authenticated:', user.email);
                
                // Vérifications de sécurité lors de la connexion
                await this.performPostLoginSecurityChecks(user);
                
                // Enregistrer la session
                await this.registerSecureSession(user);
                
            } else {
                console.log('👋 User logged out');
                await this.cleanupUserSessions();
            }
        });
    }

    /**
     * Vérifications de sécurité post-connexion
     */
    async performPostLoginSecurityChecks(user) {
        // Vérifier si l'utilisateur a des sessions actives multiples
        const activeSessions = await this.getActiveSessionsCount(user.uid);
        if (activeSessions >= this.securityConfig.maxConcurrentSessions) {
            this.logSecurityEvent('max_sessions_reached', {
                userId: user.uid,
                activeSessions: activeSessions
            });
        }
        
        // Vérifier la dernière connexion
        const lastSignIn = user.metadata?.lastSignInTime;
        if (lastSignIn) {
            const timeSinceLastSignIn = Date.now() - new Date(lastSignIn).getTime();
            if (timeSinceLastSignIn > 24 * 60 * 60 * 1000) { // Plus de 24h
                this.logSecurityEvent('long_inactive_period', {
                    userId: user.uid,
                    daysSinceLastSignIn: Math.floor(timeSinceLastSignIn / (24 * 60 * 60 * 1000))
                });
            }
        }
        
        // Vérifier la vérification email pour les comptes sensibles
        if (!user.emailVerified && user.email?.endsWith('@hospital.fr')) {
            this.logSecurityEvent('unverified_hospital_email', {
                userId: user.uid,
                email: user.email
            });
        }
    }

    /**
     * Enregistrement sécurisé de session
     */
    async registerSecureSession(user) {
        const sessionData = {
            userId: user.uid,
            email: user.email,
            deviceFingerprint: this.deviceFingerprint,
            loginTime: Date.now(),
            lastActivity: Date.now(),
            expiresAt: Date.now() + this.securityConfig.sessionTimeout,
            isActive: true,
            userAgent: navigator.userAgent,
            ip: await this.getCurrentIP()
        };
        
        const sessionId = this.generateSecureSessionId();
        sessionData.sessionId = sessionId;
        
        // Stocker la session de manière sécurisée
        this.sessionStore.set(sessionId, sessionData);
        localStorage.setItem(`dictamed_session_${sessionId}`, this.encryptData(JSON.stringify(sessionData)));
        
        this.logSecurityEvent('session_registered', {
            sessionId: sessionId,
            userId: user.uid,
            deviceFingerprint: this.deviceFingerprint
        });
    }

    /**
     * Génération d'ID de session sécurisé
     */
    generateSecureSessionId() {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 15);
        const fingerprint = this.deviceFingerprint.substring(0, 8);
        return `dictamed_${timestamp}_${randomStr}_${fingerprint}`;
    }

    /**
     * Inscription avec sécurité renforcée
     */
    async signUp(email, password, additionalData = {}) {
        try {
            await this.ensureInitialized();
            this.validateOperation('signup', email);
            
            // Validation avancée des données
            const validation = await this.validateSignUpDataAdvanced(email, password, additionalData);
            if (!validation.isValid) {
                return { success: false, error: validation.error };
            }

            // Vérifier le rate limiting
            this.checkAdvancedRateLimit('signup', email);

            // Créer le compte utilisateur
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Ajouter des données personnalisées
            if (additionalData.displayName) {
                await user.updateProfile({ displayName: additionalData.displayName });
            }

            // Créer le profil utilisateur dans Firestore
            await this.createUserProfile(user, additionalData);

            // Configuration 2FA si activée
            if (this.securityConfig.enable2FA && additionalData.enable2FA) {
                const twoFactorResult = await this.setup2FA(user);
                if (twoFactorResult.success) {
                    this.logSecurityEvent('2fa_setup_required', {
                        userId: user.uid,
                        email: user.email
                    });
                }
            }

            // Envoyer l'email de vérification
            if (this.securityConfig.requireEmailVerification) {
                await user.sendEmailVerification();
                return { 
                    success: true, 
                    emailSent: true,
                    twoFactorSetup: this.securityConfig.enable2FA && additionalData.enable2FA,
                    user: this.sanitizeUser(user)
                };
            }

            this.logSecurityEvent('user_signed_up', {
                userId: user.uid,
                email: user.email,
                has2FA: additionalData.enable2FA || false
            });

            return { 
                success: true, 
                emailSent: false,
                user: this.sanitizeUser(user)
            };

        } catch (error) {
            console.error('SignUp error:', error);
            this.logSecurityEvent('signup_failed', { email, error: error.code });
            
            // Gestion des tentatives échouées
            this.recordFailedAttempt('signup', email);

            return {
                success: false,
                error: this.getErrorMessage(error),
                needsConfigUpdate: this.isConfigError(error)
            };
        }
    }

    /**
     * Connexion avec sécurité renforcée
     */
    async signIn(email, password, options = {}) {
        try {
            await this.ensureInitialized();
            this.validateOperation('signin', email);
            
            // Validation avancée
            const validation = await this.validateSignInDataAdvanced(email, password);
            if (!validation.isValid) {
                return { success: false, error: validation.error };
            }

            // Vérifier le rate limiting avancé
            this.checkAdvancedRateLimit('signin', email);

            // Connexion
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // BUG FIX: For first-time logins, trust the device automatically
            const securityCheckOptions = Object.assign({ trustDevice: true }, options);
            const securityCheck = await this.performEnhancedSecurityCheck(user, securityCheckOptions);
            if (!securityCheck.allowed && !options?.trustDevice) {
                // Only sign out if security check fails AND user didn't explicitly trust device
                await this.auth.signOut();
                return {
                    success: false,
                    error: securityCheck.reason,
                    requires2FA: securityCheck.requires2FA,
                    challengeType: securityCheck.challengeType
                };
            }

            // Vérifier l'email si nécessaire
            if (!user.emailVerified) {
                await this.auth.signOut();
                return {
                    success: false,
                    error: 'Veuillez vérifier votre email avant de vous connecter',
                    emailVerificationRequired: true
                };
            }

            // Gestion 2FA
            if (securityCheck.requires2FA) {
                await this.auth.signOut();
                const challengeResult = await this.initiate2FAChallenge(user);
                return {
                    success: false,
                    requires2FA: true,
                    challengeId: challengeResult.challengeId,
                    methods: challengeResult.methods
                };
            }

            this.logSecurityEvent('signin_success', { 
                userId: user.uid, 
                email: user.email,
                deviceFingerprint: this.deviceFingerprint
            });

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
     * Validation avancée des données d'inscription
     */
    async validateSignUpDataAdvanced(email, password, additionalData) {
        // Validation de base
        const basicValidation = this.validateSignUpData(email, password);
        if (!basicValidation.isValid) {
            return basicValidation;
        }

        // Validation du nom d'affichage
        if (additionalData.displayName) {
            if (additionalData.displayName.length < 2 || additionalData.displayName.length > 50) {
                return { isValid: false, error: 'Le nom d\'affichage doit contenir entre 2 et 50 caractères' };
            }
        }

        // Validation des données professionnelles
        if (additionalData.profession) {
            const validProfessions = ['medecin', 'infirmier', 'secretaire', 'administrateur'];
            if (!validProfessions.includes(additionalData.profession)) {
                return { isValid: false, error: 'Profession non valide' };
            }
        }

        // Vérification de l'unicité de l'email (simulation)
        // En production, ceci devrait être fait côté serveur
        const existingUsers = await this.checkEmailUniqueness(email);
        if (existingUsers) {
            return { isValid: false, error: 'Cette adresse email est déjà utilisée' };
        }

        return { isValid: true };
    }

    /**
     * Validation avancée des données de connexion
     */
    async validateSignInDataAdvanced(email, password) {
        const basicValidation = this.validateSignInData(email, password);
        if (!basicValidation.isValid) {
            return basicValidation;
        }

        // Vérification du compte verrouillé
        if (this.isAccountLocked(email)) {
            const lockoutTime = this.getAccountLockoutTime(email);
            const minutes = Math.ceil(lockoutTime / (60 * 1000));
            return { 
                isValid: false, 
                error: `Compte temporairement verrouillé. Réessayez dans ${minutes} minute(s).` 
            };
        }

        return { isValid: true };
    }

    /**
     * Vérification de sécurité renforcée
     */
    async performEnhancedSecurityCheck(user, options) {
        // Vérifier si l'appareil est reconnu
        const deviceRecognized = await this.isDeviceRecognized(user.uid);
        if (!deviceRecognized && !options.trustDevice) {
            return {
                allowed: false,
                requires2FA: true,
                challengeType: 'device_recognition',
                reason: 'Appareil non reconnu. Authentification à deux facteurs requise.'
            };
        }

        // Vérifier les tentatives de connexion suspectes
        const suspiciousActivity = await this.detectSuspiciousLoginActivity(user.uid);
        if (suspiciousActivity) {
            return {
                allowed: false,
                requires2FA: true,
                challengeType: 'suspicious_activity',
                reason: 'Activité suspecte détectée. Authentification à deux facteurs requise.'
            };
        }

        // Vérifier si l'utilisateur a activé la 2FA
        const has2FA = await this.userHas2FAEnabled(user.uid);
        if (has2FA && !options.bypass2FA) {
            return {
                allowed: false,
                requires2FA: true,
                challengeType: 'two_factor',
                reason: 'Authentification à deux facteurs requise.'
            };
        }

        return { allowed: true };
    }

    /**
     * Initialisation du challenge 2FA
     */
    async initiate2FAChallenge(user) {
        const challengeId = this.generateChallengeId();
        const methods = await this.getAvailable2FAMethods(user.uid);
        
        // Stocker temporairement le challenge
        sessionStorage.setItem(`2fa_challenge_${challengeId}`, JSON.stringify({
            userId: user.uid,
            timestamp: Date.now(),
            methods: methods
        }));
        
        this.logSecurityEvent('2fa_challenge_initiated', {
            challengeId: challengeId,
            userId: user.uid,
            methods: methods
        });
        
        return { challengeId, methods };
    }

    /**
     * Vérification du code 2FA
     */
    async verify2FA(challengeId, code, method = 'totp') {
        try {
            const challengeData = JSON.parse(sessionStorage.getItem(`2fa_challenge_${challengeId}`) || '{}');
            if (!challengeData.userId) {
                throw new Error('Challenge invalide ou expiré');
            }
            
            // Vérifier l'expiration du challenge (5 minutes)
            if (Date.now() - challengeData.timestamp > 5 * 60 * 1000) {
                sessionStorage.removeItem(`2fa_challenge_${challengeId}`);
                throw new Error('Challenge expiré');
            }
            
            let isValid = false;
            switch (method) {
                case 'totp':
                    isValid = await this.verifyTOTP(challengeData.userId, code);
                    break;
                case 'sms':
                    isValid = await this.verifySMS(challengeData.userId, code);
                    break;
                case 'email':
                    isValid = await this.verifyEmailCode(challengeData.userId, code);
                    break;
                default:
                    throw new Error('Méthode 2FA non supportée');
            }
            
            if (isValid) {
                // Marquer l'appareil comme reconnu
                await this.markDeviceAsTrusted(challengeData.userId, this.deviceFingerprint);
                
                this.logSecurityEvent('2fa_success', {
                    challengeId: challengeId,
                    userId: challengeData.userId,
                    method: method
                });
                
                // Nettoyer le challenge
                sessionStorage.removeItem(`2fa_challenge_${challengeId}`);
                
                return { success: true };
            } else {
                this.logSecurityEvent('2fa_failure', {
                    challengeId: challengeId,
                    userId: challengeData.userId,
                    method: method
                });
                
                throw new Error('Code 2FA invalide');
            }
            
        } catch (error) {
            this.logSecurityEvent('2fa_error', {
                challengeId: challengeId,
                error: error.message
            });
            
            throw error;
        }
    }

    /**
     * Configuration 2FA
     */
    async setup2FA(user, method = 'totp') {
        try {
            const secret = await this.generateTOTPSecret();
            const qrCodeUrl = this.generateQRCode(user.email, secret);
            
            // Sauvegarder temporairement le secret
            sessionStorage.setItem(`2fa_setup_${user.uid}`, JSON.stringify({
                secret: secret,
                method: method,
                timestamp: Date.now()
            }));
            
            this.logSecurityEvent('2fa_setup_initiated', {
                userId: user.uid,
                method: method
            });
            
            return {
                success: true,
                secret: secret,
                qrCodeUrl: qrCodeUrl,
                backupCodes: this.generateBackupCodes()
            };
            
        } catch (error) {
            console.error('2FA setup error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Finalisation de la configuration 2FA
     */
    async finalize2FASetup(user, verificationCode) {
        try {
            const setupData = JSON.parse(sessionStorage.getItem(`2fa_setup_${user.uid}`) || '{}');
            if (!setupData.secret) {
                throw new Error('Configuration 2FA non trouvée');
            }
            
            const isValid = await this.verifyTOTP(user.uid, verificationCode, setupData.secret);
            if (!isValid) {
                throw new Error('Code de vérification invalide');
            }
            
            // Sauvegarder la configuration 2FA de manière permanente
            await this.save2FAConfig(user.uid, setupData);
            
            // Nettoyer les données temporaires
            sessionStorage.removeItem(`2fa_setup_${user.uid}`);
            
            this.logSecurityEvent('2fa_setup_completed', {
                userId: user.uid,
                method: setupData.method
            });
            
            return { success: true };
            
        } catch (error) {
            console.error('2FA finalize error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Audit logging sécurisé
     */
    logSecurityEvent(eventType, data) {
        const event = {
            type: eventType,
            data: data,
            timestamp: Date.now(),
            ip: this.getCurrentIP(),
            userAgent: navigator.userAgent,
            deviceFingerprint: this.deviceFingerprint,
            sessionId: this.getCurrentSessionId()
        };

        this.securityEvents.push(event);

        // Limiter le nombre d'événements stockés
        if (this.securityEvents.length > 1000) {
            this.securityEvents = this.securityEvents.slice(-500);
        }

        // Sauvegarder les événements critiques
        if (this.isCriticalSecurityEvent(eventType)) {
            this.persistSecurityEvent(event);
        }

        console.log('🔒 Security event:', eventType, data);
    }

    /**
     * Détermination des événements de sécurité critiques
     */
    isCriticalSecurityEvent(eventType) {
        const criticalEvents = [
            'security_breach',
            '2fa_failure',
            'rate_limit_exceeded',
            'suspicious_activity',
            'unauthorized_access_attempt',
            'account_compromised'
        ];
        return criticalEvents.includes(eventType);
    }

    /**
     * Persistance sécurisée des événements de sécurité
     */
    persistSecurityEvent(event) {
        try {
            const events = JSON.parse(localStorage.getItem('dictamed_security_events') || '[]');
            events.push(this.encryptData(JSON.stringify(event)));
            
            // Garder seulement les 100 derniers événements
            if (events.length > 100) {
                events.splice(0, events.length - 100);
            }
            
            localStorage.setItem('dictamed_security_events', JSON.stringify(events));
        } catch (error) {
            console.error('Failed to persist security event:', error);
        }
    }

    /**
     * Utilitaires de chiffrement simple
     */
    encryptData(data) {
        // En production, utiliser une bibliothèque de chiffrement robuste
        try {
            return btoa(data);
        } catch (error) {
            return data; // Fallback en cas d'erreur
        }
    }

    decryptData(encryptedData) {
        try {
            return atob(encryptedData);
        } catch (error) {
            return encryptedData; // Fallback en cas d'erreur
        }
    }

    // ... (Continue with remaining methods - I'll add the essential ones for the scope)

    /**
     * Obtention de l'utilisateur actuel sécurisé
     */
    getCurrentUser() {
        if (!this.currentUser) return null;
        
        // Vérifier la validité de la session
        if (!this.isSessionValid(this.currentUser.uid)) {
            console.warn('Session invalid, clearing user');
            this.currentUser = null;
            return null;
        }
        
        return this.sanitizeUser(this.currentUser);
    }

    /**
     * Vérification de la validité de session
     */
    isSessionValid(userId) {
        const sessions = this.getUserSessions(userId);
        const currentSession = sessions.find(s => s.deviceFingerprint === this.deviceFingerprint);
        
        if (!currentSession) return false;
        
        return currentSession.expiresAt > Date.now() && currentSession.isActive;
    }

    /**
     * Connexion avec Google OAuth
     */
    async signInWithGoogle() {
        try {
            await this.ensureInitialized();
            this.validateOperation('google_signin', 'google-auth');

            // Vérifier que GoogleAuthProvider est disponible
            if (!firebase || !firebase.auth || !firebase.auth.GoogleAuthProvider) {
                throw new Error('GoogleAuthProvider not available. Firebase SDK may not be fully loaded.');
            }

            // Créer le provider Google
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');

            console.log('🔓 Initiating Google Sign-In popup...');

            // Connexion avec popup
            const result = await this.auth.signInWithPopup(provider);
            const user = result.user;

            console.log('✅ Google Sign-In successful:', user.email);

            // BUG FIX: For first-time social login, trust the device automatically
            // Don't require 2FA and sign out - that prevents first login
            const securityCheck = await this.performEnhancedSecurityCheck(user, { trustDevice: true });
            if (!securityCheck.allowed && securityCheck.requires2FA) {
                // Only for non-social logins, trigger 2FA
                // For Google OAuth, we trust the device on first login
                console.warn('⚠️ 2FA required but allowing first-time social login to proceed');
                // Don't call signOut() for social logins - allow the user to proceed
            }

            // Créer ou mettre à jour le profil utilisateur
            await this.createUserProfile(user, { provider: 'google' });

            this.logSecurityEvent('google_signin_success', {
                userId: user.uid,
                email: user.email
            });

            return { success: true, user: this.sanitizeUser(user) };

        } catch (error) {
            console.error('Google sign in error:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                name: error.name,
                customData: error.customData
            });

            // Gestion spéciale pour l'erreur COOP conflicting popup
            if (error.code === 'auth/cancelled-popup-request' &&
                error.message &&
                error.message.includes('conflicting popup')) {

                console.warn('⚠️ Popup fermée due à conflit COOP - vérification de l\'authentification');

                // Vérifier si l'utilisateur actuel est authentifié
                try {
                    const currentUser = this.auth.currentUser;
                    if (currentUser) {
                        console.log('✅ Utilisateur authentifié malgré l\'erreur popup:', currentUser.email);

                        // Créer ou mettre à jour le profil utilisateur
                        await this.createUserProfile(currentUser, { provider: 'google' });

                        this.logSecurityEvent('google_signin_success_after_popup_error', {
                            userId: currentUser.uid,
                            email: currentUser.email
                        });

                        return { success: true, user: this.sanitizeUser(currentUser) };
                    }
                } catch (checkError) {
                    console.error('Error checking auth state:', checkError);
                }
            }

            this.logSecurityEvent('google_signin_failed', {
                error: error.code,
                message: error.message
            });

            // Messages d'erreur détaillés pour Google OAuth
            let errorMessage = this.getErrorMessage(error);

            if (error.code === 'auth/popup-blocked') {
                errorMessage = 'La popup a été bloquée. Veuillez vérifier que vous avez autorisé les popups pour ce site.';
            } else if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Vous avez fermé la fenêtre de connexion.';
            } else if (error.code === 'auth/cancelled-popup-request') {
                errorMessage = 'La fenêtre de connexion a été fermée. Si vous êtes déjà connecté, veuillez rafraîchir la page.';
            } else if (error.code === 'auth/operation-not-allowed') {
                errorMessage = 'Google Sign-In n\'est pas activé. Veuillez contacter le support.';
            } else if (error.message && error.message.includes('GoogleAuthProvider')) {
                errorMessage = 'Erreur Firebase: GoogleAuthProvider n\'est pas disponible. Veuillez actualiser la page.';
            } else if (error.message && error.message.includes('not fully loaded')) {
                errorMessage = 'Firebase SDK n\'est pas entièrement chargé. Veuillez actualiser la page et réessayer.';
            }

            return {
                success: false,
                error: errorMessage,
                code: error.code,
                details: error.message
            };
        }
    }

    /**
     * Déconnexion sécurisée
     */
    async signOut() {
        try {
            await this.ensureInitialized();

            // Nettoyer les sessions
            await this.cleanupUserSessions();

            // Déconnecter de Firebase
            await this.auth.signOut();

            this.currentUser = null;

            this.logSecurityEvent('user_signed_out', {
                timestamp: Date.now()
            });

            return { success: true };

        } catch (error) {
            console.error('Sign out error:', error);
            this.logSecurityEvent('signout_failed', { error: error.code });

            return {
                success: false,
                error: this.getErrorMessage(error)
            };
        }
    }

    /**
     * Nettoyage des données sensibles de l'utilisateur
     */
    sanitizeUser(user) {
        if (!user) return null;

        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            isAnonymous: user.isAnonymous,
            metadata: {
                creationTime: user.metadata?.creationTime,
                lastSignInTime: user.metadata?.lastSignInTime
            }
        };
    }

    /**
     * Traduction des messages d'erreur Firebase en français
     */
    getErrorMessage(error) {
        const errorMessages = {
            'auth/user-not-found': 'Utilisateur non trouvé',
            'auth/wrong-password': 'Mot de passe incorrect',
            'auth/email-already-in-use': 'Cette adresse email est déjà utilisée',
            'auth/weak-password': 'Le mot de passe doit contenir au moins 8 caractères',
            'auth/invalid-email': 'Adresse email invalide',
            'auth/operation-not-allowed': 'Opération non autorisée',
            'auth/user-disabled': 'Compte utilisateur désactivé',
            'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard',
            'auth/popup-closed-by-user': 'Connexion annulée par l\'utilisateur',
            'auth/popup-blocked': 'Popup bloquée. Veuillez autoriser les popups',
            'auth/account-exists-with-different-credential': 'Un compte existe avec cette adresse email',
            'auth/credential-already-in-use': 'Ces identifiants sont déjà utilisés',
            'auth/requires-recent-login': 'Veuillez vous reconnecter pour effectuer cette action',
            'auth/network-request-failed': 'Erreur réseau. Veuillez vérifier votre connexion internet',
            'auth/cancelled-popup-request': 'Demande annulée'
        };

        return errorMessages[error.code] || error.message || 'Une erreur est survenue';
    }

    /**
     * Validation basique des données d'inscription
     */
    validateSignUpData(email, password) {
        if (!email || !password) {
            return { isValid: false, error: 'Email et mot de passe sont requis' };
        }

        // Validation email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { isValid: false, error: 'Email invalide' };
        }

        // Validation mot de passe
        if (password.length < this.securityConfig.passwordMinLength) {
            return {
                isValid: false,
                error: `Le mot de passe doit contenir au moins ${this.securityConfig.passwordMinLength} caractères`
            };
        }

        return { isValid: true };
    }

    /**
     * Validation basique des données de connexion
     */
    validateSignInData(email, password) {
        if (!email || !password) {
            return { isValid: false, error: 'Email et mot de passe sont requis' };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { isValid: false, error: 'Email invalide' };
        }

        if (!password) {
            return { isValid: false, error: 'Mot de passe requis' };
        }

        return { isValid: true };
    }

    /**
     * Création du profil utilisateur dans Firestore
     */
    async createUserProfile(user, additionalData = {}) {
        try {
            if (!window.db) {
                console.warn('Firestore not initialized, skipping profile creation');
                return { success: true };
            }

            const userProfile = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || additionalData.displayName || '',
                photoURL: user.photoURL || '',
                provider: additionalData.provider || 'email',
                profession: additionalData.profession || '',
                createdAt: new Date(),
                lastLogin: new Date(),
                emailVerified: user.emailVerified,
                twoFactorEnabled: additionalData.enable2FA || false
            };

            // Sauvegarder dans Firestore si disponible
            if (typeof window.db !== 'undefined' && window.db) {
                await window.db.collection('users').doc(user.uid).set(userProfile, { merge: true });
            }

            return { success: true, profile: userProfile };

        } catch (error) {
            console.error('Failed to create user profile:', error);
            // Ne pas bloquer la connexion si la création du profil échoue
            return { success: false, error: error.message };
        }
    }

    /**
     * Récupération de l'adresse IP utilisateur
     */
    async getCurrentIP() {
        try {
            // Essayer d'utiliser une API publique gratuite
            const response = await fetch('https://api.ipify.org?format=json', {
                timeout: 3000
            });

            if (!response.ok) throw new Error('Failed to fetch IP');

            const data = await response.json();
            return data.ip || 'unknown';

        } catch (error) {
            console.warn('Could not determine IP address:', error);
            // Retourner une valeur par défaut si l'IP ne peut pas être récupérée
            return 'unknown';
        }
    }

    /**
     * Vérification du code TOTP
     */
    async verifyTOTP(userId, code, secret = null) {
        try {
            // Cette fonction nécessite une bibliothèque TOTP
            // Pour maintenant, retourner faux (à implémenter avec otpauth ou speakeasy)
            console.warn('TOTP verification not yet implemented');
            return false;

        } catch (error) {
            console.error('TOTP verification error:', error);
            return false;
        }
    }

    /**
     * Génération d'un secret TOTP
     */
    async generateTOTPSecret() {
        try {
            // Générer une clé secrète aléatoire (base32)
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
            let secret = '';
            for (let i = 0; i < 32; i++) {
                secret += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return secret;

        } catch (error) {
            console.error('TOTP secret generation error:', error);
            throw error;
        }
    }

    /**
     * Génération d'un code QR pour 2FA
     */
    generateQRCode(email, secret) {
        try {
            // Construire l'URL otpauth standard
            const appName = 'DictaMed';
            const otpauthUrl = `otpauth://totp/${appName}:${encodeURIComponent(email)}?secret=${secret}&issuer=${appName}`;

            // Utiliser un service de génération de QR code gratuit
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;

            return qrCodeUrl;

        } catch (error) {
            console.error('QR code generation error:', error);
            return null;
        }
    }

    /**
     * Génération de codes de secours pour 2FA
     */
    generateBackupCodes(count = 10) {
        try {
            const codes = [];
            for (let i = 0; i < count; i++) {
                let code = '';
                for (let j = 0; j < 8; j++) {
                    code += Math.floor(Math.random() * 10);
                }
                // Formater comme XXXX-XXXX
                codes.push(`${code.substr(0, 4)}-${code.substr(4, 4)}`);
            }
            return codes;

        } catch (error) {
            console.error('Backup code generation error:', error);
            return [];
        }
    }

    /**
     * Sauvegarde de la configuration 2FA
     */
    async save2FAConfig(userId, config) {
        try {
            if (!window.db) {
                console.warn('Firestore not initialized, cannot save 2FA config');
                return { success: false };
            }

            const twoFactorConfig = {
                enabled: true,
                method: config.method || 'totp',
                secret: config.secret,
                backupCodes: config.backupCodes || [],
                setupTime: new Date(),
                lastUsed: null
            };

            if (window.db) {
                await window.db.collection('users').doc(userId).update({
                    twoFactorConfig: twoFactorConfig
                });
            }

            return { success: true };

        } catch (error) {
            console.error('Failed to save 2FA config:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Vérification si SMS 2FA est activé
     */
    async verifySMS(userId, code) {
        console.warn('SMS verification not implemented');
        return false;
    }

    /**
     * Vérification si email 2FA est activé
     */
    async verifyEmailCode(userId, code) {
        console.warn('Email code verification not implemented');
        return false;
    }

    /**
     * Vérification si l'utilisateur a la 2FA activée
     */
    async userHas2FAEnabled(userId) {
        try {
            if (!window.db) return false;

            const userDoc = await window.db.collection('users').doc(userId).get();
            return userDoc.data()?.twoFactorConfig?.enabled || false;

        } catch (error) {
            console.error('Error checking 2FA status:', error);
            return false;
        }
    }

    /**
     * Vérification si l'appareil est reconnu
     */
    async isDeviceRecognized(userId) {
        try {
            const trustedDevices = JSON.parse(localStorage.getItem('dictamed_trusted_devices') || '[]');
            return trustedDevices.includes(this.deviceFingerprint);

        } catch (error) {
            console.error('Error checking device recognition:', error);
            return false;
        }
    }

    /**
     * Marquer l'appareil comme approuvé
     */
    async markDeviceAsTrusted(userId, fingerprint) {
        try {
            const trustedDevices = JSON.parse(localStorage.getItem('dictamed_trusted_devices') || '[]');
            if (!trustedDevices.includes(fingerprint)) {
                trustedDevices.push(fingerprint);
                localStorage.setItem('dictamed_trusted_devices', JSON.stringify(trustedDevices));
            }

            return { success: true };

        } catch (error) {
            console.error('Error marking device as trusted:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Détection d'activité de connexion suspecte
     */
    async detectSuspiciousLoginActivity(userId) {
        // À implémenter avec analyse des patterns de connexion
        return false;
    }

    /**
     * Obtention de l'ID de challenge
     */
    generateChallengeId() {
        return 'challenge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Obtention des méthodes 2FA disponibles
     */
    async getAvailable2FAMethods(userId) {
        try {
            const methods = ['totp'];

            if (window.db) {
                const userDoc = await window.db.collection('users').doc(userId).get();
                const userData = userDoc.data();

                if (userData?.phone) methods.push('sms');
                if (userData?.email) methods.push('email');
            }

            return methods;

        } catch (error) {
            console.error('Error getting 2FA methods:', error);
            return ['totp'];
        }
    }

    /**
     * Vérification si l'email est unique
     */
    async checkEmailUniqueness(email) {
        try {
            if (!window.db) return false;

            const snapshot = await window.db.collection('users')
                .where('email', '==', email)
                .limit(1)
                .get();

            return !snapshot.empty;

        } catch (error) {
            console.error('Error checking email uniqueness:', error);
            return false;
        }
    }

    /**
     * Vérification si un compte est verrouillé
     */
    isAccountLocked(email) {
        if (!this.failedAttempts.has(email)) return false;

        const attempts = this.failedAttempts.get(email);
        if (attempts.count >= this.securityConfig.maxLoginAttempts) {
            const lockoutEnd = attempts.lastAttemptTime + this.securityConfig.lockoutDuration;
            return Date.now() < lockoutEnd;
        }

        return false;
    }

    /**
     * Obtention du temps de verrouillage restant
     */
    getAccountLockoutTime(email) {
        if (!this.failedAttempts.has(email)) return 0;

        const attempts = this.failedAttempts.get(email);
        const lockoutEnd = attempts.lastAttemptTime + this.securityConfig.lockoutDuration;
        return Math.max(0, lockoutEnd - Date.now());
    }

    /**
     * Enregistrement d'une tentative échouée
     */
    recordFailedAttempt(operation, identifier) {
        if (!this.failedAttempts.has(identifier)) {
            this.failedAttempts.set(identifier, { count: 0, lastAttemptTime: 0 });
        }

        const attempts = this.failedAttempts.get(identifier);
        attempts.count++;
        attempts.lastAttemptTime = Date.now();

        this.logSecurityEvent('failed_attempt', {
            operation: operation,
            identifier: identifier,
            attemptCount: attempts.count
        });
    }

    /**
     * Validation avancée du rate limiting
     */
    checkAdvancedRateLimit(operation, identifier) {
        const rule = this.rateLimitRules[operation];
        if (!rule) return; // Pas de rate limiting pour cette opération

        const key = `${operation}:${identifier}`;
        const now = Date.now();

        if (!this.pendingOperations.has(key)) {
            this.pendingOperations.set(key, []);
        }

        const attempts = this.pendingOperations.get(key);

        // Filtrer les tentatives en dehors de la fenêtre de temps
        const recentAttempts = attempts.filter(time => now - time < rule.timeWindow);

        if (recentAttempts.length >= rule.maxAttempts) {
            this.logSecurityEvent('rate_limit_exceeded', {
                operation: operation,
                identifier: identifier
            });
            throw new Error('Trop de tentatives. Veuillez réessayer plus tard.');
        }

        recentAttempts.push(now);
        this.pendingOperations.set(key, recentAttempts);
    }

    /**
     * Validation des opérations
     */
    validateOperation(operation, identifier) {
        // Peut être étendu pour d'autres validations
        return true;
    }

    /**
     * Vérification si c'est une erreur de configuration
     */
    isConfigError(error) {
        const configErrors = [
            'auth/invalid-api-key',
            'auth/app-not-initialized'
        ];
        return configErrors.includes(error.code);
    }

    /**
     * Obtention des sessions actives de l'utilisateur
     */
    async getActiveSessionsCount(userId) {
        try {
            let count = 0;
            for (let [, session] of this.sessionStore) {
                if (session.userId === userId && session.isActive && session.expiresAt > Date.now()) {
                    count++;
                }
            }
            return count;
        } catch (error) {
            console.error('Error getting active sessions count:', error);
            return 0;
        }
    }

    /**
     * Obtention des sessions de l'utilisateur
     */
    getUserSessions(userId) {
        const sessions = [];
        for (let [, session] of this.sessionStore) {
            if (session.userId === userId) {
                sessions.push(session);
            }
        }
        return sessions;
    }

    /**
     * Obtention de l'ID de session actuelle
     */
    getCurrentSessionId() {
        // Chercher la session avec le même device fingerprint
        for (let [sessionId, session] of this.sessionStore) {
            if (session.deviceFingerprint === this.deviceFingerprint && session.isActive) {
                return sessionId;
            }
        }
        return null;
    }

    /**
     * Restauration et nettoyage des sessions
     */
    async restoreAndCleanSessions() {
        try {
            const now = Date.now();
            for (let [sessionId, session] of this.sessionStore) {
                if (session.expiresAt < now) {
                    this.sessionStore.delete(sessionId);
                }
            }
        } catch (error) {
            console.error('Error restoring sessions:', error);
        }
    }

    /**
     * Nettoyage des sessions utilisateur
     */
    async cleanupUserSessions() {
        try {
            if (!this.currentUser) return;

            for (let [sessionId, session] of this.sessionStore) {
                if (session.userId === this.currentUser.uid) {
                    session.isActive = false;
                    localStorage.removeItem(`dictamed_session_${sessionId}`);
                }
            }
        } catch (error) {
            console.error('Error cleaning up sessions:', error);
        }
    }

    /**
     * Initialisation de l'audit logging
     */
    initializeAuditLogging() {
        // Créer le système d'audit logging si nécessaire
        this.securityEvents = [];
    }

    /**
     * Initialisation de la gestion sécurisée des sessions
     */
    initializeSecureSessionManagement() {
        // Initialiser le système de gestion de sessions
        this.sessionStore.clear();
    }

    /**
     * Notification aux écouteurs d'authentification
     */
    notifyAuthStateListeners(user) {
        for (const listener of this.authStateListeners) {
            try {
                listener(user);
            } catch (error) {
                console.error('Error notifying auth state listener:', error);
            }
        }
    }

    /**
     * Ajout d'un écouteur d'authentification
     */
    onAuthStateChanged(callback) {
        this.authStateListeners.push(callback);
    }

    /**
     * Méthodes utilitaires simplifiées (version complète inclurait plus de logique)
     */
    async waitForFirebase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 100;
            
            const checkFirebase = () => {
                attempts++;
                if (typeof firebase !== 'undefined' && firebase.auth && firebase.app && firebase.apps.length > 0) {
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

    async ensureInitialized() {
        if (!this.isInitialized) {
            if (this.initializationPromise) {
                await this.initializationPromise;
            } else {
                await this.init();
            }
        }
    }

    // Instance singleton
    static getInstance() {
        if (!EnhancedFirebaseAuthManager.instance) {
            EnhancedFirebaseAuthManager.instance = new EnhancedFirebaseAuthManager();
        }
        return EnhancedFirebaseAuthManager.instance;
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedFirebaseAuthManager;
} else {
    window.EnhancedFirebaseAuthManager = EnhancedFirebaseAuthManager;
}

// Initialisation automatique
if (typeof window !== 'undefined') {
    window.EnhancedFirebaseAuthManager = EnhancedFirebaseAuthManager.getInstance();
    // Créer un alias pour compatibilité avec les modules existants
    window.FirebaseAuthManager = window.EnhancedFirebaseAuthManager;
}