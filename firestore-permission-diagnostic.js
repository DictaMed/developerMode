/**
 * Script de diagnostic des permissions Firestore pour DictaMed
 * Ce script vérifie l'état des règles de sécurité et des permissions admin
 */

class FirestorePermissionDiagnostic {
    constructor() {
        this.adminEmail = 'akio963@gmail.com';
        this.diagnosticResults = {
            timestamp: new Date().toISOString(),
            firebase: false,
            auth: false,
            firestore: false,
            adminUser: null,
            adminAccess: false,
            errors: [],
            recommendations: []
        };
    }

    /**
     * Lance le diagnostic complet
     */
    async runDiagnostic() {
        console.log('🔍 Début du diagnostic Firestore Permission...');
        console.log('=' .repeat(50));
        
        try {
            // 1. Vérifier Firebase
            await this.checkFirebase();
            
            // 2. Vérifier l'authentification
            await this.checkAuthentication();
            
            // 3. Vérifier Firestore
            await this.checkFirestore();
            
            // 4. Vérifier l'accès admin
            await this.checkAdminAccess();
            
            // 5. Tester les opérations Firestore
            await this.testFirestoreOperations();
            
            // 6. Afficher le rapport final
            this.displayReport();
            
        } catch (error) {
            console.error('❌ Erreur lors du diagnostic:', error);
            this.diagnosticResults.errors.push(`Diagnostic général: ${error.message}`);
        }
    }

