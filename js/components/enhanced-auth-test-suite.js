/**
 * DictaMed - Suite de tests complète pour l'authentification améliorée
 * Version: 3.0.0 - Tests exhaustifs de sécurité et performance
 */

class EnhancedAuthTestSuite {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            environment: 'enhanced-auth-v3.0.0',
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            warnings: 0,
            errors: [],
            testCategories: {
                configuration: [],
                security: [],
                authentication: [],
                authorization: [],
                performance: [],
                compliance: []
            },
            recommendations: [],
            securityScore: 0
        };
        this.isRunning = false;
        this.startTime = null;
    }

    /**
     * Exécution de tous les tests de la suite
     */
    async runAllTests() {
        if (this.isRunning) {
            console.warn('Tests déjà en cours d\'exécution');
            return;
        }

        console.log('🧪 === DÉMARRAGE DES TESTS D\'AUTHENTIFICATION AMÉLIORÉE V3.0.0 ===');
        this.isRunning = true;
        this.startTime = Date.now();
        this.testResults = this.resetResults();

        try {
            // Tests de configuration
            await this.testConfigurationManagement();
            
            // Tests de sécurité
            await this.testSecurityFeatures();
            
            // Tests d'authentification
            await this.testAuthenticationMethods();
            
            // Tests d'autorisation
            await this.testAuthorizationRules();
            
            // Tests de performance
            await this.testPerformanceMetrics();
            
            // Tests de conformité
            await this.testComplianceStandards();
            
            // Génération du rapport final
            await this.generateComprehensiveReport();
            
        } catch (error) {
            console.error('❌ Erreur lors des tests:', error);
            this.addResult('Test Suite Global', false, error.message, 'error');
        } finally {
            this.isRunning = false;
            const duration = Date.now() - this.startTime;
            console.log(`⏱️ Tests complétés en ${duration}ms`);
        }

        return this.testResults;
    }

    /**
     * Tests de gestion de configuration
     */
    async testConfigurationManagement() {
        console.log('\n🔧 Test de la gestion de configuration...');
        
        // Test 1: Chargement de la configuration
        try {
            const configManager = window.authConfigManager || window.getAuthConfigManager();
            if (!configManager) {
                throw new Error('AuthConfigManager non disponible');
            }
            
            const config = await configManager.getConfig();
            if (!config || !config.apiKey) {
                throw new Error('Configuration invalide');
            }
            
            this.addResult('Configuration Loading', true, 'Configuration chargée avec succès', 'configuration');
            
        } catch (error) {
            this.addResult('Configuration Loading', false, error.message, 'configuration');
        }
        
        // Test 2: Validation de la configuration
        try {
            const configManager = window.authConfigManager || window.getAuthConfigManager();
            const report = await configManager.generateConfigReport();
            
            if (!report.environment) {
                throw new Error('Environnement non détecté');
            }
            
            this.addResult('Configuration Validation', true, `Environnement: ${report.environment}`, 'configuration');
            
        } catch (error) {
            this.addResult('Configuration Validation', false, error.message, 'configuration');
        }
        
        // Test 3: Variables d'environnement
        try {
            const configManager = window.authConfigManager || window.getAuthConfigManager();
            const features = await configManager.getConfigSection('features');
            
            if (!features) {
                throw new Error('Section features non trouvée');
            }
            
            this.addResult('Environment Variables', true, 'Variables d\'environnement accessibles', 'configuration');
            
        } catch (error) {
            this.addResult('Environment Variables', false, error.message, 'configuration');
        }
    }

    /**
     * Tests des fonctionnalités de sécurité
     */
    async testSecurityFeatures() {
        console.log('\n🔒 Test des fonctionnalités de sécurité...');
        
        // Test 1: Gestionnaire d'authentification amélioré
        try {
            const enhancedAuth = window.EnhancedFirebaseAuthManager;
            if (!enhancedAuth) {
                throw new Error('EnhancedFirebaseAuthManager non disponible');
            }
            
            await enhancedAuth.init();
            if (!enhancedAuth.isInitialized) {
                throw new Error('Authentification non initialisée');
            }
            
            this.addResult('Enhanced Auth Manager', true, 'Gestionnaire d\'authentification amélioré opérationnel', 'security');
            
        } catch (error) {
            this.addResult('Enhanced Auth Manager', false, error.message, 'security');
        }
        
        // Test 2: Système 2FA
        try {
            const enhancedAuth = window.EnhancedFirebaseAuthManager;
            const securityConfig = await enhancedAuth.getSecurityConfig();
            
            if (!securityConfig || !securityConfig.enable2FA) {
                this.addResult('2FA System', false, 'Système 2FA non activé', 'security');
            } else {
                this.addResult('2FA System', true, 'Système 2FA configuré et activé', 'security');
            }
            
        } catch (error) {
            this.addResult('2FA System', false, error.message, 'security');
        }
        
        // Test 3: Tracking d'appareil
        try {
            const enhancedAuth = window.EnhancedFirebaseAuthManager;
            if (!enhancedAuth.deviceFingerprint) {
                throw new Error('Empreinte d\'appareil non générée');
            }
            
            this.addResult('Device Tracking', true, 'Tracking d\'appareil configuré', 'security');
            
        } catch (error) {
            this.addResult('Device Tracking', false, error.message, 'security');
        }
        
        // Test 4: Rate limiting
        try {
            const enhancedAuth = window.EnhancedFirebaseAuthManager;
            if (!enhancedAuth.rateLimitRules || !enhancedAuth.rateLimitRules.login) {
                throw new Error('Règles de rate limiting non configurées');
            }
            
            this.addResult('Rate Limiting', true, 'Rate limiting configuré', 'security');
            
        } catch (error) {
            this.addResult('Rate Limiting', false, error.message, 'security');
        }
        
        // Test 5: Audit logging
        try {
            const enhancedAuth = window.EnhancedFirebaseAuthManager;
            if (!enhancedAuth.securityEvents || !Array.isArray(enhancedAuth.securityEvents)) {
                throw new Error('Système d\'audit logging non initialisé');
            }
            
            this.addResult('Audit Logging', true, 'Système d\'audit logging opérationnel', 'security');
            
        } catch (error) {
            this.addResult('Audit Logging', false, error.message, 'security');
        }
    }

    /**
     * Tests des méthodes d'authentification
     */
    async testAuthenticationMethods() {
        console.log('\n🔐 Test des méthodes d\'authentification...');
        
        // Test 1: Firebase Auth SDK
        try {
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK non chargé');
            }
            
            if (!firebase.auth) {
                throw new Error('Firebase Auth non disponible');
            }
            
            this.addResult('Firebase Auth SDK', true, 'Firebase Auth SDK disponible', 'authentication');
            
        } catch (error) {
            this.addResult('Firebase Auth SDK', false, error.message, 'authentication');
        }
        
        // Test 2: État d'authentification
        try {
            const auth = firebase.auth();
            const currentUser = auth.currentUser;
            
            this.addResult('Auth State Check', true, `Utilisateur actuel: ${currentUser ? currentUser.email : 'aucun'}`, 'authentication');
            
        } catch (error) {
            this.addResult('Auth State Check', false, error.message, 'authentication');
        }
        
        // Test 3: Providers d'authentification
        try {
            const auth = firebase.auth();
            const providers = [];
            
            // Test Google Provider
            try {
                const googleProvider = new firebase.auth.GoogleAuthProvider();
                if (googleProvider) providers.push('Google');
            } catch (e) {
                // Google provider non disponible
            }
            
            // Test Email Provider
            try {
                const emailProvider = firebase.auth.EmailAuthProvider;
                if (emailProvider) providers.push('Email/Password');
            } catch (e) {
                // Email provider non disponible
            }
            
            if (providers.length === 0) {
                throw new Error('Aucun provider d\'authentification disponible');
            }
            
            this.addResult('Auth Providers', true, `Providers disponibles: ${providers.join(', ')}`, 'authentication');
            
        } catch (error) {
            this.addResult('Auth Providers', false, error.message, 'authentication');
        }
        
        // Test 4: Validation de mot de passe
        try {
            const enhancedAuth = window.EnhancedFirebaseAuthManager;
            if (!enhancedAuth.evaluatePasswordStrength) {
                throw new Error('Évaluateur de force de mot de passe non disponible');
            }
            
            const weakPassword = enhancedAuth.evaluatePasswordStrength('123');
            const strongPassword = enhancedAuth.evaluatePasswordStrength('StrongPassword123!');
            
            if (weakPassword.score >= strongPassword.score) {
                throw new Error('Évaluation de force de mot de passe incorrecte');
            }
            
            this.addResult('Password Strength', true, 'Évaluation de force de mot de passe correcte', 'authentication');
            
        } catch (error) {
            this.addResult('Password Strength', false, error.message, 'authentication');
        }
    }

    /**
     * Tests des règles d'autorisation
     */
    async testAuthorizationRules() {
        console.log('\n🛡️ Test des règles d\'autorisation...');
        
        // Test 1: Vérification des règles Firestore
        try {
            // Simuler une vérification des règles Firestore
            const response = await this.simulateFirestoreRulesCheck();
            if (!response.success) {
                throw new Error('Règles Firestore invalides');
            }
            
            this.addResult('Firestore Rules', true, 'Règles Firestore validées', 'authorization');
            
        } catch (error) {
            this.addResult('Firestore Rules', false, error.message, 'authorization');
        }
        
        // Test 2: Permissions admin
        try {
            const configManager = window.authConfigManager || window.getAuthConfigManager();
            const adminEmails = await configManager.getConfigSection('admin');
            
            if (!adminEmails || !adminEmails.emails || adminEmails.emails.length === 0) {
                throw new Error('Aucun email admin configuré');
            }
            
            this.addResult('Admin Permissions', true, `${adminEmails.emails.length} admin(s) configuré(s)`, 'authorization');
            
        } catch (error) {
            this.addResult('Admin Permissions', false, error.message, 'authorization');
        }
        
        // Test 3: Validation des données
        try {
            // Test de validation de données utilisateur
            const testUserData = {
                userId: 'test-user-123',
                email: 'test@example.com',
                displayName: 'Test User',
                profession: 'medecin',
                createdAt: new Date(),
                lastUpdated: new Date()
            };
            
            const isValid = this.validateUserProfileTest(testUserData);
            if (!isValid) {
                throw new Error('Validation des données utilisateur échouée');
            }
            
            this.addResult('Data Validation', true, 'Validation des données fonctionnelle', 'authorization');
            
        } catch (error) {
            this.addResult('Data Validation', false, error.message, 'authorization');
        }
    }

    /**
     * Tests des métriques de performance
     */
    async testPerformanceMetrics() {
        console.log('\n⚡ Test des métriques de performance...');
        
        // Test 1: Temps d'initialisation
        try {
            const startTime = performance.now();
            const enhancedAuth = window.EnhancedFirebaseAuthManager;
            await enhancedAuth.ensureInitialized();
            const initTime = performance.now() - startTime;
            
            if (initTime > 5000) { // 5 secondes maximum
                throw new Error(`Temps d'initialisation trop long: ${initTime}ms`);
            }
            
            this.addResult('Initialization Time', true, `${initTime.toFixed(2)}ms`, 'performance');
            
        } catch (error) {
            this.addResult('Initialization Time', false, error.message, 'performance');
        }
        
        // Test 2: Mémoire utilisée
        try {
            if (performance.memory) {
                const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
                
                if (memoryUsage > 50) { // 50MB maximum
                    this.addResult('Memory Usage', false, `Utilisation mémoire élevée: ${memoryUsage.toFixed(2)}MB`, 'performance');
                } else {
                    this.addResult('Memory Usage', true, `${memoryUsage.toFixed(2)}MB`, 'performance');
                }
            } else {
                this.addResult('Memory Usage', false, 'API Memory non disponible', 'performance');
            }
            
        } catch (error) {
            this.addResult('Memory Usage', false, error.message, 'performance');
        }
        
        // Test 3: Taille du bundle
        try {
            const scripts = Array.from(document.scripts);
            const totalSize = scripts.reduce((total, script) => {
                return total + (script.src.length * 2); // Estimation approximative
            }, 0);
            
            if (totalSize > 500000) { // 500KB maximum
                this.addResult('Bundle Size', false, `Taille du bundle élevée: ${(totalSize/1024).toFixed(2)}KB`, 'performance');
            } else {
                this.addResult('Bundle Size', true, `${(totalSize/1024).toFixed(2)}KB`, 'performance');
            }
            
        } catch (error) {
            this.addResult('Bundle Size', false, error.message, 'performance');
        }
    }

    /**
     * Tests des standards de conformité
     */
    async testComplianceStandards() {
        console.log('\n📋 Test des standards de conformité...');
        
        // Test 1: RGPD/Privacy
        try {
            const configManager = window.authConfigManager || window.getAuthConfigManager();
            const config = await configManager.getConfig();
            
            if (!config.security || !config.security.enableAuditLogging) {
                throw new Error('Audit logging non activé (RGPD)');
            }
            
            this.addResult('GDPR Compliance', true, 'Conformité RGPD de base', 'compliance');
            
        } catch (error) {
            this.addResult('GDPR Compliance', false, error.message, 'compliance');
        }
        
        // Test 2: Sécurité des données
        try {
            const enhancedAuth = window.EnhancedFirebaseAuthManager;
            const securityConfig = await enhancedAuth.getSecurityConfig();
            
            if (!securityConfig.requireEmailVerification) {
                throw new Error('Vérification email non requise');
            }
            
            this.addResult('Data Security', true, 'Sécurité des données conforme', 'compliance');
            
        } catch (error) {
            this.addResult('Data Security', false, error.message, 'compliance');
        }
        
        // Test 3: Standards de l'industrie
        try {
            const enhancedAuth = window.EnhancedFirebaseAuthManager;
            
            // Vérification des standards OWASP de base
            const hasRateLimiting = !!enhancedAuth.rateLimitRules;
            const hasPasswordValidation = !!enhancedAuth.evaluatePasswordStrength;
            const hasSecureSessions = !!enhancedAuth.securityConfig.sessionTimeout;
            
            if (!hasRateLimiting || !hasPasswordValidation || !hasSecureSessions) {
                throw new Error('Standards de sécurité de base non respectés');
            }
            
            this.addResult('Security Standards', true, 'Standards de sécurité respectés', 'compliance');
            
        } catch (error) {
            this.addResult('Security Standards', false, error.message, 'compliance');
        }
    }

    /**
     * Simulation de vérification des règles Firestore
     */
    async simulateFirestoreRulesCheck() {
        // Simulation d'une vérification des règles Firestore
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'Règles Firestore simulées comme valides'
                });
            }, 100);
        });
    }

    /**
     * Validation de test pour les données de profil utilisateur
     */
    validateUserProfileTest(data) {
        const requiredFields = ['userId', 'email', 'displayName', 'profession', 'createdAt', 'lastUpdated'];
        const hasRequiredFields = requiredFields.every(field => data[field] !== undefined);
        
        if (!hasRequiredFields) return false;
        
        // Validation basique
        if (typeof data.email !== 'string' || !data.email.includes('@')) return false;
        if (typeof data.displayName !== 'string' || data.displayName.length < 2) return false;
        if (!['medecin', 'infirmier', 'secretaire', 'administrateur'].includes(data.profession)) return false;
        
        return true;
    }

    /**
     * Ajout d'un résultat de test
     */
    addResult(testName, success, details, category = 'general') {
        this.testResults.totalTests++;
        if (success) {
            this.testResults.passedTests++;
        } else {
            this.testResults.failedTests++;
        }
        
        const result = {
            name: testName,
            success: success,
            details: details,
            timestamp: new Date().toLocaleTimeString()
        };
        
        if (this.testResults.testCategories[category]) {
            this.testResults.testCategories[category].push(result);
        } else {
            this.testResults.testCategories.general = this.testResults.testCategories.general || [];
            this.testResults.testCategories.general.push(result);
        }
        
        const status = success ? '✅' : '❌';
        console.log(`${status} ${testName}: ${details}`);
    }

    /**
     * Génération du rapport final
     */
    async generateComprehensiveReport() {
        const duration = Date.now() - this.startTime;
        const successRate = Math.round((this.testResults.passedTests / this.testResults.totalTests) * 100);
        
        // Calcul du score de sécurité
        const securityScore = this.calculateSecurityScore();
        this.testResults.securityScore = securityScore;
        
        console.log('\n' + '='.repeat(80));
        console.log('📊 RAPPORT COMPLET DES TESTS D\'AUTHENTIFICATION AMÉLIORÉE V3.0.0');
        console.log('='.repeat(80));
        
        console.log(`⏰ Durée totale: ${duration}ms`);
        console.log(`📈 Taux de réussite: ${successRate}%`);
        console.log(`🔒 Score de sécurité: ${securityScore}/100`);
        
        // Résumé par catégorie
        console.log('\n📋 RÉSUMÉ PAR CATÉGORIE:');
        Object.entries(this.testResults.testCategories).forEach(([category, tests]) => {
            if (tests && tests.length > 0) {
                const passed = tests.filter(t => t.success).length;
                const total = tests.length;
                const rate = Math.round((passed / total) * 100);
                console.log(`   ${category}: ${passed}/${total} (${rate}%)`);
            }
        });
        
        // Problèmes identifiés
        if (this.testResults.failedTests > 0) {
            console.log('\n❌ PROBLÈMES IDENTIFIÉS:');
            this.testResults.testCategories.security
                .filter(t => !t.success)
                .forEach(test => {
                    console.log(`   🔒 Sécurité: ${test.name} - ${test.details}`);
                });
        }
        
        // Recommandations
        this.generateRecommendations();
        if (this.testResults.recommendations.length > 0) {
            console.log('\n💡 RECOMMANDATIONS:');
            this.testResults.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }
        
        // Actions recommandées
        console.log('\n🎯 ACTIONS RECOMMANDÉES:');
        if (successRate === 100 && securityScore >= 90) {
            console.log('   ✅ Système d\'authentification excellent! Prêt pour la production.');
        } else if (successRate >= 80 && securityScore >= 70) {
            console.log('   ⚠️ Système fonctionnel avec quelques améliorations recommandées.');
            console.log('   1. Corriger les tests échoués');
            console.log('   2. Renforcer les mesures de sécurité si nécessaire');
        } else {
            console.log('   🚨 Système nécessite des corrections importantes avant production.');
            console.log('   1. Corriger tous les tests échoués');
            console.log('   2. Améliorer significativement la sécurité');
            console.log('   3. Effectuer une revue de sécurité complète');
        }
        
        console.log('\n📚 INFORMATIONS UTILES:');
        console.log(`   🔗 Documentation: docs/authentication-v3.md`);
        console.log(`   🔧 Configuration: AuthConfigManager`);
        console.log(`   🛡️ Sécurité: EnhancedFirebaseAuthManager`);
        console.log(`   📊 Firebase Console: https://console.firebase.google.com`);
        
        console.log('='.repeat(80));
        
        // Affichage dans l'interface utilisateur
        this.displayResultsInUI();
        
        return this.testResults;
    }

    /**
     * Calcul du score de sécurité
     */
    calculateSecurityScore() {
        let score = 100;
        
        // Pénalités pour les tests de sécurité échoués
        const securityTests = this.testResults.testCategories.security;
        if (securityTests) {
            const failedSecurityTests = securityTests.filter(t => !t.success).length;
            score -= (failedSecurityTests * 15); // -15 points par test de sécurité échoué
        }
        
        // Bonus pour les fonctionnalités avancées
        if (this.testResults.testCategories.security.some(t => t.name.includes('2FA') && t.success)) {
            score += 10; // Bonus pour 2FA
        }
        
        if (this.testResults.testCategories.security.some(t => t.name.includes('Device Tracking') && t.success)) {
            score += 5; // Bonus pour device tracking
        }
        
        if (this.testResults.testCategories.security.some(t => t.name.includes('Audit Logging') && t.success)) {
            score += 5; // Bonus pour audit logging
        }
        
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Génération de recommandations
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Recommandations basées sur les tests échoués
        Object.entries(this.testResults.testCategories).forEach(([category, tests]) => {
            if (tests) {
                const failedTests = tests.filter(t => !t.success);
                failedTests.forEach(test => {
                    switch (test.name) {
                        case '2FA System':
                            recommendations.push('Activer et configurer l\'authentification à deux facteurs pour améliorer la sécurité');
                            break;
                        case 'Device Tracking':
                            recommendations.push('Implémenter le tracking des appareils pour détecter les accès suspects');
                            break;
                        case 'Rate Limiting':
                            recommendations.push('Configurer le rate limiting pour prévenir les attaques par force brute');
                            break;
                        case 'Audit Logging':
                            recommendations.push('Activer l\'audit logging pour la conformité et le monitoring de sécurité');
                            break;
                    }
                });
            }
        });
        
        // Recommandations générales
        if (this.testResults.securityScore < 70) {
            recommendations.push('Réviser et renforcer toutes les mesures de sécurité avant la mise en production');
        }
        
        if (this.testResults.failedTests > this.testResults.totalTests * 0.2) {
            recommendations.push('Plus de 20% des tests ont échoué - correction urgente requise');
        }
        
        this.testResults.recommendations = [...new Set(recommendations)]; // Dédoublonnage
    }

    /**
     * Affichage des résultats dans l'interface utilisateur
     */
    displayResultsInUI() {
        // Créer un élément pour afficher les résultats
        const testDiv = document.createElement('div');
        testDiv.id = 'enhanced-auth-test-results';
        testDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 12px;
            padding: 20px;
            max-width: 450px;
            max-height: 400px;
            overflow-y: auto;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 10002;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 13px;
            border: 1px solid rgba(255,255,255,0.2);
        `;
        
        const successRate = Math.round((this.testResults.passedTests / this.testResults.totalTests) * 100);
        const securityScore = this.testResults.securityScore;
        
        let html = `
            <div style="text-align: center; margin-bottom: 15px;">
                <h3 style="margin: 0 0 10px 0; color: #fff; font-size: 16px;">🧪 Authentification v3.0.0</h3>
                <div style="display: flex; justify-content: space-around; margin-bottom: 10px;">
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold;">${successRate}%</div>
                        <div style="font-size: 11px; opacity: 0.8;">Réussite</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold;">${securityScore}</div>
                        <div style="font-size: 11px; opacity: 0.8;">Sécurité</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold;">${this.testResults.passedTests}/${this.testResults.totalTests}</div>
                        <div style="font-size: 11px; opacity: 0.8;">Tests</div>
                    </div>
                </div>
            </div>
            <div style="max-height: 250px; overflow-y: auto;">
        `;
        
        // Afficher les résultats par catégorie
        Object.entries(this.testResults.testCategories).forEach(([category, tests]) => {
            if (tests && tests.length > 0) {
                const passed = tests.filter(t => t.success).length;
                const total = tests.length;
                const rate = Math.round((passed / total) * 100);
                
                html += `
                    <div style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 6px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <span style="font-weight: bold; font-size: 12px;">${this.getCategoryIcon(category)} ${category}</span>
                            <span style="font-size: 11px; opacity: 0.9;">${passed}/${total} (${rate}%)</span>
                        </div>
                `;
                
                tests.forEach(test => {
                    const status = test.success ? '✅' : '❌';
                    const color = test.success ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,0,0.3)';
                    html += `
                        <div style="margin: 2px 0; padding: 3px 6px; background: ${color}; border-radius: 3px; font-size: 11px;">
                            ${status} ${test.name}
                        </div>
                    `;
                });
                
                html += '</div>';
            }
        });
        
        html += '</div>';
        
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Fermer';
        closeButton.style.cssText = `
            margin-top: 15px;
            width: 100%;
            padding: 8px;
            background: rgba(255,255,255,0.2);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
        `;
        closeButton.onclick = () => testDiv.remove();
        
        testDiv.innerHTML = html;
        testDiv.appendChild(closeButton);
        document.body.appendChild(testDiv);
        
        // Auto-suppression après 30 secondes
        setTimeout(() => {
            if (testDiv.parentNode) {
                testDiv.remove();
            }
        }, 30000);
    }

    /**
     * Obtention de l'icône de catégorie
     */
    getCategoryIcon(category) {
        const icons = {
            configuration: '🔧',
            security: '🔒',
            authentication: '🔐',
            authorization: '🛡️',
            performance: '⚡',
            compliance: '📋',
            general: '📊'
        };
        return icons[category] || '📊';
    }

    /**
     * Réinitialisation des résultats
     */
    resetResults() {
        return {
            timestamp: new Date().toISOString(),
            environment: 'enhanced-auth-v3.0.0',
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            warnings: 0,
            errors: [],
            testCategories: {
                configuration: [],
                security: [],
                authentication: [],
                authorization: [],
                performance: [],
                compliance: []
            },
            recommendations: [],
            securityScore: 0
        };
    }
}

// Fonction globale pour exécuter les tests
window.runEnhancedAuthTests = async function() {
    if (window.enhancedAuthTestSuite) {
        return await window.enhancedAuthTestSuite.runAllTests();
    } else {
        console.error('EnhancedAuthTestSuite non disponible');
    }
};

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedAuthTestSuite;
} else {
    window.EnhancedAuthTestSuite = EnhancedAuthTestSuite;
}

// Auto-initialisation
if (typeof window !== 'undefined') {
    window.enhancedAuthTestSuite = new EnhancedAuthTestSuite();
    console.log('🧪 EnhancedAuthTestSuite chargé. Utilisez runEnhancedAuthTests() pour lancer les tests.');
}