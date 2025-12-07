/**
 * DictaMed - Point d'entrée principal
 * Version: 2.0.0 - Architecture modulaire refactorisée
 */

// ===== GLOBAL APPLICATION INSTANCES =====
let appState, notificationSystem, loadingOverlay, autoSaveSystem;
let audioRecorderManager, dataSender, tabNavigationSystem;
let formValidationSystem, photoManagementSystem, dmiDataSender, authModalSystem;

// ===== TAB INSTANCES =====
let homeTab, normalModeTab, testModeTab;

// ===== APPLICATION INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    const logger = window.logger?.createLogger('App Initialization') || console;
    
    try {
        const timer = logger.time('Total Initialization Time');
        
        logger.info('🚀 Initialisation de DictaMed v2.1 (Architecture modulaire améliorée)...');
        
        // Validate dependencies before initialization
        await validateDependencies();
        
        // Initialize core systems in order
        await initializeCore();
        
        // Initialize components with proper dependency management
        await initializeComponents();
        
        // Initialize tabs after components are ready
        await initializeTabs();
        
        // Initialize event listeners
        initializeEventListeners();
        
        // Final initialization
        await finalizeInitialization();
        
        timer();
        logger.info('✅ DictaMed v2.1 initialisé avec succès (Architecture modulaire améliorée)!');
        
        // Show success notification after successful initialization
        if (notificationSystem) {
            setTimeout(() => {
                notificationSystem.success('DictaMed est prêt à l\'utilisation', 'Application initialisée');
            }, 500);
        }
        
    } catch (error) {
        logger.critical('❌ Erreur critique lors de l\'initialisation', { 
            error: error.message, 
            stack: error.stack 
        });
        
        if (notificationSystem) {
            notificationSystem.error(
                'Erreur lors de l\'initialisation de l\'application. Veuillez recharger la page.', 
                'Erreur d\'initialisation'
            );
        } else {
            alert('Erreur lors de l\'initialisation de l\'application. Veuillez recharger la page.');
        }
        
        // Log memory usage on error
        if (window.performanceMonitor) {
            window.performanceMonitor.logger.memory('Memory usage at error');
        }
    }
});

// ===== DEPENDENCY VALIDATION =====
async function validateDependencies() {
    const logger = window.logger?.createLogger('Dependency Validation') || console;
    
    logger.info('🔍 Validation des dépendances...');
    
    const requiredGlobals = ['APP_CONFIG', 'Utils', 'ErrorHandler'];
    const missingGlobals = requiredGlobals.filter(global => typeof window[global] === 'undefined');
    
    if (missingGlobals.length > 0) {
        const errorMsg = `Dépendances manquantes: ${missingGlobals.join(', ')}`;
        window.errorHandler.critical(errorMsg, 'Dependency Validation', {
            missing: missingGlobals,
            available: Object.keys(window).filter(key => key.match(/^[A-Z_]/))
        });
        throw new Error(errorMsg);
    }
    
    // Wait for DOM to be fully ready
    await new Promise(resolve => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve);
        } else {
            resolve();
        }
    });
    
    logger.info('✅ Dépendances validées');
}

