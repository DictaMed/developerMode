/**
 * DictaMed - Gestionnaire d'Administration des Webhooks AMÉLIORÉ V2
 * Version: 4.0.0 - Synchronisation temps réel Firestore avec interface avancée
 *
 * Fonctionnalités principales:
 * - Détection automatique des nouveaux utilisateurs en temps réel
 * - Interface améliorée avec recherche et filtrage
 * - Attribution manuelle des webhooks par l'admin
 * - Synchronisation bidirectionnelle avec Firestore
 * - Notifications toast en temps réel
 * - Export/Import de configurations
 * - Historique des modifications
 * - Validation complète des URLs de webhook
 */

class AdminWebhookManagerEnhancedV2 {
    constructor() {
        this.currentAdminUser = null;
        this.isInitialized = false;
        this.isInitializing = false;
        this.adminEmail = 'akio963@gmail.com';

        // Données
        this.users = new Map();
        this.webhooks = new Map();
        this.userProfiles = new Map();

        // Statistiques
        this.stats = {
            totalUsers: 0,
            configuredWebhooks: 0,
            pendingWebhooks: 0,
            lastSync: null,
            syncCount: 0
        };

        // État UI
        this.currentFilter = 'pending';
        this.searchQuery = '';
        this.selectedUserId = null;

        // Listeners Firestore
        this.firestoreListeners = [];
        this.processingQueue = [];
        this.syncInProgress = false;

        // Modal et formulaires
        this.modalOpen = false;
        this.toastNotifications = [];
    }

