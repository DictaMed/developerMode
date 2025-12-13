/**
 * DictaMed - Bridge entre EnhancedFirebaseAuthManager et AdminWebhookManager
 * Version: 1.0.0 - Assure la compatibilité entre les deux gestionnaires
 */

class AuthManagerBridge {
    constructor() {
        this.enhancedAuthManager = null;
        this.adminWebhookManager = null;
        this.isInitialized = false;
        this.authListeners = [];
    }

    /**
     * Initialisation du bridge
     */
    async init() {
        if (this.isInitialized) return true;

        try {
            console.log('🔗 Initialisation du bridge d\'authentification...');
            
            // Récupérer l'instance du gestionnaire d'authentification amélioré
            this.enhancedAuthManager = window.EnhancedFirebaseAuthManager || window.FirebaseAuthManager;
            if (!this.enhancedAuthManager) {
                throw new Error('EnhancedFirebaseAuthManager non trouvé');
            }

            // Attendre l'initialisation de l'auth manager
            await this.waitForAuthManagerInit();

            // Créer les méthodes de compatibilité
            this.createCompatibilityMethods();

            // Configurer les listeners d'état
            this.setupAuthStateBridge();

            this.isInitialized = true;
            console.log('✅ Bridge d\'authentification initialisé');
            return true;

        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du bridge:', error);
            return false;
        }
    }

    /**
     * Attendre l'initialisation du gestionnaire d'authentification
     */
    async waitForAuthManagerInit(timeout = 15000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            try {
                if (this.enhancedAuthManager.isInitialized) {
                    console.log('✅ EnhancedFirebaseAuthManager initialisé');
                    return true;
                }
            } catch (error) {
                console.warn('⚠️ Erreur lors de la vérification auth:', error);
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        throw new Error('EnhancedFirebaseAuthManager non initialisé dans les temps');
    }

    /**
     * Créer les méthodes de compatibilité
     */
    createCompatibilityMethods() {
        // Ajouter la méthode addAuthStateListener si elle n'existe pas
        if (!this.enhancedAuthManager.addAuthStateListener) {
            this.enhancedAuthManager.addAuthStateListener = (callback) => {
                // Stocker le callback
                this.authListeners.push(callback);
                
                // Appeler immédiatement avec l'état actuel si disponible
                const currentUser = this.enhancedAuthManager.getCurrentUser();
                if (currentUser) {
                    setTimeout(() => callback(currentUser), 100);
                }
                
                // Retourner une fonction de désabonnement
                return () => {
                    const index = this.authListeners.indexOf(callback);
                    if (index > -1) {
                        this.authListeners.splice(index, 1);
                    }
                };
            };
        }

        // S'assurer que getCurrentUser existe et fonctionne
        if (!this.enhancedAuthManager.getCurrentUser) {
            this.enhancedAuthManager.getCurrentUser = () => {
                return this.enhancedAuthManager.currentUser || null;
            };
        }
    }

    /**
     * Configurer le bridge d'état d'authentification
     */
    setupAuthStateBridge() {
        // Écouter les changements d'état de l'auth manager original
        if (this.enhancedAuthManager.auth) {
            this.enhancedAuthManager.auth.onAuthStateChanged((user) => {
                // Notifier tous les listeners
                this.authListeners.forEach(callback => {
                    try {
                        callback(user);
                    } catch (error) {
                        console.error('❌ Erreur dans un auth listener:', error);
                    }
                });
            });
        }
    }

    /**
     * Initialiser l'admin webhook manager
     */
    async initAdminWebhookManager() {
        try {
            // Attendre que le bridge soit initialisé
            await this.init();

            // Récupérer l'admin webhook manager
            this.adminWebhookManager = window.AdminWebhookManagerEnhancedFirestore;
            if (!this.adminWebhookManager) {
                console.warn('⚠️ AdminWebhookManagerEnhancedFirestore non trouvé');
                return false;
            }

            // Initialiser l'admin webhook manager
            const result = await this.adminWebhookManager.init();
            if (result) {
                console.log('✅ AdminWebhookManagerEnhancedFirestore initialisé via le bridge');
                return true;
            } else {
                console.warn('⚠️ Échec de l\'initialisation de AdminWebhookManagerEnhancedFirestore');
                return false;
            }

        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation de l\'admin webhook manager:', error);
            return false;
        }
    }

    /**
     * Forcer la détection des utilisateurs
     */
    async forceUserDetection() {
        try {
            if (this.adminWebhookManager && this.adminWebhookManager.forceUserDetection) {
                return await this.adminWebhookManager.forceUserDetection();
            } else {
                console.warn('⚠️ Méthode forceUserDetection non disponible');
                return false;
            }
        } catch (error) {
            console.error('❌ Erreur lors de la détection forcée:', error);
            return false;
        }
    }

    /**
     * Rafraîchir les données
     */
    async refreshData() {
        try {
            if (this.adminWebhookManager && this.adminWebhookManager.refreshData) {
                return await this.adminWebhookManager.refreshData();
            } else {
                console.warn('⚠️ Méthode refreshData non disponible');
                return false;
            }
        } catch (error) {
            console.error('❌ Erreur lors du rafraîchissement:', error);
            return false;
        }
    }

    /**
     * Obtenir les statistiques des utilisateurs
     */
    getUserStats() {
        try {
            if (this.adminWebhookManager) {
                return {
                    totalUsers: this.adminWebhookManager.users?.length || 0,
                    totalWebhooks: this.adminWebhookManager.webhooks?.size || 0,
                    activeWebhooks: Array.from(this.adminWebhookManager.webhooks?.values() || [])
                        .filter(w => w?.isActive).length,
                    lastUpdate: new Date().toISOString()
                };
            }
            return { error: 'AdminWebhookManager non initialisé' };
        } catch (error) {
            console.error('❌ Erreur lors de l\'obtention des stats:', error);
            return { error: error.message };
        }
    }

    /**
     * Diagnostic complet du système
     */
    async runDiagnostics() {
        const diagnostics = {
            bridgeInitialized: this.isInitialized,
            authManagerAvailable: !!this.enhancedAuthManager,
            authManagerInitialized: this.enhancedAuthManager?.isInitialized || false,
            adminManagerAvailable: !!this.adminWebhookManager,
            adminManagerInitialized: this.adminWebhookManager?.isInitialized || false,
            currentUser: this.enhancedAuthManager?.getCurrentUser()?.email || null,
            userCount: this.adminWebhookManager?.users?.length || 0,
            webhookCount: this.adminWebhookManager?.webhooks?.size || 0,
            authListenersCount: this.authListeners.length,
            timestamp: new Date().toISOString()
        };

        console.log('🔍 Diagnostic du système d\'authentification:', diagnostics);
        return diagnostics;
    }
}

// Instance singleton du bridge
window.AuthManagerBridge = new AuthManagerBridge();

// Fonction d'initialisation automatique
window.initAuthSystem = async function() {
    try {
        console.log('🚀 Initialisation automatique du système d\'authentification...');
        
        const bridge = window.AuthManagerBridge;
        const authResult = await bridge.init();
        const adminResult = await bridge.initAdminWebhookManager();
        
        if (authResult && adminResult) {
            console.log('✅ Système d\'authentification complètement initialisé');
            
            // Lancer un diagnostic
            setTimeout(() => {
                bridge.runDiagnostics();
            }, 2000);
            
            return true;
        } else {
            console.warn('⚠️ Initialisation partielle du système d\'authentification');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation automatique:', error);
        return false;
    }
};

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManagerBridge;
}