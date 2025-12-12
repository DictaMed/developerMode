/**
 * DictaMed - Test de vérification Firebase Authentication
 * Version: 1.0.0 - Diagnostic complet du système d'authentification
 */

class AuthSystemDiagnostic {
    constructor() {
        this.testResults = [];
        this.isRunning = false;
    }

    /**
     * Exécution du diagnostic complet
     */
    async runFullDiagnostic() {
        console.log('🔍 Démarrage du diagnostic complet Firebase Authentication...');
        this.isRunning = true;
        this.testResults = [];

        try {
            // Tests de base
            await this.testFirebaseSDK();
            await this.testFirebaseInitialization();
            await this.testFirebaseConfig();
            await this.testSDKCompatibility();
            await this.testAuthManager();
            await this.testPasswordStrength();
            await this.testErrorHandling();
            
            // Test de l'interface utilisateur
            await this.testUIElements();
            
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Erreur lors du diagnostic:', error);
            this.addResult('Diagnostic Global', false, error.message);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Test de la disponibilité du SDK Firebase
     */
    async testFirebaseSDK() {
        try {
            // Vérification de la disponibilité de Firebase
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK non chargé - Vérifiez les scripts CDN');
            }
            
            // Vérification des modules Firebase
            if (!firebase.app) {
                throw new Error('firebase.app non disponible - firebase-app.js manquant');
            }
            
            if (!firebase.auth) {
                throw new Error('firebase.auth non disponible - firebase-auth.js manquant');
            }
            
            // Vérification de la version
            if (firebase.SDK_VERSION) {
                this.addResult('Firebase SDK', true, `SDK v${firebase.SDK_VERSION} chargé correctement`);
            } else {
                this.addResult('Firebase SDK', true, 'SDK Firebase chargé correctement (version non détectée)');
            }
        } catch (error) {
            this.addResult('Firebase SDK', false, error.message);
        }
    }

    /**
     * Test de l'initialisation Firebase
     */
    async testFirebaseInitialization() {
        try {
            // Vérification des applications Firebase
            if (!firebase.apps || firebase.apps.length === 0) {
                throw new Error('Firebase non initialisé - initializeApp() non appelé');
            }
            
            const app = firebase.app();
            const auth = firebase.auth();
            
            if (!auth) {
                throw new Error('Firebase Auth non disponible - Vérifiez firebase-auth.js');
            }
            
            // Vérification de la configuration de l'app
            const config = app.options;
            if (!config.apiKey || !config.projectId) {
                throw new Error('Configuration Firebase incomplète');
            }
            
            this.addResult('Firebase Initialization', true, `App: ${app.name}, Projet: ${config.projectId}`);
        } catch (error) {
            this.addResult('Firebase Initialization', false, error.message);
        }
    }

    /**
     * Test de compatibilité SDK Firebase
     */
    async testSDKCompatibility() {
        try {
            // Vérification du type de SDK utilisé
            const isCompatSDK = typeof firebase.app === 'function' && firebase.app.compat;
            const isModularSDK = typeof firebase.app === 'function' && !firebase.app.compat;
            
            let sdkType = 'Inconnu';
            if (isCompatSDK) {
                sdkType = 'Compat SDK (v8)';
            } else if (isModularSDK) {
                sdkType = 'Modular SDK (v9+)';
            }
            
            // Vérification de la disponibilité des providers
            const auth = firebase.auth();
            const googleProvider = new firebase.auth.GoogleAuthProvider();
            
            if (!googleProvider) {
                throw new Error('GoogleAuthProvider non disponible - Vérifiez firebase-auth.js');
            }
            
            this.addResult('SDK Compatibility', true, `${sdkType} - Google Provider OK`);
        } catch (error) {
            this.addResult('SDK Compatibility', false, error.message);
        }
    }

    /**
     * Test du gestionnaire d'authentification
     */
    async testAuthManager() {
        try {
            if (typeof window.FirebaseAuthManager === 'undefined') {
                throw new Error('FirebaseAuthManager non défini - Vérifiez firebase-auth-manager.js');
            }
            
            const authManager = window.FirebaseAuthManager;
            
            // Test des méthodes essentielles
            const requiredMethods = [
                'getCurrentUser',
                'isAuthenticated',
                'signUp',
                'signIn',
                'signOut',
                'evaluatePasswordStrength'
            ];
            
            const missingMethods = requiredMethods.filter(method =>
                typeof authManager[method] !== 'function'
            );
            
            if (missingMethods.length > 0) {
                throw new Error(`Méthodes manquantes: ${missingMethods.join(', ')}`);
            }
            
            // Test de l'instance singleton
            if (typeof authManager.getInstance === 'function') {
                const instance1 = authManager.getInstance();
                const instance2 = authManager.getInstance();
                
                if (instance1 !== instance2) {
                    throw new Error('Singleton pattern non respecté');
                }
            }
            
            // Test de l'état d'initialisation
            if (typeof authManager.isInitialized !== 'undefined' && !authManager.isInitialized) {
                this.addResult('FirebaseAuthManager', true, 'Méthodes disponibles - Non initialisé');
            } else {
                this.addResult('FirebaseAuthManager', true, 'Toutes les méthodes disponibles');
            }
        } catch (error) {
            this.addResult('FirebaseAuthManager', false, error.message);
        }
    }

    /**
     * Test de l'évaluation de force du mot de passe
     */
    async testPasswordStrength() {
        try {
            const authManager = window.FirebaseAuthManager;
            
            // Test avec différents mots de passe
            const testPasswords = [
                { password: '123', expectedMinScore: 0 },
                { password: 'password', expectedMinScore: 1 },
                { password: 'Password123', expectedMinScore: 3 },
                { password: 'StrongPass123!', expectedMinScore: 4 }
            ];
            
            for (const test of testPasswords) {
                const result = authManager.evaluatePasswordStrength(test.password);
                
                if (result.score < test.expectedMinScore) {
                    throw new Error(`Score trop faible pour "${test.password}": ${result.score}`);
                }
                
                if (!result.strength || !result.feedback) {
                    throw new Error('Structure de résultat invalide');
                }
            }
            
            this.addResult('Password Strength', true, 'Évaluation correcte pour tous les tests');
        } catch (error) {
            this.addResult('Password Strength', false, error.message);
        }
    }

    /**
     * Test de la gestion d'erreurs
     */
    async testErrorHandling() {
        try {
            const authManager = window.FirebaseAuthManager;
            
            // Test de validation d'email
            const invalidEmails = ['', 'invalid', '@domain.com', 'user@'];
            const validEmails = ['user@example.com', 'test@domain.fr'];
            
            for (const email of invalidEmails) {
                const validation = authManager.validateSignUpData(email, 'password123');
                if (validation.isValid) {
                    throw new Error(`Email invalide accepté: ${email}`);
                }
            }
            
            for (const email of validEmails) {
                const validation = authManager.validateSignUpData(email, 'password123');
                if (!validation.isValid) {
                    throw new Error(`Email valide rejeté: ${email}`);
                }
            }
            
            this.addResult('Error Handling', true, 'Validation et gestion d\'erreurs correctes');
        } catch (error) {
            this.addResult('Error Handling', false, error.message);
        }
    }

    /**
     * Test de la configuration Firebase
     */
    async testFirebaseConfig() {
        try {
            if (!firebase.apps || firebase.apps.length === 0) {
                throw new Error('Firebase non initialisé');
            }
            
            const app = firebase.app();
            const config = app.options;
            
            // Vérification des champs essentiels
            const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
            const missingFields = requiredFields.filter(field => !config[field]);
            
            if (missingFields.length > 0) {
                throw new Error(`Configuration incomplète: ${missingFields.join(', ')}`);
            }
            
            // Vérification du format des champs
            if (!config.apiKey.startsWith('AIza')) {
                throw new Error('API Key semble invalide (doit commencer par AIza)');
            }
            
            if (!config.authDomain.includes('firebaseapp.com')) {
                throw new Error('Auth Domain semble invalide');
            }
            
            if (!config.projectId || config.projectId.length < 5) {
                throw new Error('Project ID semble invalide');
            }
            
            this.addResult('Firebase Config', true, 'Configuration valide');
        } catch (error) {
            this.addResult('Firebase Config', false, error.message);
        }
    }

    /**
     * Test des éléments d'interface utilisateur
     */
    async testUIElements() {
        try {
            const requiredElements = [
                'authModal',
                'authButton',
                'authButtonText',
                'modalEmailInput',
                'modalPasswordInput',
                'modalEmailSubmitBtn'
            ];
            
            const missingElements = requiredElements.filter(elementId =>
                !document.getElementById(elementId)
            );
            
            if (missingElements.length > 0) {
                throw new Error(`Éléments manquants: ${missingElements.join(', ')}`);
            }
            
            // Test de l'instance AuthModalSystem
            if (typeof window.AuthModalSystem === 'undefined') {
                throw new Error('AuthModalSystem non défini');
            }
            
            this.addResult('UI Elements', true, 'Tous les éléments requis présents');
        } catch (error) {
            this.addResult('UI Elements', false, error.message);
        }
    }

    /**
     * Ajout d'un résultat de test
     */
    addResult(testName, success, details) {
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
     * Génération du rapport final
     */
    generateReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(result => result.success).length;
        const failedTests = totalTests - passedTests;
        
        const successRate = Math.round((passedTests / totalTests) * 100);
        
        console.log('\n📊 === RAPPORT DE DIAGNOSTIC ===');
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
            console.log('\n🎉 SYSTÈME D\'AUTHENTIFICATION OPÉRATIONNEL!');
        } else if (successRate >= 80) {
            console.log('\n⚠️ SYSTÈME LARGEMENT FONCTIONNEL - Quelques ajustements recommandés');
        } else {
            console.log('\n🚨 SYSTÈME NON FONCTIONNEL - Corrections urgentes requises');
        }
        
        // Affichage dans l'interface si possible
        this.displayResultsInUI();
    }

