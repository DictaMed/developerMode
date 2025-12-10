/**
 * DictaMed - Gestionnaire de Webhooks Uniques par Utilisateur
 * Version: 1.0.0 - Système de webhooks dynamiques basé sur Firebase Auth
 */

class WebhookManager {
    static DEFAULT_ENDPOINTS = {
        normal: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedNormalMode',
        test: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed',
        dmi: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed'
    };

    static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    static webhookCache = new Map();

    /**
     * Récupère le webhook URL pour un utilisateur et un mode donné
     * @param {string} userId - ID de l'utilisateur Firebase
     * @param {string} mode - Mode d'envoi (normal, test, dmi)
     * @returns {Promise<string>} URL du webhook
     */
    static async getUserWebhook(userId, mode) {
        try {
            if (!userId) {
                console.warn('WebhookManager: No userId provided, using default endpoint');
                return this.getDefaultEndpoint(mode);
            }

            // Vérifier le cache
            const cacheKey = `${userId}_${mode}`;
            const cached = this.webhookCache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
                console.log(`WebhookManager: Using cached webhook for user ${userId} in mode ${mode}`);
                return cached.url;
            }

            // Récupérer depuis Firestore
            const webhookUrl = await this.fetchWebhookFromFirestore(userId, mode);
            
            if (webhookUrl) {
                // Mettre en cache
                this.webhookCache.set(cacheKey, {
                    url: webhookUrl,
                    timestamp: Date.now()
                });
                console.log(`WebhookManager: Retrieved webhook for user ${userId} in mode ${mode}`);
                return webhookUrl;
            } else {
                console.log(`WebhookManager: No webhook found for user ${userId}, using default`);
                return this.getDefaultEndpoint(mode);
            }

        } catch (error) {
            console.error('WebhookManager: Error retrieving user webhook:', error);
            return this.getDefaultEndpoint(mode);
        }
    }

    /**
     * Récupère le webhook depuis Firestore
     * @param {string} userId - ID de l'utilisateur
     * @param {string} mode - Mode d'envoi
     * @returns {Promise<string|null>} URL du webhook ou null
     */
    static async fetchWebhookFromFirestore(userId, mode) {
        try {
            // Vérifier si Firebase et Firestore sont disponibles
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                console.warn('WebhookManager: Firebase Firestore not available');
                return null;
            }

            const db = firebase.firestore();
            const docRef = db.collection('userWebhooks').doc(userId);
            const doc = await docRef.get();

            if (doc.exists) {
                const data = doc.data();
                
                // Vérifier si le webhook est actif
                if (data.isActive !== false) {
                    const webhookUrl = data.webhookUrl;
                    
                    // Valider l'URL
                    if (this.validateWebhookUrl(webhookUrl)) {
                        // Mettre à jour la dernière utilisation
                        this.updateLastUsed(userId, mode);
                        return webhookUrl;
                    } else {
                        console.warn(`WebhookManager: Invalid webhook URL for user ${userId}:`, webhookUrl);
                        return null;
                    }
                } else {
                    console.log(`WebhookManager: Webhook is inactive for user ${userId}`);
                    return null;
                }
            } else {
                console.log(`WebhookManager: No webhook document found for user ${userId}`);
                return null;
            }

        } catch (error) {
            console.error('WebhookManager: Error fetching from Firestore:', error);
            return null;
        }
    }

    /**
     * Valide l'URL du webhook
     * @param {string} url - URL à valider
     * @returns {boolean} True si l'URL est valide
     */
    static validateWebhookUrl(url) {
        try {
            if (!url || typeof url !== 'string') {
                return false;
            }

            // Vérifier que c'est une URL HTTPS
            const urlObj = new URL(url);
            if (urlObj.protocol !== 'https:') {
                console.warn('WebhookManager: Webhook URL must use HTTPS');
                return false;
            }

            // Vérifier que c'est bien un webhook (contient webhook dans le path)
            if (!urlObj.pathname.toLowerCase().includes('webhook')) {
                console.warn('WebhookManager: URL does not appear to be a webhook endpoint');
                // Ne pas bloquer pour cette vérification, juste un warning
            }

            return true;
        } catch (error) {
            console.warn('WebhookManager: Invalid URL format:', url);
            return false;
        }
    }

    /**
     * Récupère l'endpoint par défaut pour un mode
     * @param {string} mode - Mode d'envoi
     * @returns {string} URL de l'endpoint par défaut
     */
    static getDefaultEndpoint(mode) {
        return this.DEFAULT_ENDPOINTS[mode] || this.DEFAULT_ENDPOINTS.test;
    }

    /**
     * Met à jour la dernière utilisation d'un webhook
     * @param {string} userId - ID de l'utilisateur
     * @param {string} mode - Mode d'envoi
     */
    static async updateLastUsed(userId, mode) {
        try {
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                return;
            }

            const db = firebase.firestore();
            const docRef = db.collection('userWebhooks').doc(userId);
            
            await docRef.update({
                lastUsed: firebase.firestore.FieldValue.serverTimestamp(),
                lastUsedMode: mode,
                usageCount: firebase.firestore.FieldValue.increment(1)
            });

        } catch (error) {
            console.warn('WebhookManager: Error updating lastUsed:', error);
            // Ne pas faire échouer l'envoi pour cette erreur
        }
    }

    /**
     * Précharge les webhooks pour un utilisateur
     * @param {string} userId - ID de l'utilisateur
     */
    static async preloadUserWebhooks(userId) {
        try {
            const modes = ['normal', 'test', 'dmi'];
            const promises = modes.map(mode => this.getUserWebhook(userId, mode));
            await Promise.all(promises);
            console.log(`WebhookManager: Preloaded webhooks for user ${userId}`);
        } catch (error) {
            console.warn('WebhookManager: Error preloading webhooks:', error);
        }
    }

    /**
     * Invalide le cache pour un utilisateur
     * @param {string} userId - ID de l'utilisateur
     */
    static invalidateUserCache(userId) {
        const modes = ['normal', 'test', 'dmi'];
        modes.forEach(mode => {
            const cacheKey = `${userId}_${mode}`;
            this.webhookCache.delete(cacheKey);
        });
        console.log(`WebhookManager: Invalidated cache for user ${userId}`);
    }

    /**
     * Vide tout le cache
     */
    static clearCache() {
        this.webhookCache.clear();
        console.log('WebhookManager: Cache cleared');
    }

    /**
     * Obtient les statistiques du cache
     * @returns {object} Statistiques du cache
     */
    static getCacheStats() {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;

        for (const [key, value] of this.webhookCache.entries()) {
            if ((now - value.timestamp) < this.CACHE_DURATION) {
                validEntries++;
            } else {
                expiredEntries++;
            }
        }

        return {
            totalEntries: this.webhookCache.size,
            validEntries,
            expiredEntries,
            cacheSize: JSON.stringify(Object.fromEntries(this.webhookCache)).length
        };
    }

    /**
     * Nettoie les entrées expirées du cache
     */
    static cleanupExpiredCache() {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, value] of this.webhookCache.entries()) {
            if ((now - value.timestamp) >= this.CACHE_DURATION) {
                this.webhookCache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`WebhookManager: Cleaned ${cleaned} expired cache entries`);
        }

        return cleaned;
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebhookManager;
} else {
    window.WebhookManager = WebhookManager;
}