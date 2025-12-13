/**
 * DictaMed - Gestionnaire d'Interface d'Administration des Webhooks AMÉLIORÉ
 * Version: 1.3.0 - Amélioration de la détection des nouveaux comptes utilisateur
 * 
 * Améliorations principales :
 * - Écouteur en temps réel pour les nouveaux utilisateurs
 * - Détection automatique des nouveaux comptes lors de la connexion
 * - Création automatique de profils utilisateur
 * - Rafraîchissement automatique amélioré
 */

class AdminWebhookManagerEnhanced {
    constructor() {
        this.currentAdminUser = null;
        this.isInitialized = false;
        this.isInitializing = false;
        this.adminEmail = 'akio963@gmail.com'; // Email de l'administrateur principal
        this.users = []; // Liste des utilisateurs
        this.webhooks = new Map(); // Cache des webhooks par utilisateur
        this.authListenerAttached = false; // État de l'écouteur d'authentification
        this.userListenerAttached = false; // État de l'écouteur d'utilisateurs
        this.cleanupCallbacks = []; // Fonctions de nettoyage
        this.initPromise = null; // Promise pour éviter la double initialisation
        this.lastUserCount = 0; // Pour détecter les nouveaux utilisateurs
        this.autoRefreshInterval = null; // Intervalle de rafraîchissement automatique
    }

    /**
     * Initialisation corrigée du gestionnaire d'admin avec prévention des race conditions
     */
    async init() {
        // Éviter la double initialisation avec Promise
        if (this.initPromise) {
            return this.initPromise;
        }

        if (this.isInitialized || this.isInitializing) {
            console.log('ℹ️ AdminWebhookManagerEnhanced déjà initialisé ou en cours d\'initialisation');
            return this.isInitialized;
        }

        this.isInitializing = true;
        this.initPromise = this._performInitialization();
        
        try {
            const result = await this.initPromise;
            return result;
        } finally {
            this.initPromise = null;
        }
    }

    /**
     * Méthode d'initialisation réelle avec gestion améliorée des erreurs
     */
    async _performInitialization() {
        console.log('🔧 Initialisation AdminWebhookManagerEnhanced v1.3.0...');
        
        try {
            // 1. Attendre l'initialisation de Firebase Auth avec timeout
            await this.waitForAuthManager(15000);
            
            // 2. Vérifier l'authentification admin
            if (!await this.verifyAdminAuth()) {
                this.showAccessDenied();
                return false;
            }

            // 3. Récupérer l'utilisateur admin actuel
            this.currentAdminUser = this.getCurrentUserSecure();
            if (!this.currentAdminUser) {
                throw new Error('Impossible de récupérer les informations utilisateur');
            }
            console.log('✅ Admin authentifié:', this.currentAdminUser.email);

            // 4. Configurer les écouteurs (une seule fois)
            this.setupAuthListener();
            this.setupUserDetectionListener(); // NOUVEAU: Écouteur pour détecter nouveaux utilisateurs

            // 5. Charger les données en parallèle pour améliorer les performances
            const [usersResult, webhooksResult] = await Promise.allSettled([
                this.loadUsersWithRetry(),
                this.loadAllWebhooksWithRetry()
            ]);

            // Gérer les résultats même en cas d'échec partiel
            if (usersResult.status === 'fulfilled') {
                this.users = usersResult.value;
                this.lastUserCount = this.users.length;
            } else {
                console.warn('⚠️ Échec du chargement des utilisateurs:', usersResult.reason);
                this.users = [];
            }

            if (webhooksResult.status === 'fulfilled') {
                this.webhooks = webhooksResult.value;
            } else {
                console.warn('⚠️ Échec du chargement des webhooks:', webhooksResult.reason);
                this.webhooks = new Map();
            }

            // 6. Initialiser l'interface utilisateur
            this.initAdminInterface();
            this.bindEvents();

            // 7. Démarrer le rafraîchissement automatique (NOUVEAU)
            this.startAutoRefresh();

            this.isInitialized = true;
            console.log('✅ AdminWebhookManagerEnhanced v1.3.0 initialisé avec succès');
            return true;

        } catch (error) {
            console.error('❌ Erreur d\'initialisation AdminWebhookManagerEnhanced:', error);
            this.showError('Erreur lors de l\'initialisation: ' + error.message);
            this.cleanup();
            return false;
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * NOUVEAU: Configuration de l'écouteur pour détecter les nouveaux utilisateurs
     */
    setupUserDetectionListener() {
        if (this.userListenerAttached) {
            console.log('ℹ️ Écouteur de détection utilisateurs déjà configuré');
            return;
        }

        try {
            const authManager = this.getAuthManager();
            if (authManager && typeof authManager.addAuthStateListener === 'function') {
                authManager.addAuthStateListener(async (user) => {
                    console.log('👥 Changement d\'état utilisateur détecté:', user ? user.email : 'null');
                    await this.handleNewUserDetection(user);
                });
                this.userListenerAttached = true;
                console.log('✅ Écouteur de détection utilisateurs configuré');
            } else {
                console.warn('⚠️ Impossible de configurer l\'écouteur de détection');
            }
        } catch (error) {
            console.warn('⚠️ Erreur lors de la configuration de l\'écouteur utilisateurs:', error);
        }
    }

    /**
     * NOUVEAU: Gestion de la détection de nouveaux utilisateurs
     */
    async handleNewUserDetection(user) {
        try {
            if (!user) {
                return; // Utilisateur déconnecté
            }

            // Vérifier si c'est un nouvel utilisateur
            const isNewUser = !this.users.find(u => u.uid === user.uid);
            
            if (isNewUser) {
                console.log('🆕 Nouvel utilisateur détecté:', user.email);
                
                // Créer automatiquement un profil pour ce nouvel utilisateur
                await this.createUserProfile(user);
                
                // Recharger la liste des utilisateurs
                await this.refreshUsersList();
                
                // Afficher une notification
                this.showSuccess(`Nouvel utilisateur détecté: ${user.email}`);
            }
        } catch (error) {
            console.error('❌ Erreur lors de la détection du nouvel utilisateur:', error);
        }
    }

    /**
     * NOUVEAU: Création automatique de profil utilisateur
     */
    async createUserProfile(user) {
        try {
            console.log('👤 Création du profil pour:', user.email);
            
            const userProfileData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                emailVerified: user.emailVerified || false,
                createdAt: new Date(),
                lastSeen: new Date(),
                hasWebhook: false,
                profileCreatedBy: 'system_auto',
                registrationSource: 'firebase_auth'
            };

            const db = firebase.firestore();
            await db.collection('userProfiles').doc(user.uid).set(userProfileData, { merge: true });
            
            console.log('✅ Profil utilisateur créé dans userProfiles:', user.email);
            
        } catch (error) {
            console.warn('⚠️ Impossible de créer le profil utilisateur:', error);
            // Ne pas échouer pour cette raison
        }
    }

    /**
     * NOUVEAU: Démarrage du rafraîchissement automatique
     */
    startAutoRefresh() {
        // Arrêter le précédent intervalle s'il existe
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }

        // Rafraîchir toutes les 30 secondes pour détecter les nouveaux utilisateurs
        this.autoRefreshInterval = setInterval(async () => {
            if (this.isInitialized) {
                await this.performAutoRefresh();
            }
        }, 30000); // 30 secondes

        console.log('✅ Rafraîchissement automatique démarré (30s)');
    }

