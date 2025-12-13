/**
 * DictaMed - Test des corrections Firebase Authentication
 * Version: 1.0.0 - Test des améliorations apportées au système d'authentification
 */

class FirebaseAuthTestSuite {
    constructor() {
        this.testResults = [];
        this.isRunning = false;
    }

    /**
     * Exécution du test complet des corrections
     */
    async runAllTests() {
        console.log('🧪 === DÉMARRAGE DES TESTS DES CORRECTIONS AUTHENTIFICATION ===');
        this.isRunning = true;
        this.testResults = [];

        try {
            await this.testFirebaseAuthManagerInitialization();
            await this.testAdminNavigationManager();
            await this.testCompatibility();
            await this.testErrorHandling();
            
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Erreur lors des tests:', error);
            this.addTestResult('Test Suite Global', false, error.message);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Test de l'initialisation du FirebaseAuthManager
     */
    async testFirebaseAuthManagerInitialization() {
        try {
            console.log('🔍 Test: FirebaseAuthManager Initialization...');
            
            // Vérifier que FirebaseAuthManager existe
            if (typeof window.FirebaseAuthManager === 'undefined') {
                throw new Error('FirebaseAuthManager non défini');
            }

            // Vérifier que l'instance singleton fonctionne
            const instance1 = window.FirebaseAuthManager.getInstance();
            const instance2 = window.FirebaseAuthManager.getInstance();
            
            if (instance1 !== instance2) {
                throw new Error('Singleton pattern non respecté');
            }

            // Vérifier l'état d'initialisation
            if (instance1.isInitialized) {
                this.addTestResult('FirebaseAuthManager Init', true, 'Initialisé avec succès');
            } else {
                this.addTestResult('FirebaseAuthManager Init', true, 'Non encore initialisé (normal)');
            }

            // Tester la méthode ensureInitialized
            await instance1.ensureInitialized();
            if (instance1.isInitialized) {
                this.addTestResult('ensureInitialized Method', true, 'Méthode fonctionne correctement');
            } else {
                throw new Error('ensureInitialized n\'a pas initialisé le gestionnaire');
            }

        } catch (error) {
            this.addTestResult('FirebaseAuthManager Init', false, error.message);
        }
    }

    /**
     * Test du AdminNavigationManager
     */
    async testAdminNavigationManager() {
        try {
            console.log('🔍 Test: AdminNavigationManager...');
            
            // Vérifier que AdminNavigationManager existe
            if (typeof window.adminNavigationManager === 'undefined') {
                throw new Error('adminNavigationManager non défini');
            }

            const adminMgr = window.adminNavigationManager;

            // Vérifier les propriétés essentielles
            if (adminMgr.adminEmail !== 'akio963@gmail.com') {
                throw new Error('Email admin incorrect');
            }

            // Tester la méthode getCurrentUser
            const user = adminMgr.getCurrentUser();
            console.log('👤 Utilisateur actuel:', user ? user.email : 'null');

            // Tester debug
            adminMgr.debug();

            this.addTestResult('AdminNavigationManager', true, 'Gestionnaire fonctionnel');

        } catch (error) {
            this.addTestResult('AdminNavigationManager', false, error.message);
        }
    }

    /**
     * Test de compatibilité
     */
    async testCompatibility() {
        try {
            console.log('🔍 Test: Compatibility...');
            
            // Vérifier Firebase SDK
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK non chargé');
            }

            if (!firebase.apps || firebase.apps.length === 0) {
                throw new Error('Firebase non initialisé');
            }

            // Vérifier la configuration
            const app = firebase.app();
            const config = app.options;
            
            if (!config.apiKey || !config.projectId) {
                throw new Error('Configuration Firebase incomplète');
            }

            this.addTestResult('Firebase SDK', true, `SDK v${firebase.SDK_VERSION || 'unknown'} OK`);
            this.addTestResult('Firebase Config', true, 'Configuration valide');

        } catch (error) {
            this.addTestResult('Compatibility', false, error.message);
        }
    }

    /**
     * Test de la gestion d'erreurs
     */
    async testErrorHandling() {
        try {
            console.log('🔍 Test: Error Handling...');
            
            const authManager = window.FirebaseAuthManager;

            // Test de validation d'email invalide
            const invalidEmail = authManager.validateSignUpData('invalid-email', 'password123');
            if (invalidEmail.isValid) {
                throw new Error('Email invalide accepté');
            }

            // Test de validation de mot de passe faible
            const weakPassword = authManager.evaluatePasswordStrength('123');
            if (weakPassword.score >= 2) {
                throw new Error('Mot de passe faible accepté');
            }

            this.addTestResult('Error Handling', true, 'Validation et gestion d\'erreurs OK');

        } catch (error) {
            this.addTestResult('Error Handling', false, error.message);
        }
    }

    /**
     * Ajout d'un résultat de test
     */
    addTestResult(testName, success, details) {
        this.testResults.push({
            name: testName,
            success: success,
            details: details,
            timestamp: new Date().toLocaleTimeString()
        });
        
        const status = success ? '✅' : '❌';
        console.log(`${status} ${testName}: ${details}`);
    }

    /**
     * Génération du rapport de test
     */
    generateTestReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(result => result.success).length;
        const failedTests = totalTests - passedTests;
        
        const successRate = Math.round((passedTests / totalTests) * 100);
        
        console.log('\n📊 === RAPPORT DES TESTS DES CORRECTIONS ===');
        console.log(`Tests exécutés: ${totalTests}`);
        console.log(`Tests réussis: ${passedTests}`);
        console.log(`Tests échoués: ${failedTests}`);
        console.log(`Taux de réussite: ${successRate}%`);
        
        if (failedTests > 0) {
            console.log('\n❌ TESTS ÉCHOUÉS:');
            this.testResults
                .filter(result => !result.success)
                .forEach(result => {
                    console.log(`  • ${result.name}: ${result.details}`);
                });
        }
        
        if (successRate === 100) {
            console.log('\n🎉 TOUTES LES CORRECTIONS FONCTIONNENT PARFAITEMENT!');
        } else if (successRate >= 80) {
            console.log('\n⚠️ CORRECTIONS LARGEMENT FONCTIONNELLES - Quelques ajustements recommandés');
        } else {
            console.log('\n🚨 CORRECTIONS INCOMPLETES - Corrections supplémentaires requises');
        }

        // Affichage dans l'interface
        this.displayTestResultsInUI();
    }

