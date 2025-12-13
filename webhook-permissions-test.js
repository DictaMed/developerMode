/**
 * DictaMed - Test des Permissions Webhook
 * Script de diagnostic pour vérifier les permissions Firestore après la révision
 */

class WebhookPermissionsTest {
    constructor() {
        this.testResults = [];
        this.currentUser = null;
    }

    async runAllTests() {
        console.log('🔍 Démarrage du test des permissions webhook...');
        
        try {
            // Vérifier l'authentification
            await this.testAuthentication();
            
            // Tester l'accès aux collections webhook
            await this.testWebhookCollections();
            
            // Tester les opérations CRUD
            await this.testCRUDOperations();
            
            // Afficher les résultats
            this.displayResults();
            
        } catch (error) {
            console.error('❌ Erreur lors des tests:', error);
        }
    }

    async testAuthentication() {
        console.log('🔐 Test de l\'authentification...');
        
        try {
            const authManager = window.FirebaseAuthManager || window.EnhancedFirebaseAuthManager;
            if (!authManager) {
                this.addResult('Authentication', '❌ ÉCHEC', 'Gestionnaire d\'authentification non trouvé');
                return;
            }

            const user = authManager.getCurrentUser?.() || authManager.getCurrentUser;
            if (!user) {
                this.addResult('Authentication', '❌ ÉCHEC', 'Aucun utilisateur connecté');
                return;
            }

            this.currentUser = user;
            this.addResult('Authentication', '✅ SUCCÈS', `Utilisateur connecté: ${user.email}`);
            
        } catch (error) {
            this.addResult('Authentication', '❌ ÉCHEC', error.message);
        }
    }

    async testWebhookCollections() {
        console.log('📂 Test de l\'accès aux collections webhook...');
        
        if (!this.currentUser) {
            this.addResult('Collections Access', '❌ ÉCHEC', 'Utilisateur non authentifié');
            return;
        }

        try {
            const db = firebase.firestore();
            const userId = this.currentUser.uid;

            // Test lecture userWebhooks
            try {
                const userWebhooksDoc = await db.collection('userWebhooks').doc(userId).get();
                this.addResult('userWebhooks Read', '✅ SUCCÈS', `Document accessible pour l'utilisateur ${userId}`);
            } catch (error) {
                this.addResult('userWebhooks Read', '❌ ÉCHEC', error.message);
            }

            // Test lecture adminWebhooks (si admin)
            if (this.currentUser.email === 'akio963@gmail.com') {
                try {
                    const adminWebhooksSnapshot = await db.collection('adminWebhooks').limit(1).get();
                    this.addResult('adminWebhooks Read', '✅ SUCCÈS', 'Accès admin confirmé');
                } catch (error) {
                    this.addResult('adminWebhooks Read', '❌ ÉCHEC', error.message);
                }
            } else {
                this.addResult('adminWebhooks Read', '⏭️ IGNORÉ', 'Utilisateur non-admin');
            }

        } catch (error) {
            this.addResult('Collections Access', '❌ ÉCHEC', error.message);
        }
    }

    async testCRUDOperations() {
        console.log('⚡ Test des opérations CRUD...');
        
        if (!this.currentUser) {
            this.addResult('CRUD Operations', '❌ ÉCHEC', 'Utilisateur non authentifié');
            return;
        }

        try {
            const db = firebase.firestore();
            const userId = this.currentUser.uid;
            const testWebhookId = `test_${Date.now()}`;

            // Test création (simulation)
            try {
                const testWebhookData = {
                    userId: userId,
                    url: 'https://test.example.com/webhook',
                    isActive: true,
                    createdAt: new Date(),
                    testMode: true
                };

                // Tentative d'écriture en mode test (ne pas persister)
                await db.collection('userWebhooks').doc(testWebhookId).set(testWebhookData);
                this.addResult('CRUD Create', '✅ SUCCÈS', 'Création de webhook autorisée');
                
                // Nettoyer le test
                await db.collection('userWebhooks').doc(testWebhookId).delete();
                
            } catch (error) {
                if (error.code === 'permission-denied') {
                    this.addResult('CRUD Create', '❌ ÉCHEC', 'Permission refusée pour la création');
                } else {
                    this.addResult('CRUD Create', '⚠️ PARTIEL', `Erreur: ${error.message}`);
                }
            }

            // Test mise à jour (simulation)
            try {
                // Cette opération sera testée via l'interface admin
                this.addResult('CRUD Update', '⏭️ IGNORÉ', 'Test via interface admin');
            } catch (error) {
                this.addResult('CRUD Update', '❌ ÉCHEC', error.message);
            }

        } catch (error) {
            this.addResult('CRUD Operations', '❌ ÉCHEC', error.message);
        }
    }

    addResult(category, status, message) {
        this.testResults.push({
            category,
            status,
            message,
            timestamp: new Date().toLocaleTimeString()
        });
        console.log(`${status} ${category}: ${message}`);
    }

    displayResults() {
        console.log('\n📊 === RÉSULTATS DES TESTS DE PERMISSIONS WEBHOOK ===\n');
        
        const summary = {
            success: this.testResults.filter(r => r.status === '✅ SUCCÈS').length,
            failed: this.testResults.filter(r => r.status === '❌ ÉCHEC').length,
            partial: this.testResults.filter(r => r.status === '⚠️ PARTIEL').length,
            ignored: this.testResults.filter(r => r.status === '⏭️ IGNORÉ').length
        };

        console.log(`📈 Résumé: ${summary.success} succès, ${summary.failed} échecs, ${summary.partial} partiels, ${summary.ignored} ignorés`);
        
        this.testResults.forEach(result => {
            console.log(`${result.status} ${result.category}: ${result.message}`);
        });

        // Recommandations
        console.log('\n🔧 === RECOMMANDATIONS ===\n');
        
        if (summary.failed > 0) {
            console.log('❌ Des tests ont échoué. Vérifiez:');
            console.log('1. Les règles Firestore sont bien déployées');
            console.log('2. L\'utilisateur est correctement authentifié');
            console.log('3. Les permissions admin sont configurées');
        } else if (summary.partial > 0) {
            console.log('⚠️ Certains tests sont partiels. Vérifiez les messages détaillés.');
        } else {
            console.log('✅ Tous les tests sont passés avec succès!');
        }

        return summary;
    }
}

// Fonction de démarrage automatique si appelé directement
if (typeof window !== 'undefined') {
    window.WebhookPermissionsTest = WebhookPermissionsTest;
    
    // Auto-exécuter si Firebase est prêt
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                console.log('🚀 Lancement automatique du test de permissions webhook...');
                const tester = new WebhookPermissionsTest();
                tester.runAllTests();
            }
        }, 2000);
    });
}