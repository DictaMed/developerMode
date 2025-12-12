/**
 * DictaMed - Gestionnaire de Navigation Admin
 * Version: 1.0.0 - Affiche l'onglet admin seulement pour l'administrateur autorisé
 */

class AdminNavigationManager {
    constructor() {
        this.adminEmail = 'akio963@gmail.com';
        this.adminNavBtn = null;
        this.isInitialized = false;
    }

    /**
     * Initialisation du gestionnaire de navigation admin
     */
    init() {
        try {
            console.log('🔧 Initialisation AdminNavigationManager...');
            
            this.adminNavBtn = document.getElementById('adminNavBtn');
            if (!this.adminNavBtn) {
                console.warn('AdminNavigationManager: Bouton admin non trouvé dans le DOM');
                return false;
            }

            // Écouter les changements d'état d'authentification
            this.bindAuthStateListener();
            
            // Vérifier l'état initial
            this.checkAdminAccess();
            
            this.isInitialized = true;
            console.log('✅ AdminNavigationManager initialisé avec succès');
            return true;

        } catch (error) {
            console.error('❌ Erreur d\'initialisation AdminNavigationManager:', error);
            return false;
        }
    }

    /**
     * Liaison de l'écouteur d'état d'authentification
     */
    bindAuthStateListener() {
        // Écouter l'événement personnalisé d'authentification
        window.addEventListener('authStateChanged', (event) => {
            console.log('🔐 AdminNavigationManager: Changement d\'état auth détecté');
            this.checkAdminAccess();
        });

        // Écouter les événements Firebase Auth
        if (typeof window.FirebaseAuthManager !== 'undefined') {
            // Vérifier périodiquement l'état d'authentification
            setInterval(() => {
                this.checkAdminAccess();
            }, 2000); // Vérifier toutes les 2 secondes
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
     * Récupération de l'utilisateur actuel
     */
    getCurrentUser() {
        try {
            // Essayer avec FirebaseAuthManager
            if (typeof window.FirebaseAuthManager !== 'undefined' && window.FirebaseAuthManager.getCurrentUser) {
                const user = window.FirebaseAuthManager.getCurrentUser();
                if (user) {
                    return user;
                }
            }

            // Essayer avec Firebase direct
            if (typeof window.firebase !== 'undefined' && window.firebase.auth) {
                const user = window.firebase.auth.currentUser;
                if (user) {
                    return {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName
                    };
                }
            }

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
            buttonVisible: this.adminNavBtn ? this.adminNavBtn.style.display !== 'none' : false
        });
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

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminNavigationManager;
}