/**
 * DictaMed - Tab Navigation System (Simplified)
 * Version: 3.0.0 - Simplified while preserving all functionality
 * Improvements: Reduced complexity, streamlined logic, eliminated redundancy
 */

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
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.getAttribute('data-tab'));
            });
        });
    }

    initFixedNavButtons() {
        document.querySelectorAll('.fixed-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                if (targetTab) this.switchTab(targetTab);
            });
        });
    }

    initGlobalNavButtons() {
        document.querySelectorAll('[data-tab]').forEach(btn => {
            // Skip if already handled by initFixedNavButtons
            if (btn.classList.contains('fixed-nav-btn')) return;
            
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                const action = btn.getAttribute('data-action');
                
                if (targetTab && (!action || action === 'close-after-nav')) {
                    this.switchTab(targetTab).then(() => {
                        if (action === 'close-after-nav' && window.authModalSystem) {
                            window.authModalSystem.close();
                        }
                    });
                }
            });
        });
    }

    async switchTab(tabId) {
        // Validate input
        if (!tabId || typeof tabId !== 'string') {
            console.warn('⚠️ Navigation: Invalid tabId provided:', tabId);
            return;
        }
        
        // Check access
        if (!this.checkTabAccess(tabId)) return;
        
        // Deactivate all tabs
        document.querySelectorAll('.tab-btn, .fixed-nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active');
            }
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Load content and update state
        await this.loadTabContent(tabId);
        this.updateAppMode(tabId);
        this.activeTab = tabId;
    }

    async loadTabContent(tabId) {
        const tabContent = document.getElementById('tab-content');
        if (!tabContent) {
            console.error('❌ Navigation: tab-content container not found');
            return;
        }

        try {
            // Show loading state
            tabContent.innerHTML = '<div class="loading-content"><p>Chargement...</p></div>';
            
            // Map tab IDs to files
            const tabFiles = {
                'home': 'tab-home.html',
                'mode-normal': 'tab-mode-normal.html',
                'mode-test': 'tab-mode-test.html',
                'mode-dmi': 'tab-mode-dmi.html',
                'guide': 'tab-guide.html',
                'faq': 'tab-faq.html'
            };
            
            const fileName = tabFiles[tabId];
            if (!fileName) throw new Error(`Tab file not found for: ${tabId}`);
            
            // Load content with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(fileName, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            
            const content = await response.text();
            if (!content?.trim()) throw new Error('Empty content received');
            
            tabContent.innerHTML = content;
            
            // Initialize tab-specific event listeners
            this.initTabContentEventListeners(tabId);
            
            console.log(`✅ Navigation: Tab ${tabId} loaded successfully`);
            
        } catch (error) {
            console.error(`❌ Navigation: Error loading tab ${tabId}:`, error);
            this.showErrorContent(tabId, error);
        }
    }

    initTabContentEventListeners(tabId) {
        try {
            if (['mode-normal', 'mode-test'].includes(tabId)) {
                // Initialize audio recorders
                window.audioRecorderManager?.init();
                
                // Update section count
                this.updateSectionCount();
            }
            
            if (tabId === 'mode-dmi') {
                this.initDmiListeners();
            }
            
            if (tabId === 'mode-normal') {
                this.initNormalModeListeners();
            }
        } catch (error) {
            console.error('❌ Navigation: Error initializing tab event listeners:', error);
        }
    }

    initDmiListeners() {
        const texteLibre = document.getElementById('texteLibre');
        const texteLibreCounter = document.getElementById('texteLibreCounter');
        
        if (texteLibre && texteLibreCounter) {
            texteLibre.addEventListener('input', () => {
                texteLibreCounter.textContent = texteLibre.value.length;
            });
        }
        
        // Initialize DMI components
        window.photoManagementSystem?.init();
        window.formValidationSystem?.validateDMIMode?.();
    }

    initNormalModeListeners() {
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

    checkTabAccess(tabId) {
        // Test mode and basic tabs always accessible
        if (['mode-test', 'guide', 'faq', 'home'].includes(tabId)) {
            return true;
        }
        
        // DMI mode requires authentication
        if (tabId === 'mode-dmi') {
            if (window.FirebaseAuthManager && !window.FirebaseAuthManager.isAuthenticated()) {
                window.notificationSystem?.warning?.(
                    'Veuillez vous connecter pour accéder à ce mode', 
                    'Authentification requise'
                );
                return false;
            }
        }
        
        return true;
    }

    updateAppMode(tabId) {
        const modeMap = {
            'mode-normal': 'normal',
            'mode-test': 'test',
            'mode-dmi': 'dmi',
            'home': 'home'
        };
        
        const mode = modeMap[tabId] || 'home';
        this.appState?.setMode?.(mode);
    }

    updateSectionCount() {
        window.audioRecorderManager?.updateSectionCount?.();
    }

    showErrorContent(tabId, error) {
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
    }

    getActiveTab() {
        return this.activeTab;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TabNavigationSystem;
} else {
    window.TabNavigationSystem = TabNavigationSystem;
}