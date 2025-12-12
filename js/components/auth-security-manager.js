/**
 * DictaMed - Gestionnaire de sécurité avancé pour l'authentification
 * Version: 1.0.0 - 2FA, gestion de sessions, monitoring de sécurité
 */

class AuthSecurityManager {
    constructor() {
        this.sessionStore = new Map(); // Stockage des sessions actives
        this.securityEvents = []; // Journal des événements de sécurité
        this.failedAttempts = new Map(); // Suivi des tentatives échouées
        this.deviceFingerprints = new Map(); // Empreintes des appareils
        this.rateLimitRules = {
            login: { maxAttempts: 5, timeWindow: 15 * 60 * 1000 }, // 15 min
            passwordReset: { maxAttempts: 3, timeWindow: 60 * 60 * 1000 }, // 1 heure
            signup: { maxAttempts: 3, timeWindow: 60 * 60 * 1000 } // 1 heure
        };
        this.is2FAEnabled = false;
        this.pending2FAUser = null;
    }

    /**
     * Initialisation du gestionnaire de sécurité
     */
    init() {
        console.log('🔐 AuthSecurityManager v1.0.0 init() started');
        
        // Générer une empreinte d'appareil unique
        this.generateDeviceFingerprint();
        
        // Vérifier les sessions existantes
        this.restoreSessions();
        
        // Démarrer le monitoring de sécurité
        this.startSecurityMonitoring();
        
        console.log('✅ AuthSecurityManager v1.0.0 init() completed');
    }

    /**
     * Génération d'une empreinte d'appareil unique
     */
    generateDeviceFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('DictaMed Device Fingerprint', 2, 2);
        
