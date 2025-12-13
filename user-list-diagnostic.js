/**
 * DictaMed - Diagnostic de la Liste des Utilisateurs
 * Script de diagnostic pour identifier pourquoi la liste des utilisateurs ne se met pas à jour
 */

class UserListDiagnostic {
    constructor() {
        this.results = [];
        this.issues = [];
        this.recommendations = [];
    }

    async runFullDiagnostic() {
        console.log('🔍 === DIAGNOSTIC COMPLET DE LA LISTE DES UTILISATEURS ===\n');
        
        try {
            // 1. Vérifier Firebase et Firestore
            await this.testFirebaseConnection();
            
            // 2. Vérifier l'authentification
            await this.testAuthentication();
            
            // 3. Vérifier les règles Firestore
            await this.testFirestoreRules();
            
            // 4. Vérifier les collections de données
            await this.testDataCollections();
            
            // 5. Vérifier les gestionnaires
            await this.testManagers();
            
            // 6. Vérifier l'interface admin
            await this.testAdminInterface();
            
            // 7. Test d'accès direct aux données
            await this.testDirectDataAccess();
            
            // Afficher le rapport final
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Erreur lors du diagnostic:', error);
        }
    }

    async testFirebaseConnection() {
        console.log('🔥 Test de la connexion Firebase...');
        
        try {
            if (typeof firebase === 'undefined') {
                this.addIssue('Firebase SDK non chargé', 'CRITIQUE');
                return;
            }
            
            if (!firebase.firestore) {
                this.addIssue('Firestore non disponible', 'CRITIQUE');
                return;
            }
            
            if (!firebase.auth) {
                this.addIssue('Firebase Auth non disponible', 'CRITIQUE');
                return;
            }
            
            this.addResult('Firebase Connection', '✅ SUCCÈS', 'Firebase SDK et services disponibles');
            
        } catch (error) {
            this.addIssue(`Erreur de connexion Firebase: ${error.message}`, 'CRITIQUE');
        }
    }

    async testAuthentication() {
        console.log('🔐 Test de l\'authentification...');
        
        try {
            // Test avec le gestionnaire amélioré
            const enhancedAuth = window.EnhancedFirebaseAuthManager;
            if (enhancedAuth) {
                const currentUser = enhancedAuth.getCurrentUser();
                if (currentUser) {
                    this.addResult('Enhanced Auth Manager', '✅ SUCCÈS', `Utilisateur connecté: ${currentUser.email}`);
                } else {
                    this.addIssue('Aucun utilisateur connecté avec Enhanced Auth Manager', 'MAJEUR');
                }
            } else {
                this.addIssue('EnhancedFirebaseAuthManager non disponible', 'MAJEUR');
            }

            // Test avec Firebase Auth directement
            const firebaseUser = firebase.auth().currentUser;
            if (firebaseUser) {
                this.addResult('Firebase Auth Direct', '✅ SUCCÈS', `Utilisateur connecté: ${firebaseUser.email}`);
            } else {
                this.addIssue('Aucun utilisateur connecté via Firebase Auth', 'MAJEUR');
            }

            // Test du bridge
            const bridge = window.AuthManagerBridge;
            if (bridge && bridge.isInitialized) {
                this.addResult('Auth Bridge', '✅ SUCCÈS', 'Bridge d\'authentification initialisé');
            } else {
                this.addIssue('Bridge d\'authentification non initialisé', 'MAJEUR');
            }
            
        } catch (error) {
            this.addIssue(`Erreur d'authentification: ${error.message}`, 'CRITIQUE');
        }
    }

    async testFirestoreRules() {
        console.log('📋 Test des règles Firestore...');
        
        try {
            const db = firebase.firestore();
            
            // Test lecture userProfiles
            try {
                const profilesSnapshot = await db.collection('userProfiles').limit(1).get();
                this.addResult('Firestore Rules - userProfiles', '✅ SUCCÈS', 'Accès en lecture autorisé');
            } catch (error) {
                if (error.code === 'permission-denied') {
                    this.addIssue('Accès refusé à userProfiles - Vérifiez les règles Firestore', 'CRITIQUE');
                } else {
                    this.addIssue(`Erreur d'accès userProfiles: ${error.message}`, 'MAJEUR');
                }
            }
            
            // Test lecture userWebhooks
            try {
                const webhooksSnapshot = await db.collection('userWebhooks').limit(1).get();
                this.addResult('Firestore Rules - userWebhooks', '✅ SUCCÈS', 'Accès en lecture autorisé');
            } catch (error) {
                if (error.code === 'permission-denied') {
                    this.addIssue('Accès refusé à userWebhooks - Vérifiez les règles Firestore', 'CRITIQUE');
                } else {
                    this.addIssue(`Erreur d'accès userWebhooks: ${error.message}`, 'MAJEUR');
                }
            }
            
        } catch (error) {
            this.addIssue(`Erreur de test des règles Firestore: ${error.message}`, 'CRITIQUE');
        }
    }