    /**
     * NOUVEAU: Rafraîchissement automatique intelligent
     */
    async performAutoRefresh() {
        try {
            console.log('🔄 Rafraîchissement automatique en cours...');
            
            const previousCount = this.users.length;
            
            // Charger les utilisateurs avec une approche plus agressive
            const newUsers = await this.loadUsersEnhanced();
            
            if (newUsers.length !== previousCount) {
                console.log(`📈 Changement détecté: ${previousCount} → ${newUsers.length} utilisateurs`);
                this.users = newUsers;
                
                // Recharger aussi les webhooks
                const newWebhooks = await this.loadAllWebhooks();
                this.webhooks = newWebhooks;
                
                // Rafraîchir l'affichage
                if (this.isInitialized) {
                    this.renderStatistics();
                    this.renderUsersList();
                }
                
                this.showSuccess(`Liste mise à jour: ${newUsers.length} utilisateur(s)`);
            }
            
        } catch (error) {
            console.warn('⚠️ Erreur lors du rafraîchissement automatique:', error);
        }
    }

    /**
     * NOUVEAU: Chargement amélioré des utilisateurs avec détection renforcée
     */
    async loadUsersEnhanced() {
        try {
            console.log('👥 Chargement amélioré des utilisateurs...');
            
            const users = [];
            
            // Méthode 1: Charger depuis userProfiles (collection principale)
            try {
                const profilesSnapshot = await firebase.firestore().collection('userProfiles').get();
                if (!profilesSnapshot.empty) {
                    profilesSnapshot.forEach(doc => {
                        try {
                            const userData = doc.data();
                            users.push({
                                uid: doc.id,
                                ...userData
                            });
                        } catch (docError) {
                            console.warn('⚠️ Erreur lors du traitement du profil:', doc.id, docError);
                        }
                    });
                    console.log(`✅ ${users.length} utilisateurs chargés depuis userProfiles`);
                }
            } catch (profileError) {
                console.log('ℹ️ Collection userProfiles non accessible, utilisation de la méthode alternative');
            }
            
            // Méthode 2: Déduire depuis les webhooks si userProfiles est vide
            if (users.length === 0) {
                try {
                    const webhooksSnapshot = await firebase.firestore().collection('userWebhooks').get();
                    const webhookUsers = [];
                    
                    for (const doc of webhooksSnapshot.docs) {
                        try {
                            const webhookData = doc.data();
                            if (webhookData.userEmail || webhookData.createdBy) {
                                webhookUsers.push({
                                    uid: doc.id,
                                    email: webhookData.userEmail || webhookData.createdBy || 'Email non disponible',
                                    displayName: webhookData.userName || 'Nom non disponible',
                                    emailVerified: true,
                                    createdAt: webhookData.createdAt ?
                                        (webhookData.createdAt.toDate ? webhookData.createdAt.toDate().toISOString() : new Date().toISOString())
                                        : new Date().toISOString(),
                                    hasWebhook: true
                                });
                            }
                        } catch (docError) {
                            console.warn('⚠️ Erreur lors du traitement du webhook utilisateur:', doc.id, docError);
                        }
                    }
                    
                    // Ajouter l'utilisateur admin actuel s'il n'est pas dans la liste
                    const currentUser = this.getCurrentUserSecure();
                    if (currentUser && !webhookUsers.find(u => u.uid === currentUser.uid)) {
                        webhookUsers.push({
                            uid: currentUser.uid,
                            email: currentUser.email,
                            displayName: currentUser.displayName || 'Administrateur',
                            emailVerified: currentUser.emailVerified,
                            createdAt: currentUser.metadata?.creationTime || new Date().toISOString(),
                            hasWebhook: false
                        });
                    }
                    
                    console.log(`✅ ${webhookUsers.length} utilisateurs déduits depuis les webhooks`);
                    return webhookUsers;
                    
                } catch (webhookError) {
                    console.warn('⚠️ Impossible de charger depuis les webhooks:', webhookError);
                }
            }
            
            // Méthode 3: Fallback - au moins l'admin
            if (users.length === 0) {
                const currentUser = this.getCurrentUserSecure();
                if (currentUser) {
                    users.push({
                        uid: currentUser.uid,
                        email: currentUser.email,
                        displayName: currentUser.displayName || 'Administrateur',
                        emailVerified: currentUser.emailVerified,
                        createdAt: currentUser.metadata?.creationTime || new Date().toISOString(),
                        hasWebhook: false
                    });
                }
            }
            
            return users;
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement amélioré des utilisateurs:', error);
            return [];
        }
    }

    /**
     * NOUVEAU: Rechargement de la liste utilisateurs avec détection de changements
     */
    async refreshUsersList() {
        try {
            console.log('🔄 Rechargement de la liste utilisateurs...');
            
            const newUsers = await this.loadUsersEnhanced();
            const oldUsers = this.users;
            
            // Détecter les nouveaux utilisateurs
            const newUserUids = newUsers.map(u => u.uid);
            const oldUserUids = oldUsers.map(u => u.uid);
            
            const addedUsers = newUsers.filter(u => !oldUserUids.includes(u.uid));
            const removedUsers = oldUsers.filter(u => !newUserUids.includes(u.uid));
            
            if (addedUsers.length > 0) {
                console.log(`➕ ${addedUsers.length} nouvel(s) utilisateur(s) ajouté(s):`, addedUsers.map(u => u.email));
            }
            
            if (removedUsers.length > 0) {
                console.log(`➖ ${removedUsers.length} utilisateur(s) retiré(s):`, removedUsers.map(u => u.email));
            }
            
            this.users = newUsers;
            
            // Recharger les webhooks aussi
            this.webhooks = await this.loadAllWebhooks();
            
            // Rafraîchir l'affichage si nécessaire
            if (this.isInitialized) {
                this.renderStatistics();
                this.renderUsersList();
            }
            
        } catch (error) {
            console.error('❌ Erreur lors du rechargement de la liste:', error);
        }
    }

