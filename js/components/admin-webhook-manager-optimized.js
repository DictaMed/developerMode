/**
 * DictaMed - Gestionnaire d'Administration des Webhooks OPTIMISÉ
 * Version: 3.0.0 - Attribution manuelle des webhooks avec synchronisation Firestore
 * 
 * Fonctionnalités principales:
 * - Interface dédiée pour les nouveaux utilisateurs non configurés
 * - Attribution manuelle des webhooks par l'admin
 * - Synchronisation temps réel avec Firestore
 * - Queue de traitement des webhooks
 * - Notifications en temps réel des nouveaux utilisateurs
 */

class AdminWebhookManagerOptimized {
    constructor() {
        this.currentAdminUser = null;
        this.isInitialized = false;
        this.isInitializing = false;
        this.adminEmail = 'akio963@gmail.com';
        
        // Données utilisateurs
        this.users = [];
        this.userUidSet = new Set();
        this.webhooks = new Map();
        
        // Statistiques
        this.stats = {
            totalUsers: 0,
            configuredWebhooks: 0,
            pendingWebhooks: 0,
            lastSync: null
        };
        
        // États et listeners
        this.firestoreListeners = [];
        this.userProfilesListener = null;
        this.webhooksListener = null;
        this.realTimeSyncEnabled = true;
        
        // Queue de traitement
        this.processingQueue = [];
        this.detectionLock = false;
        
        // Notifications
        this.notifications = [];
        this.maxNotifications = 10;
    }

