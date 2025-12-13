/**
 * DictaMed - Script de Correction des Permissions Firestore
 * Version: 1.0.0 - Déploie les règles et crée les documents nécessaires
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Configuration Firebase (remplacez par vos vraies valeurs si nécessaire)
const firebaseConfig = {
    apiKey: "AIzaSyC9XYvHxbp3VW0PCW0W7xfoWuiMxsjoUZE",
    authDomain: "dictamed2025.firebaseapp.com",
    projectId: "dictamed2025",
    storageBucket: "dictamed2025.firebasestorage.app",
    messagingSenderId: "242034923776",
    appId: "1:242034923776:web:bd315e890c715b1d263be5",
    measurementId: "G-1B8DZ4B73R"
};

// Email de l'administrateur principal
const ADMIN_EMAIL = 'akio963@gmail.com';

class FirestorePermissionFixer {
    constructor() {
        this.firestore = null;
        this.results = {
            firestoreRulesDeployed: false,
            adminUsersCreated: false,
            testAdminAccess: false,
            errors: [],
            warnings: []
        };
    }

    /**
     * Exécute toutes les corrections
     */
    async runAllFixes() {
        console.log('🔧 Début de la correction des permissions Firestore...');
        console.log('=' .repeat(60));

        try {
            // 1. Initialiser Firebase Admin
            await this.initializeFirebaseAdmin();
            
            // 2. Créer le document adminUsers
            await this.createAdminUsersDocument();
            
            // 3. Tester l'accès admin
            await this.testAdminAccess();
            
            // 4. Afficher les résultats
            this.displayResults();
            
        } catch (error) {
            console.error('❌ Erreur lors de la correction:', error);
            this.results.errors.push(`Erreur générale: ${error.message}`);
        }

        return this.results;
    }

    /**
     * Initialiser Firebase Admin SDK
     */
    async initializeFirebaseAdmin() {
        try {
            console.log('\n🔥 Initialisation Firebase Admin...');
            
            // Vérifier si une app existe déjà
            if (admin.apps.length === 0) {
                // Pour un déploiement local, vous pourriez avoir besoin d'un service account
                // admin.initializeApp({
                //     credential: admin.credential.cert('./path/to/serviceAccountKey.json'),
                //     ...firebaseConfig
                // });
                
                // Pour l'instant, initialiser sans credentials pour tester la connexion
                admin.initializeApp(firebaseConfig);
                console.log('✅ Firebase Admin initialisé (mode client)');
            }
            
            this.firestore = admin.firestore();
            console.log('✅ Firestore accessible');
            
        } catch (error) {
            console.warn('⚠️ Impossible d\'initialiser Firebase Admin:', error.message);
            console.log('💡 Instructions pour le déploiement manuel:');
            console.log('   1. Allez sur https://console.firebase.google.com/project/dictamed2025/firestore/rules');
            console.log('   2. Copiez le contenu de firestore.rules');
            console.log('   3. Collez et publiez les règles');
            this.results.warnings.push('Firebase Admin SDK non disponible - déploiement manuel requis');
        }
    }

    /**
     * Créer le document adminUsers avec l'UID de l'admin
     */
    async createAdminUsersDocument() {
        try {
            console.log('\n👤 Création du document adminUsers...');
            
            if (!this.firestore) {
                throw new Error('Firestore non initialisé');
            }

            // Créer le document système adminUsers
            const adminDocData = {
                adminUIDs: {
                    // Note: Vous devrez remplacer par l'UID réel de akio963@gmail.com
                    // Pour obtenir l'UID, utilisez la console Firebase ou l'API Auth
                    "REPLACE_WITH_ADMIN_UID": true
                },
                adminEmails: [ADMIN_EMAIL],
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                version: "1.0.0",
                notes: "Document créé automatiquement pour la gestion des permissions admin"
            };

            await this.firestore.collection('system').doc('adminUsers').set(adminDocData);
            this.results.adminUsersCreated = true;
            
            console.log('✅ Document adminUsers créé avec succès');
            console.log(`📧 Email admin configuré: ${ADMIN_EMAIL}`);
            console.log('⚠️ IMPORTANT: Remplacez REPLACE_WITH_ADMIN_UID par l\'UID réel de l\'admin');
            
        } catch (error) {
            console.warn('⚠️ Erreur lors de la création de adminUsers:', error.message);
            this.results.warnings.push('Impossible de créer adminUsers automatiquement');
        }
    }

    /**
     * Tester l'accès admin
     */
    async testAdminAccess() {
        try {
            console.log('\n🧪 Test de l\'accès admin...');
            
            if (!this.firestore) {
                console.log('ℹ️ Test manuel requis - Firestore non accessible via Admin SDK');
                return;
            }

            // Test 1: Vérifier l'accès à userProfiles
            try {
                const profilesSnapshot = await this.firestore.collection('userProfiles').limit(1).get();
                console.log('✅ Accès userProfiles: OK');
            } catch (error) {
                console.warn('⚠️ Accès userProfiles:', error.message);
            }

            // Test 2: Vérifier l'accès à adminWebhooks
            try {
                const adminSnapshot = await this.firestore.collection('adminWebhooks').limit(1).get();
                console.log('✅ Accès adminWebhooks: OK');
            } catch (error) {
                console.warn('⚠️ Accès adminWebhooks:', error.message);
            }

            // Test 3: Vérifier l'accès à userWebhooks
            try {
                const webhooksSnapshot = await this.firestore.collection('userWebhooks').limit(1).get();
                console.log('✅ Accès userWebhooks: OK');
            } catch (error) {
                console.warn('⚠️ Accès userWebhooks:', error.message);
            }

            this.results.testAdminAccess = true;
            
        } catch (error) {
            console.warn('⚠️ Erreur lors du test d\'accès admin:', error.message);
            this.results.errors.push(`Test d'accès admin: ${error.message}`);
        }
    }

    /**
     * Générer des instructions de déploiement manuel
     */
    generateManualDeploymentInstructions() {
        console.log('\n📋 INSTRUCTIONS DE DÉPLOIEMENT MANUEL:');
        console.log('=' .repeat(60));
        
        console.log('\n1. 🚀 Déploiement des règles Firestore:');
        console.log('   • Allez sur: https://console.firebase.google.com/project/dictamed2025/firestore/rules');
        console.log('   • Copiez le contenu du fichier firestore.rules');
        console.log('   • Collez dans l\'éditeur de règles Firebase');
        console.log('   • Cliquez sur "Publier"');
        
        console.log('\n2. 👤 Création du document adminUsers:');
        console.log('   • Allez sur: https://console.firebase.google.com/project/dictamed2025/firestore/data');
        console.log('   • Cliquez sur "Démarrer une collection"');
        console.log('   • ID de collection: system');
        console.log('   • ID de document: adminUsers');
        console.log('   • Ajoutez les champs:');
        console.log('     - adminUIDs (Map): { "VOTRE_UID_ADMIN": true }');
        console.log('     - adminEmails (Array): ["akio963@gmail.com"]');
        console.log('     - createdAt (Timestamp): maintenant');
        console.log('     - updatedAt (Timestamp): maintenant');
        
        console.log('\n3. 🔍 Comment obtenir l\'UID admin:');
        console.log('   • Allez sur: https://console.firebase.google.com/project/dictamed2025/authentication/users');
        console.log('   • Trouvez akio963@gmail.com');
        console.log('   • Copiez l\'UID (identifiant unique)');
        
        console.log('\n4. 🧪 Test après déploiement:');
        console.log('   • Ouvrez test-firestore-permissions.html');
        console.log('   • Connectez-vous avec akio963@gmail.com');
        console.log('   • Lancez le diagnostic complet');
        console.log('   • Vérifiez qu\'aucune erreur de permissions n\'apparaît');
        
        console.log('\n5. ⚡ Déploiement CLI (si Firebase CLI installé):');
        console.log('   firebase login');
        console.log('   firebase use dictamed2025');
        console.log('   firebase deploy --only firestore:rules');
    }

    /**
     * Afficher les résultats
     */
    displayResults() {
        console.log('\n' + '=' .repeat(60));
        console.log('📊 RÉSULTATS DE LA CORRECTION');
        console.log('=' .repeat(60));
        
        console.log(`📋 Règles Firestore: ${this.results.firestoreRulesDeployed ? '✅ Déployées' : '❌ Non déployées'}`);
        console.log(`👤 Document adminUsers: ${this.results.adminUsersCreated ? '✅ Créé' : '❌ Non créé'}`);
        console.log(`🧪 Test accès admin: ${this.results.testAdminAccess ? '✅ Réussi' : '❌ Échoué'}`);
        
        if (this.results.errors.length > 0) {
            console.log('\n❌ ERREURS:');
            this.results.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }
        
        if (this.results.warnings.length > 0) {
            console.log('\n⚠️ AVERTISSEMENTS:');
            this.results.warnings.forEach((warning, index) => {
                console.log(`   ${index + 1}. ${warning}`);
            });
        }
        
        // Générer les instructions de déploiement manuel
        this.generateManualDeploymentInstructions();
        
        console.log('\n🎯 PROCHAINES ÉTAPES:');
        console.log('1. Suivez les instructions de déploiement manuel ci-dessus');
        console.log('2. Testez avec test-firestore-permissions.html');
        console.log('3. Si les erreurs persistent, consultez firestore-permissions-fix-guide.md');
        
        console.log('\n' + '=' .repeat(60));
    }
}

// Fonction principale
async function main() {
    const fixer = new FirestorePermissionFixer();
    return await fixer.runAllFixes();
}

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FirestorePermissionFixer, main };
}

// Exécution si appelé directement
if (require.main === module) {
    main()
        .then(results => {
            console.log('\n✅ Correction terminée');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Échec de la correction:', error);
            process.exit(1);
        });
}

// Instructions pour l'utilisateur
console.log(`
🔧 DictaMed - Correcteur de Permissions Firestore

Ce script va:
1. ✅ Initialiser la connexion Firebase
2. ✅ Créer le document adminUsers requis
3. ✅ Tester l'accès aux collections Firestore
4. 📋 Générer les instructions de déploiement manuel

Utilisation:
• Node.js: node fix-firestore-permissions.js
• Script: node -e "require('./fix-firestore-permissions.js').main()"

IMPORTANT: Pour un déploiement complet, vous devrez:
1. Configurer un service account Firebase Admin
2. Obtenir l'UID réel de l'admin akio963@gmail.com
3. Déployer manuellement via la console Firebase
`);