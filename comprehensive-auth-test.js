/**
 * DictaMed - Test Complet d'Authentification et Permissions Firestore
 * Version: 1.0.0 - Test exhaustif de tous les aspects d'authentification
 */

class ComprehensiveAuthTester {
    constructor() {
        this.adminEmail = 'akio963@gmail.com';
        this.testResults = {
            timestamp: new Date().toISOString(),
            firebaseConfig: false,
            authMethods: {},
            firestoreAccess: {},
            permissionTests: {},
            errors: [],
            warnings: [],
            recommendations: []
        };
    }

    /**
     * Lance tous les tests
     */
    async runAllTests() {
        console.log('🧪 Début des tests complets d\'authentification et permissions...');
        console.log('=' .repeat(70));

        try {
            // Tests de base
            await this.testFirebaseConfiguration();
            await this.testAllAuthenticationMethods();
            await this.testFirestoreAccess();
            await this.testPermissionScenarios();
            await this.generateReport();
            
        } catch (error) {
            console.error('❌ Erreur lors des tests:', error);
            this.testResults.errors.push(`Erreur générale: ${error.message}`);
        }

        return this.testResults;
    }

    /**
     * Test de la configuration Firebase
     */
    async testFirebaseConfiguration() {
        console.log('\n🔥 Test de la configuration Firebase...');
        
        try {
            // Vérification Firebase SDK
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK non chargé');
            }
            
            if (!firebase.apps || firebase.apps.length === 0) {
                throw new Error('Firebase non initialisé');
            }
            
            const config = firebase.apps[0].options;
            const requiredFields = ['apiKey', 'authDomain', 'projectId'];
            
            for (const field of requiredFields) {
                if (!config[field]) {
                    throw new Error(`Champ Firebase manquant: ${field}`);
                }
            }
            
            this.testResults.firebaseConfig = true;
            console.log('✅ Configuration Firebase: OK');
            console.log(`   Project: ${config.projectId}`);
            console.log(`   Auth Domain: ${config.authDomain}`);
            
        } catch (error) {
            console.error('❌ Configuration Firebase:', error.message);
            this.testResults.errors.push(`Configuration: ${error.message}`);
        }
    }

    /**
     * Test de toutes les méthodes d'authentification
     */
    async testAllAuthenticationMethods() {
        console.log('\n🔐 Test des méthodes d\'authentification...');
        
        const auth = firebase.auth();
        
        // Test 1: État d'authentification actuel
        try {
            const currentUser = auth.currentUser;
            if (currentUser) {
                console.log('✅ Utilisateur actuellement connecté:', currentUser.email);
                this.testResults.authMethods.currentUser = {
                    email: currentUser.email,
                    uid: currentUser.uid,
                    emailVerified: currentUser.emailVerified,
                    providerId: currentUser.providerId
                };
            } else {
                console.log('ℹ️ Aucun utilisateur connecté');
                this.testResults.authMethods.currentUser = null;
            }
        } catch (error) {
            console.warn('⚠️ Erreur vérification utilisateur actuel:', error.message);
        }
        
        // Test 2: Providers disponibles
        try {
            const providers = [
                { name: 'Email/Password', provider: firebase.auth.EmailAuthProvider },
                { name: 'Google', provider: firebase.auth.GoogleAuthProvider },
                { name: 'Anonymous', provider: firebase.auth.AnonymousAuthProvider }
            ];
            
            const availableProviders = [];
            for (const p of providers) {
                try {
                    if (p.provider) {
                        availableProviders.push(p.name);
                        console.log(`✅ Provider disponible: ${p.name}`);
                    }
                } catch (e) {
                    console.warn(`⚠️ Provider non disponible: ${p.name}`);
                }
            }
            
            this.testResults.authMethods.availableProviders = availableProviders;
            
        } catch (error) {
            console.warn('⚠️ Erreur vérification providers:', error.message);
        }
        
        // Test 3: Test de token d'authentification
        try {
            const user = auth.currentUser;
            if (user) {
                const token = await user.getIdTokenResult();
                console.log('✅ Token d\'authentification valide');
                this.testResults.authMethods.tokenInfo = {
                    email: token.claims.email,
                    emailVerified: token.claims.email_verified,
                    authTime: token.claims.auth_time,
                    issuedAt: token.issued_at_time
                };
            }
        } catch (error) {
            console.warn('⚠️ Erreur token d\'authentification:', error.message);
        }
    }

    /**
     * Test d'accès aux collections Firestore
     */
    async testFirestoreAccess() {
        console.log('\n📊 Test d\'accès aux collections Firestore...');
        
        const db = firebase.firestore();
        const collections = [
            { name: 'userProfiles', adminOnly: false },
            { name: 'userWebhooks', adminOnly: false },
            { name: 'adminWebhooks', adminOnly: true },
            { name: 'system', adminOnly: true },
            { name: 'webhookLogs', adminOnly: true },
            { name: '_diagnostic', adminOnly: false },
            { name: '_permission_test', adminOnly: false }
        ];
        
        const currentUser = firebase.auth().currentUser;
        const isAdmin = currentUser && currentUser.email === this.adminEmail;
        
        for (const collection of collections) {
            try {
                const testQuery = db.collection(collection.name).limit(1);
                const snapshot = await testQuery.get();
                
                this.testResults.firestoreAccess[collection.name] = {
                    accessible: true,
                    documentCount: snapshot.size,
                    expectedAdminOnly: collection.adminOnly,
                    userIsAdmin: isAdmin,
                    permissionOk: !collection.adminOnly || isAdmin
                };
                
                console.log(`✅ Accès ${collection.name}: ${snapshot.size} documents`);
                
            } catch (error) {
                this.testResults.firestoreAccess[collection.name] = {
                    accessible: false,
                    error: error.message,
                    expectedAdminOnly: collection.adminOnly,
                    userIsAdmin: isAdmin
                };
                
                console.error(`❌ Accès ${collection.name}:`, error.message);
                
                // Ajouter une recommandation si c'est un problème de permissions
                if (error.message.includes('permission') || error.message.includes('Permission denied')) {
                    this.testResults.recommendations.push(
                        `Problème de permissions pour ${collection.name} - Vérifiez les règles Firestore`
                    );
                }
            }
        }
    }

    /**
     * Test de scénarios de permissions
     */
    async testPermissionScenarios() {
        console.log('\n🧪 Test de scénarios de permissions...');
        
        const db = firebase.firestore();
        const currentUser = firebase.auth().currentUser;
        
        // Scénario 1: Test lecture avec utilisateur connecté
        if (currentUser) {
            await this.testReadOperation(db, currentUser.uid);
            await this.testWriteOperation(db, currentUser.uid);
        } else {
            console.log('ℹ️ Aucun utilisateur connecté - tests d\'écriture ignorés');
            this.testResults.permissionTests.userNotAuthenticated = true;
        }
        
        // Scénario 2: Test des opérations admin
        const isAdmin = currentUser && currentUser.email === this.adminEmail;
        if (isAdmin) {
            await this.testAdminOperations(db);
        } else {
            console.log('ℹ️ Utilisateur non admin - tests admin ignorés');
            this.testResults.permissionTests.userNotAdmin = true;
        }
    }

    /**
     * Test d'opération de lecture
     */
    async testReadOperation(db, userId) {
        try {
            console.log('📖 Test opération de lecture...');
            
            // Test lecture profil utilisateur
            const profileDoc = await db.collection('userProfiles').doc(userId).get();
            console.log(`   ✅ Lecture profil utilisateur: ${profileDoc.exists ? 'Document trouvé' : 'Document inexistant'}`);
            
            // Test lecture webhooks utilisateur
            const webhooksSnapshot = await db.collection('userWebhooks').doc(userId).get();
            console.log(`   ✅ Lecture webhook utilisateur: ${webhooksSnapshot.exists ? 'Document trouvé' : 'Document inexistant'}`);
            
            this.testResults.permissionTests.readOperation = {
                success: true,
                userProfileExists: profileDoc.exists,
                userWebhookExists: webhooksSnapshot.exists
            };
            
        } catch (error) {
            console.error('   ❌ Erreur opération de lecture:', error.message);
            this.testResults.permissionTests.readOperation = {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Test d'opération d'écriture
     */
    async testWriteOperation(db, userId) {
        try {
            console.log('✏️ Test opération d\'écriture...');
            
            const testDoc = db.collection('_permission_test').doc(`test_${userId}_${Date.now()}`);
            
            const testData = {
                userId: userId,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                testType: 'permission_test',
                email: firebase.auth().currentUser.email
            };
            
            await testDoc.set(testData);
            console.log('   ✅ Écriture test: Réussie');
            
            // Nettoyer le document test
            setTimeout(async () => {
                try {
                    await testDoc.delete();
                } catch (e) {
                    console.warn('   ⚠️ Erreur nettoyage document test:', e.message);
                }
            }, 2000);
            
            this.testResults.permissionTests.writeOperation = {
                success: true,
                testDocumentCreated: true
            };
            
        } catch (error) {
            console.error('   ❌ Erreur opération d\'écriture:', error.message);
            this.testResults.permissionTests.writeOperation = {
                success: false,
                error: error.message
            };
            
            this.testResults.recommendations.push(
                `Erreur d'écriture pour utilisateur ${userId}: ${error.message}`
            );
        }
    }

    /**
     * Test des opérations admin
     */
    async testAdminOperations(db) {
        try {
            console.log('🎛️ Test opérations admin...');
            
            // Test lecture adminWebhooks
            const adminSnapshot = await db.collection('adminWebhooks').limit(1).get();
            console.log(`   ✅ Lecture adminWebhooks: ${adminSnapshot.size} documents`);
            
            // Test lecture system
            const systemDoc = await db.collection('system').doc('adminUsers').get();
            console.log(`   ✅ Lecture system/adminUsers: ${systemDoc.exists ? 'Document trouvé' : 'Document inexistant'}`);
            
            this.testResults.permissionTests.adminOperations = {
                success: true,
                adminWebhooksCount: adminSnapshot.size,
                adminUsersDocExists: systemDoc.exists
            };
            
        } catch (error) {
            console.error('   ❌ Erreur opérations admin:', error.message);
            this.testResults.permissionTests.adminOperations = {
                success: false,
                error: error.message
            };
            
            this.testResults.recommendations.push(
                `Erreur opérations admin: ${error.message} - Vérifiez les permissions admin`
            );
        }
    }

    /**
     * Génération du rapport final
     */
    async generateReport() {
        console.log('\n' + '=' .repeat(70));
        console.log('📊 RAPPORT COMPLET DES TESTS');
        console.log('=' .repeat(70));
        
        console.log(`⏰ Timestamp: ${this.testResults.timestamp}`);
        console.log(`🔥 Firebase Config: ${this.testResults.firebaseConfig ? '✅ OK' : '❌ ERREUR'}`);
        
        // Résumé des méthodes d'authentification
        console.log('\n🔐 MÉTHODES D\'AUTHENTIFICATION:');
        if (this.testResults.authMethods.currentUser) {
            const user = this.testResults.authMethods.currentUser;
            console.log(`   👤 Connecté: ${user.email} (${user.uid})`);
            console.log(`   📧 Email vérifié: ${user.emailVerified ? 'Oui' : 'Non'}`);
        } else {
            console.log('   👤 Aucun utilisateur connecté');
        }
        
        if (this.testResults.authMethods.availableProviders) {
            console.log(`   🔧 Providers: ${this.testResults.authMethods.availableProviders.join(', ')}`);
        }
        
        // Résumé de l'accès Firestore
        console.log('\n📊 ACCÈS FIRESTORE:');
        Object.entries(this.testResults.firestoreAccess).forEach(([collection, info]) => {
            const status = info.accessible ? '✅' : '❌';
            const adminOnly = info.expectedAdminOnly ? ' (Admin)' : '';
            console.log(`   ${status} ${collection}${adminOnly}: ${info.accessible ? 'Accessible' : 'Erreur: ' + info.error}`);
        });
        
        // Résumé des tests de permissions
        console.log('\n🧪 TESTS DE PERMISSIONS:');
        Object.entries(this.testResults.permissionTests).forEach(([test, result]) => {
            const status = result.success ? '✅' : '❌';
            console.log(`   ${status} ${test}: ${result.success ? 'Réussi' : 'Échec: ' + result.error}`);
        });
        
        // Erreurs et avertissements
        if (this.testResults.errors.length > 0) {
            console.log('\n❌ ERREURS:');
            this.testResults.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }
        
        if (this.testResults.warnings.length > 0) {
            console.log('\n⚠️ AVERTISSEMENTS:');
            this.testResults.warnings.forEach((warning, index) => {
                console.log(`   ${index + 1}. ${warning}`);
            });
        }
        
        // Recommandations
        if (this.testResults.recommendations.length > 0) {
            console.log('\n💡 RECOMMANDATIONS:');
            this.testResults.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }
        
        // Actions recommandées
        console.log('\n🎯 ACTIONS RECOMMANDÉES:');
        if (this.testResults.errors.length === 0 && this.testResults.permissionTests.adminOperations?.success) {
            console.log('   ✅ Tous les tests passent! Le système fonctionne correctement.');
        } else {
            console.log('   1. Vérifiez que firestore.rules a été déployé');
            console.log('   2. Assurez-vous d\'être connecté avec akio963@gmail.com');
            console.log('   3. Consultez firestore-permissions-fix-guide.md pour les instructions détaillées');
        }
        
        console.log('\n📋 INFORMATIONS UTILES:');
        console.log(`   📧 Email admin: ${this.adminEmail}`);
        console.log(`   🔗 Console Firebase: https://console.firebase.google.com/project/dictamed2025`);
        console.log(`   📖 Guide de correction: firestore-permissions-fix-guide.md`);
        
        console.log('\n' + '=' .repeat(70));
    }
}

// Fonction globale pour exécuter les tests
window.runComprehensiveAuthTest = async function() {
    const tester = new ComprehensiveAuthTester();
    return await tester.runAllTests();
};

// Auto-exécution si appelé depuis la console
if (typeof window !== 'undefined') {
    console.log('🧪 DictaMed Comprehensive Auth Tester chargé.');
    console.log('💡 Tapez runComprehensiveAuthTest() pour lancer tous les tests.');
}

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComprehensiveAuthTester;
}