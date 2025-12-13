/**
 * DictaMed - Script de Vérification du Mode Admin
 * Version: 1.0.0 - Vérifie que le mode admin fonctionne correctement
 */

class AdminModeVerification {
    constructor() {
        this.adminEmail = 'akio963@gmail.com';
        this.results = {
            adminNavigationManager: false,
            adminWebhooksPage: false,
            adminStyles: false,
            firebaseConfig: false,
            adminAccess: false,
            errors: []
        };
    }

    /**
     * Exécute toutes les vérifications
     */
    async runAllVerifications() {
        console.log('🔍 Début de la vérification du mode admin...');
        console.log('=========================================');

        try {
            // Vérifier AdminNavigationManager
            await this.verifyAdminNavigationManager();
            
            // Vérifier la page admin-webhooks.html
            await this.verifyAdminWebhooksPage();
            
            // Vérifier les styles admin
            await this.verifyAdminStyles();
            
            // Vérifier la configuration Firebase
            await this.verifyFirebaseConfig();
            
            // Vérifier l'accès admin
            await this.verifyAdminAccess();
            
            // Afficher les résultats
            this.displayResults();
            
        } catch (error) {
            console.error('❌ Erreur lors de la vérification:', error);
            this.results.errors.push(`Erreur générale: ${error.message}`);
        }
        
        return this.results;
    }

    /**
     * Vérifier AdminNavigationManager
     */
    async verifyAdminNavigationManager() {
        console.log('\n🔧 Vérification AdminNavigationManager...');
        
        try {
            // Vérifier si la classe existe
            if (typeof AdminNavigationManager === 'undefined') {
                throw new Error('AdminNavigationManager non trouvé');
            }
            
            // Créer une instance
            const manager = new AdminNavigationManager();
            
            // Vérifier les propriétés critiques
            if (manager.adminEmail !== this.adminEmail) {
                throw new Error(`Email admin incorrect: ${manager.adminEmail}`);
            }
            
            if (typeof manager.isAdmin !== 'function') {
                throw new Error('Méthode isAdmin manquante');
            }
            
            if (typeof manager.checkAdminAccess !== 'function') {
                throw new Error('Méthode checkAdminAccess manquante');
            }
            
            this.results.adminNavigationManager = true;
            console.log('✅ AdminNavigationManager: OK');
            
        } catch (error) {
            console.error('❌ AdminNavigationManager:', error.message);
            this.results.errors.push(`AdminNavigationManager: ${error.message}`);
        }
    }

    /**
     * Vérifier la page admin-webhooks.html
     */
    async verifyAdminWebhooksPage() {
        console.log('\n📄 Vérification admin-webhooks.html...');
        
        try {
            const response = await fetch('admin-webhooks.html', { method: 'HEAD' });
            if (!response.ok) {
                throw new Error(`Page admin-webhooks.html non accessible: ${response.status}`);
            }
            
            // Vérifier que la page contient les éléments critiques
            const content = await response.text();
            
            if (!content.includes('AdminWebhookManager')) {
                throw new Error('AdminWebhookManager non trouvé dans la page');
            }
            
            if (!content.includes('admin-webhook-styles.css')) {
                throw new Error('admin-webhook-styles.css non référencé');
            }
            
            this.results.adminWebhooksPage = true;
            console.log('✅ admin-webhooks.html: OK');
            
        } catch (error) {
            console.error('❌ admin-webhooks.html:', error.message);
            this.results.errors.push(`admin-webhooks.html: ${error.message}`);
        }
    }

    /**
     * Vérifier les styles admin
     */
    async verifyAdminStyles() {
        console.log('\n🎨 Vérification admin-webhook-styles.css...');
        
        try {
            const response = await fetch('admin-webhook-styles.css', { method: 'HEAD' });
            if (!response.ok) {
                throw new Error(`admin-webhook-styles.css non accessible: ${response.status}`);
            }
            
            this.results.adminStyles = true;
            console.log('✅ admin-webhook-styles.css: OK');
            
        } catch (error) {
            console.error('❌ admin-webhook-styles.css:', error.message);
            this.results.errors.push(`admin-webhook-styles.css: ${error.message}`);
        }
    }

