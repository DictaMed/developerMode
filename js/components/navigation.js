/**
 * DictaMed - Système de navigation entre onglets
 * Version: 2.0.0 - Refactorisé pour une meilleure organisation
 */

// ===== TAB NAVIGATION SYSTEM =====
class TabNavigationSystem {
    constructor(appState) {
        this.appState = appState;
        this.activeTab = 'home';
    }

    init() {
        try {
            this.initTabButtons();
            this.initFixedNavButtons();
            this.initGlobalNavButtons();
            console.log('✅ TabNavigationSystem initialisé');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation de TabNavigationSystem:', error);
            throw error;
        }
    }

    initTabButtons() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });
    }

    initFixedNavButtons() {
        const fixedNavBtns = document.querySelectorAll('.fixed-nav-btn');
        fixedNavBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                if (targetTab) {
                    this.switchTab(targetTab);
                }
            });
        });
    }

    initGlobalNavButtons() {
        // Handle navigation buttons that don't have the fixed-nav-btn class
        const globalNavButtons = document.querySelectorAll('[data-tab]');
        globalNavButtons.forEach(btn => {
            // Skip if it's already handled by initFixedNavButtons
            if (btn.classList.contains('fixed-nav-btn')) {
                return;
            }
            
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                const action = btn.getAttribute('data-action');
                
                if (targetTab && (!action || action === 'close-after-nav')) {
                    this.switchTab(targetTab).then(() => {
                        // Close modal if action requires it
                        if (action === 'close-after-nav' && window.authModalSystem) {
                            window.authModalSystem.close();
                        }
                    });
                }
            });
        });
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

        // Load tab content if not already loaded
        await this.loadTabContent(tabId);

        // Update current mode
        this.updateAppMode(tabId);
        
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

    initTabContentEventListeners(tabId) {
        // Initialize specific event listeners based on tab type
        if (tabId === 'mode-normal' || tabId === 'mode-test') {
            // Initialize audio recorders through manager (will handle retry logic)
            if (window.audioRecorderManager) {
                window.audioRecorderManager.init();
            }

            // Update section count
            this.updateSectionCount();
        }
        
        if (tabId === 'mode-dmi') {
            // Initialize DMI specific listeners
            const texteLibre = document.getElementById('texteLibre');
            const texteLibreCounter = document.getElementById('texteLibreCounter');
            
            if (texteLibre && texteLibreCounter) {
                texteLibre.addEventListener('input', () => {
                    texteLibreCounter.textContent = texteLibre.value.length;
                });
            }
            
            // Initialize photo upload
            if (window.photoManagementSystem) {
                window.photoManagementSystem.init();
            }
            
            // DMI validation
            if (window.formValidationSystem) {
                window.formValidationSystem.validateDMIMode();
            }
        }
        
        if (tabId === 'mode-normal') {
            // Initialize optional section toggle
            const toggleBtn = document.getElementById('togglePartie4');
            const partie4 = document.querySelector('[data-section="partie4"]');
            
            if (toggleBtn && partie4) {
                toggleBtn.addEventListener('click', () => {
                    const isHidden = partie4.classList.contains('hidden');
                    partie4.classList.toggle('hidden');
                    toggleBtn.textContent = isHidden 
                        ? 'Masquer Partie 4' 
                        : 'Afficher Partie 4 (optionnelle)';
                });
            }
        }
    }

    checkTabAccess(tabId) {
        // Test mode always accessible
        if (tabId === window.APP_CONFIG.MODES.TEST || tabId === 'guide' || tabId === 'faq' || tabId === window.APP_CONFIG.MODES.HOME) {
            return true;
        }
        
        // DMI mode requires authentication, Normal mode no longer requires it
        if (tabId === window.APP_CONFIG.MODES.DMI && window.FirebaseAuthManager && !window.FirebaseAuthManager.isAuthenticated()) {
            window.notificationSystem.warning('Veuillez vous connecter pour accéder à ce mode', 'Authentification requise');
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
        
        if (tabId === window.APP_CONFIG.MODES.NORMAL) {
            mode = window.APP_CONFIG.MODES.NORMAL;
        } else if (tabId === window.APP_CONFIG.MODES.TEST) {
            mode = window.APP_CONFIG.MODES.TEST;
        } else if (tabId === window.APP_CONFIG.MODES.DMI) {
            mode = window.APP_CONFIG.MODES.DMI;
        }
        
        this.appState.setMode(mode);
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