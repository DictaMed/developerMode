/**
 * DictaMed - Correction de l'erreur d'authentification Firebase
 * Solution pour "window.firebase.auth is not a function"
 * Version: 1.0.0
 */

(function() {
    'use strict';
    
    console.log('🔧 === CORRECTION FIREBASE AUTHENTIFICATION ===');
    
    // Fonction de correction principale
    async function fixFirebaseAuth() {
        console.log('🎯 Début de la correction Firebase Auth...');
        
        try {
            // 1. Vérifier l'état actuel de Firebase
            await checkCurrentFirebaseState();
            
            // 2. Appliquer les corrections nécessaires
            await applyFirebaseCorrections();
            
            // 3. Tester la correction
            await testFirebaseFix();
            
            console.log('✅ Correction Firebase Auth terminée');
            
        } catch (error) {
            console.error('❌ Erreur lors de la correction:', error);
        }
    }
    
    // Vérification de l'état actuel
    async function checkCurrentFirebaseState() {
        console.log('📊 Vérification de l\'état Firebase actuel...');
        
        const state = {
            windowFirebase: typeof window.firebase !== 'undefined',
            windowFirebaseAuth: typeof window.firebase !== 'undefined' && typeof window.firebase.auth !== 'undefined',
            firebaseAuthType: typeof window.firebase !== 'undefined' ? typeof window.firebase.auth : 'undefined'
        };
        
        console.log('📋 État Firebase:', state);
        
        // Identifier le problème
        if (!state.windowFirebase) {
            console.error('❌ window.firebase n\'est pas défini');
            return { problem: 'firebase_not_loaded', state };
        }
        
        if (!state.windowFirebaseAuth) {
            console.error('❌ window.firebase.auth n\'est pas défini');
            return { problem: 'auth_not_loaded', state };
        }
        
        if (state.firebaseAuthType !== 'object') {
            console.error(`❌ window.firebase.auth n'est pas un objet (type: ${state.firebaseAuthType})`);
            return { problem: 'auth_wrong_type', state, expected: 'object', actual: state.firebaseAuthType };
        }
        
        console.log('✅ État Firebase semble correct');
        return { problem: null, state };
    }
    
    // Application des corrections
    async function applyFirebaseCorrections() {
        console.log('🔧 Application des corrections...');
        
        // Correction 1: S'assurer que Firebase est correctement exposé
        if (typeof window.firebase !== 'undefined' && window.firebase.auth) {
            // Vérifier que les méthodes nécessaires sont disponibles
            const requiredMethods = [
                'signInWithEmailAndPassword',
                'createUserWithEmailAndPassword',
                'signOut',
                'sendPasswordResetEmail',
                'onAuthStateChanged',
                'GoogleAuthProvider',
                'signInWithPopup'
            ];
            
            const missingMethods = requiredMethods.filter(method => 
                typeof window.firebase[method] !== 'function'
            );
            
            if (missingMethods.length > 0) {
                console.warn('⚠️ Méthodes manquantes:', missingMethods);
                
                // Recharger les modules si nécessaire
                await reloadFirebaseModules();
            } else {
                console.log('✅ Toutes les méthodes Firebase sont disponibles');
            }
        }
        
        // Correction 2: Attendre que Firebase soit complètement initialisé
        if (window.firebase && !window.firebase._initialized) {
            console.log('⏳ Attente de l\'initialisation Firebase...');
            await waitForFirebaseInit();
        }
        
        // Correction 3: Vérifier la configuration
        if (window.firebase && window.firebase.app) {
            const config = window.firebase.app.options;
            console.log('📊 Configuration Firebase:', {
                projectId: config.projectId,
                authDomain: config.authDomain,
                hasApiKey: !!config.apiKey
            });
        }
    }
    
    // Rechargement des modules Firebase
    async function reloadFirebaseModules() {
        console.log('🔄 Rechargement des modules Firebase...');
        
        try {
            // Créer un nouveau module pour recharger Firebase
            const script = document.createElement('script');
            script.type = 'module';
            script.textContent = `
                import { 
                    signInWithEmailAndPassword,
                    createUserWithEmailAndPassword,
                    signOut,
                    sendPasswordResetEmail,
                    onAuthStateChanged,
                    GoogleAuthProvider,
                    signInWithPopup
                } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
                
                if (window.firebase) {
                    window.firebase.signInWithEmailAndPassword = signInWithEmailAndPassword;
                    window.firebase.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
                    window.firebase.signOut = signOut;
                    window.firebase.sendPasswordResetEmail = sendPasswordResetEmail;
                    window.firebase.onAuthStateChanged = onAuthStateChanged;
                    window.firebase.GoogleAuthProvider = GoogleAuthProvider;
                    window.firebase.signInWithPopup = signInWithPopup;
                    
                    console.log('✅ Modules Firebase rechargés');
                }
            `;
            
            document.head.appendChild(script);
            
        } catch (error) {
            console.error('❌ Erreur lors du rechargement:', error);
        }
    }
    
    // Attendre l'initialisation Firebase
    async function waitForFirebaseInit() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (window.firebase && window.firebase.auth && typeof window.firebase.auth === 'object') {
                    clearInterval(checkInterval);
                    console.log('✅ Firebase initialisé');
                    resolve();
                }
            }, 100);
            
            // Timeout après 10 secondes
            setTimeout(() => {
                clearInterval(checkInterval);
                console.warn('⚠️ Timeout d\'attente Firebase');
                resolve();
            }, 10000);
        });
    }
    
    // Test de la correction
    async function testFirebaseFix() {
        console.log('🧪 Test de la correction...');
        
        try {
            // Test 1: Vérifier Firebase Auth
            if (typeof window.firebase !== 'undefined' && window.firebase.auth) {
                console.log('✅ Firebase Auth disponible');
                
                // Test 2: Tester les méthodes
                const methods = ['signInWithEmailAndPassword', 'createUserWithEmailAndPassword'];
                for (const method of methods) {
                    if (typeof window.firebase[method] === 'function') {
                        console.log(`✅ Méthode ${method} disponible`);
                    } else {
                        console.error(`❌ Méthode ${method} manquante`);
                    }
                }
                
                // Test 3: Test de FirebaseAuthManager
                if (typeof window.FirebaseAuthManager !== 'undefined') {
                    console.log('✅ FirebaseAuthManager disponible');
                    
                    // Tester la configuration
                    const config = await window.FirebaseAuthManager.checkAuthConfiguration();
                    console.log('📊 Configuration FirebaseAuthManager:', config);
                    
                    if (config.isConfigured) {
                        console.log('✅ FirebaseAuthManager correctement configuré');
                    } else {
                        console.warn('⚠️ FirebaseAuthManager non configuré:', config.error);
                    }
                } else {
                    console.warn('⚠️ FirebaseAuthManager non disponible');
                }
                
            } else {
                console.error('❌ Firebase Auth non disponible après correction');
            }
            
        } catch (error) {
            console.error('❌ Erreur lors du test:', error);
        }
    }
    
    // Fonction pour forcer la correction manuellement
    window.forceFirebaseFix = async function() {
        console.log('🔧 Forçage de la correction Firebase...');
        await fixFirebaseAuth();
    };
    
    // Écouter l'événement de ready Firebase
    window.addEventListener('firebaseReady', () => {
        console.log('📢 Événement firebaseReady reçu');
        setTimeout(() => fixFirebaseAuth(), 500);
    });
    
    // Lancer la correction automatiquement après un délai
    setTimeout(() => {
        console.log('⏰ Lancement automatique de la correction...');
        fixFirebaseAuth();
    }, 2000);
    
    console.log('🔧 Script de correction Firebase chargé');
    console.log('💡 Utilisation: forceFirebaseFix() pour forcer la correction');
    
})();