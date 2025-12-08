/**
 * Script de diagnostic pour identifier l'erreur d'initialisation
 * Ce script va loguer chaque étape du processus d'initialisation
 */

console.log('🔍 DIAGNOSTIC - Début du diagnostic d\'initialisation');

// Vérifier l'état des dépendances critiques au chargement de la page
const initialCheck = {
    timestamp: new Date().toISOString(),
    domReady: document.readyState,
    dependencies: {
        APP_CONFIG: typeof window.APP_CONFIG !== 'undefined',
        Utils: typeof window.Utils !== 'undefined',
        ErrorHandler: typeof window.ErrorHandler !== 'undefined',
        notificationSystem: typeof window.notificationSystem !== 'undefined'
    },
    globals: Object.keys(window).filter(key => key.match(/^[A-Z_]/))
};

console.log('📊 État initial:', initialCheck);

// Vérifier l'état des scripts chargés
const scriptTags = Array.from(document.querySelectorAll('script'));
const loadedScripts = scriptTags.map(script => ({
    src: script.src || 'inline',
    loaded: script.readyState === 'complete' || script.readyState === 'interactive' || script.readyState === 'loaded'
}));

console.log('📜 Scripts chargés:', loadedScripts);

// Wrapper pour capturer les erreurs
const originalError = window.onerror;
window.onerror = function(msg, source, lineno, colno, error) {
    console.error('🚨 ERREUR CAPTURÉE:', {
        message: msg,
        source: source,
        line: lineno,
        column: colno,
        error: error,
        timestamp: new Date().toISOString()
    });
    
    if (originalError) {
        return originalError.call(window, msg, source, lineno, colno, error);
    }
    return false;
};

// Wrapper pour capturer les promises rejections
const originalRejection = window.onunhandledrejection;
window.onunhandledrejection = function(event) {
    console.error('🚨 PROMISE REJECTION CAPTURÉE:', {
        reason: event.reason,
        promise: event.promise,
        timestamp: new Date().toISOString(),
        stack: event.reason?.stack
    });
    
    if (originalRejection) {
        originalRejection.call(window, event);
    }
};

// Vérifier périodiquement l'état des dépendances
let checkCount = 0;
const maxChecks = 50; // 5 secondes max

const intervalCheck = setInterval(() => {
    checkCount++;
    
    const status = {
        timestamp: new Date().toISOString(),
        checkNumber: checkCount,
        readyState: document.readyState,
        dependencies: {
            APP_CONFIG: typeof window.APP_CONFIG !== 'undefined',
            Utils: typeof window.Utils !== 'undefined',
            ErrorHandler: typeof window.errorHandler !== 'undefined',
            notificationSystem: typeof window.notificationSystem !== 'undefined',
            audioRecorderManager: typeof window.audioRecorderManager !== 'undefined'
        }
    };
    
    console.log(`🔄 Vérification ${checkCount}:`, status);
    
    if (status.dependencies.APP_CONFIG && 
        status.dependencies.Utils && 
        status.dependencies.ErrorHandler) {
        console.log('✅ Dépendances critiques chargées - Fin du diagnostic');
        clearInterval(intervalCheck);
    }
    
    if (checkCount >= maxChecks) {
        console.log('⏰ Timeout du diagnostic - arrêt du monitoring');
        clearInterval(intervalCheck);
    }
}, 100);

// Export pour utilisation dans la console
window.diagnosticDebug = {
    getStatus: () => ({
        timestamp: new Date().toISOString(),
        domReady: document.readyState,
        dependencies: {
            APP_CONFIG: typeof window.APP_CONFIG !== 'undefined',
            Utils: typeof window.Utils !== 'undefined',
            ErrorHandler: typeof window.errorHandler !== 'undefined',
            notificationSystem: typeof window.notificationSystem !== 'undefined'
        },
        scripts: Array.from(document.querySelectorAll('script')).map(s => s.src || 'inline')
    }),
    testNotification: () => {
        if (window.notificationSystem) {
            console.log('✅ Test notification system');
            window.notificationSystem.info('Test de notification depuis diagnostic', 'Test');
        } else {
            console.log('❌ Notification system non disponible');
        }
    },
    testConfig: () => {
        if (window.APP_CONFIG) {
            console.log('✅ Test APP_CONFIG:', window.APP_CONFIG);
        } else {
            console.log('❌ APP_CONFIG non disponible');
        }
    }
};

console.log('🔧 Diagnostic tools disponibles via window.diagnosticDebug');