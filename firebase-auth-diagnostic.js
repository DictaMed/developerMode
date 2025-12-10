/**
 * DictaMed - Diagnostic Firebase Authentication (SDK Modulaire)
 * Version: 2.0.0 - Migration vers Firebase SDK modulaire
 */

(function() {
    'use strict';
    
    console.log('🔧 === FIREBASE AUTHENTICATION DIAGNOSTIC (MODULAIRE) ===');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    // État global du diagnostic
    const authDiagnostic = {
        results: {},
        errors: [],
        recommendations: []
    };
    
    // Fonction principale de diagnostic
    async function runAuthDiagnostic() {
        console.log('🎯 === DÉBUT DU DIAGNOSTIC AUTHENTIFICATION MODULAIRE ===');
        
        try {
            // 1. Vérification de Firebase SDK
            checkFirebaseSDK();
            
            // 2. Vérification de la configuration Firebase
            await checkFirebaseConfiguration();
            
            // 3. Vérification des providers d'authentification
            await checkAuthProviders();
            
            // 4. Test de création de compte (simulation)
            await testAccountCreation();
            
            // 5. Rapport final et recommandations
            generateDiagnosticReport();
            
        } catch (error) {
            console.error('❌ Erreur lors du diagnostic:', error);
            authDiagnostic.errors.push({
                type: 'diagnostic_failed',
                message: error.message
            });
        }
    }
    
    // 1. Vérification de Firebase SDK
    function checkFirebaseSDK() {
        console.log('📦 1. Vérification Firebase SDK modulaire...');
        
        const checks = {
            'window.firebase variable': typeof window.firebase !== 'undefined',
            'window.firebase.app': typeof window.firebase !== 'undefined' && typeof window.firebase.app === 'object',
            'window.firebase.auth': typeof window.firebase !== 'undefined' && typeof window.firebase.auth === 'object',
            'window.firebase.analytics': typeof window.firebase !== 'undefined' && typeof window.firebase.analytics === 'object'
        };
        
        console.log('📊 Firebase SDK Status:', checks);
        
        Object.entries(checks).forEach(([check, passed]) => {
            if (passed) {
                console.log(`✅ ${check}: OK`);
            } else {
                console.error(`❌ ${check}: ÉCHEC`);
                authDiagnostic.errors.push({
                    type: 'sdk_missing',
                    check: check,
                    message: `${check} n'est pas disponible`
                });
            }
        });
        
        authDiagnostic.results.sdk = checks;
    }
    
    // 2. Vérification de la configuration Firebase
    async function checkFirebaseConfiguration() {
        console.log('⚙️ 2. Vérification configuration Firebase modulaire...');
        
        try {
            if (typeof window.firebase === 'undefined' || !window.firebase.app) {
                throw new Error('Firebase app non disponible');
            }
            
            const config = window.firebase.app.options;
            
            const configChecks = {
                'Project ID': !!config.projectId,
                'Auth Domain': !!config.authDomain,
                'API Key': !!config.apiKey,
                'Storage Bucket': !!config.storageBucket,
                'Messaging Sender ID': !!config.messagingSenderId,
                'App ID': !!config.appId
            };
            
            console.log('📊 Configuration Firebase:', {
                projectId: config.projectId,
                authDomain: config.authDomain,
                hasApiKey: !!config.apiKey
            });
            
            Object.entries(configChecks).forEach(([check, passed]) => {
                if (passed) {
                    console.log(`✅ ${check}: Configuré`);
                } else {
                    console.error(`❌ ${check}: Manquant`);
                    authDiagnostic.errors.push({
                        type: 'config_missing',
                        check: check,
                        message: `${check} manquant dans la configuration`
                    });
                }
            });
            
            authDiagnostic.results.configuration = configChecks;
            
        } catch (error) {
            console.error('❌ Erreur de configuration:', error);
            authDiagnostic.errors.push({
                type: 'config_error',
                message: `Erreur de configuration: ${error.message}`
            });
        }
    }
    
    // 3. Vérification des providers d'authentification
    async function checkAuthProviders() {
        console.log('🔐 3. Vérification des providers d\'authentification modulaire...');
        
        try {
            if (typeof window.firebase === 'undefined' || !window.firebase.auth) {
                throw new Error('Firebase Auth non disponible');
            }
            
            const auth = window.firebase.auth;
            
            // Vérifier l'état actuel de l'authentification
            const currentUser = auth.currentUser;
            console.log('👤 Utilisateur actuel:', currentUser ? currentUser.email : 'Aucun');
            
            // Tester les méthodes d'authentification disponibles
            const authMethods = {
                'Email/Password': typeof window.FirebaseAuthManager !== 'undefined',
                'Google': typeof window.FirebaseAuthManager !== 'undefined',
                'Anonymous': typeof window.FirebaseAuthManager !== 'undefined',
                'Current User': !!currentUser
            };
            
            console.log('📊 Méthodes d\'authentification:', authMethods);
            
            // Vérifier spécifiquement le provider Email/Password via FirebaseAuthManager
            if (authMethods['Email/Password']) {
                console.log('✅ Email/Password provider disponible via FirebaseAuthManager');
            } else {
                console.error('❌ Email/Password provider NON DISPONIBLE');
                authDiagnostic.errors.push({
                    type: 'provider_missing',
                    provider: 'Email/Password',
                    message: 'Le provider Email/Password n\'est pas disponible via FirebaseAuthManager'
                });
                
                authDiagnostic.recommendations.push(
                    'Activez le provider Email/Password dans la console Firebase (Authentication > Sign-in method)'
                );
            }
            
            authDiagnostic.results.authMethods = authMethods;
            
        } catch (error) {
            console.error('❌ Erreur vérification providers:', error);
            authDiagnostic.errors.push({
                type: 'provider_check_error',
                message: `Erreur lors de la vérification des providers: ${error.message}`
            });
        }
    }
    
    // 4. Test de création de compte (simulation)
    async function testAccountCreation() {
        console.log('🧪 4. Test simulation création de compte modulaire...');
        
        try {
            if (typeof window.firebase === 'undefined' || !window.firebase.auth) {
                throw new Error('Firebase Auth non disponible');
            }
            
            // Test via FirebaseAuthManager
            if (typeof window.FirebaseAuthManager !== 'undefined') {
                console.log('✅ FirebaseAuthManager disponible pour les tests');
                
                // Test de la configuration
                const config = await window.FirebaseAuthManager.checkAuthConfiguration();
                console.log('📊 Configuration FirebaseAuthManager:', config);
                
                if (config.isConfigured) {
                    authDiagnostic.recommendations.push(
                        'FirebaseAuthManager est correctement configuré. Testez avec un vrai email/mot de passe.'
                    );
                } else {
                    authDiagnostic.errors.push({
                        type: 'manager_config_error',
                        message: `FirebaseAuthManager non configuré: ${config.error}`
                    });
                }
            } else {
                console.error('❌ FirebaseAuthManager NON DISPONIBLE');
                authDiagnostic.errors.push({
                    type: 'manager_missing',
                    message: 'FirebaseAuthManager n\'est pas disponible'
                });
                
                authDiagnostic.recommendations.push(
                    'Vérifiez que FirebaseAuthManager est correctement chargé'
                );
            }
            
        } catch (error) {
            console.error('❌ Erreur test création:', error);
            authDiagnostic.errors.push({
                type: 'creation_test_error',
                message: `Erreur lors du test de création: ${error.message}`
            });
        }
    }
    
    // 5. Génération du rapport final
    function generateDiagnosticReport() {
        console.log('📊 === RAPPORT FINAL DIAGNOSTIC AUTH MODULAIRE ===');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalErrors: authDiagnostic.errors.length,
                totalRecommendations: authDiagnostic.recommendations.length,
                firebaseAvailable: authDiagnostic.results.sdk && Object.values(authDiagnostic.results.sdk).every(v => v),
                sdkType: 'modular'
            },
            errors: authDiagnostic.errors,
            recommendations: authDiagnostic.recommendations,
            results: authDiagnostic.results
        };
        
        if (authDiagnostic.errors.length === 0) {
            console.log('✅ DIAGNOSTIC: Aucune erreur détectée');
            console.log('🎉 Firebase Authentication modulaire semble correctement configuré');
            console.log('💡 Vous pouvez maintenant tester la création de compte');
        } else {
            console.log(`❌ DIAGNOSTIC: ${authDiagnostic.errors.length} erreur(s) détectée(s)`);
            
            authDiagnostic.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error.type}: ${error.message}`);
            });
        }
        
        if (authDiagnostic.recommendations.length > 0) {
            console.log('💡 Recommandations:');
            authDiagnostic.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }
        
        // Actions recommandées basées sur les erreurs
        const actions = getRecommendedActions();
        if (actions.length > 0) {
            console.log('🔧 Actions recommandées:');
            actions.forEach((action, index) => {
                console.log(`   ${index + 1}. ${action}`);
            });
        }
        
        // Sauvegarder le rapport global
        window.firebaseAuthDiagnosticReport = report;
        return report;
    }
    
    // Actions recommandées basées sur les erreurs détectées
    function getRecommendedActions() {
        const actions = [];
        
        const hasSDKError = authDiagnostic.errors.some(e => e.type === 'sdk_missing');
        const hasConfigError = authDiagnostic.errors.some(e => e.type === 'config_missing');
        const hasProviderError = authDiagnostic.errors.some(e => e.type === 'provider_missing');
        
        if (hasSDKError) {
            actions.push('Vérifiez que les scripts Firebase SDK modulaire sont correctement chargés dans index.html');
            actions.push('Assurez-vous que Firebase est initialisé avant les autres scripts');
        }
        
        if (hasConfigError) {
            actions.push('Vérifiez la configuration Firebase dans le script de chargement');
            actions.push('Assurez-vous que toutes les clés de configuration sont présentes');
        }
        
        if (hasProviderError) {
            actions.push('Allez dans Firebase Console > Authentication > Sign-in method');
            actions.push('Activez le provider "Email/Password"');
            actions.push('Ajoutez votre domaine dans les domaines autorisés');
        }
        
        return actions;
    }
    
    // Lancer le diagnostic après un court délai
    setTimeout(runAuthDiagnostic, 3000);
    
    // Exposer des fonctions de diagnostic pour utilisation manuelle
    window.FirebaseAuthDiagnostic = {
        run: runAuthDiagnostic,
        getReport: () => window.firebaseAuthDiagnosticReport,
        testSignUp: async function(email, password) {
            console.log('🧪 Test création de compte:', email);
            try {
                if (typeof window.FirebaseAuthManager !== 'undefined') {
                    const result = await window.FirebaseAuthManager.signUp(email, password);
                    console.log('📊 Résultat test:', result);
                    return result;
                } else {
                    throw new Error('FirebaseAuthManager non disponible');
                }
            } catch (error) {
                console.error('❌ Erreur test:', error);
                return { success: false, error: error.message };
            }
        },
        checkConfig: async function() {
            if (typeof window.FirebaseAuthManager !== 'undefined') {
                return await window.FirebaseAuthManager.checkAuthConfiguration();
            }
            return { isConfigured: false, error: 'FirebaseAuthManager non disponible' };
        },
        testGoogleSignIn: async function() {
            console.log('🧪 Test Google Sign-In');
            try {
                if (typeof window.FirebaseAuthManager !== 'undefined') {
                    const result = await window.FirebaseAuthManager.signInWithGoogle();
                    console.log('📊 Résultat Google Sign-In:', result);
                    return result;
                } else {
                    throw new Error('FirebaseAuthManager non disponible');
                }
            } catch (error) {
                console.error('❌ Erreur Google Sign-In:', error);
                return { success: false, error: error.message };
            }
        }
    };
    
    console.log('🔧 Firebase Auth Diagnostic (Modulaire) chargé.');
    console.log('💡 Utilisation: FirebaseAuthDiagnostic.run() pour relancer le diagnostic');
    console.log('💡 Test création: FirebaseAuthDiagnostic.testSignUp("test@example.com", "password123")');
    console.log('💡 Test Google: FirebaseAuthDiagnostic.testGoogleSignIn()');
    
})();