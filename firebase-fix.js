/**
 * DictaMed - Correctif Firebase pour Compatibilité
 * Version: 1.0.0 - Résout les problèmes d'authentification Firebase
 */

// Configuration Firebase corrigée
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyC9XYvHxbp3VW0PCW0W7xfoWuiMxsjoUZE",
    authDomain: "dictamed2025.firebaseapp.com",
    projectId: "dictamed2025",
    storageBucket: "dictamed2025.firebasestorage.app",
    messagingSenderId: "242034923776",
    appId: "1:242034923776:web:bd315e890c715b1d263be5",
    measurementId: "G-1B8DZ4B73R"
};

/**
 * Initialisation Firebase corrigée
 */
async function initFirebaseFix() {
    try {
        console.log('🔧 Correction Firebase: Initialisation...');
        
        // Si Firebase est déjà initialisé, on sort
        if (window.firebase && window.firebase.auth) {
            console.log('✅ Firebase déjà initialisé');
            return window.firebase;
        }
        
        // Charger Firebase SDK compat si nécessaire
        if (typeof firebase === 'undefined') {
            await loadFirebaseSDK();
        }
        
        // Initialiser Firebase
        const app = firebase.initializeApp(FIREBASE_CONFIG);
        const auth = firebase.auth();
        
        // Exposer Firebase globalement
        window.firebase = {
            ...window.firebase,
            app: app,
            auth: auth
        };
        
        console.log('✅ Firebase corrigé et initialisé avec succès');
        return window.firebase;
        
    } catch (error) {
        console.error('❌ Erreur correction Firebase:', error);
        return null;
    }
}

/**
 * Chargement du SDK Firebase
 */
function loadFirebaseSDK() {
    return new Promise((resolve, reject) => {
        if (typeof firebase !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
        script.onload = () => {
            // Charger Auth compat aussi
            const authScript = document.createElement('script');
            authScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js';
            authScript.onload = () => resolve();
            authScript.onerror = reject;
            document.head.appendChild(authScript);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Attendre que Firebase soit disponible
 */
function waitForFirebase(timeout = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        function checkFirebase() {
            if (window.firebase && window.firebase.auth) {
                resolve(window.firebase);
                return;
            }
            
            if (Date.now() - startTime > timeout) {
                reject(new Error('Timeout: Firebase non disponible'));
                return;
            }
            
            setTimeout(checkFirebase, 100);
        }
        
        checkFirebase();
    });
}

// Export pour utilisation globale
window.FirebaseFix = {
    init: initFirebaseFix,
    waitForFirebase: waitForFirebase,
    config: FIREBASE_CONFIG
};

// Auto-initialisation si appelé directement
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initFirebaseFix();
        });
    } else {
        setTimeout(() => initFirebaseFix(), 100);
    }
}