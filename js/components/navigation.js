/**
 * DictaMed - Système de navigation entre onglets
 * Version: 3.0.0 - Refactorisé avec gestion des event listeners et simplification
 */

// ===== TAB NAVIGATION SYSTEM =====
class TabNavigationSystem {
    constructor(appState) {
        this.appState = appState;
        this.activeTab = 'home';
        this.normalModeButton = null;
        // Gestionnaire d'événements pour éviter les memory leaks
        this.tabEventListeners = new Map();
        this.boundHandlers = new Map();
    }

    init() {
        try {
            this.initAllNavButtons();
            this.initNormalModeButton();
            this.initAuthStateListener();
            console.log('✅ TabNavigationSystem v3.0 initialisé');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation de TabNavigationSystem:', error);
            throw error;
        }
    }

    /**
     * Initialise tous les boutons de navigation en une seule passe
     * Évite la duplication de code et les listeners multiples
     */
    initAllNavButtons() {
        const allNavButtons = document.querySelectorAll('[data-tab]');
        allNavButtons.forEach(btn => {
            const handler = () => {
                const targetTab = btn.getAttribute('data-tab');
                const action = btn.getAttribute('data-action');

                if (targetTab) {
                    this.switchTab(targetTab).then(() => {
                        if (action === 'close-after-nav' && window.authModalSystem) {
                            window.authModalSystem.close();
                        }
                    });
                }
            };

            // Stocker le handler pour pouvoir le supprimer plus tard si nécessaire
            this.boundHandlers.set(btn, handler);
            btn.addEventListener('click', handler);
        });
    }

    initNormalModeButton() {
        // Find the normal mode button in the fixed navigation
        this.normalModeButton = document.querySelector('.fixed-nav-btn[data-tab="mode-normal"]');
        
        // Initialize the visibility based on current authentication status
        this.updateNormalModeButtonVisibility();
    }

    initAuthStateListener() {
        // BUG FIX #8: Use Firebase onAuthStateChanged instead of polling
        // BUG FIX: Wait for Firebase to restore auth state on page reload
        // This is much more efficient and responds immediately to auth changes
        const checkAuthState = () => {
            this.updateNormalModeButtonVisibility();
        };

        // BUG FIX: Wait for auth restoration before checking state
        // This ensures Firebase has time to restore user from persistence on page reload
        (async () => {
            try {
                if (window.FirebaseAuthManager && window.FirebaseAuthManager.waitForAuthRestoration) {
                    await window.FirebaseAuthManager.waitForAuthRestoration();
                    console.log('✅ Auth state restored from persistence');
                }
            } catch (error) {
                console.warn('⚠️ Auth restoration error:', error);
            }

            // Now check the auth state
            checkAuthState();
        })();

        // Set up Firebase auth state listener for real-time updates
        try {
            if (window.firebase && window.firebase.auth) {
                const auth = window.firebase.auth();
                auth.onAuthStateChanged((user) => {
                    console.log('🔄 Firebase auth state changed:', user ? user.email : 'not authenticated');
                    checkAuthState();
                });
            }
        } catch (error) {
            console.warn('⚠️ Navigation: Could not set up Firebase auth listener:', error);
            // Fallback to periodic checking
            setInterval(checkAuthState, 5000);
        }

        // Also listen for custom auth events
        window.addEventListener('authStateChanged', checkAuthState);
    }

    updateNormalModeButtonVisibility() {
        if (!this.normalModeButton) {
            return;
        }

        // Vérifier si l'utilisateur est authentifié en utilisant getCurrentUser()
        const currentUser = window.FirebaseAuthManager && window.FirebaseAuthManager.getCurrentUser && window.FirebaseAuthManager.getCurrentUser();
        const isAuthenticated = !!currentUser; // !!null = false, !!user = true

        if (isAuthenticated) {
            this.normalModeButton.style.display = '';
            this.normalModeButton.classList.remove('auth-required-hidden');
            console.log('🔓 Normal mode button visible - user authenticated:', currentUser?.email);
        } else {
            this.normalModeButton.style.display = 'none';
            this.normalModeButton.classList.add('auth-required-hidden');
            console.log('🔒 Normal mode button hidden - user not authenticated');
        }

        // BUG FIX: Update all mode visibility based on authentication status
        // This ensures both Mode Normal and Mode Test visibility is synchronized
        if (window.DictaMed && typeof window.DictaMed.updateModeVisibility === 'function') {
            window.DictaMed.updateModeVisibility(isAuthenticated);
        }
    }