    /**
     * Affichage des résultats dans l'interface
     */
    displayTestResultsInUI() {
        // Créer un élément pour afficher les résultats
        const testDiv = document.createElement('div');
        testDiv.id = 'auth-test-results';
        testDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: white;
            border: 2px solid #28a745;
            border-radius: 8px;
            padding: 15px;
            max-width: 400px;
            max-height: 300px;
            overflow-y: auto;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10001;
            font-family: monospace;
            font-size: 12px;
        `;
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(result => result.success).length;
        const successRate = Math.round((passedTests / totalTests) * 100);
        
        let html = `
            <h3 style="margin: 0 0 10px 0; color: #28a745;">🧪 Test des Corrections</h3>
            <div style="margin-bottom: 10px;">
                <strong>Tests:</strong> ${passedTests}/${totalTests} | 
                <strong>Réussite:</strong> ${successRate}%
            </div>
            <div style="max-height: 200px; overflow-y: auto;">
        `;
        
        this.testResults.forEach(result => {
            const status = result.success ? '✅' : '❌';
            const color = result.success ? '#28a745' : '#dc3545';
            html += `
                <div style="margin: 5px 0; color: ${color};">
                    ${status} <strong>${result.name}</strong><br>
                    <span style="font-size: 10px; color: #666;">${result.details}</span>
                </div>
            `;
        });
        
        html += '</div>';
        
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Fermer';
        closeButton.style.cssText = `
            margin-top: 10px;
            padding: 5px 10px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        closeButton.onclick = () => testDiv.remove();
        
        testDiv.innerHTML = html;
        testDiv.appendChild(closeButton);
        document.body.appendChild(testDiv);
        
        // Auto-suppression après 15 secondes
        setTimeout(() => {
            if (testDiv.parentNode) {
                testDiv.remove();
            }
        }, 15000);
    }
}

// Initialisation automatique du test
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.firebaseAuthTest = new FirebaseAuthTestSuite();
        });
    } else {
        window.firebaseAuthTest = new FirebaseAuthTestSuite();
    }
}

// Fonction globale pour lancer les tests
window.runFirebaseAuthTests = function() {
    if (window.firebaseAuthTest) {
        window.firebaseAuthTest.runAllTests();
    } else {
        console.error('Test suite non disponible');
    }
};

console.log('🧪 FirebaseAuthTestSuite chargé. Utilisez runFirebaseAuthTests() pour lancer les tests des corrections.');