    /**
     * Vérifier la configuration Firebase
     */
    async verifyFirebaseConfig() {
        console.log('\n🔥 Vérification configuration Firebase...');
        
        try {
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase non initialisé');
            }
            
            if (!firebase.apps || firebase.apps.length === 0) {
                throw new Error('Aucune application Firebase initialisée');
            }
            
            const config = firebase.apps[0].options;
            
            // Vérifier les propriétés critiques
            const requiredProps = ['apiKey', 'authDomain', 'projectId'];
            for (const prop of requiredProps) {
                if (!config[prop]) {
                    throw new Error(`Propriété Firebase manquante: ${prop}`);
                }
            }
            
            this.results.firebaseConfig = true;
            console.log('✅ Configuration Firebase: OK');
            
        } catch (error) {
            console.error('❌ Configuration Firebase:', error.message);
            this.results.errors.push(`Firebase: ${error.message}`);
        }
    }

    /**
     * Vérifier l'accès admin
     */
    async verifyAdminAccess() {
        console.log('\n🔐 Vérification accès admin...');
        
        try {
            // Vérifier si Firebase Auth est disponible
            if (typeof firebase === 'undefined' || !firebase.auth) {
                throw new Error('Firebase Auth non disponible');
            }
            
            const auth = firebase.auth();
            const currentUser = auth.currentUser;
            
            if (currentUser) {
                if (currentUser.email === this.adminEmail) {
                    this.results.adminAccess = true;
                    console.log('✅ Accès admin autorisé:', currentUser.email);
                } else {
                    console.log('ℹ️ Utilisateur connecté:', currentUser.email, '(non admin)');
                }
            } else {
                console.log('ℹ️ Aucun utilisateur connecté');
            }
            
        } catch (error) {
            console.error('❌ Vérification accès admin:', error.message);
            this.results.errors.push(`Accès admin: ${error.message}`);
        }
    }

    /**
     * Afficher les résultats de la vérification
     */
    displayResults() {
        console.log('\n=========================================');
        console.log('📊 RÉSULTATS DE LA VÉRIFICATION ADMIN');
        console.log('=========================================');
        
        const checks = [
            { name: 'AdminNavigationManager', key: 'adminNavigationManager' },
            { name: 'Page admin-webhooks.html', key: 'adminWebhooksPage' },
            { name: 'Styles admin-webhook-styles.css', key: 'adminStyles' },
            { name: 'Configuration Firebase', key: 'firebaseConfig' },
            { name: 'Accès admin', key: 'adminAccess' }
        ];
        
        let passedCount = 0;
        
        checks.forEach(check => {
            const status = this.results[check.key] ? '✅ PASS' : '❌ FAIL';
            console.log(`${check.name}: ${status}`);
            if (this.results[check.key]) passedCount++;
        });
        
        console.log(`\nTotal: ${passedCount}/${checks.length} vérifications réussies`);
        
        if (this.results.errors.length > 0) {
            console.log('\n❌ Erreurs détectées:');
            this.results.errors.forEach(error => {
                console.log(`  - ${error}`);
            });
        }
        
        console.log('\n🎯 Recommandations:');
        if (passedCount === checks.length) {
            console.log('✅ Toutes les vérifications passent! Le mode admin est opérationnel.');
        } else {
            console.log('⚠️ Certaines vérifications échouent. Corrigez les erreurs ci-dessus.');
        }
        
        console.log('\n📋 Informations admin:');
        console.log(`Email admin configuré: ${this.adminEmail}`);
        console.log(`Page d'accès: admin-webhooks.html`);
        
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            console.log(`Utilisateur actuel: ${user ? user.email : 'non connecté'}`);
        }
        
        console.log('=========================================');
    }
}

// Fonction globale pour exécuter la vérification
window.runAdminModeVerification = async function() {
    const verifier = new AdminModeVerification();
    return await verifier.runAllVerifications();
};

// Auto-exécution si appelé depuis la console
if (typeof window !== 'undefined') {
    console.log('🎯 DictaMed Admin Mode Verification chargé.');
    console.log('💡 Tapez runAdminModeVerification() pour lancer la vérification.');
}

export default AdminModeVerification;