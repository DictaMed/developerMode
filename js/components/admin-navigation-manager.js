/**
 * DictaMed - Gestionnaire de Navigation Admin
 * Version: 1.2.0 - Améliorations de synchronisation et gestion d'erreurs
 * Compatible avec FirebaseAuthManager v2.1.0
 */

class AdminNavigationManager {
    constructor() {
        this.adminEmail = 'akio963@gmail.com';
        this.adminNavBtn = null;
        this.isInitialized = false;
        this.authListenerAdded = false;
        this.checkInterval = null;
        this.lastCheckTime = 0;
        this.checkCooldown = 1000; // 1 seconde entre les vérifications
        this.retryCount = 0;
        this.maxRetries = 5;
        this.cleanupCallbacks = [];
    }

    /**
     * Initialisation du gestionnaire de navigation admin avec gestion d'erreurs améliorée
     */
    init() {
        try {
            // Éviter la double initialisation
            if (this.isInitialized) {
                console.log('ℹ️ AdminNavigationManager déjà initialisé');
                return true;
            }

            console.log('🔧 Initialisation AdminNavigationManager v1.2.0...');
            
            this.adminNavBtn = document.getElementById('adminNavBtn');
            if (!this.adminNavBtn) {
                console.warn('AdminNavigationManager: Bouton admin non trouvé dans le DOM');
                // Essayer de créer le bouton s'il n'existe pas
                this.createAdminButton();
                return false;
            }

            // Écouter les changements d'état d'authentification
            this.bindAuthStateListener();
            
            // Vérifier l'état initial après un court délai
            setTimeout(() => {
                this.checkAdminAccess();
            }, 1000);
            
            this.isInitialized = true;
            console.log('✅ AdminNavigationManager v1.2.0 initialisé avec succès');
            return true;

        } catch (error) {
            console.error('❌ Erreur d\'initialisation AdminNavigationManager:', error);
            return false;
        }
    }

    /**
     * Création du bouton admin s'il n'existe pas
     */
    createAdminButton() {
        try {
            const navAuth = document.querySelector('.nav-auth');
            if (!navAuth) {
                console.warn('Impossible de créer le bouton admin: nav-auth non trouvé');
                return;
            }

            const adminBtn = document.createElement('button');
            adminBtn.id = 'adminNavBtn';
            adminBtn.className = 'auth-button admin-button';
            adminBtn.style.display = 'none';
            adminBtn.innerHTML = '🎛️ Admin';
            
            adminBtn.addEventListener('click', () => {
                if (this.isAdmin()) {
                    window.location.href = 'admin-webhooks.html';
                } else {
                    this.showAdminAccessDenied();
                }
            });

            navAuth.appendChild(adminBtn);
            this.adminNavBtn = adminBtn;
            console.log('✅ Bouton admin créé dynamiquement');

        } catch (error) {
            console.error('❌ Erreur lors de la création du bouton admin:', error);
        }
    }

    /**
     * Liaison de l'écouteur d'état d'authentification amélioré
     */
    bindAuthStateListener() {
        try {
            // Écouter l'événement personnalisé d'authentification
            window.addEventListener('authStateChanged', (event) => {
                console.log('🔐 AdminNavigationManager: Changement d\'état auth détecté');
                this.handleAuthStateChange();
            });

            // Méthode optimisée pour FirebaseAuthManager
            this.setupFirebaseAuthListener();
            
        } catch (error) {
            console.error('❌ Erreur lors de la liaison des listeners auth:', error);
        }
    }

    /**
     * Configuration optimisée de l'écouteur Firebase Auth
     */
    setupFirebaseAuthListener() {
        const maxAttempts = 10;
        let attempts = 0;

        const trySetupListener = () => {
            attempts++;
            
            if (typeof window.FirebaseAuthManager !== 'undefined' && 
                window.FirebaseAuthManager.addAuthStateListener) {
                
                try {
                    window.FirebaseAuthManager.addAuthStateListener((user) => {
                        console.log('🔐 AdminNavigationManager: FirebaseAuthManager state changed:', 
                            user ? user.email : 'null');
                        this.handleAuthStateChange();
                    });
                    
                    this.authListenerAdded = true;
                    this.retryCount = 0;
                    console.log('✅ Écouteur FirebaseAuthManager ajouté avec succès');
                    
                } catch (error) {
                    console.warn('⚠️ Erreur lors de l\'ajout de l\'écouteur FirebaseAuthManager:', error);
                    this.startPeriodicCheck();
                }
                
            } else if (attempts < maxAttempts) {
                // Réessayer dans 500ms
                setTimeout(trySetupListener, 500);
            } else {
                console.warn('⚠️ FirebaseAuthManager non disponible après', maxAttempts, 'tentatives');
                this.startPeriodicCheck();
            }
        };

        // Commencer les tentatives
        trySetupListener();
    }

