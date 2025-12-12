/**
 * DictaMed - Script d'Administration des Webhooks Utilisateur
 * Version: 1.0.0 - Outil pour gérer les webhooks via Firebase Console
 */

// ===== CONFIGURATION =====
const WEBHOOK_ADMIN_CONFIG = {
    // URLs par défaut pour les différents modes
    DEFAULT_WEBHOOKS: {
        normal: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedNormalMode',
        test: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed',
        dmi: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed'
    },
    
    // Template pour générer des webhooks personnalisés
    WEBHOOK_TEMPLATE: {
        baseUrl: 'https://n8n.srv1104707.hstgr.cloud/webhook',
        modes: {
            normal: 'DictaMedNormalMode',
            test: 'DictaMed',
            dmi: 'DictaMed'
        }
    }
};

// ===== FONCTIONS D'ADMINISTRATION =====

/**
 * Assigne un webhook à un utilisateur
 * @param {string} userId - UID de l'utilisateur Firebase
 * @param {string} webhookUrl - URL du webhook
 * @param {boolean} isActive - Statut actif/inactif
 * @param {string} notes - Notes optionnelles
 */
async function assignWebhookToUser(userId, webhookUrl, isActive = true, notes = '') {
    try {
        console.log(`🔧 Assignation du webhook à l'utilisateur: ${userId}`);
        
        // Validation des paramètres
        if (!userId || !webhookUrl) {
            throw new Error('userId et webhookUrl sont requis');
        }
        
        // Validation de l'URL
        if (!isValidWebhookUrl(webhookUrl)) {
            throw new Error('URL de webhook invalide');
        }
        
        // Préparation des données
        const webhookData = {
            webhookUrl: webhookUrl.trim(),
            isActive: Boolean(isActive),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastUsed: null,
            lastUsedMode: null,
            usageCount: 0,
            notes: notes.trim(),
            adminAssigned: true,
            assignedBy: 'admin_script'
        };
        
        // Enregistrement dans Firestore
        const db = firebase.firestore();
        await db.collection('userWebhooks').doc(userId).set(webhookData, { merge: true });
        
        console.log(`✅ Webhook assigné avec succès à l'utilisateur ${userId}`);
        console.log(`📡 URL: ${webhookUrl}`);
        console.log(`📝 Notes: ${notes || 'Aucune'}`);
        
        return {
            success: true,
            userId: userId,
            webhookUrl: webhookUrl,
            message: 'Webhook assigné avec succès'
        };
        
    } catch (error) {
        console.error(`❌ Erreur lors de l'assignation du webhook:`, error);
        return {
            success: false,
            userId: userId,
            error: error.message
        };
    }
}

/**
 * Assigne des webhooks par défaut à un utilisateur
 * @param {string} userId - UID de l'utilisateur Firebase
 * @param {string} notes - Notes optionnelles
 */
async function assignDefaultWebhooks(userId, notes = '') {
    try {
        console.log(`🔧 Assignation des webhooks par défaut à l'utilisateur: ${userId}`);
        
        const assignments = [];
        
        for (const [mode, url] of Object.entries(WEBHOOK_ADMIN_CONFIG.DEFAULT_WEBHOOKS)) {
            const result = await assignWebhookToUser(userId, url, true, notes);
            assignments.push(result);
        }
        
        const successCount = assignments.filter(r => r.success).length;
        console.log(`✅ ${successCount}/${assignments.length} webhooks assignés avec succès`);
        
        return {
            success: successCount === assignments.length,
            userId: userId,
            assignments: assignments
        };
        
    } catch (error) {
        console.error(`❌ Erreur lors de l'assignation des webhooks par défaut:`, error);
        return {
            success: false,
            userId: userId,
            error: error.message
        };
    }
}

/**
 * Désactive le webhook d'un utilisateur
 * @param {string} userId - UID de l'utilisateur Firebase
 * @param {string} reason - Raison de la désactivation
 */
async function deactivateUserWebhook(userId, reason = 'Désactivé par l\'administrateur') {
    try {
        console.log(`🔧 Désactivation du webhook pour l'utilisateur: ${userId}`);
        
        const db = firebase.firestore();
        await db.collection('userWebhooks').doc(userId).update({
            isActive: false,
            deactivatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            deactivationReason: reason
        });
        
        console.log(`✅ Webhook désactivé pour l'utilisateur ${userId}`);
        
        return {
            success: true,
            userId: userId,
            message: 'Webhook désactivé avec succès'
        };
        
    } catch (error) {
        console.error(`❌ Erreur lors de la désactivation du webhook:`, error);
        return {
            success: false,
            userId: userId,
            error: error.message
        };
    }
}