    async testDataCollections() {
        console.log('📊 Test des collections de données...');
        
        try {
            const db = firebase.firestore();
            
            // Compter les profils utilisateur
            try {
                const profilesSnapshot = await db.collection('userProfiles').get();
                const profileCount = profilesSnapshot.size;
                this.addResult('userProfiles Collection', '✅ SUCCÈS', `${profileCount} profils trouvés`);
                
                if (profileCount === 0) {
                    this.addIssue('Aucun profil utilisateur trouvé - Les utilisateurs ne créent peut-être pas de profils', 'INFO');
                }
            } catch (error) {
                this.addIssue(`Erreur lecture userProfiles: ${error.message}`, 'MAJEUR');
            }
            
            // Compter les webhooks utilisateur
            try {
                const webhooksSnapshot = await db.collection('userWebhooks').get();
                const webhookCount = webhooksSnapshot.size;
                this.addResult('userWebhooks Collection', '✅ SUCCÈS', `${webhookCount} webhooks trouvés`);
                
                if (webhookCount === 0) {
                    this.addIssue('Aucun webhook utilisateur trouvé - Peut être normal si aucun utilisateur n\'a configuré de webhook', 'INFO');
                }
            } catch (error) {
                this.addIssue(`Erreur lecture userWebhooks: ${error.message}`, 'MAJEUR');
            }
            
        } catch (error) {
            this.addIssue(`Erreur de test des collections: ${error.message}`, 'CRITIQUE');
        }
    }

    async testManagers() {
        console.log('👥 Test des gestionnaires...');
        
        // Test AdminWebhookManagerEnhancedFirestore
        const adminManager = window.AdminWebhookManagerEnhancedFirestore;
        if (adminManager) {
            if (adminManager.isInitialized) {
                this.addResult('AdminWebhookManager', '✅ SUCCÈS', 'Gestionnaire initialisé');
                
                // Vérifier les données internes
                const userCount = adminManager.users?.length || 0;
                const webhookCount = adminManager.webhooks?.size || 0;
                
                this.addResult('AdminWebhookManager Data', '✅ SUCCÈS', `${userCount} utilisateurs, ${webhookCount} webhooks en cache`);
                
                if (userCount === 0) {
                    this.addIssue('Aucun utilisateur dans le cache du gestionnaire', 'MAJEUR');
                }
            } else {
                this.addIssue('AdminWebhookManager non initialisé', 'MAJEUR');
            }
        } else {
            this.addIssue('AdminWebhookManagerEnhancedFirestore non trouvé', 'CRITIQUE');
        }
        
        // Test AuthManagerBridge
        const bridge = window.AuthManagerBridge;
        if (bridge) {
            if (bridge.isInitialized) {
                this.addResult('AuthManagerBridge', '✅ SUCCÈS', 'Bridge initialisé');
            } else {
                this.addIssue('AuthManagerBridge non initialisé', 'MAJEUR');
            }
        } else {
            this.addIssue('AuthManagerBridge non trouvé', 'MAJEUR');
        }
    }

    async testAdminInterface() {
        console.log('🖥️ Test de l\'interface admin...');
        
        // Vérifier si le conteneur admin existe
        const adminContainer = document.getElementById('adminWebhookContainer');
        if (adminContainer) {
            this.addResult('Admin Container', '✅ SUCCÈS', 'Conteneur admin trouvé dans le DOM');
        } else {
            this.addIssue('Conteneur admin non trouvé - Interface non initialisée', 'MAJEUR');
        }
        
        // Vérifier la liste des utilisateurs
        const usersList = document.getElementById('usersList');
        if (usersList) {
            const userCards = usersList.querySelectorAll('.user-card');
            this.addResult('Users List DOM', '✅ SUCCÈS', `${userCards.length} cartes utilisateur dans le DOM`);
            
            if (userCards.length === 0) {
                this.addIssue('Aucune carte utilisateur affichée - Problème de rendu', 'MAJEUR');
            }
        } else {
            this.addIssue('Liste des utilisateurs non trouvée dans le DOM', 'MAJEUR');
        }
        
        // Vérifier les statistiques
        const statsContainer = document.getElementById('adminStats');
        if (statsContainer) {
            this.addResult('Stats Container', '✅ SUCCÈS', 'Conteneur de statistiques trouvé');
        } else {
            this.addIssue('Conteneur de statistiques non trouvé', 'MAJEUR');
        }
    }

