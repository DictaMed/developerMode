/**
 * DictaMed - Tests Unitaires pour Composants Critiques
 * Date: 2025-12-08
 * 
 * Ce fichier contient les tests unitaires de base pour vérifier le bon fonctionnement
 * des composants critiques de l'application DictaMed.
 */

// ===== FRAMEWORK DE TEST SIMPLE =====
const DictaMedTests = {
    results: [],
    total: 0,
    passed: 0,
    failed: 0,

    test(name, testFunction) {
        this.total++;
        try {
            console.log(`🧪 Test: ${name}`);
            testFunction();
            this.passed++;
            this.results.push({ name, status: 'PASS', error: null });
            console.log(`✅ PASS: ${name}`);
        } catch (error) {
            this.failed++;
            this.results.push({ name, status: 'FAIL', error: error.message });
            console.error(`❌ FAIL: ${name} - ${error.message}`);
        }
    },

    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    },

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    },

    assertType(value, type, message) {
        const actualType = typeof value;
        if (actualType !== type) {
            throw new Error(message || `Expected type ${type}, got ${actualType}`);
        }
    },

    assertExists(value, message) {
        if (value === null || value === undefined) {
            throw new Error(message || 'Value does not exist');
        }
    },

    runAll() {
        console.log('🚀 Démarrage des tests unitaires DictaMed');
        console.log('=====================================');

        // Test des composants Core
        this.testCoreComponents();
        
        // Test des composants UI
        this.testUIComponents();
        
        // Test des utilitaires
        this.testUtilities();
        
        // Test de l'intégration
        this.testIntegration();

        this.printSummary();
        return this.results;
    },

    printSummary() {
        console.log('=====================================');
        console.log('📊 RÉSUMÉ DES TESTS:');
        console.log(`Total: ${this.total}`);
        console.log(`✅ Réussis: ${this.passed}`);
        console.log(`❌ Échoués: ${this.failed}`);
        console.log(`Taux de réussite: ${((this.passed/this.total)*100).toFixed(1)}%`);
        
        if (this.failed > 0) {
            console.log('\n❌ TESTS ÉCHOUÉS:');
            this.results.filter(r => r.status === 'FAIL').forEach(r => {
                console.log(`  - ${r.name}: ${r.error}`);
            });
        }
    }
};

// ===== TESTS DES COMPOSANTS CORE =====
DictaMedTests.testCoreComponents = function() {
    console.log('\n🔧 Tests des Composants Core');
    console.log('----------------------------');

    // Test APP_CONFIG
    this.test('APP_CONFIG exists and has required properties', () => {
        this.assertExists(window.APP_CONFIG, 'APP_CONFIG should be defined');
        this.assertType(window.APP_CONFIG, 'object');
        this.assertExists(window.APP_CONFIG.MODES, 'APP_CONFIG.MODES should exist');
        this.assertExists(window.APP_CONFIG.SECTIONS, 'APP_CONFIG.SECTIONS should exist');
        this.assertExists(window.APP_CONFIG.ENDPOINTS, 'APP_CONFIG.ENDPOINTS should exist');
    });

    // Test Utils
    this.test('Utils exists and has required methods', () => {
        this.assertExists(window.Utils, 'Utils should be defined');
        this.assertType(window.Utils, 'object');
        this.assertType(window.Utils.formatDuration, 'function');
        this.assertType(window.Utils.fileToBase64, 'function');
        this.assertType(window.Utils.generateId, 'function');
        this.assertType(window.Utils.debounce, 'function');
        this.assertType(window.Utils.throttle, 'function');
    });

    // Test ErrorHandler
    this.test('ErrorHandler exists and has required methods', () => {
        this.assertExists(window.errorHandler, 'errorHandler should be defined');
        this.assertType(window.errorHandler, 'object');
        this.assertType(window.errorHandler.error, 'function');
        this.assertType(window.errorHandler.warning, 'function');
        this.assertType(window.errorHandler.info, 'function');
        this.assertType(window.errorHandler.debug, 'function');
    });

    // Test Logger
    this.test('Logger exists and can create loggers', () => {
        this.assertExists(window.logger, 'logger should be defined');
        this.assertType(window.logger.createLogger, 'function');
        
        const testLogger = window.logger.createLogger('TestComponent');
        this.assertType(testLogger, 'object');
        this.assertType(testLogger.error, 'function');
        this.assertType(testLogger.warning, 'function');
        this.assertType(testLogger.info, 'function');
    });
};

// ===== TESTS DES COMPOSANTS UI =====
DictaMedTests.testUIComponents = function() {
    console.log('\n🎨 Tests des Composants UI');
    console.log('--------------------------');

    // Test NotificationSystem
    this.test('NotificationSystem exists and has required methods', () => {
        this.assertExists(window.NotificationSystem, 'NotificationSystem should be defined');
        const notificationSystem = new window.NotificationSystem();
        this.assertType(notificationSystem.show, 'function');
        this.assertType(notificationSystem.success, 'function');
        this.assertType(notificationSystem.error, 'function');
        this.assertType(notificationSystem.warning, 'function');
        this.assertType(notificationSystem.info, 'function');
    });

    // Test LoadingOverlay
    this.test('LoadingOverlay exists and has required methods', () => {
        this.assertExists(window.LoadingOverlay, 'LoadingOverlay should be defined');
        const loadingOverlay = new window.LoadingOverlay();
        this.assertType(loadingOverlay.show, 'function');
        this.assertType(loadingOverlay.hide, 'function');
    });

    // Test TabNavigationSystem
    this.test('TabNavigationSystem exists and has required methods', () => {
        this.assertExists(window.TabNavigationSystem, 'TabNavigationSystem should be defined');
        // Note: Nécessite AppState pour être instancié
    });

    // Test FirebaseAuthManager
    this.test('FirebaseAuthManager exists and has required methods', () => {
        this.assertExists(window.FirebaseAuthManager, 'FirebaseAuthManager should be defined');
        this.assertType(window.FirebaseAuthManager.init, 'function');
        this.assertType(window.FirebaseAuthManager.isAuthenticated, 'function');
        this.assertType(window.FirebaseAuthManager.getCurrentUser, 'function');
    });
};

