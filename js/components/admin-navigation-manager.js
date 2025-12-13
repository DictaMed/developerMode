/**
 * DictaMed - Gestionnaire de Navigation Admin
 * Version: 1.1.0 - Affiche l'onglet admin seulement pour l'administrateur autorisé
 * Compatible avec FirebaseAuthManager v2.1.0
 */

class AdminNavigationManager {
    constructor() {
        this.adminEmail = 'akio963@gmail.com';
        this.adminNavBtn = null;
        this.isInitialized = false;
        this.authListenerAdded = false;
        this.checkInterval = null;
    }

    /**
     * Initialisation du gestionnaire de navigation admin
     */
    init() {
        try {
            console.log('🔧 Initialisation AdminNavigationManager v1.1.0...');
            
            this.adminNavBtn = document.getElementById('adminNavBtn');
            if (!this.adminNavBtn) {
                console.warn('AdminNavigationManager: Bouton admin non trouvé dans le DOM');
                return false;
            }

            // Écouter les changements d'état d'authentification
            this.bindAuthStateListener();
            
            // Vérifier l'état initial après un court délai
            setTimeout(() => {
                this.checkAdminAccess();
            }, 1000);
            
            this.isInitialized = true;
            console.log('✅ AdminNavigationManager v1.1.0 initialisé avec succès');
            return true;

        } catch (error) {
            console.error('❌ Erreur d\'initialisation AdminNavigationManager:', error);
            return false;
        }
    }

    /**
     * Liaison de l'écouteur d'état d'authentification amélioré
     */
    bindAuthStateListener() {
        // Écouter l'événement personnalisé d'authentification
        window.addEventListener('authStateChanged', (event) => {
            console.log('🔐 AdminNavigationManager: Changement d\'état auth détecté');
            this.checkAdminAccess();
        });

        // Écouter les événements Firebase Auth avec FirebaseAuthManager
        if (typeof window.FirebaseAuthManager !== 'undefined') {
            // Ajouter un écouteur d'état d'authentification
            window.FirebaseAuthManager.addAuthStateListener((user) => {
                console.log('🔐 AdminNavigationManager: FirebaseAuthManager state changed:', user ? user.email : 'null');
                this.checkAdminAccess();
            });
            
            this.authListenerAdded = true;
            console.log('✅ Écouteur FirebaseAuthManager ajouté');
        } else {
            // Fallback: vérification périodique si FirebaseAuthManager n'est pas encore disponible
            console.log('⚠️ FirebaseAuthManager non disponible, utilisation du fallback');
            this.startPeriodicCheck();
        }
    }

    /**
     * Démarrer la vérification périodique (fallback)
     */
    startPeriodicCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        this.checkInterval = setInterval(() => {
            this.checkAdminAccess();
            
            // Essayer d'ajouter l'écouteur quand FirebaseAuthManager devient disponible
            if (!this.authListenerAdded && typeof window.FirebaseAuthManager !== 'undefined') {
                this.bindAuthStateListener();
            }
        }, 2000); // Vérifier toutes les 2 secondes
    }

    /**
     * Arrêter la vérification périodique
     */
    stopPeriodicCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * Vérification de l'accès administrateur
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
        } catch (error) {
            console.error('❌ Erreur lors de la vérification d\'accès admin:', error);
            this.hideAdminButton();
        }
    }

    /**
     * Affichage du bouton admin
     */
    showAdminButton() {
        if (this.adminNavBtn) {
            this.adminNavBtn.style.display = 'flex';
            this.adminNavBtn.style.opacity = '1';
            console.log('👁️ Bouton admin affiché');
        }
    }

    /**
     * Masquage du bouton admin
     */
    hideAdminButton() {
        if (this.adminNavBtn) {
            this.adminNavBtn.style.display = 'none';
            this.adminNavBtn.style.opacity = '0';
            console.log('🙈 Bouton admin masqué');
        }
    }

    /**
     * Récupération de l'utilisateur actuel avec fallback amélioré
     */
    getCurrentUser() {
        try {
            // Essayer avec FirebaseAuthManager d'abord
            if (typeof window.FirebaseAuthManager !== 'undefined' && 
                window.FirebaseAuthManager.getCurrentUser && 
                window.FirebaseAuthManager.isInitialized) {
                
                const user = window.FirebaseAuthManager.getCurrentUser();
                if (user) {
                    console.log('👤 Utilisateur récupéré via FirebaseAuthManager:', user.email);
                    return user;
                }
            }

            // Essayer avec Firebase direct
            if (typeof window.firebase !== 'undefined' && window.firebase.auth) {
                const user = window.firebase.auth.currentUser;
                if (user) {
                    console.log('👤 Utilisateur récupéré via Firebase direct:', user.email);
                    return {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName
                    };
                }
            }

            console.log('ℹ️ Aucun utilisateur trouvé');
            return null;
            
        } catch (error) {
            console.warn('AdminNavigationManager: Erreur lors de la récupération de l\'utilisateur:', error);
            return null;
        }
    }

    /**
     * Vérification si l'utilisateur est admin
     */
    isAdmin() {
        const currentUser = this.getCurrentUser();
        return currentUser && currentUser.email === this.adminEmail;
    }

    /**
     * Forcer la vérification (utile après connexion/déconnexion)
     */
    forceCheck() {
        console.log('🔄 AdminNavigationManager: Vérification forcée');
        this.checkAdminAccess();
    }

    /**
     * Débogage - Afficher les informations de l'utilisateur actuel
     */
    debug() {
        const currentUser = this.getCurrentUser();
        console.log('🐛 AdminNavigationManager Debug:', {
            currentUser: currentUser,
            isAdmin: this.isAdmin(),
            adminEmail: this.adminEmail,
            buttonVisible: this.adminNavBtn ? this.adminNavBtn.style.display !== 'none' : false,
            isInitialized: this.isInitialized,
            authListenerAdded: this.authListenerAdded,
            firebaseAuthManagerAvailable: typeof window.FirebaseAuthManager !== 'undefined',
            firebaseAuthManagerInitialized: window.FirebaseAuthManager ? window.FirebaseAuthManager.isInitialized : false
        });
    }

    /**
     * Nettoyage des ressources
     */
    cleanup() {
        this.stopPeriodicCheck();
        this.isInitialized = false;
        console.log('🧹 AdminNavigationManager nettoyé');
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

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminNavigationManager;
}