/**
 * Récupère les informations de webhook d'un utilisateur
 * @param {string} userId - UID de l'utilisateur Firebase
 */
async function getUserWebhookInfo(userId) {
    try {
        const db = firebase.firestore();
        const doc = await db.collection('userWebhooks').doc(userId).get();
        
        if (doc.exists) {
            const data = doc.data();
            console.log(`📊 Informations webhook pour ${userId}:`, data);
            return {
                success: true,
                userId: userId,
                data: data
            };
        } else {
            console.log(`ℹ️ Aucun webhook trouvé pour l'utilisateur ${userId}`);
            return {
                success: false,
                userId: userId,
                message: 'Aucun webhook trouvé'
            };
        }
        
    } catch (error) {
        console.error(`❌ Erreur lors de la récupération des informations:`, error);
        return {
            success: false,
            userId: userId,
            error: error.message
        };
    }
}

/**
 * Liste tous les webhooks utilisateur avec statistiques
 */
async function listAllUserWebhooks() {
    try {
        console.log('📋 Récupération de tous les webhooks utilisateur...');
        
        const db = firebase.firestore();
        const snapshot = await db.collection('userWebhooks').get();
        
        const webhooks = [];
        snapshot.forEach(doc => {
            webhooks.push({
                userId: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`📊 Total: ${webhooks.length} webhooks trouvés`);
        
        // Statistiques
        const stats = {
            total: webhooks.length,
            active: webhooks.filter(w => w.isActive).length,
            inactive: webhooks.filter(w => !w.isActive).length,
            withUsage: webhooks.filter(w => w.usageCount > 0).length
        };
        
        console.log('📈 Statistiques:', stats);
        
        return {
            success: true,
            webhooks: webhooks,
            stats: stats
        };
        
    } catch (error) {
        console.error(`❌ Erreur lors de la récupération des webhooks:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Valide une URL de webhook
 * @param {string} url - URL à valider
 */
function isValidWebhookUrl(url) {
    try {
        if (!url || typeof url !== 'string') {
            return false;
        }
        
        const urlObj = new URL(url);
        
        // Doit être HTTPS
        if (urlObj.protocol !== 'https:') {
            return false;
        }
        
        // Doit contenir "webhook" dans le path (indicateur générique)
        if (!urlObj.pathname.toLowerCase().includes('webhook')) {
            console.warn('⚠️ L\'URL ne contient pas "webhook" dans le path');
            // Ne pas bloquer pour cette vérification
        }
        
        // Longueur raisonnable
        if (url.length < 10 || url.length > 2048) {
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.warn('⚠️ URL invalide:', error.message);
        return false;
    }
}

/**
 * Génère un rapport de tous les utilisateurs sans webhook
 */
async function findUsersWithoutWebhooks() {
    try {
        console.log('🔍 Recherche des utilisateurs sans webhook...');
        
        // Récupérer tous les utilisateurs Firebase Auth
        const authUsers = await firebase.auth().listUsers(1000);
        const userIds = authUsers.users.map(user => user.uid);
        
        // Récupérer tous les webhooks existants
        const db = firebase.firestore();
        const webhooksSnapshot = await db.collection('userWebhooks').get();
        const existingWebhookIds = new Set();
        webhooksSnapshot.forEach(doc => {
            existingWebhookIds.add(doc.id);
        });
        
        // Identifier les utilisateurs sans webhook
        const usersWithoutWebhooks = userIds.filter(userId => !existingWebhookIds.has(userId));
        
        console.log(`📊 ${usersWithoutWebhooks.length} utilisateurs sans webhook trouvé(s)`);
        
        return {
            success: true,
            usersWithoutWebhooks: usersWithoutWebhooks,
            totalUsers: userIds.length,
            usersWithWebhooks: userIds.length - usersWithoutWebhooks.length
        };
        
    } catch (error) {
        console.error(`❌ Erreur lors de la recherche:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ===== FONCTIONS DE BATCH =====

/**
 * Assigne des webhooks par défaut à plusieurs utilisateurs
 * @param {Array} userIds - Liste des UIDs utilisateurs
 * @param {string} notes - Notes optionnelles
 */
async function batchAssignDefaultWebhooks(userIds, notes = '') {
    console.log(`🔧 Assignation en lot de ${userIds.length} utilisateurs...`);
    
    const results = [];
    
    for (const userId of userIds) {
        try {
            const result = await assignDefaultWebhooks(userId, notes);
            results.push(result);
            
            // Pause entre les assignations pour éviter la surcharge
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.error(`❌ Erreur pour l'utilisateur ${userId}:`, error);
            results.push({
                success: false,
                userId: userId,
                error: error.message
            });
        }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Batch terminé: ${successCount}/${results.length} réussis`);
    
    return {
        success: successCount === results.length,
        totalProcessed: results.length,
        successCount: successCount,
        results: results
    };
}

// ===== FONCTIONS D'EXPORT/IMPORT =====

/**
 * Exporte tous les webhooks vers un fichier JSON
 */
async function exportWebhooks() {
    try {
        const result = await listAllUserWebhooks();
        
        if (result.success) {
            const exportData = {
                exportDate: new Date().toISOString(),
                version: '1.0.0',
                stats: result.stats,
                webhooks: result.webhooks
            };
            
            // Créer un lien de téléchargement
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `dictamed-webhooks-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log('📥 Export terminé');
            return { success: true, message: 'Export terminé' };
        }
        
        return result;
        
    } catch (error) {
        console.error(`❌ Erreur lors de l'export:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ===== INSTRUCTIONS D'UTILISATION =====

/**
 * Affiche les instructions d'utilisation dans la console
 */
function showUsageInstructions() {
    console.log(`
🎯 DictaMed - Administration des Webhooks Utilisateur
=====================================================

📋 FONCTIONS DISPONIBLES:

1. assignWebhookToUser(userId, webhookUrl, isActive, notes)
   → Assigne un webhook personnalisé à un utilisateur

2. assignDefaultWebhooks(userId, notes)
   → Assigne les webhooks par défaut à un utilisateur

3. deactivateUserWebhook(userId, reason)
   → Désactive le webhook d'un utilisateur

4. getUserWebhookInfo(userId)
   → Récupère les informations d'un webhook

5. listAllUserWebhooks()
   → Liste tous les webhooks avec statistiques

6. findUsersWithoutWebhooks()
   → Trouve les utilisateurs sans webhook

7. batchAssignDefaultWebhooks(userIds, notes)
   → Assigne des webhooks en lot

8. exportWebhooks()
   → Exporte tous les webhooks vers un fichier JSON

📝 EXEMPLES D'UTILISATION:

// Assigner un webhook personnalisé
await assignWebhookToUser('abc123def456', 'https://example.com/webhook/mydoctor', true, 'Dr. Martin - Cabinet principal');

// Assigner les webhooks par défaut
await assignDefaultWebhooks('abc123def456', 'Nouveau médecin');

// Lister tous les webhooks
const all = await listAllWebhooks();

// Assigner en lot à plusieurs utilisateurs
const users = ['user1', 'user2', 'user3'];
await batchAssignDefaultWebhooks(users, 'Migration webhooks');

🔧 CONFIGURATION:
- Les webhooks par défaut sont configurés dans WEBHOOK_ADMIN_CONFIG.DEFAULT_WEBHOOKS
- Les règles de sécurité Firestore sont dans firestore.rules

⚠️ NOTES IMPORTANTES:
- Exécuter ces fonctions depuis la console Firebase
- Vérifier que l'authentification admin est configurée
- Les webhooks doivent être en HTTPS
- Tester les webhooks avant assignment en production
    `);
}

// ===== EXPORT =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WEBHOOK_ADMIN_CONFIG,
        assignWebhookToUser,
        assignDefaultWebhooks,
        deactivateUserWebhook,
        getUserWebhookInfo,
        listAllUserWebhooks,
        findUsersWithoutWebhooks,
        batchAssignDefaultWebhooks,
        exportWebhooks,
        showUsageInstructions
    };
} else {
    window.WebhookAdmin = {
        WEBHOOK_ADMIN_CONFIG,
        assignWebhookToUser,
        assignDefaultWebhooks,
        deactivateUserWebhook,
        getUserWebhookInfo,
        listAllUserWebhooks,
        findUsersWithoutWebhooks,
        batchAssignDefaultWebhooks,
        exportWebhooks,
        showUsageInstructions
    };
    
    console.log('🎯 DictaMed Webhook Admin chargé. Tapez showUsageInstructions() pour voir les instructions.');
}