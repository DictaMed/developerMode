/**
 * DictaMed - Test d'Intégration Admin Webhook System V2
 * Script de test pour vérifier que le système fonctionne correctement
 */

class AdminWebhookIntegrationTest {
    constructor() {
        this.testResults = [];
        this.passedTests = 0;
        this.failedTests = 0;
    }

    /**
     * Lancer tous les tests
     */
    async runAllTests() {
        console.log('🧪 Démarrage des tests d\'intégration Admin Webhook System V2\n');

        try {
            await this.testFirebaseInitialization();
            await this.testFirestoreAccess();
            await this.testAdminAuthentication();
            await this.testUserProfilesCollection();
            await this.testUserWebhooksCollection();
            await this.testAdminWebhookManager();
            await this.testRealtimeListeners();
            await this.testWebhookValidation();
        } catch (error) {
            console.error('❌ Erreur critique lors des tests:', error);
        }

        this.printTestSummary();
        return this.getTestReport();
    }

    /**
     * Test 1: Initialisation Firebase
     */
    async testFirebaseInitialization() {
        console.log('📍 Test 1: Initialisation Firebase...');

        try {
            // Vérifier que Firebase est disponible
            if (typeof firebase === 'undefined') {
                this.addTestResult('Firebase SDK', false, 'Firebase non disponible');
                return;
            }

            // Vérifier que l'app est initialisée
            if (!firebase.apps || firebase.apps.length === 0) {
                this.addTestResult('Firebase App', false, 'Aucune app initialisée');
                return;
            }

            this.addTestResult('Firebase SDK', true);
            this.addTestResult('Firebase App', true, `${firebase.apps.length} app(s) initialisée(s)`);

            // Vérifier Auth
            if (typeof firebase.auth === 'function') {
                this.addTestResult('Firebase Auth', true);
            } else {
                this.addTestResult('Firebase Auth', false);
            }

            // Vérifier Firestore
            if (typeof firebase.firestore === 'function') {
                this.addTestResult('Firebase Firestore', true);
            } else {
                this.addTestResult('Firebase Firestore', false);
            }

        } catch (error) {
            this.addTestResult('Firebase Init', false, error.message);
        }
    }

    /**
     * Test 2: Accès Firestore
     */
    async testFirestoreAccess() {
        console.log('\n📍 Test 2: Accès Firestore...');

        try {
            const db = firebase.firestore();

            // Test de lecture des userProfiles
            const profilesSnapshot = await db.collection('userProfiles').limit(1).get();
            this.addTestResult(
                'Accès userProfiles',
                true,
                `${profilesSnapshot.size} document(s)`
            );

            // Test de lecture des userWebhooks
            const webhooksSnapshot = await db.collection('userWebhooks').limit(1).get();
            this.addTestResult(
                'Accès userWebhooks',
                true,
                `${webhooksSnapshot.size} document(s)`
            );

            // Compter total utilisateurs
            const allProfiles = await db.collection('userProfiles').get();
            const allWebhooks = await db.collection('userWebhooks').get();

            this.addTestResult(
                'Décompte utilisateurs',
                true,
                `${allProfiles.size} utilisateurs, ${allWebhooks.size} webhooks`
            );

        } catch (error) {
            this.addTestResult('Accès Firestore', false, error.message);
        }
    }

    /**
     * Test 3: Authentification Admin
     */
    async testAdminAuthentication() {
        console.log('\n📍 Test 3: Authentification Admin...');

        try {
            const auth = firebase.auth();
            const user = auth.currentUser;

            if (!user) {
                this.addTestResult('Utilisateur connecté', false, 'Aucun utilisateur connecté');
                return;
            }

            this.addTestResult('Utilisateur connecté', true, user.email);

            // Vérifier si c'est l'admin
            const isAdmin = user.email === 'akio963@gmail.com';
            this.addTestResult(
                'Authentification Admin',
                isAdmin,
                isAdmin ? 'Accès admin confirmé' : `Pas d'accès admin (${user.email})`
            );

            // Vérifier la vérification email
            this.addTestResult(
                'Email vérifié',
                user.emailVerified,
                user.emailVerified ? 'Oui' : 'Non'
            );

        } catch (error) {
            this.addTestResult('Auth Test', false, error.message);
        }
    }