    /**
     * Démarrage de la vérification périodique optimisée (fallback)
     */
    startPeriodicCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        this.checkInterval = setInterval(() => {
            // Vérifier le cooldown
            const now = Date.now();
            if (now - this.lastCheckTime < this.checkCooldown) {
                return;
            }
            this.lastCheckTime = now;

            this.checkAdminAccess();
            
            // Essayer d'ajouter l'écouteur quand FirebaseAuthManager devient disponible
            if (!this.authListenerAdded && typeof window.FirebaseAuthManager !== 'undefined') {
                this.setupFirebaseAuthListener();
            }
        }, 2000); // Vérifier toutes les 2 secondes
    }

    /**
     * Arrêt de la vérification périodique
     */
    stopPeriodicCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * Gestion centralisée des changements d'état d'authentification
     */
    handleAuthStateChange() {
        try {
            // Reset du compteur de retry en cas de succès
            this.retryCount = 0;
            this.checkAdminAccess();
        } catch (error) {
            console.error('❌ Erreur lors de la gestion du changement auth:', error);
        }
    }

    /**
     * Vérification de l'accès administrateur avec gestion d'erreurs améliorée
     */
    checkAdminAccess() {
        try {
            const currentUser = this.getCurrentUser();
            
            if (currentUser && currentUser.email === this.adminEmail) {
                this.showAdminButton();
                console.log('✅ Accès admin autorisé pour:', currentUser.email);
            } else {
                this.hideAdminButton();
                if (currentUser) {
                    console.log('🚫 Accès admin refusé pour:', currentUser.email);
                } else {
                    console.log('🚫 Aucun utilisateur connecté');
                }
            }
            
            this.retryCount = 0; // Reset en cas de succès
            
        } catch (error) {
            this.retryCount++;
            console.warn(`⚠️ Erreur lors de la vérification d'accès admin (tentative ${this.retryCount}):`, error);
            
            // En cas d'erreur, masquer le bouton pour la sécurité
            this.hideAdminButton();
            
            // Retry avec backoff exponentiel
            if (this.retryCount < this.maxRetries) {
                setTimeout(() => {
                    this.checkAdminAccess();
                }, Math.min(1000 * Math.pow(2, this.retryCount), 10000));
            }
        }
    }

    /**
     * Affichage du bouton admin avec animation
     */
    showAdminButton() {
        if (this.adminNavBtn) {
            this.adminNavBtn.style.display = 'flex';
            this.adminNavBtn.style.opacity = '1';
            this.adminNavBtn.style.transform = 'translateY(0)';
            
            // Animation d'apparition
            this.adminNavBtn.animate([
                { opacity: 0, transform: 'translateY(-10px)' },
                { opacity: 1, transform: 'translateY(0)' }
            ], {
                duration: 300,
                easing: 'ease-out'
            });
            
            console.log('👁️ Bouton admin affiché');
        }
    }

    /**
     * Masquage du bouton admin avec animation
     */
    hideAdminButton() {
        if (this.adminNavBtn) {
            this.adminNavBtn.style.opacity = '0';
            this.adminNavBtn.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                if (this.adminNavBtn) {
                    this.adminNavBtn.style.display = 'none';
                }
            }, 300);
            
            console.log('🙈 Bouton admin masqué');
        }
    }

    /**
     * Récupération de l'utilisateur actuel avec fallback amélioré et cache
     */
    getCurrentUser() {
        try {
            // Vérifier le cache en premier pour éviter les appels répétés
            const cacheKey = 'admin_nav_current_user';
            const cached = sessionStorage.getItem(cacheKey);
            const cacheTime = sessionStorage.getItem(cacheKey + '_time');
            
            // Utiliser le cache si moins de 30 secondes
            if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 30000) {
                return JSON.parse(cached);
            }

            let user = null;

            // Méthode 1: Essayer avec FirebaseAuthManager optimisé
            if (typeof window.FirebaseAuthManager !== 'undefined') {
                try {
                    const authManager = window.FirebaseAuthManager.getInstance ? 
                        window.FirebaseAuthManager.getInstance() : window.FirebaseAuthManager;
                    
                    if (authManager && authManager.getCurrentUser && authManager.isInitialized) {
                        const currentUser = authManager.getCurrentUser();
                        if (currentUser) {
                            user = {
                                uid: currentUser.uid,
                                email: currentUser.email,
                                displayName: currentUser.displayName || currentUser.email,
                                emailVerified: currentUser.emailVerified || false
                            };
                        }
                    }
                } catch (error) {
                    console.warn('⚠️ Erreur avec FirebaseAuthManager:', error);
                }
            }

            // Méthode 2: Fallback vers Firebase direct
            if (!user && typeof window.firebase !== 'undefined' && window.firebase.auth) {
                try {
                    const firebaseUser = window.firebase.auth().currentUser;
                    if (firebaseUser) {
                        user = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName || firebaseUser.email,
                            emailVerified: firebaseUser.emailVerified || false
                        };
                    }
                } catch (error) {
                    console.warn('⚠️ Erreur avec Firebase direct:', error);
                }
            }

            // Mettre en cache le résultat
            if (user) {
                sessionStorage.setItem(cacheKey, JSON.stringify(user));
                sessionStorage.setItem(cacheKey + '_time', Date.now().toString());
            } else {
                sessionStorage.removeItem(cacheKey);
                sessionStorage.removeItem(cacheKey + '_time');
            }

            return user;
            
        } catch (error) {
            console.warn('AdminNavigationManager: Erreur lors de la récupération de l\'utilisateur:', error);
            return null;
        }
    }

    /**
     * Vérification si l'utilisateur est admin avec validation renforcée
     */
    isAdmin() {
        try {
            const currentUser = this.getCurrentUser();
            const isAdmin = currentUser && currentUser.email === this.adminEmail;
            
            console.log('🔍 Vérification admin:', {
                currentUser: currentUser?.email || 'null',
                isAdmin: isAdmin,
                adminEmail: this.adminEmail
            });
            
            return isAdmin;
        } catch (error) {
            console.error('❌ Erreur lors de la vérification admin:', error);
            return false;
        }
    }

    /**
     * Forcer la vérification (utile après connexion/déconnexion)
     */
    forceCheck() {
        console.log('🔄 AdminNavigationManager: Vérification forcée');
        this.retryCount = 0; // Reset des retries
        this.checkAdminAccess();
    }

    /**
     * Affichage d'un message d'accès refusé pour l'admin
     */
    showAdminAccessDenied() {
        try {
            const message = `Accès refusé. Cette interface est réservée à l'administrateur (${this.adminEmail}).`;
            
            if (window.notificationSystem) {
                window.notificationSystem.error(message, 'Accès Refusé');
            } else {
                alert('🚫 ' + message);
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'affichage d\'accès refusé:', error);
        }
    }

    /**
     * Débogage - Afficher les informations de l'utilisateur actuel
     */
    debug() {
        try {
            const currentUser = this.getCurrentUser();
            const debugInfo = {
                currentUser: currentUser,
                isAdmin: this.isAdmin(),
                adminEmail: this.adminEmail,
                buttonVisible: this.adminNavBtn ? this.adminNavBtn.style.display !== 'none' : false,
                isInitialized: this.isInitialized,
                authListenerAdded: this.authListenerAdded,
                checkIntervalActive: !!this.checkInterval,
                retryCount: this.retryCount,
                firebaseAuthManagerAvailable: typeof window.FirebaseAuthManager !== 'undefined',
                firebaseAuthManagerInitialized: window.FirebaseAuthManager?.isInitialized || false,
                firebaseAvailable: typeof window.firebase !== 'undefined',
                timestamp: new Date().toISOString()
            };
            
            console.log('🐛 AdminNavigationManager Debug:', debugInfo);
            return debugInfo;
        } catch (error) {
            console.error('❌ Erreur lors du debug:', error);
            return null;
        }
    }

    /**
     * Nettoyage des ressources
     */
    cleanup() {
        try {
            console.log('🧹 Nettoyage AdminNavigationManager...');
            
            // Arrêter la vérification périodique
            this.stopPeriodicCheck();
            
            // Réinitialiser les variables d'état
            this.isInitialized = false;
            this.authListenerAdded = false;
            this.retryCount = 0;
            
            // Exécuter les callbacks de nettoyage
            this.cleanupCallbacks.forEach(callback => {
                try {
                    callback();
                } catch (error) {
                    console.warn('⚠️ Erreur lors du nettoyage:', error);
                }
            });
            this.cleanupCallbacks = [];
            
            console.log('✅ AdminNavigationManager nettoyé');
        } catch (error) {
            console.error('❌ Erreur lors du nettoyage:', error);
        }
    }

    /**
     * Ajout d'un callback de nettoyage
     */
    addCleanupCallback(callback) {
        if (typeof callback === 'function') {
            this.cleanupCallbacks.push(callback);
        }
    }

    /**
     * Statut du gestionnaire
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            authListenerAdded: this.authListenerAdded,
            checkIntervalActive: !!this.checkInterval,
            retryCount: this.retryCount,
            lastCheckTime: this.lastCheckTime,
            adminEmail: this.adminEmail
        };
    }
}

// Instance globale
window.adminNavigationManager = new AdminNavigationManager();

// Initialisation automatique quand le DOM est chargé
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.adminNavigationManager.init();
        });
    } else {
        // DOM déjà chargé
        setTimeout(() => {
            window.adminNavigationManager.init();
        }, 500);
    }
}

// Écouter l'événement firebaseReady pour s'assurer que Firebase est initialisé
window.addEventListener('firebaseReady', () => {
    console.log('🔥 Firebase ready event reçu par AdminNavigationManager');
    if (window.adminNavigationManager && !window.adminNavigationManager.isInitialized) {
        window.adminNavigationManager.init();
    }
});

// Écouter l'événement authStateChanged global
window.addEventListener('authStateChanged', () => {
    if (window.adminNavigationManager && window.adminNavigationManager.isInitialized) {
        window.adminNavigationManager.handleAuthStateChange();
    }
});

// Gestion du déchargement de page
window.addEventListener('beforeunload', () => {
    if (window.adminNavigationManager) {
        window.adminNavigationManager.cleanup();
    }
});

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminNavigationManager;
}