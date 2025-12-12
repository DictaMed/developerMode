/**
 * DictaMed - Gestionnaire d'Interface d'Administration des Webhooks
 * Version: 1.0.0 - Interface complète pour gérer les webhooks utilisateur
 */

class AdminWebhookManager {
    constructor() {
        this.currentAdminUser = null;
        this.isInitialized = false;
        this.adminEmail = 'akio963@gmail.com'; // Email de l'administrateur principal
        this.users = []; // Liste des utilisateurs
        this.webhooks = new Map(); // Cache des webhooks par utilisateur
    }

    /**
     * Initialisation du gestionnaire d'admin
     */
    async init() {
        try {
            console.log('🔧 Initialisation AdminWebhookManager...');
            
            // Vérifier l'authentification
            if (!this.checkAdminAuth()) {
                this.showAccessDenied();
                return false;
            }

            const authManager = window.FirebaseAuthManager || FirebaseAuthManager.getInstance();
            this.currentAdminUser = authManager.getCurrentUser();
            console.log('✅ Admin authentifié:', this.currentAdminUser.email);

            // Charger les données
            await this.loadUsers();
            await this.loadAllWebhooks();

            // Initialiser l'interface
            this.initAdminInterface();
            this.bindEvents();

            this.isInitialized = true;
            console.log('✅ AdminWebhookManager initialisé avec succès');
            return true;

        } catch (error) {
            console.error('❌ Erreur d\'initialisation AdminWebhookManager:', error);
            this.showError('Erreur lors de l\'initialisation: ' + error.message);
            return false;
        }
    }

    /**
     * Vérification de l'authentification admin
     */
    checkAdminAuth() {
        const authManager = window.FirebaseAuthManager || FirebaseAuthManager.getInstance();
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
    }

    /**
     * Chargement de tous les utilisateurs
     */
    async loadUsers() {
        try {
            console.log('👥 Chargement des utilisateurs...');
            
            const db = firebase.firestore();
            
            // Récupérer tous les utilisateurs depuis Firebase Auth
            const listUsersResult = await firebase.auth().listUsers(1000);
            this.users = listUsersResult.users.map(user => ({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || 'Non défini',
                emailVerified: user.emailVerified,
                createdAt: new Date(user.metadata.creationTime).toISOString()
            }));

            console.log(`✅ ${this.users.length} utilisateurs chargés`);
            return this.users;

        } catch (error) {
            console.error('❌ Erreur lors du chargement des utilisateurs:', error);
            this.showError('Impossible de charger les utilisateurs: ' + error.message);
            return [];
        }
    }