    async switchTab(tabId) {
        // Validate tabId before proceeding
        if (!tabId || typeof tabId !== 'string') {
            console.warn('⚠️ Navigation: Invalid tabId provided:', tabId);
            return;
        }
        
        // Check access before switching
        if (!this.checkTabAccess(tabId)) {
            return;
        }
        
        // Deactivate all tabs and content
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Sync fixed navigation buttons
        this.updateFixedNavButtons(tabId);

        // Update current mode FIRST - before loading tab content
        // This ensures onTabLoad() methods see the correct mode
        this.updateAppMode(tabId);
        console.log(`🔄 Mode changed to: ${tabId}`);

        // Load tab content if not already loaded
        await this.loadTabContent(tabId);

        this.activeTab = tabId;
    }

    async loadTabContent(tabId) {
        try {
            // Validation des paramètres d'entrée
            if (!tabId || typeof tabId !== 'string') {
                console.warn('⚠️ Navigation: Invalid tabId provided:', tabId);
                return;
            }
            
            const tabContent = document.getElementById('tab-content');
            
            if (!tabContent) {
                console.error('❌ Navigation: tab-content container not found in DOM');
                
                // Tentative de création du container s'il n'existe pas
                try {
                    const mainContainer = document.querySelector('main.container');
                    if (mainContainer) {
                        const newTabContent = document.createElement('div');
                        newTabContent.id = 'tab-content';
                        newTabContent.className = 'tab-content active';
                        mainContainer.appendChild(newTabContent);
                        console.log('✅ Navigation: Created missing tab-content container');
                        return this.loadTabContent(tabId); // Retry
                    }
                } catch (createError) {
                    console.error('❌ Navigation: Failed to create tab-content container:', createError);
                }
                return;
            }

            // Show loading state avec gestion d'erreur
            try {
                tabContent.innerHTML = '<div class="loading-content"><p>Chargement...</p></div>';
            } catch (innerHtmlError) {
                console.error('❌ Navigation: Error setting loading content:', innerHtmlError);
                return;
            }
            
            // Map tab IDs to file names avec validation
            const tabFiles = {
                'home': 'tab-home.html',
                'connexion': 'tab-connexion.html',
                'mode-normal': 'tab-mode-normal.html',
                'mode-test': 'tab-mode-test.html',
                'mode-dmi': 'tab-mode-dmi.html',
                'guide': 'tab-guide.html',
                'faq': 'tab-faq.html'
            };
            
            const fileName = tabFiles[tabId];
            if (!fileName) {
                throw new Error(`Tab file not found for: ${tabId}`);
            }
            
            // Load content from file avec timeout et gestion d'erreur
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
                
                const response = await fetch(fileName, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const content = await response.text();
                
                // Vérification du contenu
                if (!content || content.trim().length === 0) {
                    throw new Error('Empty content received');
                }
                
                tabContent.innerHTML = content;
                
                // Initialize event listeners pour le contenu nouvellement chargé
                try {
                    this.initTabContentEventListeners(tabId);
                } catch (listenerError) {
                    console.error('❌ Navigation: Error initializing tab event listeners:', listenerError);
                    // Ne pas faire échouer le chargement complet pour une erreur de listener
                }
                
                console.log(`✅ Navigation: Tab ${tabId} loaded successfully`);
                
            } catch (fetchError) {
                throw new Error(`Failed to load tab content: ${fetchError.message}`);
            }
            
        } catch (error) {
            console.error(`❌ Navigation: Error loading tab ${tabId}:`, error);
            
            // Amélioration de l'affichage d'erreur avec plus de détails
            try {
                const tabContent = document.getElementById('tab-content');
                if (tabContent) {
                    tabContent.innerHTML = `
                        <div class="error-content">
                            <h2>❌ Erreur de chargement</h2>
                            <p>Impossible de charger le contenu de l'onglet: <strong>${tabId}</strong></p>
                            <p><small>Erreur: ${error.message}</small></p>
                            <div class="error-actions">
                                <button class="btn btn-primary" onclick="switchTab('home')">🏠 Retour à l'accueil</button>
                                <button class="btn btn-secondary" onclick="location.reload()">🔄 Recharger la page</button>
                            </div>
                        </div>
                    `;
                }
            } catch (fallbackError) {
                console.error('❌ Navigation: Error showing fallback error content:', fallbackError);
                // Fallback ultime si tout échoue
                alert(`Erreur de navigation: Impossible de charger l'onglet ${tabId}. Veuillez recharger la page.`);
            }
        }
    }