    async testDirectDataAccess() {
        console.log('🔍 Test d\'accès direct aux données...');
        
        try {
            const db = firebase.firestore();
            
            // Accès direct aux profils
            const profilesSnapshot = await db.collection('userProfiles').get();
            const profiles = [];
            profilesSnapshot.forEach(doc => {
                profiles.push({ id: doc.id, ...doc.data() });
            });
            
            this.addResult('Direct Profiles Access', '✅ SUCCÈS', `${profiles.length} profils accessibles directement`);
            
            // Analyser les profils
            if (profiles.length > 0) {
                const firstProfile = profiles[0];
                this.addResult('Profile Structure', '✅ SUCCÈS', `Premier profil: ${firstProfile.email || 'Email manquant'}`);
            } else {
                this.addIssue('Aucun profil accessible directement', 'INFO');
            }
            
            // Accès direct aux webhooks
            const webhooksSnapshot = await db.collection('userWebhooks').get();
            const webhooks = [];
            webhooksSnapshot.forEach(doc => {
                webhooks.push({ id: doc.id, ...doc.data() });
            });
            
            this.addResult('Direct Webhooks Access', '✅ SUCCÈS', `${webhooks.length} webhooks accessibles directement`);
            
        } catch (error) {
            this.addIssue(`Erreur d'accès direct: ${error.message}`, 'MAJEUR');
        }
    }

    addResult(category, status, message) {
        this.results.push({ category, status, message, timestamp: new Date().toLocaleTimeString() });
        console.log(`${status} ${category}: ${message}`);
    }

    addIssue(issue, severity = 'MAJEUR') {
        this.issues.push({ issue, severity, timestamp: new Date().toLocaleTimeString() });
        console.warn(`⚠️ [${severity}] ${issue}`);
        
        // Ajouter des recommandations basées sur le problème
        this.addRecommendations(issue, severity);
    }

    addRecommendations(issue, severity) {
        const recs = [];
        
        if (issue.includes('Firebase SDK')) {
            recs.push('Vérifiez que le script Firebase est bien chargé avant ce diagnostic');
        }
        
        if (issue.includes('permission-denied')) {
            recs.push('Exécutez: firebase deploy --only firestore:rules');
            recs.push('Vérifiez que vous êtes connecté avec le bon compte Firebase');
        }
        
        if (issue.includes('non initialisé')) {
            recs.push('Appelez window.initAuthSystem() pour initialiser le système');
        }
        
        if (issue.includes('Aucun utilisateur')) {
            recs.push('Créez un compte test ou vérifiez que des utilisateurs existent dans Firebase Auth');
        }
        
        if (issue.includes('Aucun profil')) {
            recs.push('Les utilisateurs doivent se connecter pour créer des profils automatiquement');
        }
        
        recs.forEach(rec => {
            this.recommendations.push({ issue, recommendation: rec, severity });
        });
    }

    generateReport() {
        console.log('\n📊 === RAPPORT DE DIAGNOSTIC ===\n');
        
        // Résumé
        const criticalIssues = this.issues.filter(i => i.severity === 'CRITIQUE').length;
        const majorIssues = this.issues.filter(i => i.severity === 'MAJEUR').length;
        const infoIssues = this.issues.filter(i => i.severity === 'INFO').length;
        
        console.log(`📈 Résumé: ${this.results.length} tests réussis, ${criticalIssues} erreurs critiques, ${majorIssues} problèmes majeurs, ${infoIssues} informations`);
        
        // Problèmes critiques
        if (criticalIssues > 0) {
            console.log('\n🚨 PROBLÈMES CRITIQUES:');
            this.issues.filter(i => i.severity === 'CRITIQUE').forEach(issue => {
                console.log(`❌ ${issue.issue}`);
            });
        }
        
        // Problèmes majeurs
        if (majorIssues > 0) {
            console.log('\n⚠️ PROBLÈMES MAJEURS:');
            this.issues.filter(i => i.severity === 'MAJEUR').forEach(issue => {
                console.log(`⚠️ ${issue.issue}`);
            });
        }
        
        // Recommandations
        if (this.recommendations.length > 0) {
            console.log('\n🔧 RECOMMANDATIONS:');
            this.recommendations.forEach(rec => {
                console.log(`💡 ${rec.recommendation}`);
            });
        }
        
        // Actions suggérées
        console.log('\n🚀 ACTIONS SUGGÉRÉES:');
        
        if (criticalIssues > 0) {
            console.log('1. Corriger les problèmes critiques avant de continuer');
        } else if (majorIssues > 0) {
            console.log('1. Résoudre les problèmes majeurs pour un fonctionnement optimal');
            console.log('2. Tester avec window.initAuthSystem()');
        } else {
            console.log('1. Le système semble fonctionnel - Testez manuellement l\'interface admin');
            console.log('2. Utilisez les boutons de rafraîchissement dans l\'interface');
        }
        
        console.log('\n🔍 Commandes de diagnostic:');
        console.log('- window.AuthManagerBridge.runDiagnostics()');
        console.log('- window.initAuthSystem()');
        console.log('- await new UserListDiagnostic().runFullDiagnostic()');
    }
}

// Export et auto-exécution
if (typeof window !== 'undefined') {
    window.UserListDiagnostic = UserListDiagnostic;
    
    // Auto-exécuter le diagnostic après 3 secondes
    setTimeout(() => {
        if (typeof firebase !== 'undefined') {
            console.log('🚀 Lancement automatique du diagnostic...');
            const diagnostic = new UserListDiagnostic();
            diagnostic.runFullDiagnostic();
        }
    }, 3000);
}