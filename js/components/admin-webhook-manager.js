/**
 * DictaMed - Gestionnaire d'Interface d'Administration des Webhooks
 * Version: 1.1.0 - Corrections des bugs d'authentification et gestion d'erreurs améliorée
 */

class AdminWebhookManager {
    constructor() {
        this.currentAdminUser = null;
        this.isInitialized = false;
        this.isInitializing = false;
        this.adminEmail = 'akio963@gmail.com'; // Email de l'administrateur principal
        this.users = []; // Liste des utilisateurs
        this.webhooks = new Map(); // Cache des webhooks par utilisateur
        this.authListenerAttached = false; // État de l'écouteur d'authentification
        this.cleanupCallbacks = []; // Fonctions de nettoyage
    }

    /**
     * Initialisation du gestionnaire d'admin avec gestion d'erreurs améliorée
     */
    async init() {
        // Éviter la double initialisation
        if (this.isInitialized || this.isInitializing) {
            console.log('ℹ️ AdminWebhookManager déjà initialisé ou en cours d\'initialisation');
            return this.isInitialized;
        }

        this.isInitializing = true;
        console.log('🔧 Initialisation AdminWebhookManager v1.1.0...');
        
        try {
            // 1. Vérification de l'authentification avec retry
            if (!await this.waitForAuthInitialization(10000)) {
                throw new Error('Authentification non initialisée dans les temps');
            }

            if (!this.checkAdminAuth()) {
                this.showAccessDenied();
                return false;
            }

            // 2. Récupération sécurisée de l'utilisateur actuel
            this.currentAdminUser = this.getCurrentUserSecure();
            if (!this.currentAdminUser) {
                throw new Error('Impossible de récupérer les informations utilisateur');
            }
            console.log('✅ Admin authentifié:', this.currentAdminUser.email);

            // 3. Configuration de l'écouteur d'authentification
            this.setupAuthListener();

            // 4. Chargement des données avec retry
            await this.loadUsersWithRetry();
            await this.loadAllWebhooksWithRetry();

            // 5. Initialisation de l'interface
            this.initAdminInterface();
            this.bindEvents();

            this.isInitialized = true;
            console.log('✅ AdminWebhookManager v1.1.0 initialisé avec succès');
            return true;

        } catch (error) {
            console.error('❌ Erreur d\'initialisation AdminWebhookManager:', error);
            this.showError('Erreur lors de l\'initialisation: ' + error.message);
            this.cleanup(); // Nettoyer en cas d'erreur
            return false;
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * Attendre l'initialisation de l'authentification avec retry
     */
    async waitForAuthInitialization(timeout = 10000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            try {
                const authManager = this.getAuthManager();
                if (authManager && authManager.isInitialized) {
                    return true;
                }
            } catch (error) {
                console.warn('⚠️ Erreur lors de la vérification auth:', error);
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        return false;
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
     * Configuration de l'écouteur d'authentification
     */
    setupAuthListener() {
        if (this.authListenerAttached) return;

        try {
            const authManager = this.getAuthManager();
            if (authManager && authManager.addAuthStateListener) {
                authManager.addAuthStateListener((user) => {
                    console.log('🔐 Changement d\'état auth détecté:', user ? user.email : 'null');
                    this.handleAuthStateChange(user);
                });
                this.authListenerAttached = true;
                console.log('✅ Écouteur d\'authentification configuré');
            }
        } catch (error) {
            console.warn('⚠️ Impossible de configurer l\'écouteur auth:', error);
        }
    }

    /**
     * Gestion des changements d'état d'authentification
     */
    async handleAuthStateChange(user) {
        if (!user || user.email !== this.adminEmail) {
            console.log('🚫 Accès admin révoqué');
            this.showAccessDenied();
            return;
        }

        // Recharger les données si nécessaire
        if (this.isInitialized) {
            try {
                await this.refreshData();
            } catch (error) {
                console.error('❌ Erreur lors du rafraîchissement après changement auth:', error);
            }
        }
    }

    /**
     * Vérification de l'authentification admin avec gestion d'erreurs
     */
    checkAdminAuth() {
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
     * Chargement des utilisateurs avec retry et gestion d'erreurs améliorée
     */
    async loadUsersWithRetry(maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`👥 Tentative ${attempt}/${maxRetries} de chargement des utilisateurs...`);
                const users = await this.loadUsers();
                if (users.length >= 0) { // Accepter 0 utilisateur comme valide
                    return users;
                }
                throw new Error('Résultat invalide du chargement des utilisateurs');
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Tentative ${attempt} échouée:`, error.message);
                
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Backoff exponentiel
                }
            }
        }
        
        console.error('❌ Échec du chargement des utilisateurs après', maxRetries, 'tentatives:', lastError);
        this.showError('Impossible de charger les utilisateurs après plusieurs tentatives');
        return [];
    }

    /**
     * Chargement de tous les webhooks avec retry
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
     * Chargement de tous les utilisateurs (version corrigée côté client)
     */
    async loadUsers() {
        try {
            console.log('👥 Chargement des utilisateurs...');
            
            // Vérification Firebase
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                throw new Error('Firestore non disponible');
            }

            const db = firebase.firestore();
            this.users = [];
            
            // Méthode 1: Essayer de charger depuis une collection userProfiles (si elle existe)
            try {
                const profilesSnapshot = await db.collection('userProfiles').get();
                if (!profilesSnapshot.empty) {
                    this.users = profilesSnapshot.docs.map(doc => ({
                        uid: doc.id,
                        ...doc.data()
                    }));
                    console.log(`✅ ${this.users.length} utilisateurs chargés depuis userProfiles`);
                    return this.users;
                }
            } catch (profileError) {
                console.log('ℹ️ Collection userProfiles non accessible, utilisation de la méthode alternative');
            }
            
            // Méthode 2: Déduire les utilisateurs depuis les webhooks existants
            const webhooksSnapshot = await db.collection('userWebhooks').get();
            const webhookUsers = [];
            
            for (const doc of webhooksSnapshot.docs) {
                const webhookData = doc.data();
                // Essayer de récupérer les infos utilisateur depuis les données du webhook
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
            }
            
            // Méthode 3: Ajouter l'utilisateur admin actuel s'il n'est pas dans la liste
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
            
            this.users = webhookUsers;
            console.log(`✅ ${this.users.length} utilisateurs déduits depuis les webhooks`);
            return this.users;

        } catch (error) {
            console.error('❌ Erreur lors du chargement des utilisateurs:', error);
            this.showError('Impossible de charger les utilisateurs: ' + error.message);
            return [];
        }
    }

    /**
     * Chargement de tous les webhooks avec gestion d'erreurs améliorée
     */
    async loadAllWebhooks() {
        try {
            console.log('🔗 Chargement des webhooks...');
            
            // Vérification Firebase
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                throw new Error('Firestore non disponible');
            }

            const db = firebase.firestore();
            const snapshot = await db.collection('userWebhooks').get();
            
            snapshot.forEach(doc => {
                try {
                    const data = doc.data();
                    this.webhooks.set(doc.id, {
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

            console.log(`✅ ${this.webhooks.size} webhooks chargés`);
            return this.webhooks;

        } catch (error) {
            console.error('❌ Erreur lors du chargement des webhooks:', error);
            this.showError('Impossible de charger les webhooks: ' + error.message);
            return new Map();
        }
    }

    /**
     * Initialisation de l'interface admin avec gestion d'erreurs
     */
    initAdminInterface() {
        try {
            // Créer le conteneur principal si nécessaire
            this.createAdminContainer();
            
            // Afficher la liste des utilisateurs
            this.renderUsersList();
            
            // Afficher les statistiques
            this.renderStatistics();
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation de l\'interface:', error);
            throw error;
        }
    }

    /**
     * Création du conteneur d'administration avec gestion d'erreurs
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

        // Injection du HTML avec échappement des données utilisateur
        const adminContainer = document.getElementById('adminWebhookContainer');
        if (!adminContainer) {
            throw new Error('Impossible de créer le conteneur admin');
        }

        const adminEmail = this.escapeHtml(this.currentAdminUser.email);
        adminContainer.innerHTML = `
            <div class="admin-webhook-header">
                <h1>🎛️ Administration des Webhooks</h1>
                <p>Gestion des webhooks utilisateur pour DictaMed</p>
                <div class="admin-info">
                    <span>Connecté en tant que: <strong>${adminEmail}</strong></span>
                    <button id="refreshDataBtn" class="btn btn-secondary">🔄 Actualiser</button>
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
            const activeWebhooks = Array.from(this.webhooks.values()).filter(w => w.isActive).length;
            const inactiveWebhooks = totalWebhooks - activeWebhooks;
            const usersWithoutWebhooks = totalUsers - totalWebhooks;

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
                    <div class="stat-card">
                        <div class="stat-icon">⚠️</div>
                        <div class="stat-content">
                            <div class="stat-number">${usersWithoutWebhooks}</div>
                            <div class="stat-label">Sans Webhook</div>
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
            }

            // Appliquer la recherche
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filteredUsers = filteredUsers.filter(user => 
                    user.email.toLowerCase().includes(term) ||
                    user.displayName.toLowerCase().includes(term) ||
                    user.uid.toLowerCase().includes(term)
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
     * Rendu d'une carte utilisateur avec validation des données - VERSION CORRIGÉE
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

            const displayName = this.escapeHtml(user.displayName || 'Nom non disponible');
            const userEmail = this.escapeHtml(user.email);
            const userUid = this.escapeHtml(user.uid);
            const webhookUrl = webhook?.webhookUrl ? this.escapeHtml(webhook.webhookUrl) : '';

            return `
                <div class="user-card ${statusClass}" data-user-id="${userUid}">
                    <div class="user-info">
                        <div class="user-avatar">
                            ${displayName.charAt(0).toUpperCase()}
                        </div>
                        <div class="user-details">
                            <div class="user-name">${displayName}</div>
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
                                   id="webhook_${userUid}"
                                   placeholder="https://exemple.com/webhook" 
                                   value="${webhookUrl}">
                            <button class="btn btn-save" onclick="adminWebhookManager.saveWebhook('${userUid}')">
                                💾 Sauvegarder
                            </button>
                        </div>
                        
                        <div class="webhook-controls">
                            <button class="btn ${isActive ? 'btn-warning' : 'btn-success'}" 
                                    onclick="adminWebhookManager.toggleWebhookStatus('${userUid}')">
                                ${isActive ? '🚫 Désactiver' : '✅ Activer'}
                            </button>
                            
                            <button class="btn btn-danger" 
                                    onclick="adminWebhookManager.deleteWebhook('${userUid}')"
                                    ${!hasWebhook ? 'disabled' : ''}>
                                🗑️ Supprimer
                            </button>
                            
                            ${webhook ? `
                            <button class="btn btn-info" onclick="adminWebhookManager.viewWebhookDetails('${userUid}')">
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
     * Liaison des événements des cartes utilisateur
     */
    bindUserCardEvents() {
        // Les événements sont déjà liés via onclick dans le HTML pour éviter les problèmes de scope
    }

    /**
     * Sauvegarde d'un webhook pour un utilisateur (version améliorée avec retry)
     */
    async saveWebhook(userId) {
        try {
            this.showLoading(true);
            
            const webhookInput = document.getElementById(`webhook_${userId}`);
            const webhookUrl = webhookInput?.value?.trim();
            
            if (!webhookUrl) {
                throw new Error('L\'URL du webhook est requise');
            }

            // Validation de l'URL
            if (!this.validateWebhookUrl(webhookUrl)) {
                throw new Error('URL de webhook invalide. Doit être une URL HTTPS valide.');
            }

            const user = this.users.find(u => u.uid === userId);
            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            // Préparer les données du webhook
            const webhookData = {
                webhookUrl: webhookUrl,
                isActive: true,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: this.currentAdminUser.email,
                notes: `Mis à jour par l'administrateur le ${new Date().toLocaleDateString('fr-FR')}`
            };

            // Vérifier si le webhook existe déjà
            const existingWebhook = this.webhooks.get(userId);
            if (existingWebhook) {
                webhookData.createdAt = existingWebhook.createdAt;
            } else {
                webhookData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            }

            // Sauvegarder dans Firestore avec retry
            await this.saveWebhookWithRetry(userId, webhookData);

            // NOUVEAU: Sauvegarder/mettre à jour les infos utilisateur dans userProfiles
            await this.updateUserProfile(user);

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
     * Sauvegarde webhook avec retry
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
     * Mise à jour du profil utilisateur
     */
    async updateUserProfile(user) {
        try {
            const db = firebase.firestore();
            const userProfileData = {
                email: user.email,
                displayName: user.displayName,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt ? 
                    (user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt)) 
                    : firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                hasWebhook: true,
                lastWebhookUpdate: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection('userProfiles').doc(user.uid).set(userProfileData, { merge: true });
            console.log('✅ Profil utilisateur mis à jour dans userProfiles');
        } catch (profileError) {
            console.warn('⚠️ Impossible de mettre à jour userProfiles:', profileError);
            // Ne pas échouer la sauvegarde du webhook pour cette raison
        }
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
            
            // Mettre à jour dans Firestore avec retry
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
     * Mise à jour du statut webhook avec retry
     */
    async updateWebhookStatusWithRetry(userId, newStatus, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const db = firebase.firestore();
                await db.collection('userWebhooks').doc(userId).update({
                    isActive: newStatus,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedBy: this.currentAdminUser.email
                });
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

            // Supprimer de Firestore avec retry
            await this.deleteWebhookWithRetry(userId);

            // Supprimer du cache local
            this.webhooks.delete(userId);

            // Mettre à jour le profil utilisateur pour indiquer qu'il n'a plus de webhook
            await this.updateUserProfileAfterDeletion(userId);

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
     * Mise à jour du profil après suppression
     */
    async updateUserProfileAfterDeletion(userId) {
        try {
            const db = firebase.firestore();
            await db.collection('userProfiles').doc(userId).update({
                hasWebhook: false,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Profil utilisateur mis à jour après suppression');
        } catch (profileError) {
            console.warn('⚠️ Impossible de mettre à jour userProfiles après suppression:', profileError);
        }
    }

    /**
     * Affichage des détails d'un webhook avec validation
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
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const hasValidHostname = urlObj.hostname && urlObj.hostname.length > 3;
            const validLength = url.length > 10 && url.length <= 2048;
            const noInvalidChars = !url.includes('<') && !url.includes('>') && !url.includes('"');
            
            return isHttps && hasValidHostname && validLength && noInvalidChars;
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
            
            // Charger les données avec retry
            await this.loadUsersWithRetry();
            await this.loadAllWebhooksWithRetry();
            
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
     * Affichage de l'état de chargement avec validation DOM
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
     * Affichage d'un message de succès avec fallback amélioré
     */
    showSuccess(message) {
        try {
            if (window.notificationSystem && typeof window.notificationSystem.success === 'function') {
                window.notificationSystem.success(message, 'Succès');
            } else {
                console.log('✅ Succès:', message);
                // Fallback amélioré
                this.showTemporaryMessage('✅ ' + message, 'success');
            }
        } catch (error) {
            console.warn('⚠️ Erreur lors de l\'affichage du succès:', error);
            console.log('✅ Succès:', message);
        }
    }

    /**
     * Affichage d'un message d'erreur avec fallback amélioré
     */
    showError(message) {
        try {
            if (window.notificationSystem && typeof window.notificationSystem.error === 'function') {
                window.notificationSystem.error(message, 'Erreur');
            } else {
                console.error('❌ Erreur:', message);
                // Fallback amélioré
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
     * Nettoyage des ressources
     */
    cleanup() {
        try {
            console.log('🧹 Nettoyage AdminWebhookManager...');
            
            // Réinitialiser les variables d'état
            this.isInitialized = false;
            this.isInitializing = false;
            this.currentAdminUser = null;
            this.users = [];
            this.webhooks.clear();
            
            // Exécuter les callbacks de nettoyage
            this.cleanupCallbacks.forEach(callback => {
                try {
                    callback();
                } catch (error) {
                    console.warn('⚠️ Erreur lors du nettoyage:', error);
                }
            });
            this.cleanupCallbacks = [];
            
            console.log('✅ AdminWebhookManager nettoyé');
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
    module.exports = AdminWebhookManager;
} else {
    window.AdminWebhookManager = AdminWebhookManager;
}