    /**
     * Nettoie les event listeners d'un onglet avant d'en ajouter de nouveaux
     * Évite les memory leaks et les événements dupliqués
     */
    cleanupTabEventListeners(tabId) {
        const listeners = this.tabEventListeners.get(tabId);
        if (listeners) {
            listeners.forEach(({ element, event, handler }) => {
                if (element) {
                    element.removeEventListener(event, handler);
                }
            });
            this.tabEventListeners.delete(tabId);
        }
    }

    /**
     * Ajoute un event listener avec tracking pour nettoyage ultérieur
     */
    addTabEventListener(tabId, element, event, handler) {
        if (!element) return;

        element.addEventListener(event, handler);

        if (!this.tabEventListeners.has(tabId)) {
            this.tabEventListeners.set(tabId, []);
        }
        this.tabEventListeners.get(tabId).push({ element, event, handler });
    }

    initTabContentEventListeners(tabId) {
        // Nettoyer les anciens listeners avant d'en ajouter de nouveaux
        this.cleanupTabEventListeners(tabId);

        // Configuration des initialiseurs par onglet
        const tabInitializers = {
            'connexion': () => {
                if (window.authPageManager) {
                    console.log('🔐 Initializing AuthPageManager for connexion tab');
                    window.authPageManager.init();
                }
            },

            'mode-normal': () => {
                console.log('🔧 Initializing NormalModeTab after HTML loaded');
                if (typeof normalModeTab !== 'undefined' && normalModeTab) {
                    normalModeTab.init();
                }
                if (window.audioRecorderManager) {
                    window.audioRecorderManager.init();
                }
                this.updateSectionCount();

                // Toggle Partie 4 optionnelle
                const toggleBtn = document.getElementById('togglePartie4');
                const partie4 = document.querySelector('[data-section="partie4"]');
                if (toggleBtn && partie4) {
                    const handler = () => {
                        const isHidden = partie4.classList.contains('hidden');
                        partie4.classList.toggle('hidden');
                        toggleBtn.textContent = isHidden
                            ? 'Masquer Partie 4'
                            : 'Afficher Partie 4 (optionnelle)';
                    };
                    this.addTabEventListener(tabId, toggleBtn, 'click', handler);
                }
            },

            'mode-test': () => {
                console.log('🔧 Initializing TestModeTab after HTML loaded');
                if (typeof testModeTab !== 'undefined' && testModeTab) {
                    testModeTab.init();
                }
                if (window.audioRecorderManager) {
                    window.audioRecorderManager.init();
                }
                this.updateSectionCount();
            },

            'mode-dmi': () => {
                console.log('🔧 Initializing DmiModeTab after HTML loaded');
                if (typeof dmiModeTab !== 'undefined' && dmiModeTab) {
                    dmiModeTab.init();
                }

                // Submit DMI button
                const submitDMIBtn = document.getElementById('submitDMI');
                if (submitDMIBtn && window.dmiDataSender) {
                    const submitHandler = async () => {
                        console.log('🖱️ DMI Submit button CLICKED!');
                        try {
                            await window.dmiDataSender.send();
                        } catch (error) {
                            console.error('❌ Error sending DMI data:', error);
                            window.notificationSystem?.error('Erreur lors de l\'envoi des données DMI');
                        }
                    };
                    this.addTabEventListener(tabId, submitDMIBtn, 'click', submitHandler);
                    console.log('✅ Click listener attached to submitDMI button');
                }

                // Texte libre counter
                const texteLibre = document.getElementById('texteLibre');
                const texteLibreCounter = document.getElementById('texteLibreCounter');
                if (texteLibre && texteLibreCounter) {
                    const inputHandler = () => {
                        texteLibreCounter.textContent = texteLibre.value.length;
                    };
                    this.addTabEventListener(tabId, texteLibre, 'input', inputHandler);
                }

                // Photo management et validation
                window.photoManagementSystem?.init();
                window.formValidationSystem?.validateDMIMode();
            }
        };

        // Exécuter l'initialiseur correspondant
        const initializer = tabInitializers[tabId];
        if (initializer) {
            initializer();
        }
    }