// ===== INITIALIZATION FUNCTIONS =====
async function initializeCore() {
    const logger = window.logger?.createLogger('Core Initialization') || console;
    const timer = logger.time('Core Module Initialization');
    
    logger.info('🔧 Initialisation des modules core...');
    
    try {
        // Core modules are loaded via script tags in HTML
        appState = new AppState();
        notificationSystem = new NotificationSystem();
        loadingOverlay = new LoadingOverlay();
        
        // Ensure core systems are properly initialized before proceeding
        if (!appState || !notificationSystem || !loadingOverlay) {
            throw new Error('Échec de l\'initialisation des modules core');
        }
        
        timer();
        logger.info('✅ Modules core initialisés');
        
    } catch (error) {
        timer();
        logger.error('❌ Erreur lors de l\'initialisation des modules core', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

async function initializeComponents() {
    const logger = window.logger?.createLogger('Component Initialization') || console;
    const timer = logger.time('Component Initialization');
    
    logger.info('🔧 Initialisation des composants...');
    
    try {
        // Initialize audio recorder manager first (critical dependency)
        audioRecorderManager = new AudioRecorderManager(appState);
        await audioRecorderManager.init();
        
        // Initialize navigation system
        tabNavigationSystem = new TabNavigationSystem(appState);
        await tabNavigationSystem.init();
        
        // Initialize other components with proper error handling
        const componentPromises = [];
        
        // Form validation system
        if (typeof FormValidationSystem !== 'undefined') {
            formValidationSystem = new FormValidationSystem();
            componentPromises.push(
                errorHandler.handleAsync(
                    () => formValidationSystem.init(),
                    'FormValidationSystem',
                    'Erreur lors de l\'initialisation du système de validation'
                )
            );
        }
        
        // Photo management system
        if (typeof PhotoManagementSystem !== 'undefined') {
            photoManagementSystem = new PhotoManagementSystem();
            componentPromises.push(
                errorHandler.handleAsync(
                    () => photoManagementSystem.init(),
                    'PhotoManagementSystem',
                    'Erreur lors de l\'initialisation du système de gestion des photos'
                )
            );
        }
        
        // DMI data sender
        if (typeof DMIDataSender !== 'undefined') {
            dmiDataSender = new DMIDataSender(photoManagementSystem);
        }
        
        // Auth modal system
        if (typeof AuthModalSystem !== 'undefined') {
            authModalSystem = new AuthModalSystem();
            componentPromises.push(
                errorHandler.handleAsync(
                    () => authModalSystem.init(),
                    'AuthModalSystem',
                    'Erreur lors de l\'initialisation du modal d\'authentification'
                )
            );
        }
        
        // Auto-save system
        if (typeof AutoSaveSystem !== 'undefined') {
            autoSaveSystem = new AutoSaveSystem(appState);
            componentPromises.push(
                errorHandler.handleAsync(
                    () => autoSaveSystem.init(),
                    'AutoSaveSystem',
                    'Erreur lors de l\'initialisation du système de sauvegarde automatique'
                )
            );
        }
        
        // Data sender
        if (typeof DataSender !== 'undefined') {
            dataSender = new DataSender(appState, audioRecorderManager);
        }
        
        // Wait for all component initializations to complete
        const results = await Promise.allSettled(componentPromises);
        
        // Log any failed component initializations
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                logger.warning(`Composant ${index} a échoué lors de l'initialisation`, {
                    error: result.reason?.message,
                    stack: result.reason?.stack
                });
            }
        });
        
        // Initialize Firebase Auth after other components are ready
        setTimeout(() => {
            if (typeof FirebaseAuthManager !== 'undefined') {
                try {
                    FirebaseAuthManager.init();
                } catch (error) {
                    logger.warning('Erreur lors de l\'initialisation de Firebase Auth', {
                        error: error.message
                    });
                }
            }
        }, 200);
        
        timer();
        logger.info('✅ Composants initialisés');
        
    } catch (error) {
        timer();
        logger.error('❌ Erreur critique lors de l\'initialisation des composants', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

async function initializeTabs() {
    const logger = window.logger?.createLogger('Tab Initialization') || console;
    const timer = logger.time('Tab Initialization');
    
    try {
        // Initialize tab-specific modules
        const tabPromises = [];
        
        if (typeof HomeTab !== 'undefined') {
            homeTab = new HomeTab(appState, tabNavigationSystem);
            tabPromises.push(
                errorHandler.handleAsync(
                    () => homeTab.init(),
                    'HomeTab',
                    'Erreur lors de l\'initialisation de l\'onglet d\'accueil'
                )
            );
        }
        
        if (typeof NormalModeTab !== 'undefined') {
            normalModeTab = new NormalModeTab(appState, tabNavigationSystem, audioRecorderManager, dataSender);
            tabPromises.push(
                errorHandler.handleAsync(
                    () => normalModeTab.init(),
                    'NormalModeTab',
                    'Erreur lors de l\'initialisation du mode normal'
                )
            );
        }
        
        if (typeof TestModeTab !== 'undefined') {
            testModeTab = new TestModeTab(appState, tabNavigationSystem, audioRecorderManager, dataSender);
            tabPromises.push(
                errorHandler.handleAsync(
                    () => testModeTab.init(),
                    'TestModeTab',
                    'Erreur lors de l\'initialisation du mode test'
                )
            );
        }
        
        // Wait for all tab initializations to complete
        await Promise.allSettled(tabPromises);
        
        timer();
        logger.info('✅ Tab modules initialisés');
        
    } catch (error) {
        timer();
        logger.error('❌ Erreur lors de l\'initialisation des onglets', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

function initializeEventListeners() {
    // Global event listeners
    setupGlobalEventListeners();
    
    // Tab change listeners
    setupTabChangeListeners();
}

function setupGlobalEventListeners() {
    // Submit buttons are now handled by individual tab modules
    // But we keep some global listeners here
    
    // Swipe hint hiding
    const tabsContainer = document.querySelector('.tabs-container');
    const swipeHint = document.querySelector('.swipe-hint');

    if (tabsContainer && swipeHint) {
        let hasScrolled = false;
        
        tabsContainer.addEventListener('scroll', Utils.throttle(() => {
            if (!hasScrolled) {
                hasScrolled = true;
                swipeHint.style.animation = 'fadeOut 0.5s ease forwards';
                setTimeout(() => {
                    swipeHint.style.display = 'none';
                }, 500);
            }
        }, 100));
        
        // Auto hide after 10 seconds
        setTimeout(() => {
            if (!hasScrolled && swipeHint) {
                swipeHint.style.animation = 'fadeOut 0.5s ease forwards';
                setTimeout(() => {
                    swipeHint.style.display = 'none';
                }, 500);
            }
        }, 10000);
    }
}

function setupTabChangeListeners() {
    // Listen for tab changes to trigger lifecycle methods
    const originalSwitchTab = tabNavigationSystem.switchTab.bind(tabNavigationSystem);
    
    tabNavigationSystem.switchTab = async function(tabId) {
        // Call lifecycle methods before switching
        await handleTabUnload(tabNavigationSystem.getActiveTab());
        
        // Perform the actual tab switch
        await originalSwitchTab(tabId);
        
        // Call lifecycle methods after switching
        await handleTabLoad(tabId);
    };
}

async function handleTabLoad(tabId) {
    // Call onTabLoad for the specific tab
    switch(tabId) {
        case 'home':
            if (homeTab && homeTab.onTabLoad) {
                homeTab.onTabLoad();
            }
            break;
        case 'mode-normal':
            if (normalModeTab && normalModeTab.onTabLoad) {
                normalModeTab.onTabLoad();
            }
            break;
        case 'mode-test':
            if (testModeTab && testModeTab.onTabLoad) {
                testModeTab.onTabLoad();
            }
            break;
        // Add other tabs as needed
    }
}

async function handleTabUnload(tabId) {
    // Call onTabUnload for the specific tab
    switch(tabId) {
        case 'home':
            if (homeTab && homeTab.onTabUnload) {
                homeTab.onTabUnload();
            }
            break;
        case 'mode-normal':
            if (normalModeTab && normalModeTab.onTabUnload) {
                normalModeTab.onTabUnload();
            }
            break;
        case 'mode-test':
            if (testModeTab && testModeTab.onTabUnload) {
                testModeTab.onTabUnload();
            }
            break;
        // Add other tabs as needed
    }
}

async function finalizeInitialization() {
    // Update initial state
    if (audioRecorderManager) {
        audioRecorderManager.updateSectionCount();
    }
    
    appState.isInitialized = true;
    
    // Make instances globally available for compatibility
    makeInstancesGlobal();
    
    // Initialize global helper functions
    initializeGlobalHelpers();
}

function makeInstancesGlobal() {
    // Limit global exposure to essential functions only
    // All internal instances are now encapsulated in the DictaMed namespace
    window.DictaMed = window.DictaMed || {};
    
    // Only expose essential global functions for backward compatibility
    window.switchTab = async (tabId) => {
        if (tabNavigationSystem) {
            await tabNavigationSystem.switchTab(tabId);
        }
    };

    window.toggleAuthModal = () => {
        if (authModalSystem) {
            authModalSystem.toggle();
        }
    };

    window.closeAuthModal = () => {
        if (authModalSystem) {
            authModalSystem.close();
        }
    };

    window.togglePasswordVisibility = () => {
        if (authModalSystem) {
            authModalSystem.togglePasswordVisibility();
        }
    };

    window.showForgotPassword = () => {
        const email = document.getElementById('modalEmailInput').value.trim();
        if (!email) {
            if (notificationSystem) {
                notificationSystem.warning('Veuillez d\'abord entrer votre adresse email pour réinitialiser votre mot de passe.', 'Email requis');
            } else {
                alert('Veuillez d\'abord entrer votre adresse email pour réinitialiser votre mot de passe.');
            }
            document.getElementById('modalEmailInput').focus();
            return;
        }
        
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().sendPasswordResetEmail(email)
                .then(() => {
                    if (notificationSystem) {
                        notificationSystem.success('Un email de réinitialisation a été envoyé à ' + email, 'Email envoyé');
                    } else {
                        alert('Un email de réinitialisation a été envoyé à ' + email);
                    }
                })
                .catch((error) => {
                    console.error('Erreur:', error);
                    if (error.code === 'auth/user-not-found') {
                        if (notificationSystem) {
                            notificationSystem.error('Aucun compte trouvé avec cet email', 'Erreur');
                        } else {
                            alert('Aucun compte trouvé avec cet email');
                        }
                    } else {
                        if (notificationSystem) {
                            notificationSystem.error('Impossible d\'envoyer l\'email de réinitialisation', 'Erreur');
                        } else {
                            alert('Impossible d\'envoyer l\'email de réinitialisation');
                        }
                    }
                });
        } else {
            alert('Un email de réinitialisation sera envoyé à: ' + email);
        }
    };
}

function initializeGlobalHelpers() {
    // Create DictaMed namespace for organized global access
    window.DictaMed = window.DictaMed || {};
    
    // Essential helper functions for backward compatibility
    window.DictaMed.updateSectionCount = () => {
        if (audioRecorderManager) {
            audioRecorderManager.updateSectionCount();
        }
    };

    window.DictaMed.resetForm = (mode) => {
        if (mode === window.APP_CONFIG.MODES.NORMAL && normalModeTab) {
            normalModeTab.resetForm();
        } else if (mode === window.APP_CONFIG.MODES.TEST && testModeTab) {
            testModeTab.resetForm();
        }
    };
    
    // Debug access (only in development)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.DictaMed.debug = {
            appState,
            notificationSystem,
            audioRecorderManager,
            tabNavigationSystem
        };
        console.log('🔧 Debug mode enabled - Access via DictaMed.debug');
    }
}

// ===== MODULE SYSTEM FOR DYNAMIC LOADING =====
window.DictaMedModules = {
    // Method to dynamically load a tab module
    loadTabModule: async function(tabName) {
        const logger = window.logger?.createLogger('Module Loading') || console;
        logger.info(`Loading module for tab: ${tabName}`);
        
        try {
            // This can be extended to load modules on demand
            // Implementation for lazy loading if needed
            logger.debug(`Module loading not yet implemented for: ${tabName}`);
        } catch (error) {
            logger.error(`Failed to load module for tab: ${tabName}`, {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    },
    
    // Method to get a specific module instance
    getModule: function(moduleName) {
        const logger = window.logger?.createLogger('Module Access') || console;
        
        try {
            switch(moduleName) {
                case 'home': return homeTab;
                case 'normal': return normalModeTab;
                case 'test': return testModeTab;
                default: 
                    logger.warning(`Unknown module requested: ${moduleName}`);
                    return null;
            }
        } catch (error) {
            logger.error(`Error accessing module: ${moduleName}`, {
                error: error.message,
                stack: error.stack
            });
            return null;
        }
    }
};

// Add development-only debugging helpers
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.DictaMedDebug = {
        getErrors: () => window.errorHandler?.getRecentErrors() || [],
        getPerformanceMetrics: () => window.performanceMonitor?.getMetrics() || {},
        exportDebugInfo: () => window.errorHandler?.exportErrors() || {},
        clearErrors: () => window.errorHandler?.clearErrors(),
        testError: () => window.errorHandler?.error('Test error for debugging', 'Debug Test')
    };
}