    /**
     * Vérifier l'initialisation Firebase
     */
    async checkFirebase() {
        try {
            console.log('\n🔥 Vérification Firebase...');
            
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK non chargé');
            }
            
            if (!firebase.apps || firebase.apps.length === 0) {
                throw new Error('Aucune application Firebase initialisée');
            }
            
            const config = firebase.apps[0].options;
            const requiredProps = ['apiKey', 'authDomain', 'projectId'];
            
            for (const prop of requiredProps) {
                if (!config[prop]) {
                    throw new Error(`Propriété Firebase manquante: ${prop}`);
                }
            }
            
            this.diagnosticResults.firebase = true;
            console.log('✅ Firebase: OK');
            console.log(`   Project: ${config.projectId}`);
            console.log(`   Auth Domain: ${config.authDomain}`);
            
        } catch (error) {
            console.error('❌ Firebase:', error.message);
            this.diagnosticResults.errors.push(`Firebase: ${error.message}`);
        }
    }

    /**
     * Vérifier l'authentification
     */
    async checkAuthentication() {
        try {
            console.log('\n🔐 Vérification Authentification...');
            
            if (!firebase.auth) {
                throw new Error('Firebase Auth non disponible');
            }
            
            const auth = firebase.auth();
            const currentUser = auth.currentUser;
            
            if (currentUser) {
                this.diagnosticResults.adminUser = {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    emailVerified: currentUser.emailVerified,
                    providerId: currentUser.providerId
                };
                
                console.log('✅ Utilisateur connecté:', currentUser.email);
                console.log(`   UID: ${currentUser.uid}`);
                console.log(`   Email vérifié: ${currentUser.emailVerified ? 'Oui' : 'Non'}`);
                
            } else {
                console.log('ℹ️ Aucun utilisateur connecté');
                this.diagnosticResults.recommendations.push('Connectez-vous avec akio963@gmail.com pour tester les permissions admin');
            }
            
            this.diagnosticResults.auth = true;
            
        } catch (error) {
            console.error('❌ Authentification:', error.message);
            this.diagnosticResults.errors.push(`Auth: ${error.message}`);
        }
    }

    /**
     * Vérifier Firestore
     */
    async checkFirestore() {
        try {
            console.log('\n📊 Vérification Firestore...');
            
            if (!firebase.firestore) {
                throw new Error('Firebase Firestore non disponible');
            }
            
            const db = firebase.firestore();
            
            // Test de connexion basique
            const testDoc = db.collection('_diagnostic').doc('test');
            await testDoc.set({
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                message: 'Test de connexion Firestore'
            });
            
            // Nettoyer le document de test
            await testDoc.delete();
            
            this.diagnosticResults.firestore = true;
            console.log('✅ Firestore: OK');
            console.log('   Connexion testée avec succès');
            
        } catch (error) {
            console.error('❌ Firestore:', error.message);
            this.diagnosticResults.errors.push(`Firestore: ${error.message}`);
        }
    }

    /**
     * Vérifier l'accès admin
     */
    async checkAdminAccess() {
        try {
            console.log('\n🎛️ Vérification Accès Admin...');
            
            const currentUser = firebase.auth().currentUser;
            
            if (!currentUser) {
                console.log('ℹ️ Aucun utilisateur connecté - test des règles de sécurité');
                this.diagnosticResults.adminAccess = false;
                return;
            }
            
            if (currentUser.email !== this.adminEmail) {
                console.log(`ℹ️ Utilisateur connecté mais non admin: ${currentUser.email}`);
                console.log(`   Admin requis: ${this.adminEmail}`);
                this.diagnosticResults.adminAccess = false;
                return;
            }
            
            // Test d'accès aux collections admin
            await this.testAdminCollections();
            
            this.diagnosticResults.adminAccess = true;
            console.log('✅ Accès Admin: Autorisé');
            
        } catch (error) {
            console.error('❌ Accès Admin:', error.message);
            this.diagnosticResults.errors.push(`Admin Access: ${error.message}`);
            this.diagnosticResults.adminAccess = false;
        }
    }

    /**
     * Tester l'accès aux collections administrateur
     */
    async testAdminCollections() {
        const db = firebase.firestore();
        
        // Tester l'accès à userProfiles (admin peut lire tous)
        try {
            await db.collection('userProfiles').limit(1).get();
            console.log('   ✅ Accès userProfiles: OK');
        } catch (error) {
            console.warn(`   ⚠️ Accès userProfiles: ${error.message}`);
        }
        
        // Tester l'accès à adminWebhooks
        try {
            await db.collection('adminWebhooks').limit(1).get();
            console.log('   ✅ Accès adminWebhooks: OK');
        } catch (error) {
            console.warn(`   ⚠️ Accès adminWebhooks: ${error.message}`);
        }
        
        // Tester l'accès à userWebhooks (lecture)
        try {
            await db.collection('userWebhooks').limit(1).get();
            console.log('   ✅ Accès userWebhooks: OK');
        } catch (error) {
            console.warn(`   ⚠️ Accès userWebhooks: ${error.message}`);
        }
    }

    /**
     * Tester les opérations Firestore
     */
    async testFirestoreOperations() {
        try {
            console.log('\n🧪 Test des Opérations Firestore...');
            
            const currentUser = firebase.auth().currentUser;
            if (!currentUser) {
                console.log('ℹ️ Aucun utilisateur connecté - test limité');
                return;
            }
            
            const db = firebase.firestore();
            const testUserId = currentUser.uid;
            
            // Test de lecture
            try {
                const userProfileRef = db.collection('userProfiles').doc(testUserId);
                await userProfileRef.get();
                console.log('   ✅ Lecture profil utilisateur: OK');
            } catch (error) {
                console.warn(`   ⚠️ Lecture profil utilisateur: ${error.message}`);
            }
            
            // Test d'écriture (avec merge pour éviter les conflits)
            try {
                const testData = {
                    lastDiagnosticRun: firebase.firestore.FieldValue.serverTimestamp(),
                    diagnosticUser: currentUser.email
                };
                
                await db.collection('_diagnostic').doc(`user_${testUserId}`).set(testData, { merge: true });
                console.log('   ✅ Écriture test: OK');
                
                // Nettoyer
                await db.collection('_diagnostic').doc(`user_${testUserId}`).delete();
            } catch (error) {
                console.warn(`   ⚠️ Écriture test: ${error.message}`);
            }
            
        } catch (error) {
            console.warn('⚠️ Erreur lors des tests d\'opérations:', error.message);
        }
    }

    /**
     * Afficher le rapport de diagnostic
     */
    displayReport() {
        console.log('\n' + '=' .repeat(50));
        console.log('📋 RAPPORT DE DIAGNOSTIC FIRESTORE');
        console.log('=' .repeat(50));
        
        console.log(`⏰ Timestamp: ${this.diagnosticResults.timestamp}`);
        console.log(`🔥 Firebase: ${this.diagnosticResults.firebase ? '✅ OK' : '❌ ERREUR'}`);
        console.log(`🔐 Auth: ${this.diagnosticResults.auth ? '✅ OK' : '❌ ERREUR'}`);
        console.log(`📊 Firestore: ${this.diagnosticResults.firestore ? '✅ OK' : '❌ ERREUR'}`);
        console.log(`🎛️ Admin Access: ${this.diagnosticResults.adminAccess ? '✅ AUTORISÉ' : '❌ REFUSÉ'}`);
        
        if (this.diagnosticResults.adminUser) {
            console.log(`👤 Utilisateur: ${this.diagnosticResults.adminUser.email} (${this.diagnosticResults.adminUser.uid})`);
        }
        
        if (this.diagnosticResults.errors.length > 0) {
            console.log('\n❌ ERREURS DÉTECTÉES:');
            this.diagnosticResults.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }
        
        if (this.diagnosticResults.recommendations.length > 0) {
            console.log('\n💡 RECOMMANDATIONS:');
            this.diagnosticResults.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }
        
        console.log('\n🔧 ACTIONS RECOMMANDÉES:');
        if (!this.diagnosticResults.adminAccess) {
            console.log('   1. Vérifiez que firestore.rules a été déployé');
            console.log('   2. Connectez-vous avec akio963@gmail.com');
            console.log('   3. Redémarrez la page admin-webhooks.html');
        } else {
            console.log('   ✅ Tout semble fonctionner correctement !');
        }
        
        console.log('\n📖 Déploiement des règles:');
        console.log('   firebase deploy --only firestore:rules');
        console.log('   Ou utilisez la console Firebase: https://console.firebase.google.com/project/dictamed2025/firestore/rules');
        
        console.log('\n' + '=' .repeat(50));
    }
}

// Fonction globale pour lancer le diagnostic
window.runFirestoreDiagnostic = async function() {
    const diagnostic = new FirestorePermissionDiagnostic();
    await diagnostic.runDiagnostic();
    return diagnostic.diagnosticResults;
};

// Auto-exécution si appelé depuis la console
if (typeof window !== 'undefined') {
    console.log('🔍 DictaMed Firestore Permission Diagnostic chargé.');
    console.log('💡 Tapez runFirestoreDiagnostic() pour lancer le diagnostic.');
}

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirestorePermissionDiagnostic;
}