    /**
     * Affichage des résultats dans l'interface
     */
    displayResultsInUI() {
        // Créer un élément pour afficher les résultats
        const diagnosticDiv = document.createElement('div');
        diagnosticDiv.id = 'auth-diagnostic-results';
        diagnosticDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 15px;
            max-width: 400px;
            max-height: 300px;
            overflow-y: auto;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            font-family: monospace;
            font-size: 12px;
        `;
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(result => result.success).length;
        const successRate = Math.round((passedTests / totalTests) * 100);
        
        let html = `
            <h3 style="margin: 0 0 10px 0; color: #333;">🔍 Diagnostic Authentification</h3>
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
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        closeButton.onclick = () => diagnosticDiv.remove();
        
        diagnosticDiv.innerHTML = html;
        diagnosticDiv.appendChild(closeButton);
        document.body.appendChild(diagnosticDiv);
        
        // Auto-suppression après 10 secondes
        setTimeout(() => {
            if (diagnosticDiv.parentNode) {
                diagnosticDiv.remove();
            }
        }, 10000);
    }
}

// Initialisation automatique du diagnostic
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.authDiagnostic = new AuthSystemDiagnostic();
        });
    } else {
        window.authDiagnostic = new AuthSystemDiagnostic();
    }
}

// Fonction globale pour lancer le diagnostic
window.runAuthDiagnostic = function() {
    if (window.authDiagnostic) {
        window.authDiagnostic.runFullDiagnostic();
    } else {
        console.error('Diagnostic non disponible');
    }
};

console.log('🔍 AuthSystemDiagnostic chargé. Utilisez runAuthDiagnostic() pour lancer les tests.');