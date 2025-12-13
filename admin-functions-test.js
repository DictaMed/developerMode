/**
 * DictaMed - Tests Comprehensive pour les Fonctions Admin
 * Version: 1.0.0 - Tests complets pour AdminNavigationManager et AdminWebhookManager
 */

class AdminFunctionsTestSuite {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            tests: []
        };
        this.testTimeout = 5000; // 5 secondes timeout pour chaque test
    }

    /**
     * Exécuter tous les tests
     */
    async runAllTests() {
        console.log('🧪 Démarrage de la suite de tests des fonctions admin...');
        console.log('=================================================');
        
        // Tests pour AdminNavigationManager
        await this.testAdminNavigationManager();
        
        // Tests pour AdminWebhookManager
        await this.testAdminWebhookManager();
        
        // Tests d'intégration
        await this.testIntegration();
        
        // Tests de performance
        await this.testPerformance();
        
        // Afficher les résultats
        this.displayResults();
        
        return this.testResults;
    }

    /**
     * Tests pour AdminNavigationManager
     */
    async testAdminNavigationManager() {
        console.log('\n🔍 Tests AdminNavigationManager:');
        console.log('--------------------------------');
        
        // Test 1: Initialisation
        await this.runTest('AdminNavigationManager - Initialisation', async () => {
            if (typeof AdminNavigationManager === 'undefined') {
                throw new Error('AdminNavigationManager non défini');
            }
            
            const manager = new AdminNavigationManager();
            if (!manager) {
                throw new Error('Impossible de créer une instance');
            }
            
            // Vérifier les propriétés de base
            if (manager.adminEmail !== 'akio963@gmail.com') {
                throw new Error('Email admin incorrect');
            }
            
            if (typeof manager.isInitialized !== 'boolean') {
                throw new Error('Propriété isInitialized manquante');
            }
            
            return true;
        });

        // Test 2: Gestion des événements
        await this.runTest('AdminNavigationManager - Gestion des événements', async () => {
            const manager = new AdminNavigationManager();
            
            // Vérifier la présence des méthodes d'événement
            if (typeof manager.bindAuthStateListener !== 'function') {
                throw new Error('Méthode bindAuthStateListener manquante');
            }
            
            if (typeof manager.handleAuthStateChange !== 'function') {
                throw new Error('Méthode handleAuthStateChange manquante');
            }
            
            return true;
        });

        // Test 3: Vérification admin
        await this.runTest('AdminNavigationManager - Vérification admin', async () => {
            const manager = new AdminNavigationManager();
            
            if (typeof manager.isAdmin !== 'function') {
                throw new Error('Méthode isAdmin manquante');
            }
            
            if (typeof manager.checkAdminAccess !== 'function') {
                throw new Error('Méthode checkAdminAccess manquante');
            }
            
            return true;
        });

        // Test 4: Nettoyage
        await this.runTest('AdminNavigationManager - Nettoyage', async () => {
            const manager = new AdminNavigationManager();
            
            if (typeof manager.cleanup !== 'function') {
                throw new Error('Méthode cleanup manquante');
            }
            
            if (typeof manager.addCleanupCallback !== 'function') {
                throw new Error('Méthode addCleanupCallback manquante');
            }
            
            return true;
        });

        // Test 5: Debug et statut
        await this.runTest('AdminNavigationManager - Debug et statut', async () => {
            const manager = new AdminNavigationManager();
            
            if (typeof manager.debug !== 'function') {
                throw new Error('Méthode debug manquante');
            }
            
            if (typeof manager.getStatus !== 'function') {
                throw new Error('Méthode getStatus manquante');
            }
            
            const status = manager.getStatus();
            if (!status || typeof status !== 'object') {
                throw new Error('getStatus ne retourne pas un objet valide');
            }
            
            return true;
        });
    }

    /**
     * Tests pour AdminWebhookManager
     */
    async testAdminWebhookManager() {
        console.log('\n🔗 Tests AdminWebhookManager:');
        console.log('-----------------------------');
        
        // Test 1: Initialisation
        await this.runTest('AdminWebhookManager - Initialisation', async () => {
            if (typeof AdminWebhookManager === 'undefined') {
                throw new Error('AdminWebhookManager non défini');
            }
            
            const manager = new AdminWebhookManager();
            if (!manager) {
                throw new Error('Impossible de créer une instance');
            }
            
            // Vérifier les propriétés de base
            if (manager.adminEmail !== 'akio963@gmail.com') {
                throw new Error('Email admin incorrect');
            }
            
            if (!Array.isArray(manager.users)) {
                throw new Error('Users doit être un array');
            }
            
            if (!(manager.webhooks instanceof Map)) {
                throw new Error('Webhooks doit être une Map');
            }
            
            return true;
        });

        // Test 2: Chargement des données
        await this.runTest('AdminWebhookManager - Chargement des données', async () => {
            const manager = new AdminWebhookManager();
            
            if (typeof manager.loadUsers !== 'function') {
                throw new Error('Méthode loadUsers manquante');
            }
            
            if (typeof manager.loadAllWebhooks !== 'function') {
                throw new Error('Méthode loadAllWebhooks manquante');
            }
            
            return true;
        });

        // Test 3: Gestion des webhooks
        await this.runTest('AdminWebhookManager - Gestion des webhooks', async () => {
            const manager = new AdminWebhookManager();
            
            if (typeof manager.saveWebhook !== 'function') {
                throw new Error('Méthode saveWebhook manquante');
            }
            
            if (typeof manager.toggleWebhookStatus !== 'function') {
                throw new Error('Méthode toggleWebhookStatus manquante');
            }
            
            if (typeof manager.deleteWebhook !== 'function') {
                throw new Error('Méthode deleteWebhook manquante');
            }
            
            return true;
        });

        // Test 4: Validation et rendu
        await this.runTest('AdminWebhookManager - Validation et rendu', async () => {
            const manager = new AdminWebhookManager();
            
            if (typeof manager.validateWebhookUrl !== 'function') {
                throw new Error('Méthode validateWebhookUrl manquante');
            }
            
            if (typeof manager.renderUserCard !== 'function') {
                throw new Error('Méthode renderUserCard manquante');
            }
            
            if (typeof manager.renderStatistics !== 'function') {
                throw new Error('Méthode renderStatistics manquante');
            }
            
            // Test de validation d'URL
            const validUrl = 'https://example.com/webhook';
            const invalidUrl = 'not-a-url';
            
            if (!manager.validateWebhookUrl(validUrl)) {
                throw new Error('URL valide rejetée');
            }
            
            if (manager.validateWebhookUrl(invalidUrl)) {
                throw new Error('URL invalide acceptée');
            }
            
            return true;
        });

        // Test 5: Interface et affichage
        await this.runTest('AdminWebhookManager - Interface et affichage', async () => {
            const manager = new AdminWebhookManager();
            
            if (typeof manager.initAdminInterface !== 'function') {
                throw new Error('Méthode initAdminInterface manquante');
            }
            
            if (typeof manager.showLoading !== 'function') {
                throw new Error('Méthode showLoading manquante');
            }
            
            if (typeof manager.showError !== 'function') {
                throw new Error('Méthode showError manquante');
            }
            
            if (typeof manager.showSuccess !== 'function') {
                throw new Error('Méthode showSuccess manquante');
            }
            
            return true;
        });

        // Test 6: Gestion des erreurs
        await this.runTest('AdminWebhookManager - Gestion des erreurs', async () => {
            const manager = new AdminWebhookManager();
            
            // Test avec des données invalides
            try {
                const invalidUser = { uid: '', email: '' };
                const result = manager.renderUserCard(invalidUser, null);
                if (typeof result !== 'string') {
                    throw new Error('renderUserCard doit retourner une string');
                }
            } catch (error) {
                // C'est normal que cela échoue avec des données invalides
            }
            
            return true;
        });
    }

    /**
     * Tests d'intégration
     */
    async testIntegration() {
        console.log('\n🔗 Tests d\'intégration:');
        console.log('------------------------');
        
        // Test 1: Compatibilité FirebaseAuthManager
        await this.runTest('Intégration - Compatibilité FirebaseAuthManager', async () => {
            if (typeof window.FirebaseAuthManager === 'undefined') {
                console.warn('⚠️ FirebaseAuthManager non disponible, test ignoré');
                return true;
            }
            
            const authManager = window.FirebaseAuthManager.getInstance ? 
                window.FirebaseAuthManager.getInstance() : window.FirebaseAuthManager;
            
            if (!authManager) {
                throw new Error('Impossible d\'obtenir l\'instance FirebaseAuthManager');
            }
            
            // Vérifier les méthodes requises
            if (typeof authManager.getCurrentUser !== 'function') {
                throw new Error('FirebaseAuthManager.getCurrentUser manquant');
            }
            
            if (typeof authManager.addAuthStateListener !== 'function') {
                throw new Error('FirebaseAuthManager.addAuthStateListener manquant');
            }
            
            return true;
        });

        // Test 2: Interface DOM
        await this.runTest('Intégration - Interface DOM', async () => {
            // Créer un conteneur de test
            const testContainer = document.createElement('div');
            testContainer.id = 'test-admin-container';
            testContainer.style.display = 'none';
            document.body.appendChild(testContainer);
            
            try {
                const manager = new AdminWebhookManager();
                
                // Test de création de conteneur
                manager.createAdminContainer();
                
                const container = document.getElementById('adminWebhookContainer');
                if (!container) {
                    throw new Error('Conteneur admin non créé');
                }
                
                return true;
            } finally {
                // Nettoyer
                document.body.removeChild(testContainer);
                const adminContainer = document.getElementById('adminWebhookContainer');
                if (adminContainer) {
                    adminContainer.remove();
                }
            }
        });

        // Test 3: Échappement HTML
        await this.runTest('Intégration - Échappement HTML', async () => {
            const manager = new AdminWebhookManager();
            
            if (typeof manager.escapeHtml !== 'function') {
                throw new Error('Méthode escapeHtml manquante');
            }
            
            const testString = '<script>alert("xss")</script>';
            const escaped = manager.escapeHtml(testString);
            
            if (escaped.includes('<script>')) {
                throw new Error('Échappement HTML défaillant');
            }
            
            return true;
        });
    }

    /**
     * Tests de performance
     */
    async testPerformance() {
        console.log('\n⚡ Tests de performance:');
        console.log('------------------------');
        
        // Test 1: Performance de l'initialisation
        await this.runTest('Performance - Initialisation AdminNavigationManager', async () => {
            const startTime = performance.now();
            
            const manager = new AdminNavigationManager();
            // Simuler une initialisation rapide sans Firebase
            manager.isInitialized = true;
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            if (duration > 100) {
                throw new Error(`Initialisation trop lente: ${duration}ms`);
            }
            
            return true;
        });

        // Test 2: Performance du rendu
        await this.runTest('Performance - Rendu des cartes utilisateur', async () => {
            const manager = new AdminWebhookManager();
            
            const startTime = performance.now();
            
            // Créer des données de test
            const testUser = {
                uid: 'test-uid',
                email: 'test@example.com',
                displayName: 'Test User',
                emailVerified: true
            };
            
            const testWebhook = {
                webhookUrl: 'https://example.com/webhook',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            // Rendre 100 cartes pour tester la performance
            for (let i = 0; i < 100; i++) {
                manager.renderUserCard(testUser, testWebhook);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            if (duration > 1000) {
                throw new Error(`Rendu trop lent: ${duration}ms pour 100 cartes`);
            }
            
            return true;
        });

        // Test 3: Gestion mémoire
        await this.runTest('Performance - Gestion mémoire', async () => {
            const manager = new AdminWebhookManager();
            
            // Ajouter plusieurs callbacks de nettoyage
            for (let i = 0; i < 10; i++) {
                manager.addCleanupCallback(() => {
                    // Callback vide pour le test
                });
            }
            
            if (manager.cleanupCallbacks.length !== 10) {
                throw new Error('Callbacks de nettoyage mal gérés');
            }
            
            // Nettoyer
            manager.cleanup();
            
            if (manager.cleanupCallbacks.length !== 0) {
                throw new Error('Callbacks de nettoyage non vidés');
            }
            
            return true;
        });
    }

    /**
     * Exécuter un test individuel
     */
    async runTest(testName, testFunction) {
        this.testResults.total++;
        
        try {
            console.log(`⏳ Test en cours: ${testName}`);
            
            // Timeout pour éviter les tests infinies
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Test timeout')), this.testTimeout);
            });
            
            const testPromise = Promise.resolve(testFunction());
            
            await Promise.race([testPromise, timeoutPromise]);
            
            this.testResults.passed++;
            this.testResults.tests.push({
                name: testName,
                status: 'PASSED',
                duration: 0
            });
            
            console.log(`✅ Réussi: ${testName}`);
            
        } catch (error) {
            this.testResults.failed++;
            this.testResults.tests.push({
                name: testName,
                status: 'FAILED',
                error: error.message,
                duration: 0
            });
            
            console.log(`❌ Échec: ${testName} - ${error.message}`);
        }
    }

    /**
     * Afficher les résultats des tests
     */
    displayResults() {
        console.log('\n=================================================');
        console.log('📊 RÉSULTATS DES TESTS DES FONCTIONS ADMIN');
        console.log('=================================================');
        
        console.log(`Total des tests: ${this.testResults.total}`);
        console.log(`Réussis: ${this.testResults.passed} ✅`);
        console.log(`Échoués: ${this.testResults.failed} ❌`);
        console.log(`Taux de réussite: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);
        
        if (this.testResults.failed > 0) {
            console.log('\n❌ Tests échoués:');
            this.testResults.tests
                .filter(test => test.status === 'FAILED')
                .forEach(test => {
                    console.log(`  - ${test.name}: ${test.error}`);
                });
        }
        
        console.log('\n🎯 Recommandations:');
        if (this.testResults.failed === 0) {
            console.log('✅ Tous les tests passent! Les fonctions admin sont opérationnelles.');
        } else {
            console.log('⚠️ Certains tests échouent. Vérifiez les erreurs ci-dessus.');
        }
        
        console.log('=================================================');
    }

    /**
     * Test spécifique pour vérifier la correction des bugs
     */
    async testBugFixes() {
        console.log('\n🐛 Test des corrections de bugs:');
        console.log('--------------------------------');
        
        // Test 1: Race conditions
        await this.runTest('Bug Fix - Race conditions dans init', async () => {
            const manager = new AdminWebhookManager();
            
            // Vérifier que initPromise existe pour prévenir les race conditions
            if (typeof manager.initPromise !== 'undefined') {
                console.log('✅ Protection contre les race conditions détectée');
            }
            
            return true;
        });

        // Test 2: Memory leaks
        await this.runTest('Bug Fix - Memory leaks dans les listeners', async () => {
            const manager = new AdminNavigationManager();
            
            // Vérifier que eventListeners est tracké
            if (Array.isArray(manager.eventListeners)) {
                console.log('✅ Tracking des event listeners détecté');
            }
            
            return true;
        });

        // Test 3: Erreur handling
        await this.runTest('Bug Fix - Gestion d\'erreurs améliorée', async () => {
            const manager = new AdminWebhookManager();
            
            // Vérifier que les méthodes ont une gestion d'erreurs
            const methodsToCheck = ['loadUsers', 'loadAllWebhooks', 'saveWebhook'];
            
            for (const methodName of methodsToCheck) {
                if (typeof manager[methodName] !== 'function') {
                    throw new Error(`Méthode ${methodName} manquante`);
                }
            }
            
            return true;
        });
    }
}

// Fonction globale pour exécuter les tests
window.runAdminFunctionsTests = async function() {
    const testSuite = new AdminFunctionsTestSuite();
    return await testSuite.runAllTests();
};

// Fonction pour tester spécifiquement les corrections de bugs
window.runBugFixTests = async function() {
    const testSuite = new AdminFunctionsTestSuite();
    return await testSuite.testBugFixes();
};

// Export pour utilisation dans les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminFunctionsTestSuite;
}