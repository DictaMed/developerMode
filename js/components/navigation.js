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
                this.switchTab(targetTab);
            });
        });
    }

    async switchTab(tabId) {
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
        const tabContent = document.getElementById('tab-content');
        
        if (!tabContent) {
            console.error('Container tab-content non trouvé');
            return;
        }

        try {
            // Show loading state
            tabContent.innerHTML = '<div class="loading-content"><p>Chargement...</p></div>';
            
            // Map tab IDs to file names
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
                throw new Error(`Fichier de tab non trouvé pour: ${tabId}`);
            }
            
            // Load content from file
            const response = await fetch(fileName);
            if (!response.ok) {
                throw new Error(`Erreur lors du chargement: ${response.status}`);
            }
            
            const content = await response.text();
            tabContent.innerHTML = content;
            
            // Initialize event listeners for the newly loaded content
            this.initTabContentEventListeners(tabId);
            
        } catch (error) {
            console.error('Erreur lors du chargement du tab:', error);
            tabContent.innerHTML = `
                <div class="error-content">
                    <h2>Erreur de chargement</h2>
                    <p>Impossible de charger le contenu de cet onglet.</p>
                    <button class="btn btn-primary" onclick="switchTab('home')">Retour à l'accueil</button>
                </div>
            `;
        }
    }

    initTabContentEventListeners(tabId) {
        // Initialize specific event listeners based on tab type
        if (tabId === 'mode-normal' || tabId === 'mode-test') {
            // Reinitialize audio recorders for recording sections
            const recordingSections = document.querySelectorAll('.recording-section');
            recordingSections.forEach(section => {
                const sectionId = section.getAttribute('data-section');
                const existingRecorder = window.audioRecorderManager.getRecorder(sectionId);
                
                // Create new recorder if doesn't exist or if tab changed
                if (!existingRecorder) {
                    const recorder = new window.AudioRecorder(section);
                    window.audioRecorderManager.recorders.set(sectionId, recorder);
                    window.appState.setRecording(sectionId, recorder);
                }
            });
            
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