    /**
     * Test 4: Collection userProfiles
     */
    async testUserProfilesCollection() {
        console.log('\n📍 Test 4: Collection userProfiles...');

        try {
            const db = firebase.firestore();
            const snapshot = await db.collection('userProfiles').get();

            if (snapshot.empty) {
                this.addTestResult('userProfiles documents', false, 'Collection vide');
                return;
            }

            let validCount = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                if (this.validateUserProfile(data)) {
                    validCount++;
                }
            });

            this.addTestResult(
                'userProfiles documents',
                validCount > 0,
                `${snapshot.size} total, ${validCount} valides`
            );

            // Vérifier un exemple
            const firstDoc = snapshot.docs[0];
            const userData = firstDoc.data();

            this.addTestResult(
                'Structure userProfile',
                this.hasRequiredFields(userData, ['uid', 'email', 'createdAt']),
                `Email: ${userData.email}`
            );

        } catch (error) {
            this.addTestResult('userProfiles Test', false, error.message);
        }
    }

    /**
     * Test 5: Collection userWebhooks
     */
    async testUserWebhooksCollection() {
        console.log('\n📍 Test 5: Collection userWebhooks...');

        try {
            const db = firebase.firestore();
            const snapshot = await db.collection('userWebhooks').get();

            this.addTestResult(
                'userWebhooks accessible',
                true,
                `${snapshot.size} webhook(s) trouvé(s)`
            );

            if (snapshot.empty) {
                console.log('   ℹ️ Aucun webhook trouvé (normal si pas encore assignés)');
                return;
            }

            let validCount = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                if (this.validateWebhook(data)) {
                    validCount++;
                }
            });

            this.addTestResult(
                'Webhooks valides',
                validCount > 0,
                `${validCount}/${snapshot.size} valides`
            );

            // Vérifier un exemple
            const firstDoc = snapshot.docs[0];
            const webhookData = firstDoc.data();

            this.addTestResult(
                'Structure webhook',
                this.validateWebhook(webhookData),
                `URL: ${webhookData.webhookUrl.substring(0, 40)}...`
            );

        } catch (error) {
            this.addTestResult('userWebhooks Test', false, error.message);
        }
    }

    /**
     * Test 6: AdminWebhookManagerEnhancedV2
     */
    async testAdminWebhookManager() {
        console.log('\n📍 Test 6: AdminWebhookManagerEnhancedV2...');

        try {
            if (typeof window.AdminWebhookManagerEnhancedV2 === 'undefined') {
                this.addTestResult('Classe disponible', false, 'AdminWebhookManagerEnhancedV2 non trouvée');
                return;
            }

            this.addTestResult('Classe disponible', true);

            // Vérifier les méthodes principales
            const manager = new AdminWebhookManagerEnhancedV2();

            const methods = [
                'init',
                'assignWebhook',
                'removeWebhook',
                'testWebhook',
                'loadUserProfiles',
                'loadWebhooks',
                'setupRealtimeListeners'
            ];

            let methodsOk = 0;
            methods.forEach(method => {
                if (typeof manager[method] === 'function') {
                    methodsOk++;
                }
            });

            this.addTestResult(
                'Méthodes principales',
                methodsOk === methods.length,
                `${methodsOk}/${methods.length} méthodes trouvées`
            );

            // Vérifier les propriétés
            const properties = ['currentAdminUser', 'users', 'webhooks', 'stats'];
            let propsOk = 0;
            properties.forEach(prop => {
                if (manager.hasOwnProperty(prop)) {
                    propsOk++;
                }
            });

            this.addTestResult(
                'Propriétés principales',
                propsOk === properties.length,
                `${propsOk}/${properties.length} propriétés trouvées`
            );

        } catch (error) {
            this.addTestResult('AdminManager Test', false, error.message);
        }
    }

    /**
     * Test 7: Écouteurs Firestore
     */
    async testRealtimeListeners() {
        console.log('\n📍 Test 7: Écouteurs Firestore temps réel...');

        try {
            const db = firebase.firestore();

            // Tester l'écouteur userProfiles
            let profilesListenerWorks = false;
            const profilesUnsubscribe = db.collection('userProfiles')
                .limit(1)
                .onSnapshot(snapshot => {
                    profilesListenerWorks = true;
                });

            // Attendre un peu
            await new Promise(resolve => setTimeout(resolve, 1000));
            profilesUnsubscribe();

            this.addTestResult(
                'Écouteur userProfiles',
                profilesListenerWorks,
                'Temps réel fonctionnel'
            );

            // Tester l'écouteur userWebhooks
            let webhooksListenerWorks = false;
            const webhooksUnsubscribe = db.collection('userWebhooks')
                .limit(1)
                .onSnapshot(snapshot => {
                    webhooksListenerWorks = true;
                });

            // Attendre un peu
            await new Promise(resolve => setTimeout(resolve, 1000));
            webhooksUnsubscribe();

            this.addTestResult(
                'Écouteur userWebhooks',
                webhooksListenerWorks,
                'Temps réel fonctionnel'
            );

        } catch (error) {
            this.addTestResult('Listeners Test', false, error.message);
        }
    }

    /**
     * Test 8: Validation des URLs webhook
     */
    async testWebhookValidation() {
        console.log('\n📍 Test 8: Validation des URLs webhook...');

        const manager = new AdminWebhookManagerEnhancedV2();

        const testUrls = [
            { url: 'https://n8n.example.com/webhook/test', valid: true },
            { url: 'http://example.com/webhook', valid: true },
            { url: 'https://example.com', valid: true },
            { url: 'ftp://example.com', valid: false },
            { url: 'not-a-url', valid: false },
            { url: 'example.com/webhook', valid: false }
        ];

        let validCount = 0;
        testUrls.forEach(test => {
            const result = manager.validateWebhookUrl(test.url);
            if (result === test.valid) {
                validCount++;
            }
        });

        this.addTestResult(
            'Validation URLs',
            validCount === testUrls.length,
            `${validCount}/${testUrls.length} validations correctes`
        );
    }

    /**
     * Helpers
     */

    validateUserProfile(data) {
        return data &&
            typeof data.email === 'string' &&
            typeof data.uid === 'string' &&
            (data.createdAt || true);
    }

    validateWebhook(data) {
        return data &&
            typeof data.webhookUrl === 'string' &&
            data.webhookUrl.match(/^https?:\/\//) &&
            typeof data.isActive === 'boolean';
    }

    hasRequiredFields(obj, fields) {
        return fields.every(field => obj.hasOwnProperty(field));
    }

    addTestResult(testName, passed, details = '') {
        const result = {
            name: testName,
            passed: passed,
            details: details,
            timestamp: new Date()
        };

        this.testResults.push(result);

        if (passed) {
            this.passedTests++;
            console.log(`   ✅ ${testName}${details ? ': ' + details : ''}`);
        } else {
            this.failedTests++;
            console.log(`   ❌ ${testName}${details ? ': ' + details : ''}`);
        }
    }

    printTestSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 RÉSUMÉ DES TESTS');
        console.log('='.repeat(60));
        console.log(`✅ Réussis: ${this.passedTests}`);
        console.log(`❌ Échoués: ${this.failedTests}`);
        console.log(`📈 Total: ${this.testResults.length}`);
        console.log(`📊 Taux de réussite: ${((this.passedTests / this.testResults.length) * 100).toFixed(2)}%`);
        console.log('='.repeat(60));
    }

    getTestReport() {
        return {
            passed: this.passedTests,
            failed: this.failedTests,
            total: this.testResults.length,
            successRate: (this.passedTests / this.testResults.length) * 100,
            details: this.testResults,
            timestamp: new Date().toISOString()
        };
    }
}

// Export
if (typeof window !== 'undefined') {
    window.AdminWebhookIntegrationTest = AdminWebhookIntegrationTest;

    // Fonction globale pour lancer les tests
    window.runAdminWebhookTests = async function() {
        const tester = new AdminWebhookIntegrationTest();
        return await tester.runAllTests();
    };

    console.log('💡 Pour lancer les tests, appelez: window.runAdminWebhookTests()');
}