    checkTabAccess(tabId) {
        // Onglets toujours accessibles
        const publicTabs = [window.APP_CONFIG.MODES.TEST, 'guide', 'faq', window.APP_CONFIG.MODES.HOME, 'connexion'];
        if (publicTabs.includes(tabId)) {
            return true;
        }

        // Vérifier l'authentification via getCurrentUser (pas isAuthenticated qui n'existe pas)
        const isAuthenticated = !!(window.FirebaseAuthManager?.getCurrentUser?.());

        // Onglets nécessitant une authentification
        const protectedTabs = [window.APP_CONFIG.MODES.DMI, window.APP_CONFIG.MODES.NORMAL];
        if (protectedTabs.includes(tabId) && !isAuthenticated) {
            window.notificationSystem?.warning('Veuillez vous connecter pour accéder à ce mode', 'Authentification requise');
            return false;
        }

        return true;
    }

    updateFixedNavButtons(activeTabId) {
        const fixedNavBtns = document.querySelectorAll('.fixed-nav-btn');
        fixedNavBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === activeTabId) {
                btn.classList.add('active');
            }
        });
    }

    updateAppMode(tabId) {
        let mode = window.APP_CONFIG.MODES.HOME;

        // FIX: tabId has "mode-" prefix, but APP_CONFIG.MODES values don't
        // Examples: tabId="mode-normal" but MODES.NORMAL="normal"
        // Use endsWith() to handle the prefix correctly

        if (tabId.endsWith(window.APP_CONFIG.MODES.NORMAL)) {
            mode = window.APP_CONFIG.MODES.NORMAL;
            console.log(`✅ Mode set to NORMAL from tabId: ${tabId}`);
        } else if (tabId.endsWith(window.APP_CONFIG.MODES.TEST)) {
            mode = window.APP_CONFIG.MODES.TEST;
            console.log(`✅ Mode set to TEST from tabId: ${tabId}`);
        } else if (tabId.endsWith(window.APP_CONFIG.MODES.DMI)) {
            mode = window.APP_CONFIG.MODES.DMI;
            console.log(`✅ Mode set to DMI from tabId: ${tabId}`);
        } else {
            mode = window.APP_CONFIG.MODES.HOME;
            console.log(`✅ Mode set to HOME from tabId: ${tabId}`);
        }

        console.log(`   Setting appState mode to: "${mode}"`);
        this.appState.setMode(mode);
        console.log(`   appState.currentMode is now: "${this.appState.currentMode}"`);
    }

    updateSectionCount() {
        if (window.audioRecorderManager) {
            window.audioRecorderManager.updateSectionCount();
        }
    }

    getActiveTab() {
        return this.activeTab;
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TabNavigationSystem;
} else {
    window.TabNavigationSystem = TabNavigationSystem;
}