/**
 * DictaMed - Service de statistiques utilisateur
 * Version: 1.0.0 - Gestion des statistiques avec Firebase Firestore
 */

class UserStatsService {
    constructor() {
        this.db = null;
        this.currentUserId = null;
        this.statsCache = null;
        this.cacheExpiry = null;
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Initialiser le service avec Firestore
     */
    async init() {
        try {
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                this.db = firebase.firestore();
                console.log('UserStatsService initialisé');
            } else {
                console.warn('Firebase Firestore non disponible');
            }
        } catch (error) {
            console.error('Erreur initialisation UserStatsService:', error);
        }
    }

    /**
     * Définir l'utilisateur actuel
     */
    setCurrentUser(userId) {
        if (this.currentUserId !== userId) {
            this.currentUserId = userId;
            this.statsCache = null;
            this.cacheExpiry = null;
        }
    }

    /**
     * Obtenir la référence du document statistiques
     */
    getStatsRef(userId = this.currentUserId) {
        if (!this.db || !userId) return null;
        return this.db.collection('userStats').doc(userId);
    }

    /**
     * Créer les statistiques par défaut pour un nouvel utilisateur
     */
    getDefaultStats() {
        return {
            // Compteurs d'envoi
            totalSends: 0,
            normalModeSends: 0,
            dmiModeSends: 0,
            testModeSends: 0,

            // Photos
            totalPhotos: 0,

            // Audio
            totalAudioRecordings: 0,
            totalAudioDuration: 0, // en secondes

            // Texte
            totalTextSends: 0,
            totalCharactersSent: 0,

            // Dates
            firstUseDate: null,
            lastActivityDate: null,

            // Sessions
            totalSessions: 0,
            averageSessionDuration: 0,

            // Métadonnées
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
    }

    /**
     * Obtenir les statistiques de l'utilisateur
     */
    async getStats(userId = this.currentUserId) {
        if (!this.db || !userId) {
            return this.getDefaultStats();
        }

        // Vérifier le cache
        if (this.statsCache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
            return this.statsCache;
        }

        try {
            const statsRef = this.getStatsRef(userId);
            const doc = await statsRef.get();

            if (doc.exists) {
                this.statsCache = doc.data();
            } else {
                // Créer les stats par défaut si elles n'existent pas
                const defaultStats = this.getDefaultStats();
                defaultStats.firstUseDate = firebase.firestore.FieldValue.serverTimestamp();
                await statsRef.set(defaultStats);
                this.statsCache = defaultStats;
            }

            this.cacheExpiry = Date.now() + this.CACHE_DURATION;
            return this.statsCache;

        } catch (error) {
            console.error('Erreur lors de la récupération des stats:', error);
            return this.getDefaultStats();
        }
    }

    /**
     * Incrémenter un compteur de statistique
     */
    async incrementStat(statName, value = 1, userId = this.currentUserId) {
        if (!this.db || !userId) return;

        try {
            const statsRef = this.getStatsRef(userId);
            await statsRef.set({
                [statName]: firebase.firestore.FieldValue.increment(value),
                lastActivityDate: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Invalider le cache
            this.statsCache = null;

        } catch (error) {
            console.error(`Erreur incrémentation ${statName}:`, error);
        }
    }

    /**
     * Enregistrer un envoi en mode Normal
     */
    async recordNormalModeSend(audioCount = 0, audioDuration = 0) {
        if (!this.db || !this.currentUserId) return;

        try {
            const statsRef = this.getStatsRef();
            await statsRef.set({
                totalSends: firebase.firestore.FieldValue.increment(1),
                normalModeSends: firebase.firestore.FieldValue.increment(1),
                totalAudioRecordings: firebase.firestore.FieldValue.increment(audioCount),
                totalAudioDuration: firebase.firestore.FieldValue.increment(audioDuration),
                lastActivityDate: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            this.statsCache = null;
            console.log('Stats Normal Mode enregistrées');

        } catch (error) {
            console.error('Erreur enregistrement stats Normal Mode:', error);
        }
    }

    /**
     * Enregistrer un envoi en mode DMI
     */
    async recordDMIModeSend(hasPhoto = false, hasAudio = false, hasText = false, audioDuration = 0, textLength = 0) {
        if (!this.db || !this.currentUserId) return;

        try {
            const updates = {
                totalSends: firebase.firestore.FieldValue.increment(1),
                dmiModeSends: firebase.firestore.FieldValue.increment(1),
                lastActivityDate: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (hasPhoto) {
                updates.totalPhotos = firebase.firestore.FieldValue.increment(1);
            }
            if (hasAudio) {
                updates.totalAudioRecordings = firebase.firestore.FieldValue.increment(1);
                updates.totalAudioDuration = firebase.firestore.FieldValue.increment(audioDuration);
            }
            if (hasText) {
                updates.totalTextSends = firebase.firestore.FieldValue.increment(1);
                updates.totalCharactersSent = firebase.firestore.FieldValue.increment(textLength);
            }

            const statsRef = this.getStatsRef();
            await statsRef.set(updates, { merge: true });

            this.statsCache = null;
            console.log('Stats DMI Mode enregistrées');

        } catch (error) {
            console.error('Erreur enregistrement stats DMI Mode:', error);
        }
    }

    /**
     * Enregistrer un envoi en mode Test
     */
    async recordTestModeSend(audioCount = 0, audioDuration = 0) {
        if (!this.db || !this.currentUserId) return;

        try {
            const statsRef = this.getStatsRef();
            await statsRef.set({
                totalSends: firebase.firestore.FieldValue.increment(1),
                testModeSends: firebase.firestore.FieldValue.increment(1),
                totalAudioRecordings: firebase.firestore.FieldValue.increment(audioCount),
                totalAudioDuration: firebase.firestore.FieldValue.increment(audioDuration),
                lastActivityDate: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            this.statsCache = null;

        } catch (error) {
            console.error('Erreur enregistrement stats Test Mode:', error);
        }
    }

    /**
     * Enregistrer une nouvelle session
     */
    async recordSession() {
        await this.incrementStat('totalSessions');
    }

    /**
     * Formater la durée en format lisible
     */
    formatDuration(seconds) {
        if (!seconds || seconds === 0) return '0 min';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}h ${minutes}min`;
        } else if (minutes > 0) {
            return `${minutes}min ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    /**
     * Obtenir un résumé formaté des statistiques
     */
    async getFormattedStats(userId = this.currentUserId) {
        const stats = await this.getStats(userId);

        return {
            totalEnvois: stats.totalSends || 0,
            envoisNormal: stats.normalModeSends || 0,
            envoisDMI: stats.dmiModeSends || 0,
            envoisTest: stats.testModeSends || 0,
            photosEnvoyees: stats.totalPhotos || 0,
            enregistrementsAudio: stats.totalAudioRecordings || 0,
            dureeAudioFormatee: this.formatDuration(stats.totalAudioDuration || 0),
            dureeAudioSecondes: stats.totalAudioDuration || 0,
            textesEnvoyes: stats.totalTextSends || 0,
            caracteresEnvoyes: stats.totalCharactersSent || 0,
            nombreSessions: stats.totalSessions || 0,
            premiereUtilisation: stats.firstUseDate?.toDate?.() || null,
            derniereActivite: stats.lastActivityDate?.toDate?.() || null
        };
    }
}

// Export global
window.UserStatsService = UserStatsService;

// Instance globale
window.userStatsService = new UserStatsService();

// Initialiser quand Firebase est prêt
if (typeof document !== 'undefined') {
    const initStatsService = () => {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            window.userStatsService.init();
        } else {
            setTimeout(initStatsService, 200);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStatsService);
    } else {
        initStatsService();
    }
}