    /**
     * Attendre l'initialisation du gestionnaire d'authentification
     */
    async waitForAuthManager(timeout = 15000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            try {
                const authManager = this.getAuthManager();
                if (authManager && authManager.isInitialized) {
                    console.log('✅ FirebaseAuthManager initialisé');
                    return true;
                }
            } catch (error) {
                console.warn('⚠️ Erreur lors de la vérification auth:', error);
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        throw new Error('FirebaseAuthManager non initialisé dans les temps');
    }

    /**
     * Vérification de l'authentification admin avec retry
     */
    async verifyAdminAuth() {
        try {
            const authManager = this.getAuthManager();
            if (!authManager) {
                this.showError('Gestionnaire d\'authentification non disponible');
                return false;
            }

            const currentUser = authManager.getCurrentUser();
            if (!currentUser) {
                this.showError('Vous devez être connecté pour accéder à cette interface.');
                return false;
            }

            if (currentUser.email !== this.adminEmail) {
                this.showError(`Accès refusé. Cette interface est réservée à l'administrateur.`);
                return false;
            }

            return true;
        } catch (error) {
            console.error('❌ Erreur lors de la vérification auth:', error);
            this.showError('Erreur lors de la vérification d\'authentification');
            return false;
        }
    }

    /**
     * Récupération sécurisée du gestionnaire d'authentification
     */
    getAuthManager() {
        try {
            if (window.FirebaseAuthManager && typeof window.FirebaseAuthManager.getInstance === 'function') {
                return window.FirebaseAuthManager.getInstance();
            }
            if (window.FirebaseAuthManager && window.FirebaseAuthManager.getCurrentUser) {
                return window.FirebaseAuthManager;
            }
            return null;
        } catch (error) {
            console.warn('⚠️ Erreur lors de la récupération du gestionnaire auth:', error);
            return null;
        }
    }

    /**
     * Récupération sécurisée de l'utilisateur actuel
     */
    getCurrentUserSecure() {
        try {
            const authManager = this.getAuthManager();
            if (!authManager) {
                throw new Error('Gestionnaire d\'authentification non disponible');
            }

            const user = authManager.getCurrentUser();
            if (!user) {
               throw new Error('Aucun utilisateur connecté');
           }

            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email,
                emailVerified: user.emailVerified || false,
                metadata: user.metadata || {}
            };
        } catch (error) {
            console.error('❌ Erreur lors de la récupération utilisateur:', error);
            return null;
        }
    }

    /**
     * Configuration de l'écouteur d'authentification (version améliorée)
     */
    setupAuthListener() {
        if (this.authListenerAttached) {
            console.log('ℹ️ Écouteur d\'authentification déjà configuré');
            return;
        }

        try {
            const authManager = this.getAuthManager();
            if (authManager && typeof authManager.addAuthStateListener === 'function') {
                authManager.addAuthStateListener((user) => {
                    console.log('🔐 Changement d\'état auth détecté:', user ? user.email : 'null');
                    this.handleAuthStateChange(user);
                });
                this.authListenerAttached = true;
                console.log('✅ Écouteur d\'authentification configuré');
            } else {
                console.warn('⚠️ Impossible de configurer l\'écouteur auth');
            }
        } catch (error) {
            console.warn('⚠️ Erreur lors de la configuration de l\'écouteur auth:', error);
        }
    }

    /**
     * Gestion des changements d'état d'authentification (version améliorée)
     */
    async handleAuthStateChange(user) {
        try {
            if (!user || user.email !== this.adminEmail) {
                console.log('🚫 Accès admin révoqué');
                this.showAccessDenied();
                return;
            }

            // Recharger les données si nécessaire
            if (this.isInitialized) {
                console.log('🔄 Rechargement des données après changement auth...');
                await this.refreshDataSafely();
            }
        } catch (error) {
            console.error('❌ Erreur lors du rafraîchissement après changement auth:', error);
        }
    }

    /**
     * Rafraîchissement sécurisé des données
     */
    async refreshDataSafely() {
        try {
            const [usersResult, webhooksResult] = await Promise.allSettled([
                this.loadUsers(),
                this.loadAllWebhooks()
            ]);

            if (usersResult.status === 'fulfilled') {
                this.users = usersResult.value;
            }

            if (webhooksResult.status === 'fulfilled') {
                this.webhooks = webhooksResult.value;
            }

            // Rafraîchir l'affichage si les éléments DOM existent
            if (this.isInitialized) {
                this.renderStatistics();
                this.renderUsersList();
            }
        } catch (error) {
            console.error('❌ Erreur lors du rafraîchissement sécurisé:', error);
        }
    }