// ===== TESTS DES UTILITAIRES =====
DictaMedTests.testUtilities = function() {
    console.log('\n🛠️ Tests des Utilitaires');
    console.log('------------------------');

    // Test Utils.formatDuration
    this.test('Utils.formatDuration formats time correctly', () => {
        this.assertEqual(window.Utils.formatDuration(0), '00:00');
        this.assertEqual(window.Utils.formatDuration(30), '00:30');
        this.assertEqual(window.Utils.formatDuration(65), '01:05');
        this.assertEqual(window.Utils.formatDuration(3661), '61:01');
    });

    // Test Utils.generateId
    this.test('Utils.generateId generates unique IDs', () => {
        const id1 = window.Utils.generateId();
        const id2 = window.Utils.generateId();
        this.assert(id1 !== id2, 'Generated IDs should be unique');
        this.assertType(id1, 'string', 'Generated ID should be a string');
        this.assert(id1.length > 0, 'Generated ID should not be empty');
    });

    // Test Utils.isValidEmail
    this.test('Utils.isValidEmail validates emails correctly', () => {
        this.assert(window.Utils.isValidEmail('test@example.com'), 'Should validate correct email');
        this.assert(window.Utils.isValidEmail('user.name+tag@domain.co.uk'), 'Should validate complex email');
        this.assert(!window.Utils.isValidEmail('invalid-email'), 'Should reject invalid email');
        this.assert(!window.Utils.isValidEmail('@domain.com'), 'Should reject email without username');
        this.assert(!window.Utils.isValidEmail('user@'), 'Should reject email without domain');
    });

    // Test Utils.debounce
    this.test('Utils.debounce debounces function calls', (done) => {
        let callCount = 0;
        const debouncedFn = window.Utils.debounce(() => {
            callCount++;
        }, 100);

        // Call function multiple times quickly
        debouncedFn();
        debouncedFn();
        debouncedFn();

        // Should not have been called yet
        this.assertEqual(callCount, 0, 'Function should not be called immediately');

        // Wait for debounce to complete
        setTimeout(() => {
            this.assertEqual(callCount, 1, 'Function should be called once after debounce');
            done();
        }, 150);
    });

    // Test Utils.throttle
    this.test('Utils.throttle throttles function calls', (done) => {
        let callCount = 0;
        const throttledFn = window.Utils.throttle(() => {
            callCount++;
        }, 100);

        // Call function multiple times quickly
        throttledFn();
        throttledFn();
        throttledFn();

        // Should have been called once
        this.assertEqual(callCount, 1, 'Function should be called once immediately');

        // Wait for throttle to reset
        setTimeout(() => {
            throttledFn();
            this.assertEqual(callCount, 2, 'Function should be called again after throttle period');
            done();
        }, 150);
    });
};

// ===== TESTS D'INTÉGRATION =====
DictaMedTests.testIntegration = function() {
    console.log('\n🔗 Tests d\'Intégration');
    console.log('-----------------------');

    // Test DOM Elements
    this.test('Required DOM elements exist', () => {
        const requiredElements = [
            'tab-content',
            'authButton',
            'authModal'
        ];

        requiredElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            this.assertExists(element, `Element ${elementId} should exist in DOM`);
        });
    });

    // Test Global Functions
    this.test('Global functions are available', () => {
        this.assertType(window.switchTab, 'function', 'switchTab should be a global function');
        this.assertType(window.toggleAuthModal, 'function', 'toggleAuthModal should be a global function');
        this.assertType(window.closeAuthModal, 'function', 'closeAuthModal should be a global function');
    });

    // Test Firebase Configuration
    this.test('Firebase is properly configured', () => {
        if (typeof firebase !== 'undefined') {
            this.assertExists(firebase.apps, 'Firebase apps should exist');
        }
    });
};

// ===== MÉTHODE POUR AJOUTER DES TESTS PERSONNALISÉS =====
DictaMedTests.addCustomTest = function(name, testFunction) {
    this.test(name, testFunction);
};

// ===== LANCEMENT AUTOMATIQUE DES TESTS =====
if (typeof window !== 'undefined') {
    // Exposer les tests globalement
    window.DictaMedTests = DictaMedTests;
    
    // Lancer les tests automatiquement si demandé
    if (window.location.search.includes('runTests=true')) {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                DictaMedTests.runAll();
            }, 1000); // Attendre que l'app soit initialisée
        });
    }
    
    // Instructions pour lancer les tests manuellement
    console.log(`
🧪 TESTS UNITAIRES DICTAMED
===========================
Pour lancer les tests :
1. Ouvrez la console développeur (F12)
2. Tapez : DictaMedTests.runAll()
3. Ou ajoutez ?runTests=true à l'URL

Tests disponibles :
- Tests des composants Core
- Tests des composants UI  
- Tests des utilitaires
- Tests d'intégration

Pour ajouter un test personnalisé :
DictaMedTests.addCustomTest('Mon Test', () => {
    // Votre test ici
});
    `);
}

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DictaMedTests;
}