        const fingerprint = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screen: `${screen.width}x${screen.height}`,
            canvas: canvas.toDataURL(),
            timestamp: Date.now()
        };
        
        const fingerprintString = btoa(JSON.stringify(fingerprint));
        this.deviceFingerprint = fingerprintString;
        
        // Sauvegarder en localStorage
        localStorage.setItem('dictamed_device_fingerprint', fingerprintString);
        
        console.log('🔍 Device fingerprint generated');
    }

    /**
     * Vérification de session expirée avec renouvellement automatique
     */
    checkSessionExpiry() {
        const sessionData = localStorage.getItem('dictamed_session');
        if (!sessionData) return false;

        try {
            const session = JSON.parse(sessionData);
            const now = Date.now();
            const sessionAge = now - session.loginTime;
            const warningThreshold = 5 * 60 * 1000; // 5 minutes avant expiration

            if (sessionAge > session.timeout) {
                this.handleSessionExpired();
                return false;
            }

            // Alerte avant expiration
            if (sessionAge > (session.timeout - warningThreshold)) {
                this.showSessionWarning(session.timeout - sessionAge);
            }

            return true;
        } catch (error) {
            console.error('Session check error:', error);
            this.clearCompromisedSession();
            return false;
        }
    }

    /**
     * Gestion de session expirée
     */
    handleSessionExpired() {
        console.log('⏰ Session expired, logging out user');
        
        // Journaliser l'événement
        this.logSecurityEvent('session_expired', {
            timestamp: Date.now(),
            userAgent: navigator.userAgent
        });

        // Déconnecter l'utilisateur
        const authManager = window.FirebaseAuthManager || FirebaseAuthManager.getInstance();
        authManager.signOut().then(() => {
            if (window.notificationSystem) {
                window.notificationSystem.warning(
                    'Votre session a expiré. Veuillez vous reconnecter.',
                    'Session expirée'
                );
            }
        });
    }

    /**
     * Affichage d'avertissement avant expiration
     */
    showSessionWarning(timeRemaining) {
        if (window.sessionWarningShown) return; // Éviter les doublons
        window.sessionWarningShown = true;

        const minutes = Math.ceil(timeRemaining / (60 * 1000));
        
        if (window.notificationSystem) {
            window.notificationSystem.info(
                `Votre session expire dans ${minutes} minute(s). Sauvegardez votre travail.`,
                'Avertissement de session'
            );
        }

        // Reset après 30 secondes
        setTimeout(() => {
            window.sessionWarningShown = false;
        }, 30000);
    }

    /**
     * Vérification de taux avancée avec plusieurs facteurs
     */
    advancedRateLimit(operation, identifier, customLimit = null) {
        const rules = customLimit || this.rateLimitRules[operation];
        if (!rules) return true;

        const key = `${operation}_${identifier}`;
        const attempts = this.failedAttempts.get(key) || [];
        const now = Date.now();

        // Nettoyer les anciennes tentatives
        const recentAttempts = attempts.filter(timestamp => now - timestamp < rules.timeWindow);

        if (recentAttempts.length >= rules.maxAttempts) {
            const waitTime = rules.timeWindow - (now - recentAttempts[0]);
            const minutes = Math.ceil(waitTime / (60 * 1000));
            
            this.logSecurityEvent('rate_limit_exceeded', {
                operation,
                identifier,
                attempts: recentAttempts.length,
                waitTime
            });

            throw new Error(`Trop de tentatives. Réessayez dans ${minutes} minute(s).`);
        }

        // Ajouter la tentative actuelle
        recentAttempts.push(now);
        this.failedAttempts.set(key, recentAttempts);

        return true;
    }

    /**
     * Authentification à deux facteurs (2FA)
     */
    async enable2FA(user) {
        try {
            console.log('🔐 Enabling 2FA for user:', user.email);
            
            // Générer un secret TOTP
            const secret = this.generateTOTPSecret();
            const qrCodeUrl = this.generateQRCode(user.email, secret);
            
            // Sauvegarder temporairement le secret (en production, utiliser un serveur)
            sessionStorage.setItem(`2fa_secret_${user.uid}`, secret);
            
            this.is2FAEnabled = true;
            this.pending2FAUser = user;

            this.logSecurityEvent('2fa_enabled', {
                userId: user.uid,
                email: user.email,
                timestamp: Date.now()
            });

            return {
                success: true,
                secret,
                qrCodeUrl,
                backupCodes: this.generateBackupCodes()
            };
            
        } catch (error) {
            console.error('2FA enable error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Vérification du code 2FA
     */
    verify2FACode(user, code) {
        const secret = sessionStorage.getItem(`2fa_secret_${user.uid}`);
        if (!secret) {
            throw new Error('2FA not set up for this user');
        }

        const isValid = this.validateTOTP(secret, code);
        
        if (isValid) {
            this.logSecurityEvent('2fa_success', {
                userId: user.uid,
                timestamp: Date.now()
            });
            
            // Nettoyer le secret temporaire
            sessionStorage.removeItem(`2fa_secret_${user.uid}`);
            this.pending2FAUser = null;
            
            return true;
        } else {
            this.logSecurityEvent('2fa_failure', {
                userId: user.uid,
                timestamp: Date.now()
            });
            
            throw new Error('Code 2FA invalide');
        }
    }

    /**
     * Génération d'un secret TOTP
     */
    generateTOTPSecret() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        for (let i = 0; i < 32; i++) {
            secret += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return secret;
    }

    /**
     * Validation TOTP (simplifiée)
     */
    validateTOTP(secret, code) {
        // En production, utiliser une library comme otplib
        // Cette implémentation est simplifiée pour la démonstration
        return code && code.length === 6 && /^\d{6}$/.test(code);
    }

    /**
     * Génération de QR Code pour 2FA
     */
    generateQRCode(email, secret) {
        const issuer = 'DictaMed';
        const label = encodeURIComponent(`DictaMed:${email}`);
        const encodedSecret = encodeURIComponent(secret);
        
        return `otpauth://totp/${label}?secret=${encodedSecret}&issuer=${encodeURIComponent(issuer)}`;
    }

    /**
     * Génération de codes de sauvegarde
     */
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            codes.push(code);
        }
        return codes;
    }

    /**
     * Détection d'activités suspectes
     */
    detectSuspiciousActivity() {
        const currentSession = this.getCurrentSession();
        if (!currentSession) return;

        const suspiciousActivities = [];

        // Vérifier changement d'IP (simulation)
        const currentIP = this.getCurrentIP();
        if (currentSession.lastIP && currentSession.lastIP !== currentIP) {
            suspiciousActivities.push('ip_change');
        }

        // Vérifier changement de User-Agent
        const currentUA = navigator.userAgent;
        if (currentSession.lastUserAgent && currentSession.lastUserAgent !== currentUA) {
            suspiciousActivities.push('user_agent_change');
        }

        // Vérifier changement d'empreinte d'appareil
        const currentFingerprint = this.deviceFingerprint;
        if (currentSession.deviceFingerprint && currentSession.deviceFingerprint !== currentFingerprint) {
            suspiciousActivities.push('device_change');
        }

        if (suspiciousActivities.length > 0) {
            this.handleSuspiciousActivity(suspiciousActivities);
        }
    }

    /**
     * Gestion des activités suspectes
     */
    handleSuspiciousActivity(activities) {
        console.warn('🚨 Suspicious activity detected:', activities);
        
        this.logSecurityEvent('suspicious_activity', {
            activities,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            fingerprint: this.deviceFingerprint
        });

        // En production, on pourrait :
        // 1. Demander une re-authentification
        // 2. Notifier l'utilisateur par email
        // 3. Bloquer temporairement le compte
        // 4. Logger l'incident pour analyse

        if (window.notificationSystem) {
            window.notificationSystem.warning(
                'Activité suspecte détectée. Si ce n\'est pas vous, contactez le support.',
                'Sécurité'
            );
        }
    }

    /**
     * Journalisation des événements de sécurité
     */
    logSecurityEvent(eventType, data) {
        const event = {
            type: eventType,
            data: data,
            timestamp: Date.now(),
            ip: this.getCurrentIP(),
            userAgent: navigator.userAgent,
            fingerprint: this.deviceFingerprint
        };

        this.securityEvents.push(event);

        // Limiter le nombre d'événements stockés
        if (this.securityEvents.length > 1000) {
            this.securityEvents = this.securityEvents.slice(-500);
        }

        // Sauvegarder les événements critiques
        if (['security_breach', '2fa_failure', 'rate_limit_exceeded'].includes(eventType)) {
            this.persistSecurityEvent(event);
        }

        console.log('📋 Security event:', eventType, data);
    }

    /**
     * Persistance des événements critiques
     */
    persistSecurityEvent(event) {
        try {
            const events = JSON.parse(localStorage.getItem('dictamed_security_events') || '[]');
            events.push(event);
            
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
     * Démarrage du monitoring de sécurité
     */
    startSecurityMonitoring() {
        // Vérification de session toutes les 30 secondes
        setInterval(() => {
            this.checkSessionExpiry();
            this.detectSuspiciousActivity();
        }, 30000);

        // Nettoyage des anciennes données toutes les heures
        setInterval(() => {
            this.cleanupOldData();
        }, 60 * 60 * 1000);

        console.log('🛡️ Security monitoring started');
    }

    /**
     * Nettoyage des anciennes données
     */
    cleanupOldData() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 heures

        // Nettoyer les événements anciens
        this.securityEvents = this.securityEvents.filter(
            event => now - event.timestamp < maxAge
        );

        // Nettoyer les tentatives échouées anciennes
        for (const [key, attempts] of this.failedAttempts) {
            const recentAttempts = attempts.filter(
                timestamp => now - timestamp < maxAge
            );
            
            if (recentAttempts.length === 0) {
                this.failedAttempts.delete(key);
            } else {
                this.failedAttempts.set(key, recentAttempts);
            }
        }
    }

    /**
     * Restauration des sessions
     */
    restoreSessions() {
        // Logique de restauration des sessions existantes
        console.log('🔄 Restoring sessions...');
    }

    /**
     * Obtention de la session actuelle
     */
    getCurrentSession() {
        const sessionData = localStorage.getItem('dictamed_session');
        if (!sessionData) return null;

        try {
            return JSON.parse(sessionData);
        } catch (error) {
            console.error('Failed to parse session:', error);
            return null;
        }
    }

    /**
     * Simulation d'obtention d'IP (en production, utiliser un service)
     */
    getCurrentIP() {
        // Simulation d'IP pour la démonstration
        return '192.168.1.' + Math.floor(Math.random() * 255);
    }

    /**
     * Nettoyage de session compromise
     */
    clearCompromisedSession() {
        localStorage.removeItem('dictamed_session');
        this.sessionStore.clear();
        console.log('🗑️ Compromised session cleared');
    }

    /**
     * Génération d'un rapport de sécurité
     */
    generateSecurityReport() {
        const now = Date.now();
        const last24h = now - (24 * 60 * 60 * 1000);

        const recentEvents = this.securityEvents.filter(
            event => event.timestamp > last24h
        );

        const eventCounts = recentEvents.reduce((acc, event) => {
            acc[event.type] = (acc[event.type] || 0) + 1;
            return acc;
        }, {});

        return {
            summary: {
                totalEvents: recentEvents.length,
                timeRange: '24h',
                eventTypes: Object.keys(eventCounts)
            },
            eventCounts,
            recommendations: this.getSecurityRecommendations(eventCounts)
        };
    }

    /**
     * Recommandations de sécurité basées sur l'activité
     */
    getSecurityRecommendations(eventCounts) {
        const recommendations = [];

        if (eventCounts['rate_limit_exceeded'] > 5) {
            recommendations.push('Considérez l\'activation de la 2FA pour améliorer la sécurité');
        }

        if (eventCounts['suspicious_activity'] > 0) {
            recommendations.push('Surveillez les connexions depuis de nouveaux appareils');
        }

        if (eventCounts['2fa_failure'] > 3) {
            recommendations.push('Vérifiez vos codes de sauvegarde 2FA');
        }

        return recommendations;
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthSecurityManager;
} else {
    window.AuthSecurityManager = AuthSecurityManager;
}

// Initialisation automatique
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.authSecurityManager = new AuthSecurityManager();
            window.authSecurityManager.init();
        });
    } else {
        window.authSecurityManager = new AuthSecurityManager();
        window.authSecurityManager.init();
    }
}