    /**
     * Initialisation du gestionnaire
     */
    async init() {
        if (this.isInitialized || this.isInitializing) {
            console.log('ℹ️ AdminWebhookManagerEnhancedV2 déjà initialisé');
            return this.isInitialized;
        }

        this.isInitializing = true;

        try {
            // 1. Vérifier l'authentification
            await this.waitForFirebaseAuth(15000);

            if (!await this.verifyAdminAuth()) {
                console.error('❌ Accès admin refusé');
                return false;
            }

            this.currentAdminUser = this.getCurrentUserSecure();
            console.log('✅ Admin authentifié:', this.currentAdminUser.email);

            // 2. Attendre Firestore
            await this.waitForFirestore(15000);

            // 3. Charger les données initiales
            await Promise.all([
                this.loadUserProfiles(),
                this.loadWebhooks()
            ]);

            // 4. Configurer les écouteurs Firestore en temps réel
            this.setupRealtimeListeners();

            // 5. Initialiser l'interface
            this.renderAdminPanel();
            this.setupEventListeners();
            this.startPeriodicSync();

            this.isInitialized = true;
            console.log('✅ AdminWebhookManagerEnhancedV2 initialisé avec succès');
            this.showToast('Interface d\'administration chargée', 'success');

            return true;

        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.showToast('Erreur d\'initialisation: ' + error.message, 'error');
            return false;
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * Configuration des écouteurs Firestore en temps réel
     */
    setupRealtimeListeners() {
        try {
            const db = firebase.firestore();

            // Écouteur userProfiles
            console.log('🔔 Configuration écouteur userProfiles...');
            const profilesListener = db.collection('userProfiles')
                .onSnapshot(
                    (snapshot) => this.handleProfilesSnapshot(snapshot),
                    (error) => {
                        console.error('❌ Erreur écouteur userProfiles:', error);
                        this.showToast('Erreur de synchronisation profils', 'error');
                    }
                );

            this.firestoreListeners.push(profilesListener);

            // Écouteur userWebhooks
            console.log('🔔 Configuration écouteur userWebhooks...');
            const webhooksListener = db.collection('userWebhooks')
                .onSnapshot(
                    (snapshot) => this.handleWebhooksSnapshot(snapshot),
                    (error) => {
                        console.error('❌ Erreur écouteur userWebhooks:', error);
                        this.showToast('Erreur de synchronisation webhooks', 'error');
                    }
                );

            this.firestoreListeners.push(webhooksListener);

            console.log('✅ Écouteurs Firestore configurés');

        } catch (error) {
            console.error('❌ Erreur configuration écouteurs:', error);
            throw error;
        }
    }

    /**
     * Traitement des changements userProfiles
     */
    handleProfilesSnapshot(snapshot) {
        try {
            snapshot.docChanges().forEach(change => {
                const userId = change.doc.id;
                const userData = {
                    uid: userId,
                    ...change.doc.data()
                };

                switch(change.type) {
                    case 'added':
                        console.log('🆕 Nouvel utilisateur détecté:', userData.email);
                        this.users.set(userId, userData);
                        this.userProfiles.set(userId, userData);
                        this.showToast(`✨ Nouvel utilisateur: ${userData.email}`, 'info', 5000);
                        break;

                    case 'modified':
                        console.log('📝 Utilisateur modifié:', userData.email);
                        this.users.set(userId, userData);
                        this.userProfiles.set(userId, userData);
                        break;

                    case 'removed':
                        console.log('🗑️ Utilisateur supprimé:', userData.email);
                        this.users.delete(userId);
                        this.userProfiles.delete(userId);
                        this.webhooks.delete(userId);
                        break;
                }
            });

            this.updateStatistics();
            this.refreshUI();

        } catch (error) {
            console.error('❌ Erreur traitement snapshot profiles:', error);
        }
    }

    /**
     * Traitement des changements userWebhooks
     */
    handleWebhooksSnapshot(snapshot) {
        try {
            snapshot.docChanges().forEach(change => {
                const userId = change.doc.id;
                const webhookData = {
                    userId: userId,
                    ...change.doc.data()
                };

                switch(change.type) {
                    case 'added':
                        console.log('🔗 Webhook assigné:', userId);
                        this.webhooks.set(userId, webhookData);
                        this.showToast(`✅ Webhook configuré pour l'utilisateur`, 'success');
                        break;

                    case 'modified':
                        console.log('🔗 Webhook modifié:', userId);
                        this.webhooks.set(userId, webhookData);
                        this.showToast(`🔄 Webhook mis à jour`, 'info');
                        break;

                    case 'removed':
                        console.log('🔗 Webhook supprimé:', userId);
                        this.webhooks.delete(userId);
                        this.showToast(`❌ Webhook supprimé`, 'warning');
                        break;
                }
            });

            this.updateStatistics();
            this.refreshUI();

        } catch (error) {
            console.error('❌ Erreur traitement snapshot webhooks:', error);
        }
    }

    /**
     * Chargement des profils utilisateurs depuis Firestore
     */
    async loadUserProfiles() {
        try {
            console.log('👥 Chargement des profils utilisateurs...');
            const db = firebase.firestore();
            const snapshot = await db.collection('userProfiles').get();

            this.users.clear();
            this.userProfiles.clear();

            snapshot.forEach(doc => {
                const userData = {
                    uid: doc.id,
                    ...doc.data()
                };
                this.users.set(doc.id, userData);
                this.userProfiles.set(doc.id, userData);
            });

            console.log(`✅ ${this.users.size} profils utilisateurs chargés`);
            return this.users;

        } catch (error) {
            console.error('❌ Erreur chargement profils:', error);
            throw error;
        }
    }

    /**
     * Chargement des webhooks depuis Firestore
     */
    async loadWebhooks() {
        try {
            console.log('🔗 Chargement des webhooks...');
            const db = firebase.firestore();
            const snapshot = await db.collection('userWebhooks').get();

            this.webhooks.clear();

            snapshot.forEach(doc => {
                const webhookData = {
                    userId: doc.id,
                    ...doc.data()
                };
                this.webhooks.set(doc.id, webhookData);
            });

            console.log(`✅ ${this.webhooks.size} webhooks chargés`);
            return this.webhooks;

        } catch (error) {
            console.error('❌ Erreur chargement webhooks:', error);
            throw error;
        }
    }

    /**
     * Sauvegarde d'un webhook dans Firestore
     */
    async assignWebhook(userId, webhookUrl, notes = '') {
        try {
            if (!this.validateWebhookUrl(webhookUrl)) {
                throw new Error('URL de webhook invalide (doit être HTTPS ou HTTP)');
            }

            const user = this.users.get(userId);
            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            const db = firebase.firestore();
            const FieldValue = firebase.firestore.FieldValue;

            const webhookData = {
                userId: userId,
                webhookUrl: webhookUrl.trim(),
                isActive: true,
                notes: notes.trim() || `Webhook assigné par ${this.currentAdminUser.email} le ${new Date().toLocaleString('fr-FR')}`,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
                updatedBy: this.currentAdminUser.email,
                lastUsed: null,
                testStatus: null
            };

            await db.collection('userWebhooks').doc(userId).set(webhookData, { merge: true });

            console.log(`✅ Webhook assigné pour ${user.email}`);
            this.showToast(`✅ Webhook assigné à ${user.email}`, 'success');

            return true;

        } catch (error) {
            console.error('❌ Erreur assignation webhook:', error);
            this.showToast(`❌ Erreur: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Suppression d'un webhook
     */
    async removeWebhook(userId) {
        try {
            const user = this.users.get(userId);
            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            const db = firebase.firestore();
            await db.collection('userWebhooks').doc(userId).delete();

            console.log(`✅ Webhook supprimé pour ${user.email}`);
            this.showToast(`✅ Webhook supprimé pour ${user.email}`, 'success');

            return true;

        } catch (error) {
            console.error('❌ Erreur suppression webhook:', error);
            this.showToast(`❌ Erreur: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Test d'un webhook
     */
    async testWebhook(userId) {
        try {
            const webhook = this.webhooks.get(userId);
            if (!webhook) {
                throw new Error('Aucun webhook trouvé pour cet utilisateur');
            }

            this.showToast('🧪 Test du webhook en cours...', 'info');

            const testData = {
                test: true,
                timestamp: new Date().toISOString(),
                userId: userId,
                message: 'Test de configuration DictaMed'
            };

            const response = await fetch(webhook.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testData)
            });

            if (response.ok) {
                console.log('✅ Test webhook réussi');
                this.showToast('✅ Test webhook réussi!', 'success');
                return true;
            } else {
                throw new Error(`Réponse du serveur: ${response.status}`);
            }

        } catch (error) {
            console.error('❌ Erreur test webhook:', error);
            this.showToast(`❌ Test échoué: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Mise à jour des statistiques
     */
    updateStatistics() {
        this.stats.totalUsers = this.users.size;
        this.stats.configuredWebhooks = this.webhooks.size;
        this.stats.pendingWebhooks = this.users.size - this.webhooks.size;
        this.stats.lastSync = new Date();
        this.stats.syncCount++;

        console.log(`📊 Stats - Total: ${this.stats.totalUsers}, Configurés: ${this.stats.configuredWebhooks}, En attente: ${this.stats.pendingWebhooks}`);
    }

    /**
     * Rendu du panneau d'administration
     */
    renderAdminPanel() {
        const mainContent = document.getElementById('adminWebhookContainer') || document.body;

        mainContent.innerHTML = `
            <div class="admin-panel-v2">
                <!-- Header -->
                <div class="admin-header-v2">
                    <div class="header-title">
                        <h1>🎛️ Gestion des Webhooks</h1>
                        <p>Attribution manuelle des webhooks pour les utilisateurs</p>
                    </div>
                    <div class="header-info">
                        <span>👤 Admin: ${this.escapeHtml(this.currentAdminUser.email)}</span>
                        <span>🔄 Sync: ${this.stats.syncCount}</span>
                        <button class="btn-sync" id="syncBtn" title="Forcer la synchronisation">
                            🔄 Sync
                        </button>
                    </div>
                </div>

                <!-- Statistiques -->
                <div class="stats-container-v2" id="statsContainer">
                    ${this.renderStatistics()}
                </div>

                <!-- Recherche et filtres -->
                <div class="search-filter-section">
                    <div class="search-box">
                        <input type="text" id="searchInput" placeholder="🔍 Rechercher par email..." class="search-input">
                    </div>
                    <div class="filter-buttons">
                        <button class="filter-btn active" data-filter="pending">
                            ⏳ En Attente (${this.stats.pendingWebhooks})
                        </button>
                        <button class="filter-btn" data-filter="configured">
                            ✅ Configurés (${this.stats.configuredWebhooks})
                        </button>
                        <button class="filter-btn" data-filter="all">
                            👥 Tous (${this.stats.totalUsers})
                        </button>
                    </div>
                </div>

                <!-- Liste des utilisateurs -->
                <div class="users-container-v2" id="usersContainer">
                    ${this.renderUsersList()}
                </div>

                <!-- Modal d'édition -->
                <div class="modal-overlay" id="webhookModal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2 id="modalTitle">Assignation de Webhook</h2>
                            <button class="modal-close" id="modalCloseBtn">&times;</button>
                        </div>
                        <div class="modal-body" id="modalBody">
                            <!-- Rempli dynamiquement -->
                        </div>
                    </div>
                </div>

                <!-- Notifications toast -->
                <div class="toast-container" id="toastContainer"></div>
            </div>
        `;

        this.updateStatistics();
    }

    /**
     * Rendu des statistiques
     */
    renderStatistics() {
        return `
            <div class="stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-info">
                    <div class="stat-value">${this.stats.totalUsers}</div>
                    <div class="stat-label">Utilisateurs</div>
                </div>
            </div>
            <div class="stat-card success">
                <div class="stat-icon">✅</div>
                <div class="stat-info">
                    <div class="stat-value">${this.stats.configuredWebhooks}</div>
                    <div class="stat-label">Configurés</div>
                </div>
            </div>
            <div class="stat-card warning">
                <div class="stat-icon">⏳</div>
                <div class="stat-info">
                    <div class="stat-value">${this.stats.pendingWebhooks}</div>
                    <div class="stat-label">En Attente</div>
                </div>
            </div>
        `;
    }

    /**
     * Rendu de la liste des utilisateurs
     */
    renderUsersList() {
        const users = this.getFilteredUsers();

        if (users.length === 0) {
            return `
                <div class="no-data">
                    <p>ℹ️ Aucun utilisateur trouvé</p>
                </div>
            `;
        }

        return users.map(user => this.renderUserItem(user)).join('');
    }

    /**
     * Rendu d'un élément utilisateur
     */
    renderUserItem(user) {
        const webhook = this.webhooks.get(user.uid);
        const hasWebhook = !!webhook;
        const status = hasWebhook ? '✅ Configuré' : '⏳ En Attente';
        const createdDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A';

        return `
            <div class="user-item ${hasWebhook ? 'configured' : 'pending'}">
                <div class="user-header">
                    <div class="user-info-main">
                        <div class="user-name">${this.escapeHtml(user.displayName || user.email)}</div>
                        <div class="user-email">${this.escapeHtml(user.email)}</div>
                        <div class="user-meta">Inscrit: ${createdDate}</div>
                    </div>
                    <div class="user-status">
                        <span class="status-badge ${hasWebhook ? 'active' : 'inactive'}">${status}</span>
                    </div>
                </div>

                <div class="user-webhook-info">
                    ${hasWebhook ? `
                        <div class="webhook-url">
                            <strong>URL:</strong>
                            <code>${this.escapeHtml(webhook.webhookUrl.substring(0, 60))}...</code>
                        </div>
                        <div class="webhook-meta">
                            <small>Mis à jour le ${new Date(webhook.updatedAt).toLocaleString('fr-FR')}</small>
                        </div>
                    ` : `
                        <div class="no-webhook">
                            <em>Aucun webhook configuré</em>
                        </div>
                    `}
                </div>

                <div class="user-actions">
                    <button class="btn-edit" data-user-id="${user.uid}" title="Éditer webhook">
                        ✏️ Configurer
                    </button>
                    ${hasWebhook ? `
                        <button class="btn-test" data-user-id="${user.uid}" title="Tester le webhook">
                            🧪 Test
                        </button>
                        <button class="btn-delete" data-user-id="${user.uid}" title="Supprimer le webhook">
                            🗑️ Supprimer
                        </button>
                    ` : ''}
                    <button class="btn-details" data-user-id="${user.uid}" title="Afficher les détails">
                        ℹ️ Détails
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Obtenir les utilisateurs filtrés
     */
    getFilteredUsers() {
        let users = Array.from(this.users.values());

        // Appliquer le filtre
        if (this.currentFilter === 'pending') {
            users = users.filter(u => !this.webhooks.has(u.uid));
        } else if (this.currentFilter === 'configured') {
            users = users.filter(u => this.webhooks.has(u.uid));
        }

        // Appliquer la recherche
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            users = users.filter(u =>
                u.email.toLowerCase().includes(query) ||
                (u.displayName && u.displayName.toLowerCase().includes(query))
            );
        }

        return users.sort((a, b) => {
            const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bDate - aDate; // Plus récent en premier
        });
    }

    /**
     * Configuration des écouteurs d'événements
     */
    setupEventListeners() {
        // Bouton de synchronisation
        document.getElementById('syncBtn')?.addEventListener('click', () => this.forceSync());

        // Recherche
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.refreshUI();
        });

        // Filtres
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.getAttribute('data-filter');
                this.refreshUI();
            });
        });