    /**
     * Chargement des utilisateurs avec retry amélioré
     */
    async loadUsersWithRetry(maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`👥 Tentative ${attempt}/${maxRetries} de chargement des utilisateurs...`);
                const users = await this.loadUsers();
                if (Array.isArray(users)) {
                    return users;
                }
                throw new Error('Résultat invalide du chargement des utilisateurs');
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Tentative ${attempt} échouée:`, error.message);
                
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }
        
        console.error('❌ Échec du chargement des utilisateurs après', maxRetries, 'tentatives:', lastError);
        this.showError('Impossible de charger les utilisateurs après plusieurs tentatives');
        return [];
    }

    /**
     * Chargement de tous les webhooks avec retry amélioré
     */
    async loadAllWebhooksWithRetry(maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔗 Tentative ${attempt}/${maxRetries} de chargement des webhooks...`);
                const webhooks = await this.loadAllWebhooks();
                if (webhooks instanceof Map) {
                    return webhooks;
                }
                throw new Error('Résultat invalide du chargement des webhooks');
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Tentative ${attempt} échouée:`, error.message);
                
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }
        
        console.error('❌ Échec du chargement des webhooks après', maxRetries, 'tentatives:', lastError);
        this.showError('Impossible de charger les webhooks après plusieurs tentatives');
        return new Map();
    }

    /**
     * Chargement de tous les utilisateurs (version corrigée)
     */
    async loadUsers() {
        try {
            console.log('👥 Chargement des utilisateurs...');
            
            // Vérification Firebase avec gestion d'erreurs améliorée
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                throw new Error('Firestore non disponible');
            }

            const db = firebase.firestore();
            const users = [];
            
            // Méthode 1: Essayer de charger depuis userProfiles
            try {
                const profilesSnapshot = await db.collection('userProfiles').get();
                if (!profilesSnapshot.empty) {
                    profilesSnapshot.docs.forEach(doc => {
                        try {
                            users.push({
                                uid: doc.id,
                                ...doc.data()
                            });
                        } catch (docError) {
                            console.warn('⚠️ Erreur lors du traitement du profil utilisateur:', doc.id, docError);
                        }
                    });
                    console.log(`✅ ${users.length} utilisateurs chargés depuis userProfiles`);
                    return users;
                }
            } catch (profileError) {
                console.log('ℹ️ Collection userProfiles non accessible, utilisation de la méthode alternative');
            }
            
            // Méthode 2: Déduire les utilisateurs depuis les webhooks existants
            try {
                const webhooksSnapshot = await db.collection('userWebhooks').get();
                const webhookUsers = [];
                
                for (const doc of webhooksSnapshot.docs) {
                    try {
                        const webhookData = doc.data();
                        if (webhookData.userEmail || webhookData.createdBy) {
                            webhookUsers.push({
                                uid: doc.id,
                                email: webhookData.userEmail || webhookData.createdBy || 'Email non disponible',
                                displayName: webhookData.userName || 'Nom non disponible',
                                emailVerified: true,
                                createdAt: webhookData.createdAt ?
                                    (webhookData.createdAt.toDate ? webhookData.createdAt.toDate().toISOString() : new Date().toISOString())
                                    : new Date().toISOString(),
                                hasWebhook: true
                            });
                        }
                    } catch (docError) {
                        console.warn('⚠️ Erreur lors du traitement du webhook utilisateur:', doc.id, docError);
                    }
                }
                
                // Ajouter l'utilisateur admin actuel
                const currentUser = this.getCurrentUserSecure();
                if (currentUser && !webhookUsers.find(u => u.uid === currentUser.uid)) {
                    webhookUsers.push({
                        uid: currentUser.uid,
                        email: currentUser.email,
                        displayName: currentUser.displayName || 'Administrateur',
                        emailVerified: currentUser.emailVerified,
                        createdAt: currentUser.metadata?.creationTime || new Date().toISOString(),
                        hasWebhook: false
                    });
                }
                
                console.log(`✅ ${webhookUsers.length} utilisateurs déduits depuis les webhooks`);
                return webhookUsers;
                
            } catch (webhookError) {
                console.warn('⚠️ Impossible de charger depuis les webhooks:', webhookError);
                // Fallback: retourner au moins l'admin
                const currentUser = this.getCurrentUserSecure();
                if (currentUser) {
                    return [{
                        uid: currentUser.uid,
                        email: currentUser.email,
                        displayName: currentUser.displayName || 'Administrateur',
                        emailVerified: currentUser.emailVerified,
                        createdAt: currentUser.metadata?.creationTime || new Date().toISOString(),
                        hasWebhook: false
                    }];
                }
                return [];
            }

        } catch (error) {
            console.error('❌ Erreur lors du chargement des utilisateurs:', error);
            this.showError('Impossible de charger les utilisateurs: ' + error.message);
            return [];
        }
    }

    /**
     * Chargement de tous les webhooks (version améliorée)
     */
    async loadAllWebhooks() {
        try {
            console.log('🔗 Chargement des webhooks...');
            
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                throw new Error('Firestore non disponible');
            }

            const db = firebase.firestore();
            const snapshot = await db.collection('userWebhooks').get();
            const webhooks = new Map();
            
            snapshot.forEach(doc => {
                try {
                    const data = doc.data();
                    webhooks.set(doc.id, {
                        userId: doc.id,
                        ...data,
                        lastUsed: data.lastUsed?.toDate?.() || data.lastUsed,
                        createdAt: data.createdAt?.toDate?.() || data.createdAt,
                        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
                    });
                } catch (docError) {
                    console.warn('⚠️ Erreur lors du traitement du webhook', doc.id, ':', docError);
                }
            });

            console.log(`✅ ${webhooks.size} webhooks chargés`);
            return webhooks;

        } catch (error) {
            console.error('❌ Erreur lors du chargement des webhooks:', error);
            this.showError('Impossible de charger les webhooks: ' + error.message);
            return new Map();
        }
    }

    /**
     * Récupération sécurisée du FieldValue Firebase
     */
    getFirebaseFieldValue() {
        try {
            if (typeof firebase !== 'undefined' && 
                firebase.firestore && 
                firebase.firestore.FieldValue && 
                typeof firebase.firestore.FieldValue.serverTimestamp === 'function') {
                return firebase.firestore.FieldValue;
            }
            console.warn('⚠️ FieldValue Firebase non disponible, utilisation de Date()');
            return null;
        } catch (error) {
            console.warn('⚠️ Erreur lors de l\'accès à FieldValue:', error);
            return null;
        }
    }

    /**
     * Initialisation de l'interface admin avec gestion d'erreurs améliorée
     */
    initAdminInterface() {
        try {
            this.createAdminContainer();
            this.renderStatistics();
            this.renderUsersList();
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation de l\'interface:', error);
            throw error;
        }
    }

    /**
     * Création du conteneur d'administration avec validation
     */
    createAdminContainer() {
        const container = document.getElementById('adminWebhookContainer');
        if (container) {
            container.innerHTML = '';
        } else {
            const mainContent = document.querySelector('main') || document.body;
            const newContainer = document.createElement('div');
            newContainer.id = 'adminWebhookContainer';
            newContainer.className = 'admin-webhook-container';
            mainContent.appendChild(newContainer);
        }

        const adminContainer = document.getElementById('adminWebhookContainer');
        if (!adminContainer) {
            throw new Error('Impossible de créer le conteneur admin');
        }

        const adminEmail = this.escapeHtml(this.currentAdminUser?.email || 'Admin');
        adminContainer.innerHTML = `
            <div class="admin-webhook-header">
                <h1>🎛️ Administration des Webhooks (Version Améliorée)</h1>
                <p>Gestion des webhooks utilisateur pour DictaMed - Détection automatique des nouveaux comptes</p>
                <div class="admin-info">
                    <span>Connecté en tant que: <strong>${adminEmail}</strong></span>
                    <div class="admin-controls">
                        <button id="refreshDataBtn" class="btn btn-secondary">🔄 Actualiser</button>
                        <button id="forceRefreshBtn" class="btn btn-info">⚡ Détection Forcée</button>
                        <button id="autoRefreshToggle" class="btn btn-warning">⏸️ Pause Auto</button>
                    </div>
                </div>
            </div>

            <div class="admin-stats" id="adminStats">
                <!-- Statistiques seront insérées ici -->
            </div>

            <div class="admin-content">
                <div class="users-section">
                    <h2>👥 Utilisateurs et Webhooks</h2>
                    <div class="users-controls">
                        <input type="text" id="userSearchInput" placeholder="Rechercher un utilisateur..." class="search-input">
                        <select id="filterSelect" class="filter-select">
                            <option value="all">Tous les utilisateurs</option>
                            <option value="withWebhook">Avec webhook</option>
                            <option value="withoutWebhook">Sans webhook</option>
                            <option value="active">Webhook actif</option>
                            <option value="inactive">Webhook inactif</option>
                            <option value="recent">Récemment ajoutés</option>
                        </select>
                    </div>
                    <div id="usersList" class="users-list">
                        <!-- Liste des utilisateurs sera insérée ici -->
                    </div>
                </div>
            </div>

            <div id="loadingOverlay" class="loading-overlay" style="display: none;">
                <div class="loading-spinner"></div>
                <p>Chargement...</p>
            </div>
        `;
    }

    /**
     * Échappement HTML pour sécuriser l'affichage
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Rendu des statistiques avec gestion d'erreurs
     */
    renderStatistics() {
        try {
            const statsContainer = document.getElementById('adminStats');
            if (!statsContainer) return;

            const totalUsers = this.users.length;
            const totalWebhooks = this.webhooks.size;
            const activeWebhooks = Array.from(this.webhooks.values()).filter(w => w?.isActive).length;
            const inactiveWebhooks = totalWebhooks - activeWebhooks;
            const usersWithoutWebhooks = totalUsers - totalWebhooks;

            // Calculer les utilisateurs récents (ajoutés dans les dernières 24h)
            const recentUsers = this.users.filter(user => {
                const createdAt = user.createdAt ? new Date(user.createdAt) : new Date();
                const now = new Date();
                const diffHours = (now - createdAt) / (1000 * 60 * 60);
                return diffHours <= 24;
            }).length;

            statsContainer.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">👥</div>
                        <div class="stat-content">
                            <div class="stat-number">${totalUsers}</div>
                            <div class="stat-label">Utilisateurs Total</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🆕</div>
                        <div class="stat-content">
                            <div class="stat-number">${recentUsers}</div>
                            <div class="stat-label">Nouveaux (24h)</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🔗</div>
                        <div class="stat-content">
                            <div class="stat-number">${totalWebhooks}</div>
                            <div class="stat-label">Webhooks Configurés</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-content">
                            <div class="stat-number">${activeWebhooks}</div>
                            <div class="stat-label">Webhooks Actifs</div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('❌ Erreur lors du rendu des statistiques:', error);
        }
    }

    /**
     * Rendu de la liste des utilisateurs avec gestion d'erreurs
     */
    renderUsersList(filter = 'all', searchTerm = '') {
        try {
            const usersListContainer = document.getElementById('usersList');
            if (!usersListContainer) return;

            let filteredUsers = [...this.users];

            // Appliquer le filtre
            switch (filter) {
                case 'withWebhook':
                    filteredUsers = filteredUsers.filter(user => this.webhooks.has(user.uid));
                    break;
                case 'withoutWebhook':
                    filteredUsers = filteredUsers.filter(user => !this.webhooks.has(user.uid));
                    break;
                case 'active':
                    filteredUsers = filteredUsers.filter(user => {
                        const webhook = this.webhooks.get(user.uid);
                        return webhook && webhook.isActive;
                    });
                    break;
                case 'inactive':
                    filteredUsers = filteredUsers.filter(user => {
                        const webhook = this.webhooks.get(user.uid);
                        return webhook && !webhook.isActive;
                    });
                    break;
                case 'recent':
                    const now = new Date();
                    filteredUsers = filteredUsers.filter(user => {
                        const createdAt = user.createdAt ? new Date(user.createdAt) : new Date();
                        const diffHours = (now - createdAt) / (1000 * 60 * 60);
                        return diffHours <= 24;
                    });
                    break;
            }

            // Appliquer la recherche
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filteredUsers = filteredUsers.filter(user => 
                    user.email?.toLowerCase().includes(term) ||
                    user.displayName?.toLowerCase().includes(term) ||
                    user.uid?.toLowerCase().includes(term)
                );
            }

            // Générer le HTML avec gestion d'erreurs
            usersListContainer.innerHTML = filteredUsers.map(user => {
                try {
                    const webhook = this.webhooks.get(user.uid);
                    return this.renderUserCard(user, webhook);
                } catch (cardError) {
                    console.warn('⚠️ Erreur lors du rendu de la carte utilisateur:', user.uid, cardError);
                    return this.renderErrorCard(user);
                }
            }).join('');

            // Ajouter les gestionnaires d'événements
            this.bindUserCardEvents();
        } catch (error) {
            console.error('❌ Erreur lors du rendu de la liste utilisateurs:', error);
        }
    }

    /**
     * Rendu d'une carte utilisateur avec validation renforcée et gestion sécurisée des événements
     */
    renderUserCard(user, webhook) {
        try {
            // Validation des données utilisateur
            if (!user || !user.uid || !user.email) {
                throw new Error('Données utilisateur invalides');
            }

            const isActive = webhook?.isActive !== false;
            const hasWebhook = !!webhook;
            const statusClass = hasWebhook ? (isActive ? 'active' : 'inactive') : 'no-webhook';
            const statusText = hasWebhook ? (isActive ? 'Actif' : 'Inactif') : 'Non configuré';
            const statusIcon = hasWebhook ? (isActive ? '✅' : '❌') : '⚪';

            // Détecter si c'est un utilisateur récent
            const createdAt = user.createdAt ? new Date(user.createdAt) : new Date();
            const isRecent = ((new Date() - createdAt) / (1000 * 60 * 60)) <= 24;
            const recentBadge = isRecent ? '<span class="recent-badge">🆕 Nouveau</span>' : '';

            const displayName = this.escapeHtml(user.displayName || 'Nom non disponible');
            const userEmail = this.escapeHtml(user.email);
            const userUid = this.escapeHtml(user.uid);
            const webhookUrl = webhook?.webhookUrl ? this.escapeHtml(webhook.webhookUrl) : '';

            // Générer des IDs uniques pour les éléments
            const inputId = `webhook_${userUid}`;
            const saveBtnId = `save_${userUid}`;
            const toggleBtnId = `toggle_${userUid}`;
            const deleteBtnId = `delete_${userUid}`;
            const detailsBtnId = `details_${userUid}`;

            return `
                <div class="user-card ${statusClass}" data-user-id="${userUid}">
                    <div class="user-info">
                        <div class="user-avatar">
                            ${displayName.charAt(0).toUpperCase()}
                        </div>
                        <div class="user-details">
                            <div class="user-name">${displayName} ${recentBadge}</div>
                            <div class="user-email">${userEmail}</div>
                            <div class="user-uid">${userUid}</div>
                            <div class="user-status">
                                <span class="status-badge ${statusClass}">
                                    ${statusIcon} ${statusText}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="webhook-management">
                        <div class="webhook-input-group">
                            <input type="url" 
                                   class="webhook-input" 
                                   id="${inputId}"
                                   placeholder="https://exemple.com/webhook" 
                                   value="${webhookUrl}">
                            <button class="btn btn-save" id="${saveBtnId}" data-user-id="${userUid}">
                                💾 Sauvegarder
                            </button>
                        </div>
                        
                        <div class="webhook-controls">
                            <button class="btn ${isActive ? 'btn-warning' : 'btn-success'}" 
                                    id="${toggleBtnId}" data-user-id="${userUid}">
                                ${isActive ? '🚫 Désactiver' : '✅ Activer'}
                            </button>
                            
                            <button class="btn btn-danger" 
                                    id="${deleteBtnId}" data-user-id="${userUid}"
                                    ${!hasWebhook ? 'disabled' : ''}>
                                🗑️ Supprimer
                            </button>
                            
                            ${webhook ? `
                            <button class="btn btn-info" id="${detailsBtnId}" data-user-id="${userUid}">
                                ℹ️ Détails
                            </button>
                            ` : ''}
                        </div>
                        
                        ${webhook ? `
                        <div class="webhook-meta">
                            <small>Créé: ${this.formatDate(webhook.createdAt)}</small>
                            ${webhook.lastUsed ? `<small>Dernière utilisation: ${this.formatDate(webhook.lastUsed)}</small>` : ''}
                            ${webhook.usageCount ? `<small>Utilisations: ${webhook.usageCount}</small>` : ''}
                            ${webhook.notes ? `<small>Notes: ${this.escapeHtml(webhook.notes)}</small>` : ''}
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('❌ Erreur lors du rendu de la carte utilisateur:', error);
            return this.renderErrorCard(user);
        }
    }

    /**
     * Rendu d'une carte d'erreur pour un utilisateur
     */
    renderErrorCard(user) {
        const userEmail = this.escapeHtml(user?.email || 'Utilisateur inconnu');
        const userUid = this.escapeHtml(user?.uid || 'UID inconnu');
        
        return `
            <div class="user-card error" data-user-id="${userUid}">
                <div class="user-info">
                    <div class="user-avatar">⚠️</div>
                    <div class="user-details">
                        <div class="user-name">Erreur de chargement</div>
                        <div class="user-email">${userEmail}</div>
                        <div class="user-uid">${userUid}</div>
                        <div class="user-status">
                            <span class="status-badge error">❌ Erreur</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Liaison des événements de l'interface avec gestion d'erreurs
     */
    bindEvents() {
        try {
            // Bouton de rafraîchissement
            const refreshBtn = document.getElementById('refreshDataBtn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => this.refreshData());
            }

            // NOUVEAU: Bouton de détection forcée
            const forceRefreshBtn = document.getElementById('forceRefreshBtn');
            if (forceRefreshBtn) {
                forceRefreshBtn.addEventListener('click', () => this.forceUserDetection());
            }

            // NOUVEAU: Bouton de toggle auto-refresh
            const autoRefreshToggle = document.getElementById('autoRefreshToggle');
            if (autoRefreshToggle) {
                autoRefreshToggle.addEventListener('click', () => this.toggleAutoRefresh());
            }

            // Recherche d'utilisateurs
            const searchInput = document.getElementById('userSearchInput');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.renderUsersList(document.getElementById('filterSelect')?.value, e.target.value);
                });
            }

            // Filtre des utilisateurs
            const filterSelect = document.getElementById('filterSelect');
            if (filterSelect) {
                filterSelect.addEventListener('change', (e) => {
                    this.renderUsersList(e.target.value, document.getElementById('userSearchInput')?.value);
                });
            }
        } catch (error) {
            console.error('❌ Erreur lors de la liaison des événements:', error);
        }
    }

    /**
     * NOUVEAU: Détection forcée des nouveaux utilisateurs
     */
    async forceUserDetection() {
        try {
            this.showLoading(true);
            console.log('⚡ Détection forcée des nouveaux utilisateurs...');
            
            // Recharger complètement les données
            await this.refreshUsersList();
            
            this.showSuccess('Détection forcée terminée');
            
        } catch (error) {
            console.error('❌ Erreur lors de la détection forcée:', error);
            this.showError('Erreur lors de la détection forcée: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * NOUVEAU: Toggle du rafraîchissement automatique
     */
    toggleAutoRefresh() {
        const toggleBtn = document.getElementById('autoRefreshToggle');
        if (!toggleBtn) return;

        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
            toggleBtn.textContent = '▶️ Reprendre Auto';
            toggleBtn.className = 'btn btn-success';
            this.showSuccess('Rafraîchissement automatique mis en pause');
        } else {
            this.startAutoRefresh();
            toggleBtn.textContent = '⏸️ Pause Auto';
            toggleBtn.className = 'btn btn-warning';
            this.showSuccess('Rafraîchissement automatique repris');
        }
    }

    /**
     * Liaison des événements des cartes utilisateur avec gestion sécurisée
     */
    bindUserCardEvents() {
        try {
            // Utiliser la délégation d'événements pour éviter les problèmes de scope
            const usersList = document.getElementById('usersList');
            if (!usersList) return;

            usersList.addEventListener('click', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) return;

                const userId = target.getAttribute('data-user-id');
                if (!userId) return;

                if (target.id.startsWith('save_')) {
                    this.saveWebhook(userId);
                } else if (target.id.startsWith('toggle_')) {
                    this.toggleWebhookStatus(userId);
                } else if (target.id.startsWith('delete_')) {
                    this.deleteWebhook(userId);
                } else if (target.id.startsWith('details_')) {
                    this.viewWebhookDetails(userId);
                }
            });
        } catch (error) {
            console.error('❌ Erreur lors de la liaison des événements des cartes:', error);
        }
    }

    /**
     * Sauvegarde d'un webhook pour un utilisateur (version améliorée avec validation FieldValue)
     */
    async saveWebhook(userId) {
        try {
            this.showLoading(true);
            
            const webhookInput = document.getElementById(`webhook_${userId}`);
            const webhookUrl = webhookInput?.value?.trim();
            
            if (!webhookUrl) {
                throw new Error('L\'URL du webhook est requise');
            }

            // Validation de l'URL améliorée
            if (!this.validateWebhookUrl(webhookUrl)) {
                throw new Error('URL de webhook invalide. Doit être une URL HTTPS valide.');
            }

            const user = this.users.find(u => u.uid === userId);
            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            // Récupération sécurisée de FieldValue
            const FieldValue = this.getFirebaseFieldValue();
            const timestamp = FieldValue ? FieldValue.serverTimestamp() : new Date();

            // Préparer les données du webhook
            const webhookData = {
                webhookUrl: webhookUrl,
                isActive: true,
                updatedAt: timestamp,
                updatedBy: this.currentAdminUser.email,
                notes: `Mis à jour par l'administrateur le ${new Date().toLocaleDateString('fr-FR')}`
            };

            // Vérifier si le webhook existe déjà
            const existingWebhook = this.webhooks.get(userId);
            if (existingWebhook) {
                webhookData.createdAt = existingWebhook.createdAt;
            } else {
                webhookData.createdAt = timestamp;
            }

            // Sauvegarder dans Firestore
            await this.saveWebhookWithRetry(userId, webhookData);

            // Mettre à jour le cache local
            this.webhooks.set(userId, {
                userId: userId,
                ...webhookData,
                createdAt: webhookData.createdAt
            });

            // Mettre à jour la liste des utilisateurs si nécessaire
            const existingUserIndex = this.users.findIndex(u => u.uid === userId);
            if (existingUserIndex >= 0) {
                this.users[existingUserIndex].hasWebhook = true;
            }

            // Rafraîchir l'affichage
            this.renderUsersList(document.getElementById('filterSelect')?.value, document.getElementById('userSearchInput')?.value);
            this.renderStatistics();

            this.showSuccess(`Webhook sauvegardé pour ${user.email}`);
            
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde du webhook:', error);
            this.showError('Erreur lors de la sauvegarde: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Sauvegarde webhook avec retry amélioré
     */
    async saveWebhookWithRetry(userId, webhookData, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const db = firebase.firestore();
                await db.collection('userWebhooks').doc(userId).set(webhookData, { merge: true });
                console.log(`✅ Webhook sauvegardé (tentative ${attempt})`);
                return;
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Tentative ${attempt} échouée:`, error.message);
                
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }
        
        throw new Error(`Échec de la sauvegarde après ${maxRetries} tentatives: ${lastError.message}`);
    }

    /**
     * Basculer le statut d'un webhook avec retry
     */
    async toggleWebhookStatus(userId) {
        try {
            this.showLoading(true);
            
            const webhook = this.webhooks.get(userId);
            if (!webhook) {
                throw new Error('Webhook non trouvé');
            }

            const newStatus = !webhook.isActive;
            const user = this.users.find(u => u.uid === userId);
            
            // Mettre à jour dans Firestore
            await this.updateWebhookStatusWithRetry(userId, newStatus);

            // Mettre à jour le cache local
            webhook.isActive = newStatus;
            webhook.updatedAt = new Date();
            this.webhooks.set(userId, webhook);

            // Rafraîchir l'affichage
            this.renderUsersList(document.getElementById('filterSelect')?.value, document.getElementById('userSearchInput')?.value);
            this.renderStatistics();

            const action = newStatus ? 'activé' : 'désactivé';
            this.showSuccess(`Webhook ${action} pour ${user.email}`);
            
        } catch (error) {
            console.error('❌ Erreur lors du changement de statut:', error);
            this.showError('Erreur lors du changement de statut: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Mise à jour du statut webhook avec retry et validation FieldValue
     */
    async updateWebhookStatusWithRetry(userId, newStatus, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const db = firebase.firestore();
                
                // Récupération sécurisée de FieldValue
                const FieldValue = this.getFirebaseFieldValue();
                const updateData = {
                    isActive: newStatus,
                    updatedBy: this.currentAdminUser.email
                };
                
                if (FieldValue) {
                    updateData.updatedAt = FieldValue.serverTimestamp();
                } else {
                    updateData.updatedAt = new Date();
                }
                
                await db.collection('userWebhooks').doc(userId).update(updateData);
                console.log(`✅ Statut webhook mis à jour (tentative ${attempt})`);
                return;
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Tentative ${attempt} échouée:`, error.message);
                
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }
        
        throw new Error(`Échec de la mise à jour du statut après ${maxRetries} tentatives: ${lastError.message}`);
    }

    /**
     * Suppression d'un webhook avec confirmation renforcée
     */
    async deleteWebhook(userId) {
        try {
            const user = this.users.find(u => u.uid === userId);
            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            // Confirmation renforcée
            const confirmMessage = `Êtes-vous absolument sûr de vouloir supprimer le webhook de ${user.email} ?\n\nCette action est irréversible et peut affecter les intégrations en cours.`;
            if (!confirm(confirmMessage)) {
                return;
            }

            this.showLoading(true);

            // Supprimer de Firestore
            await this.deleteWebhookWithRetry(userId);

            // Supprimer du cache local
            this.webhooks.delete(userId);

            // Mettre à jour la liste des utilisateurs
            const userIndex = this.users.findIndex(u => u.uid === userId);
            if (userIndex >= 0) {
                this.users[userIndex].hasWebhook = false;
            }

            // Rafraîchir l'affichage
            this.renderUsersList(document.getElementById('filterSelect')?.value, document.getElementById('userSearchInput')?.value);
            this.renderStatistics();

            this.showSuccess(`Webhook supprimé pour ${user.email}`);
            
        } catch (error) {
            console.error('❌ Erreur lors de la suppression:', error);
            this.showError('Erreur lors de la suppression: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Suppression webhook avec retry
     */
    async deleteWebhookWithRetry(userId, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const db = firebase.firestore();
                await db.collection('userWebhooks').doc(userId).delete();
                console.log(`✅ Webhook supprimé (tentative ${attempt})`);
                return;
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Tentative ${attempt} échouée:`, error.message);
                
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }
        
        throw new Error(`Échec de la suppression après ${maxRetries} tentatives: ${lastError.message}`);
    }

    /**
     * Affichage des détails d'un webhook
     */
    viewWebhookDetails(userId) {
        try {
            const webhook = this.webhooks.get(userId);
            const user = this.users.find(u => u.uid === userId);
            
            if (!webhook || !user) {
                this.showError('Données non trouvées');
                return;
            }

            const details = `
Utilisateur: ${user.displayName} (${user.email})
UID: ${user.uid}

Webhook URL: ${webhook.webhookUrl}
Statut: ${webhook.isActive ? 'Actif' : 'Inactif'}
Créé le: ${this.formatDate(webhook.createdAt)}
Dernière modification: ${this.formatDate(webhook.updatedAt)}
${webhook.lastUsed ? `Dernière utilisation: ${this.formatDate(webhook.lastUsed)}` : ''}
${webhook.usageCount ? `Nombre d'utilisations: ${webhook.usageCount}` : ''}
${webhook.notes ? `Notes: ${webhook.notes}` : ''}
${webhook.updatedBy ? `Modifié par: ${webhook.updatedBy}` : ''}
            `;

            alert(details);
        } catch (error) {
            console.error('❌ Erreur lors de l\'affichage des détails:', error);
            this.showError('Erreur lors de l\'affichage des détails');
        }
    }

    /**
     * Validation d'une URL de webhook améliorée
     */
    validateWebhookUrl(url) {
        try {
            // Validation basique
            if (!url || typeof url !== 'string') {
                return false;
            }

            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const hasValidHostname = urlObj.hostname && urlObj.hostname.length > 3;
            const validLength = url.length > 10 && url.length <= 2048;
            const noInvalidChars = !url.includes('<') && !url.includes('>') && !url.includes('"');
            const noSpaces = !url.includes(' ');
            const validPath = urlObj.pathname && urlObj.pathname.length > 0;
            
            return isHttps && hasValidHostname && validLength && noInvalidChars && noSpaces && validPath;
        } catch (error) {
            console.warn('⚠️ Erreur de validation URL:', error);
            return false;
        }
    }

    /**
     * Rafraîchissement des données avec retry
     */
    async refreshData() {
        try {
            this.showLoading(true);
            
            // Charger les données en parallèle
            const [usersResult, webhooksResult] = await Promise.allSettled([
                this.loadUsersWithRetry(),
                this.loadAllWebhooksWithRetry()
            ]);

            if (usersResult.status === 'fulfilled') {
                this.users = usersResult.value;
            }
            if (webhooksResult.status === 'fulfilled') {
                this.webhooks = webhooksResult.value;
            }
            
            this.renderStatistics();
            this.renderUsersList(document.getElementById('filterSelect')?.value, document.getElementById('userSearchInput')?.value);
            
            this.showSuccess('Données actualisées avec succès');
        } catch (error) {
            console.error('❌ Erreur lors du rafraîchissement:', error);
            this.showError('Erreur lors du rafraîchissement: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Formatage de date avec gestion d'erreurs
     */
    formatDate(date) {
        try {
            if (!date) return 'Non défini';
            const d = date instanceof Date ? date : new Date(date);
            
            // Vérifier si la date est valide
            if (isNaN(d.getTime())) {
                return 'Date invalide';
            }
            
            return d.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.warn('⚠️ Erreur de formatage de date:', error);
            return 'Erreur de date';
        }
    }

    /**
     * Affichage de l'état de chargement
     */
    showLoading(show) {
        try {
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) {
                overlay.style.display = show ? 'flex' : 'none';
            }
        } catch (error) {
            console.warn('⚠️ Erreur lors de l\'affichage du loading:', error);
        }
    }

    /**
     * Affichage d'un message de succès
     */
    showSuccess(message) {
        try {
            if (window.notificationSystem && typeof window.notificationSystem.success === 'function') {
                window.notificationSystem.success(message, 'Succès');
            } else {
                console.log('✅ Succès:', message);
                this.showTemporaryMessage('✅ ' + message, 'success');
            }
        } catch (error) {
            console.warn('⚠️ Erreur lors de l\'affichage du succès:', error);
            console.log('✅ Succès:', message);
        }
    }

    /**
     * Affichage d'un message d'erreur
     */
    showError(message) {
        try {
            if (window.notificationSystem && typeof window.notificationSystem.error === 'function') {
                window.notificationSystem.error(message, 'Erreur');
            } else {
                console.error('❌ Erreur:', message);
                this.showTemporaryMessage('❌ ' + message, 'error');
            }
        } catch (error) {
            console.warn('⚠️ Erreur lors de l\'affichage de l\'erreur:', error);
            console.error('❌ Erreur:', message);
        }
    }

    /**
     * Affichage temporaire d'un message
     */
    showTemporaryMessage(message, type = 'info') {
        try {
            const messageDiv = document.createElement('div');
            messageDiv.className = `temp-message ${type}`;
            messageDiv.textContent = message;
            messageDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'error' ? '#f56565' : type === 'success' ? '#48bb78' : '#4299e1'};
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                z-index: 10000;
                animation: slideInRight 0.3s ease-out;
            `;
            
            document.body.appendChild(messageDiv);
            
            setTimeout(() => {
                messageDiv.remove();
            }, 5000);
        } catch (error) {
            console.warn('⚠️ Erreur lors de l\'affichage temporaire:', error);
        }
    }

    /**
     * Message d'accès refusé avec informations détaillées
     */
    showAccessDenied() {
        try {
            const container = document.getElementById('adminWebhookContainer') || document.body;
            const currentUser = this.getCurrentUserSecure();
            
            container.innerHTML = `
                <div class="access-denied">
                    <div class="access-denied-content">
                        <h1>🚫 Accès Refusé</h1>
                        <p>Cette interface est réservée à l'administrateur.</p>
                        <p>Veuillez vous connecter avec le compte administrateur : <strong>${this.adminEmail}</strong></p>
                        ${currentUser ? `<p>Vous êtes connecté avec : <strong>${this.escapeHtml(currentUser.email)}</strong></p>` : ''}
                        <div class="error-actions">
                            <button class="btn btn-primary" onclick="location.reload()">
                                🔄 Actualiser la page
                            </button>
                            <button class="btn btn-secondary" onclick="window.FirebaseAuthManager?.signOut()">
                                🚪 Se déconnecter
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('❌ Erreur lors de l\'affichage d\'accès refusé:', error);
        }
    }

    /**
     * Nettoyage des ressources avec gestion améliorée
     */
    cleanup() {
        try {
            console.log('🧹 Nettoyage AdminWebhookManagerEnhanced...');
            
            // Arrêter le rafraîchissement automatique
            if (this.autoRefreshInterval) {
                clearInterval(this.autoRefreshInterval);
                this.autoRefreshInterval = null;
            }
            
            // Réinitialiser les variables d'état
            this.isInitialized = false;
            this.isInitializing = false;
            this.currentAdminUser = null;
            this.users = [];
            this.webhooks.clear();
            this.authListenerAttached = false;
            this.userListenerAttached = false;
            
            // Exécuter les callbacks de nettoyage
            this.cleanupCallbacks.forEach(callback => {
                try {
                    callback();
                } catch (error) {
                    console.warn('⚠️ Erreur lors du nettoyage:', error);
                }
            });
            this.cleanupCallbacks = [];
            
            console.log('✅ AdminWebhookManagerEnhanced nettoyé');
        } catch (error) {
            console.error('❌ Erreur lors du nettoyage:', error);
        }
    }

    /**
     * Ajout d'un callback de nettoyage
     */
    addCleanupCallback(callback) {
        if (typeof callback === 'function') {
            this.cleanupCallbacks.push(callback);
        }
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminWebhookManagerEnhanced;
} else {
    window.AdminWebhookManagerEnhanced = AdminWebhookManagerEnhanced;
}