    /**
     * Initialisation du gestionnaire
     */
    async init() {
        if (this.isInitialized || this.isInitializing) {
            console.log('ℹ️ AdminWebhookManager déjà initialisé');
            return this.isInitialized;
        }

        this.isInitializing = true;
        
        try {
            // 1. Vérifier l'authentification
            await this.waitForAuthManager(15000);
            
            if (!await this.verifyAdminAuth()) {
                console.error('❌ Accès admin refusé');
                return false;
            }

            this.currentAdminUser = this.getCurrentUserSecure();
            console.log('✅ Admin authentifié:', this.currentAdminUser.email);

            // 2. Configurer les écouteurs Firestore
            this.setupFirestoreListeners();
            
            // 3. Charger les données initiales
            await Promise.all([
                this.loadAllUsers(),
                this.loadAllWebhooks()
            ]);

            // 4. Initialiser l'interface
            this.renderAdminPanel();
            this.startAutoSync();

            this.isInitialized = true;
            console.log('✅ AdminWebhookManager initialisé avec succès');
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.showError('Erreur d\'initialisation: ' + error.message);
            return false;
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * Configuration des écouteurs Firestore temps réel
     */
    setupFirestoreListeners() {
        try {
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                throw new Error('Firestore non disponible');
            }

            const db = firebase.firestore();

            // Écouteur 1: Collection userProfiles (nouveaux utilisateurs)
            this.userProfilesListener = db.collection('userProfiles')
                .onSnapshot(
                    (snapshot) => {
                        console.log('🔄 Changement détecté dans userProfiles');
                        this.handleUserProfilesChange(snapshot);
                    },
                    (error) => {
                        console.error('❌ Erreur écouteur userProfiles:', error);
                    }
                );

            this.firestoreListeners.push(this.userProfilesListener);

            // Écouteur 2: Collection userWebhooks (changements webhooks)
            this.webhooksListener = db.collection('userWebhooks')
                .onSnapshot(
                    (snapshot) => {
                        console.log('🔄 Changement détecté dans userWebhooks');
                        this.handleWebhooksChange(snapshot);
                    },
                    (error) => {
                        console.error('❌ Erreur écouteur userWebhooks:', error);
                    }
                );

            this.firestoreListeners.push(this.webhooksListener);

            console.log('✅ Écouteurs Firestore configurés');
            
        } catch (error) {
            console.error('❌ Erreur configuration écouteurs:', error);
        }
    }

    /**
     * Traitement des changements userProfiles
     */
    async handleUserProfilesChange(snapshot) {
        if (this.detectionLock) {
            console.log('🔒 Traitement en cours, ajout à la queue');
            this.processingQueue.push({ type: 'profilesChange', snapshot });
            return;
        }

        this.detectionLock = true;

        try {
            const changes = [];
            
            snapshot.docChanges().forEach(change => {
                const userData = { uid: change.doc.id, ...change.doc.data() };
                
                switch(change.type) {
                    case 'added':
                        console.log('🆕 Nouvel utilisateur:', userData.email);
                        changes.push({ type: 'added', user: userData });
                        break;
                    case 'modified':
                        console.log('📝 Utilisateur modifié:', userData.email);
                        changes.push({ type: 'modified', user: userData });
                        break;
                    case 'removed':
                        console.log('🗑️ Utilisateur supprimé:', userData.email);
                        changes.push({ type: 'removed', user: userData });
                        break;
                }
            });

            await this.applyUserChanges(changes);
            
        } catch (error) {
            console.error('❌ Erreur traitement changements:', error);
        } finally {
            this.detectionLock = false;
            this.processQueue();
        }
    }

    /**
     * Application des changements utilisateurs
     */
    async applyUserChanges(changes) {
        let hasChanges = false;

        for (const change of changes) {
            const user = change.user;
            const uid = user.uid;

            if (change.type === 'added') {
                if (!this.userUidSet.has(uid)) {
                    this.users.push(user);
                    this.userUidSet.add(uid);
                    hasChanges = true;

                    // Ajouter une notification
                    this.addNotification(`🆕 Nouvel utilisateur: ${user.email}`);
                    
                    // Vérifier si un webhook est configuré
                    const hasWebhook = this.webhooks.has(uid);
                    user.hasWebhook = hasWebhook;
                    
                    console.log(`👤 Utilisateur ${user.email} - Webhook: ${hasWebhook ? '✅' : '⏳'}`);
                }
                
            } else if (change.type === 'modified') {
                const index = this.users.findIndex(u => u.uid === uid);
                if (index >= 0) {
                    this.users[index] = user;
                    hasChanges = true;
                }
                
            } else if (change.type === 'removed') {
                const index = this.users.findIndex(u => u.uid === uid);
                if (index >= 0) {
                    this.users.splice(index, 1);
                    this.userUidSet.delete(uid);
                    this.webhooks.delete(uid);
                    hasChanges = true;
                }
            }
        }

        if (hasChanges) {
            this.updateStatistics();
            this.refreshUIPanel();
        }
    }

    /**
     * Traitement des changements webhooks
     */
    async handleWebhooksChange(snapshot) {
        try {
            snapshot.docChanges().forEach(change => {
                const webhookData = change.doc.data();
                const userId = change.doc.id;

                switch(change.type) {
                    case 'added':
                        console.log('🔗 Webhook ajouté pour:', userId);
                        this.webhooks.set(userId, {
                            userId: userId,
                            ...webhookData
                        });
                        this.markUserAsConfigured(userId);
                        break;
                        
                    case 'modified':
                        console.log('🔗 Webhook modifié pour:', userId);
                        this.webhooks.set(userId, {
                            userId: userId,
                            ...webhookData
                        });
                        break;
                        
                    case 'removed':
                        console.log('🔗 Webhook supprimé pour:', userId);
                        this.webhooks.delete(userId);
                        this.markUserAsUnconfigured(userId);
                        break;
                }
            });

            this.updateStatistics();
            this.refreshUIPanel();
            
        } catch (error) {
            console.error('❌ Erreur traitement webhooks:', error);
        }
    }

    /**
     * Chargement de tous les utilisateurs depuis Firestore
     */
    async loadAllUsers() {
        try {
            console.log('👥 Chargement des utilisateurs...');
            
            const db = firebase.firestore();
            const snapshot = await db.collection('userProfiles').get();
            
            this.users = [];
            this.userUidSet.clear();

            snapshot.forEach(doc => {
                const userData = {
                    uid: doc.id,
                    ...doc.data()
                };
                
                // Vérifier si webhook configuré
                userData.hasWebhook = this.webhooks.has(doc.id);
                
                this.users.push(userData);
                this.userUidSet.add(doc.id);
            });

            console.log(`✅ ${this.users.length} utilisateurs chargés`);
            return this.users;
            
        } catch (error) {
            console.error('❌ Erreur chargement utilisateurs:', error);
            return [];
        }
    }

    /**
     * Chargement de tous les webhooks depuis Firestore
     */
    async loadAllWebhooks() {
        try {
            console.log('🔗 Chargement des webhooks...');
            
            const db = firebase.firestore();
            const snapshot = await db.collection('userWebhooks').get();
            
            this.webhooks.clear();

            snapshot.forEach(doc => {
                const data = doc.data();
                this.webhooks.set(doc.id, {
                    userId: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate?.() || data.createdAt,
                    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
                });
            });

            console.log(`✅ ${this.webhooks.size} webhooks chargés`);
            return this.webhooks;
            
        } catch (error) {
            console.error('❌ Erreur chargement webhooks:', error);
            return new Map();
        }
    }

    /**
     * Sauvegarde d'un webhook dans Firestore
     */
    async saveWebhookToFirestore(userId, webhookUrl, notes = '') {
        try {
            if (!this.validateWebhookUrl(webhookUrl)) {
                throw new Error('URL de webhook invalide');
            }

            const db = firebase.firestore();
            const FieldValue = this.getFirebaseFieldValue();

            const webhookData = {
                userId: userId,
                webhookUrl: webhookUrl,
                isActive: true,
                notes: notes || `Webhook assigné par ${this.currentAdminUser.email}`,
                createdAt: FieldValue ? FieldValue.serverTimestamp() : new Date(),
                updatedAt: FieldValue ? FieldValue.serverTimestamp() : new Date(),
                updatedBy: this.currentAdminUser.email,
                lastUsed: null
            };

            // Sauvegarder dans Firestore
            await db.collection('userWebhooks').doc(userId).set(webhookData, { merge: true });

            // Mettre à jour le cache local
            this.webhooks.set(userId, webhookData);
            this.markUserAsConfigured(userId);

            console.log(`✅ Webhook sauvegardé pour ${userId}`);
            return true;
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde webhook:', error);
            throw error;
        }
    }

    /**
     * Suppression d'un webhook
     */
    async deleteWebhook(userId) {
        try {
            const db = firebase.firestore();
            
            await db.collection('userWebhooks').doc(userId).delete();
            this.webhooks.delete(userId);
            this.markUserAsUnconfigured(userId);

            console.log(`✅ Webhook supprimé pour ${userId}`);
            return true;
            
        } catch (error) {
            console.error('❌ Erreur suppression webhook:', error);
            throw error;
        }
    }

    /**
     * Marquage d'un utilisateur comme configuré
     */
    markUserAsConfigured(userId) {
        const user = this.users.find(u => u.uid === userId);
        if (user) {
            user.hasWebhook = true;
            user.configuredAt = new Date();
        }
    }

    /**
     * Marquage d'un utilisateur comme non configuré
     */
    markUserAsUnconfigured(userId) {
        const user = this.users.find(u => u.uid === userId);
        if (user) {
            user.hasWebhook = false;
        }
    }

    /**
     * Mise à jour des statistiques
     */
    updateStatistics() {
        this.stats.totalUsers = this.users.length;
        this.stats.configuredWebhooks = this.webhooks.size;
        this.stats.pendingWebhooks = this.users.length - this.webhooks.size;
        this.stats.lastSync = new Date();
        
        console.log(`📊 Stats - Total: ${this.stats.totalUsers}, Configurés: ${this.stats.configuredWebhooks}, En attente: ${this.stats.pendingWebhooks}`);
    }

    /**
     * Rendu du panneau d'administration
     */
    renderAdminPanel() {
        const mainContent = document.getElementById('mainContent') || document.body;
        
        let container = document.getElementById('adminWebhookContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'adminWebhookContainer';
            container.className = 'admin-webhook-container';
            mainContent.appendChild(container);
        }

        const adminEmail = this.escapeHtml(this.currentAdminUser?.email || 'Admin');
        const timestamp = new Date().toLocaleString('fr-FR');

        container.innerHTML = `
            <div class="admin-webhook-header">
                <h1>🎛️ Gestion des Webhooks - Admin Panel</h1>
                <p>Attribution manuelle des webhooks avec synchronisation temps réel Firestore</p>
                <div class="admin-info">
                    <span>Admin: <strong>${adminEmail}</strong></span>
                    <span>Sync: <strong>${timestamp}</strong></span>
                </div>
            </div>

            <div class="admin-stats" id="adminStats">
                <!-- Statistiques -->
            </div>

            <div class="admin-tabs">
                <button class="tab-btn active" data-tab="pending">⏳ En Attente (${this.stats.pendingWebhooks})</button>
                <button class="tab-btn" data-tab="configured">✅ Configurés (${this.stats.configuredWebhooks})</button>
                <button class="tab-btn" data-tab="all">👥 Tous les Utilisateurs</button>
            </div>

            <div class="admin-content">
                <div id="pendingTab" class="tab-content active">
                    <h2>Utilisateurs en attente de configuration</h2>
                    <div id="pendingUsersList" class="users-list">
                        <!-- Liste des utilisateurs en attente -->
                    </div>
                </div>

                <div id="configuredTab" class="tab-content">
                    <h2>Utilisateurs configurés</h2>
                    <div id="configuredUsersList" class="users-list">
                        <!-- Liste des utilisateurs configurés -->
                    </div>
                </div>

                <div id="allTab" class="tab-content">
                    <h2>Tous les utilisateurs</h2>
                    <div id="allUsersList" class="users-list">
                        <!-- Liste complète -->
                    </div>
                </div>
            </div>

            <div id="notificationCenter" class="notification-center">
                <!-- Notifications -->
            </div>
        `;

        this.updateStatisticsDisplay();
        this.renderUserLists();
        this.setupTabNavigation();
        this.setupEventListeners();
    }

    /**
     * Rendu des listes d'utilisateurs
     */
    renderUserLists() {
        const pendingUsers = this.users.filter(u => !u.hasWebhook);
        const configuredUsers = this.users.filter(u => u.hasWebhook);

        // Onglet En attente
        const pendingContainer = document.getElementById('pendingUsersList');
        if (pendingContainer) {
            pendingContainer.innerHTML = pendingUsers.length === 0 
                ? '<p class="no-data">✅ Aucun utilisateur en attente</p>'
                : pendingUsers.map(user => this.renderUserCard(user, 'pending')).join('');
        }

        // Onglet Configurés
        const configuredContainer = document.getElementById('configuredUsersList');
        if (configuredContainer) {
            configuredContainer.innerHTML = configuredUsers.length === 0
                ? '<p class="no-data">Aucun utilisateur configuré</p>'
                : configuredUsers.map(user => this.renderUserCard(user, 'configured')).join('');
        }

        // Onglet Tous
        const allContainer = document.getElementById('allUsersList');
        if (allContainer) {
            allContainer.innerHTML = this.users.length === 0
                ? '<p class="no-data">Aucun utilisateur</p>'
                : this.users.map(user => this.renderUserCard(user, 'all')).join('');
        }
    }

    /**
     * Rendu d'une carte utilisateur
     */
    renderUserCard(user, section) {
        const webhook = this.webhooks.get(user.uid);
        const webhookDisplay = webhook ? `<code>${this.escapeHtml(webhook.webhookUrl.substring(0, 50))}...</code>` : '<em>Pas configuré</em>';
        const status = user.hasWebhook ? '✅ Configuré' : '⏳ En attente';
        const createdDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A';

        return `
            <div class="user-card" data-user-id="${user.uid}">
                <div class="user-info">
                    <h3>${this.escapeHtml(user.displayName || user.email)}</h3>
                    <p>Email: <strong>${this.escapeHtml(user.email)}</strong></p>
                    <p>Inscrit: ${createdDate}</p>
                    <p>Status: <span class="status-badge ${user.hasWebhook ? 'configured' : 'pending'}">${status}</span></p>
                </div>

                <div class="webhook-section">
                    <label>Webhook URL:</label>
                    <input type="text" 
                        class="webhook-input" 
                        data-user-id="${user.uid}"
                        value="${webhook ? this.escapeHtml(webhook.webhookUrl) : ''}" 
                        placeholder="https://example.com/webhook">
                    
                    <textarea class="webhook-notes" 
                        data-user-id="${user.uid}"
                        placeholder="Notes (optionnel)">${webhook ? this.escapeHtml(webhook.notes || '') : ''}</textarea>
                </div>

                <div class="webhook-actions">
                    <button class="btn btn-primary save-webhook" data-user-id="${user.uid}">💾 Sauvegarder</button>
                    ${webhook ? `<button class="btn btn-danger delete-webhook" data-user-id="${user.uid}">🗑️ Supprimer</button>` : ''}
                    <button class="btn btn-info view-details" data-user-id="${user.uid}">ℹ️ Détails</button>
                </div>
            </div>
        `;
    }

    /**
     * Configuration de la navigation par onglets
     */
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = button.getAttribute('data-tab');
                
                // Désactiver tous les onglets
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Activer l'onglet sélectionné
                button.classList.add('active');
                document.getElementById(`${tabName}Tab`).classList.add('active');
            });
        });
    }

    /**
     * Configuration des écouteurs d'événements
     */
    setupEventListeners() {
        // Boutons de sauvegarde
        document.querySelectorAll('.save-webhook').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = btn.getAttribute('data-user-id');
                this.handleSaveWebhook(userId);
            });
        });

        // Boutons de suppression
        document.querySelectorAll('.delete-webhook').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = btn.getAttribute('data-user-id');
                this.handleDeleteWebhook(userId);
            });
        });

        // Boutons de détails
        document.querySelectorAll('.view-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = btn.getAttribute('data-user-id');
                this.showUserDetails(userId);
            });
        });
    }

    /**
     * Gestion de la sauvegarde du webhook
     */
    async handleSaveWebhook(userId) {
        try {
            const webhookInput = document.querySelector(`.webhook-input[data-user-id="${userId}"]`);
            const notesInput = document.querySelector(`.webhook-notes[data-user-id="${userId}"]`);
            
            const webhookUrl = webhookInput?.value?.trim();
            const notes = notesInput?.value?.trim() || '';

            if (!webhookUrl) {
                this.showError('L\'URL du webhook est requise');
                return;
            }

            await this.saveWebhookToFirestore(userId, webhookUrl, notes);
            this.showSuccess(`✅ Webhook sauvegardé pour l'utilisateur`);
            
            this.refreshUIPanel();
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
            this.showError('Erreur: ' + error.message);
        }
    }

    /**
     * Gestion de la suppression du webhook
     */
    async handleDeleteWebhook(userId) {
        const user = this.users.find(u => u.uid === userId);
        
        if (!confirm(`Êtes-vous sûr de vouloir supprimer le webhook de ${user?.email} ?`)) {
            return;
        }

        try {
            await this.deleteWebhook(userId);
            this.showSuccess(`✅ Webhook supprimé`);
            this.refreshUIPanel();
        } catch (error) {
            this.showError('Erreur: ' + error.message);
        }
    }

    /**
     * Affichage des détails utilisateur
     */
    showUserDetails(userId) {
        const user = this.users.find(u => u.uid === userId);
        const webhook = this.webhooks.get(userId);

        const details = `
            <h3>Détails Utilisateur</h3>
            <p><strong>UID:</strong> ${user.uid}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Nom:</strong> ${user.displayName || 'N/A'}</p>
            <p><strong>Date d'inscription:</strong> ${new Date(user.createdAt).toLocaleString('fr-FR')}</p>
            <p><strong>Vérification Email:</strong> ${user.emailVerified ? '✅ Vérifiée' : '❌ Non vérifiée'}</p>
            
            ${webhook ? `
                <h4>Configuration Webhook</h4>
                <p><strong>URL:</strong> ${webhook.webhookUrl}</p>
                <p><strong>Actif:</strong> ${webhook.isActive ? '✅' : '❌'}</p>
                <p><strong>Notes:</strong> ${webhook.notes}</p>
                <p><strong>Créé:</strong> ${new Date(webhook.createdAt).toLocaleString('fr-FR')}</p>
                <p><strong>Modifié:</strong> ${new Date(webhook.updatedAt).toLocaleString('fr-FR')}</p>
                <p><strong>Par:</strong> ${webhook.updatedBy}</p>
            ` : '<p>Aucun webhook configuré</p>'}
        `;

        alert(details);
    }

    /**
     * Mise à jour de l'affichage des statistiques
     */
    updateStatisticsDisplay() {
        const statsContainer = document.getElementById('adminStats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-card">
                    <div class="stat-value">${this.stats.totalUsers}</div>
                    <div class="stat-label">Utilisateurs Total</div>
                </div>
                <div class="stat-card configured">
                    <div class="stat-value">${this.stats.configuredWebhooks}</div>
                    <div class="stat-label">Webhooks Configurés</div>
                </div>
                <div class="stat-card pending">
                    <div class="stat-value">${this.stats.pendingWebhooks}</div>
                    <div class="stat-label">En Attente</div>
                </div>
            `;
        }
    }

    /**
     * Rafraîchissement du panneau UI
     */
    refreshUIPanel() {
        this.updateStatistics();
        this.updateStatisticsDisplay();
        this.renderUserLists();
        this.setupEventListeners();
    }

    /**
     * Synchronisation automatique
     */
    startAutoSync() {
        setInterval(() => {
            if (this.realTimeSyncEnabled) {
                console.log('🔄 Synchronisation auto...');
                this.updateStatistics();
            }
        }, 30000); // Tous les 30 secondes
    }

    /**
     * Ajout d'une notification
     */
    addNotification(message) {
        this.notifications.unshift({
            message: message,
            timestamp: new Date(),
            id: Math.random()
        });

        if (this.notifications.length > this.maxNotifications) {
            this.notifications.pop();
        }

        this.renderNotifications();
    }

    /**
     * Rendu des notifications
     */
    renderNotifications() {
        const center = document.getElementById('notificationCenter');
        if (!center) return;

        center.innerHTML = this.notifications
            .map(notif => `
                <div class="notification">
                    <span>${notif.message}</span>
                    <small>${notif.timestamp.toLocaleTimeString('fr-FR')}</small>
                </div>
            `)
            .join('');
    }

    /**
     * Traitement de la queue
     */
    processQueue() {
        while (this.processingQueue.length > 0 && !this.detectionLock) {
            const item = this.processingQueue.shift();
            
            if (item.type === 'profilesChange') {
                this.handleUserProfilesChange(item.snapshot);
            }
        }
    }

    /**
     * Validation URL webhook
     */
    validateWebhookUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
        } catch {
            return false;
        }
    }

    /**
     * Helpers utilitaires
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getCurrentUserSecure() {
        try {
            return firebase.auth().currentUser;
        } catch {
            return null;
        }
    }

    getFirebaseFieldValue() {
        try {
            return firebase.firestore.FieldValue;
        } catch {
            return null;
        }
    }

    async waitForAuthManager(timeout) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            if (firebase?.auth()?.currentUser) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return false;
    }

    async verifyAdminAuth() {
        const user = firebase?.auth()?.currentUser;
        return user && user.email === this.adminEmail;
    }

    showError(message) {
        console.error(message);
        alert(`❌ ${message}`);
    }

    showSuccess(message) {
        console.log(message);
        this.addNotification(message);
    }
}

// Export
if (typeof window !== 'undefined') {
    window.AdminWebhookManagerOptimized = AdminWebhookManagerOptimized;
}