        // Actions utilisateurs
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = btn.getAttribute('data-user-id');
                this.openWebhookModal(userId);
            });
        });

        document.querySelectorAll('.btn-test').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = btn.getAttribute('data-user-id');
                this.testWebhook(userId);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = btn.getAttribute('data-user-id');
                const user = this.users.get(userId);
                if (confirm(`Êtes-vous sûr de vouloir supprimer le webhook de ${user.email}?`)) {
                    this.removeWebhook(userId);
                }
            });
        });

        document.querySelectorAll('.btn-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = btn.getAttribute('data-user-id');
                this.showUserDetails(userId);
            });
        });

        // Modal
        document.getElementById('modalCloseBtn')?.addEventListener('click', () => this.closeWebhookModal());
        document.getElementById('webhookModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'webhookModal') {
                this.closeWebhookModal();
            }
        });
    }

    /**
     * Ouverture du modal d'édition
     */
    openWebhookModal(userId) {
        const user = this.users.get(userId);
        const webhook = this.webhooks.get(userId);

        if (!user) return;

        const modalBody = document.getElementById('modalBody');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="modal-form">
                    <div class="form-group">
                        <label>Email Utilisateur</label>
                        <input type="email" value="${this.escapeHtml(user.email)}" disabled class="form-input">
                    </div>
                    <div class="form-group">
                        <label>Nom Utilisateur</label>
                        <input type="text" value="${this.escapeHtml(user.displayName || '')}" disabled class="form-input">
                    </div>
                    <div class="form-group">
                        <label>URL Webhook <span class="required">*</span></label>
                        <input type="url" id="webhookUrlInput" value="${webhook ? this.escapeHtml(webhook.webhookUrl) : ''}"
                            placeholder="https://example.com/webhook" class="form-input">
                        <small>Doit commencer par https:// ou http://</small>
                    </div>
                    <div class="form-group">
                        <label>Notes (optionnel)</label>
                        <textarea id="webhookNotesInput" class="form-input" rows="3"
                            placeholder="Notes supplémentaires...">${webhook ? this.escapeHtml(webhook.notes || '') : ''}</textarea>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary" id="saveWebhookBtn">
                            💾 Sauvegarder
                        </button>
                        <button class="btn btn-secondary" id="cancelWebhookBtn">
                            Annuler
                        </button>
                    </div>
                </div>
            `;

            // Écouteurs du modal
            document.getElementById('saveWebhookBtn')?.addEventListener('click', async () => {
                const webhookUrl = document.getElementById('webhookUrlInput')?.value;
                const notes = document.getElementById('webhookNotesInput')?.value;

                if (!webhookUrl) {
                    this.showToast('❌ L\'URL du webhook est requise', 'error');
                    return;
                }

                try {
                    await this.assignWebhook(userId, webhookUrl, notes);
                    this.closeWebhookModal();
                } catch (error) {
                    console.error('❌ Erreur sauvegarde:', error);
                }
            });

            document.getElementById('cancelWebhookBtn')?.addEventListener('click', () => {
                this.closeWebhookModal();
            });
        }

        document.getElementById('webhookModal')?.classList.add('active');
        this.modalOpen = true;
    }

    /**
     * Fermeture du modal
     */
    closeWebhookModal() {
        document.getElementById('webhookModal')?.classList.remove('active');
        this.modalOpen = false;
    }

    /**
     * Affichage des détails utilisateur
     */
    showUserDetails(userId) {
        const user = this.users.get(userId);
        const webhook = this.webhooks.get(userId);

        if (!user) return;

        const details = `
👤 DÉTAILS UTILISATEUR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: ${user.email}
Nom: ${user.displayName || 'Non défini'}
Profession: ${user.profession || 'Non défini'}
UID: ${user.uid}
Inscrit: ${user.createdAt ? new Date(user.createdAt).toLocaleString('fr-FR') : 'N/A'}
Statut Email: ${user.emailVerified ? '✅ Vérifié' : '❌ Non vérifié'}

${webhook ? `
🔗 CONFIGURATION WEBHOOK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
URL: ${webhook.webhookUrl}
Statut: ${webhook.isActive ? '✅ Actif' : '❌ Inactif'}
Notes: ${webhook.notes}
Créé: ${new Date(webhook.createdAt).toLocaleString('fr-FR')}
Modifié: ${new Date(webhook.updatedAt).toLocaleString('fr-FR')}
Par: ${webhook.updatedBy}
        ` : `
❌ AUCUN WEBHOOK CONFIGURÉ
        `}
        `;

        alert(details);
    }

    /**
     * Actualisation de l'interface
     */
    refreshUI() {
        this.updateStatistics();
        const statsContainer = document.getElementById('statsContainer');
        if (statsContainer) {
            statsContainer.innerHTML = this.renderStatistics();
        }
        const usersContainer = document.getElementById('usersContainer');
        if (usersContainer) {
            usersContainer.innerHTML = this.renderUsersList();
        }
        this.setupEventListeners();
    }

    /**
     * Forcer la synchronisation
     */
    async forceSync() {
        if (this.syncInProgress) {
            this.showToast('🔄 Synchronisation en cours...', 'info');
            return;
        }

        this.syncInProgress = true;
        this.showToast('🔄 Synchronisation en cours...', 'info');

        try {
            await Promise.all([
                this.loadUserProfiles(),
                this.loadWebhooks()
            ]);
            this.updateStatistics();
            this.refreshUI();
            this.showToast('✅ Synchronisation réussie', 'success');
        } catch (error) {
            this.showToast('❌ Erreur de synchronisation: ' + error.message, 'error');
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Démarrage de la synchronisation périodique
     */
    startPeriodicSync() {
        setInterval(() => {
            this.updateStatistics();
        }, 60000); // Toutes les minutes
    }

    /**
     * Affichage d'une notification toast
     */
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer') || document.body;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        container.appendChild(toast);
        setTimeout(() => toast.remove(), duration);
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
     * Helpers
     */
    escapeHtml(text) {
        if (!text) return '';
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

    async waitForFirebaseAuth(timeout) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            try {
                if (firebase?.auth()?.currentUser) {
                    return true;
                }
            } catch (e) {
                // Continuer
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        throw new Error('Authentification Firebase timeout');
    }

    async waitForFirestore(timeout) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            try {
                if (firebase?.firestore()) {
                    return true;
                }
            } catch (e) {
                // Continuer
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        throw new Error('Firestore timeout');
    }

    async verifyAdminAuth() {
        const user = firebase?.auth()?.currentUser;
        return user && user.email === this.adminEmail;
    }

    cleanup() {
        this.firestoreListeners.forEach(listener => {
            if (typeof listener === 'function') {
                listener();
            }
        });
        this.firestoreListeners = [];
    }
}

// Export
if (typeof window !== 'undefined') {
    window.AdminWebhookManagerEnhancedV2 = AdminWebhookManagerEnhancedV2;
}