    /**
     * Chargement de tous les webhooks
     */
    async loadAllWebhooks() {
        try {
            console.log('🔗 Chargement des webhooks...');
            
            const db = firebase.firestore();
            const snapshot = await db.collection('userWebhooks').get();
            
            snapshot.forEach(doc => {
                const data = doc.data();
                this.webhooks.set(doc.id, {
                    userId: doc.id,
                    ...data,
                    lastUsed: data.lastUsed?.toDate?.() || data.lastUsed
                });
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
     * Initialisation de l'interface admin
     */
    initAdminInterface() {
        // Créer le conteneur principal si nécessaire
        this.createAdminContainer();
        
        // Afficher la liste des utilisateurs
        this.renderUsersList();
        
        // Afficher les statistiques
        this.renderStatistics();
    }

    /**
     * Création du conteneur d'administration
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

        // Injecter le HTML de l'interface
        const adminContainer = document.getElementById('adminWebhookContainer');
        adminContainer.innerHTML = `
            <div class="admin-webhook-header">
                <h1>🎛️ Administration des Webhooks</h1>
                <p>Gestion des webhooks utilisateur pour DictaMed</p>
                <div class="admin-info">
                    <span>Connecté en tant que: <strong>${this.currentAdminUser.email}</strong></span>
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
     * Rendu des statistiques
     */
    renderStatistics() {
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
    }

    /**
     * Rendu de la liste des utilisateurs
     */
    renderUsersList(filter = 'all', searchTerm = '') {
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

        // Générer le HTML
        usersListContainer.innerHTML = filteredUsers.map(user => {
            const webhook = this.webhooks.get(user.uid);
            return this.renderUserCard(user, webhook);
        }).join('');

        // Ajouter les gestionnaires d'événements
        this.bindUserCardEvents();
    }

    /**
     * Rendu d'une carte utilisateur
     */
    renderUserCard(user, webhook) {
        const isActive = webhook?.isActive !== false;
        const hasWebhook = !!webhook;
        const statusClass = hasWebhook ? (isActive ? 'active' : 'inactive') : 'no-webhook';
        const statusText = hasWebhook ? (isActive ? 'Actif' : 'Inactif') : 'Non configuré';
        const statusIcon = hasWebhook ? (isActive ? '✅' : '❌') : '⚪';

        return `
            <div class="user-card ${statusClass}" data-user-id="${user.uid}">
                <div class="user-info">
                    <div class="user-avatar">
                        ${user.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div class="user-details">
                        <div class="user-name">${user.displayName}</div>
                        <div class="user-email">${user.email}</div>
                        <div class="user-uid">${user.uid}</div>
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
                               id="webhook_${user.uid}"
                               placeholder="https://exemple.com/webhook" 
                               value="${webhook?.webhookUrl || ''}">
                        <button class="btn btn-save" onclick="adminWebhookManager.saveWebhook('${user.uid}')">
                            💾 Sauvegarder
                        </button>
                    </div>
                    
                    <div class="webhook-controls">
                        <button class="btn ${isActive ? 'btn-warning' : 'btn-success'}" 
                                onclick="adminWebhookManager.toggleWebhookStatus('${user.uid}')">
                            ${isActive ? '🚫 Désactiver' : '✅ Activer'}
                        </button>
                        
                        <button class="btn btn-danger" 
                                onclick="adminWebhookManager.deleteWebhook('${user.uid}')"
                                ${!hasWebhook ? 'disabled' : ''}>
                            🗑️ Supprimer
                        </button>
                        
                        ${webhook ? `
                        <button class="btn btn-info" onclick="adminWebhookManager.viewWebhookDetails('${user.uid}')">
                            ℹ️ Détails
                        </button>
                        ` : ''}
                    </div>
                    
                    ${webhook ? `
                    <div class="webhook-meta">
                        <small>Créé: ${this.formatDate(webhook.createdAt)}</small>
                        ${webhook.lastUsed ? `<small>Dernière utilisation: ${this.formatDate(webhook.lastUsed)}</small>` : ''}
                        ${webhook.usageCount ? `<small>Utilisations: ${webhook.usageCount}</small>` : ''}
                        ${webhook.notes ? `<small>Notes: ${webhook.notes}</small>` : ''}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Liaison des événements de l'interface
     */
    bindEvents() {
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
    }

    /**
     * Liaison des événements des cartes utilisateur
     */
    bindUserCardEvents() {
        // Les événements sont déjà liés via onclick dans le HTML
    }

    /**
     * Sauvegarde d'un webhook pour un utilisateur
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

            // Préparer les données
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

            // Sauvegarder dans Firestore
            const db = firebase.firestore();
            await db.collection('userWebhooks').doc(userId).set(webhookData, { merge: true });

            // Mettre à jour le cache local
            this.webhooks.set(userId, {
                userId: userId,
                ...webhookData,
                createdAt: webhookData.createdAt
            });

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
     * Basculer le statut d'un webhook
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
            const db = firebase.firestore();
            await db.collection('userWebhooks').doc(userId).update({
                isActive: newStatus,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: this.currentAdminUser.email
            });

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
     * Suppression d'un webhook
     */
    async deleteWebhook(userId) {
        try {
            const user = this.users.find(u => u.uid === userId);
            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            // Confirmation
            if (!confirm(`Êtes-vous sûr de vouloir supprimer le webhook de ${user.email} ?`)) {
                return;
            }

            this.showLoading(true);

            // Supprimer de Firestore
            const db = firebase.firestore();
            await db.collection('userWebhooks').doc(userId).delete();

            // Supprimer du cache local
            this.webhooks.delete(userId);

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
     * Affichage des détails d'un webhook
     */
    viewWebhookDetails(userId) {
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
    }

    /**
     * Validation d'une URL de webhook
     */
    validateWebhookUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'https:' && 
                   urlObj.hostname && 
                   url.length > 10 && 
                   url.length <= 2048;
        } catch (error) {
            return false;
        }
    }

    /**
     * Rafraîchissement des données
     */
    async refreshData() {
        try {
            this.showLoading(true);
            await this.loadUsers();
            await this.loadAllWebhooks();
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
     * Formatage de date
     */
    formatDate(date) {
        if (!date) return 'Non défini';
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Affichage de l'état de chargement
     */
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * Affichage d'un message de succès
     */
    showSuccess(message) {
        if (window.notificationSystem) {
            window.notificationSystem.success(message, 'Succès');
        } else {
            console.log('✅ Succès:', message);
            alert('✅ ' + message);
        }
    }

    /**
     * Affichage d'un message d'erreur
     */
    showError(message) {
        if (window.notificationSystem) {
            window.notificationSystem.error(message, 'Erreur');
        } else {
            console.error('❌ Erreur:', message);
            alert('❌ ' + message);
        }
    }

    /**
     * Message d'accès refusé
     */
    showAccessDenied() {
        const container = document.getElementById('adminWebhookContainer') || document.body;
        container.innerHTML = `
            <div class="access-denied">
                <div class="access-denied-content">
                    <h1>🚫 Accès Refusé</h1>
                    <p>Cette interface est réservée à l'administrateur.</p>
                    <p>Veuillez vous connecter avec le compte administrateur : <strong>${this.adminEmail}</strong></p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        🔄 Actualiser la page
                    </button>
                </div>
            </div>
        `;
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminWebhookManager;
} else {
    window.AdminWebhookManager = AdminWebhookManager;
}
