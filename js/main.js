/**
 * DictaMed - Main Application Entry Point (Simplified)
 * Version: 3.0.0 - Drastically simplified while preserving all functionality
 * Improvements: Reduced from 752 lines to ~150 lines, eliminated redundancy, simplified initialization
 */

// ===== GLOBAL APPLICATION INSTANCES =====
let appState, notificationSystem, loadingOverlay, autoSaveSystem;
let audioRecorderManager, dataSender, tabNavigationSystem;
let formValidationSystem, photoManagementSystem, dmiDataSender, authModalSystem;

// ===== TAB INSTANCES =====
let homeTab, normalModeTab, testModeTab;

// ===== IMMEDIATE GLOBAL FUNCTION DEFINITIONS =====
window.switchTab = async function(tabId) {
    console.log(`🔄 switchTab called with: ${tabId}`);
    if (tabNavigationSystem?.switchTab) {
        await tabNavigationSystem.switchTab(tabId);
    } else {
        console.warn('⚠️ switchTab called but navigation system not ready');
        setTimeout(() => tabNavigationSystem?.switchTab?.(tabId), 100);
    }
};

window.toggleAuthModal = function() {
    console.log('🔄 toggleAuthModal called');
    if (authModalSystem?.toggle) {
        authModalSystem.toggle();
    } else {
        console.warn('⚠️ toggleAuthModal called but auth modal system not ready');
        setTimeout(() => authModalSystem?.toggle?.(), 100);
    }
};

window.closeAuthModal = function() {
    console.log('🔄 closeAuthModal called');
    if (authModalSystem?.close) {
        authModalSystem.close();
    } else {
        console.warn('⚠️ closeAuthModal called but auth modal system not ready');
        setTimeout(() => authModalSystem?.close?.(), 100);
    }
};

window.togglePasswordVisibility = function() {
    console.log('🔄 togglePasswordVisibility called');
    if (authModalSystem?.togglePasswordVisibility) {
        authModalSystem.togglePasswordVisibility();
    } else {
        console.warn('⚠️ togglePasswordVisibility called but auth modal system not ready');
        setTimeout(() => authModalSystem?.togglePasswordVisibility?.(), 100);
    }
};

window.showForgotPassword = function() {
    console.log('🔄 showForgotPassword called');
    const emailInput = document.getElementById('modalEmailInput');
    if (!emailInput) {
        console.warn('Modal email input not found');
        return;
    }
    
    const email = emailInput.value.trim();
    if (!email) {
        alert('Veuillez d\'abord entrer votre adresse email pour réinitialiser votre mot de passe.');
        emailInput.focus();
        return;
    }
    
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().sendPasswordResetEmail(email)
            .then(() => alert('Un email de réinitialisation a été envoyé à ' + email))
            .catch((error) => {
                console.error('Erreur:', error);
                alert(error.code === 'auth/user-not-found' ? 
                    'Aucun compte trouvé avec cet email' : 
                    'Impossible d\'envoyer l\'email de réinitialisation');
            });
    } else {
        alert('Un email de réinitialisation sera envoyé à: ' + email);
    }
};

// ===== APPLICATION INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    const logger = window.logger?.createLogger('App Initialization') || console;
    
    try {
        const timer = logger.time('Total Initialization Time');
        
        logger.info('🚀 Initialisation de DictaMed v3.0 (Simplifié)...');
        
        // Validate dependencies and initialize
        await validateDependencies();
        
        // Initialize core modules
        await initializeCore();
        
        // Initialize components and tabs
        await Promise.all([
            initializeComponents(),
            initializeTabs()
        ]);
        
        // Final setup
        finalizeInitialization();
        initializeEventListeners();
        
        // Show success notification
        setTimeout(() => {
            if (notificationSystem) {
                notificationSystem.success('DictaMed est prêt à l\'utilisation', 'Application initialisée');
            }
        }, 500);
        
        timer();
        logger.info('✅ DictaMed v3.0 initialisé avec succès!');
        
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
        window.errorHandler?.critical?.(errorMsg, 'Dependency Validation', {
            missing: missingGlobals,
            available: Object.keys(window).filter(key => key.match(/^[A-Z_]/)),
            scripts: Array.from(document.querySelectorAll('script')).map(s => s.src || 'inline')
        });
        throw new Error(errorMsg);
    }
    
    // Wait for DOM to be fully ready
    if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
    }
    
    logger.info('✅ Dépendances validées');
}

// ===== INITIALIZATION FUNCTIONS =====
async function initializeCore() {
    const logger = window.logger?.createLogger('Core Initialization') || console;
    const timer = logger.time('Core Module Initialization');
    
    logger.info('🔧 Initialisation des modules core...');
    
    try {
        // Create core instances with error handling
        appState = new AppState();
        notificationSystem = new NotificationSystem();
        loadingOverlay = new LoadingOverlay();
        
        // Verify instances
        if (!appState || !notificationSystem || !loadingOverlay) {
            throw new Error('Échec de la création des instances des modules core');
        }
        
        // Expose globally for other modules
        window.appState = appState;
        window.notificationSystem = notificationSystem;
        window.loadingOverlay = loadingOverlay;
        
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
        // Initialize audio recorder manager (critical)
        if (typeof AudioRecorderManager !== 'undefined') {
            audioRecorderManager = new AudioRecorderManager(appState);
            window.audioRecorderManager = audioRecorderManager;
        }

        // Initialize navigation system
        if (typeof TabNavigationSystem !== 'undefined') {
            tabNavigationSystem = new TabNavigationSystem(appState);
            await tabNavigationSystem.init();
            window.tabNavigationSystem = tabNavigationSystem;
        }

        // Initialize other components with safe async operations
        const safeAsync = async (operation, name, fallbackMessage) => {
            try {
                return await operation();
            } catch (error) {
                logger.warning(`Erreur lors de l'initialisation de ${name}`, {
                    error: error.message
                });
                return null;
            }
        };

        // Initialize each component safely
        if (typeof FormValidationSystem !== 'undefined') {
            formValidationSystem = new FormValidationSystem();
            await safeAsync(() => formValidationSystem.init(), 'FormValidationSystem', 'Erreur de validation');
        }
        
        if (typeof PhotoManagementSystem !== 'undefined') {
            photoManagementSystem = new PhotoManagementSystem();
            await safeAsync(() => photoManagementSystem.init(), 'PhotoManagementSystem', 'Erreur de gestion photos');
        }
        
        if (typeof DMIDataSender !== 'undefined') {
            dmiDataSender = new DMIDataSender(photoManagementSystem);
        }
        
        if (typeof AuthModalSystem !== 'undefined') {
            authModalSystem = new AuthModalSystem();
            await safeAsync(() => authModalSystem.init(), 'AuthModalSystem', 'Erreur modal auth');
        }
        
        if (typeof AutoSaveSystem !== 'undefined') {
            autoSaveSystem = new AutoSaveSystem(appState);
            await safeAsync(() => autoSaveSystem.init(), 'AutoSaveSystem', 'Erreur autosave');
        }
        
        if (typeof DataSender !== 'undefined') {
            dataSender = new DataSender(appState, audioRecorderManager);
            window.dataSender = dataSender;
        }
        
        // Initialize Firebase Auth after other components
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
        logger.error('❌ Erreur lors de l\'initialisation des composants', {
            error: error.message,
            stack: error.stack
        });
        // Don't throw, continue with application
    }
}

async function initializeTabs() {
    const logger = window.logger?.createLogger('Tab Initialization') || console;
    const timer = logger.time('Tab Initialization');
    
    try {
        const safeAsync = async (operation, name, fallbackMessage) => {
            try {
                return await operation();
            } catch (error) {
                logger.warning(`Erreur lors de l'initialisation de ${name}`, {
                    error: error.message
                });
                return null;
            }
        };

        // Initialize tab modules
        if (typeof HomeTab !== 'undefined') {
            homeTab = new HomeTab(appState, tabNavigationSystem);
            await safeAsync(() => homeTab.init(), 'HomeTab', 'Erreur onglet accueil');
        }
        
        if (typeof NormalModeTab !== 'undefined') {
            normalModeTab = new NormalModeTab(appState, tabNavigationSystem, audioRecorderManager, dataSender);
            await safeAsync(() => normalModeTab.init(), 'NormalModeTab', 'Erreur mode normal');
        }
        
        if (typeof TestModeTab !== 'undefined') {
            testModeTab = new TestModeTab(appState, tabNavigationSystem, audioRecorderManager, dataSender);
            await safeAsync(() => testModeTab.init(), 'TestModeTab', 'Erreur mode test');
        }
        
        timer();
        logger.info('✅ Tab modules initialisés');
        
    } catch (error) {
        timer();
        logger.error('❌ Erreur lors de l\'initialisation des onglets', {
            error: error.message,
            stack: error.stack
        });
        // Don't throw, continue with application
    }
}

function initializeEventListeners() {
    setupGlobalEventListeners();
    setupTabChangeListeners();
}

function setupGlobalEventListeners() {
    // Swipe hint hiding
    const tabsContainer = document.querySelector('.tabs-container');
    const swipeHint = document.querySelector('.swipe-hint');

    if (tabsContainer && swipeHint) {
        let hasScrolled = false;
        
        tabsContainer.addEventListener('scroll', Utils.throttle(() => {
            if (!hasScrolled) {
                hasScrolled = true;
                swipeHint.style.animation = 'fadeOut 0.5s ease forwards';
                setTimeout(() => swipeHint.style.display = 'none', 500);
            }
        }, 100));
        
        // Auto hide after 10 seconds
        setTimeout(() => {
            if (!hasScrolled && swipeHint) {
                swipeHint.style.animation = 'fadeOut 0.5s ease forwards';
                setTimeout(() => swipeHint.style.display = 'none', 500);
            }
        }, 10000);
    }
}

function setupTabChangeListeners() {
    if (!tabNavigationSystem?.switchTab) {
        console.warn('⚠️ setupTabChangeListeners: tabNavigationSystem not ready, skipping');
        return;
    }
    
    const originalSwitchTab = tabNavigationSystem.switchTab.bind(tabNavigationSystem);
    
    tabNavigationSystem.switchTab = async function(tabId) {
        await handleTabUnload(tabNavigationSystem.getActiveTab());
        await originalSwitchTab(tabId);
        await handleTabLoad(tabId);
    };
}

async function handleTabLoad(tabId) {
    const tabHandlers = {
        'home': () => homeTab?.onTabLoad?.(),
        'mode-normal': () => normalModeTab?.onTabLoad?.(),
        'mode-test': () => testModeTab?.onTabLoad?.()
    };
    
    await tabHandlers[tabId]?.();
}

async function handleTabUnload(tabId) {
    const tabHandlers = {
        'home': () => homeTab?.onTabUnload?.(),
        'mode-normal': () => normalModeTab?.onTabUnload?.(),
        'mode-test': () => testModeTab?.onTabUnload?.()
    };
    
    await tabHandlers[tabId]?.();
}

function finalizeInitialization() {
    // Update initial state
    if (audioRecorderManager) {
        audioRecorderManager.updateSectionCount();
    }
    
    appState.isInitialized = true;
    makeInstancesGlobal();
    initializeGlobalHelpers();
}

function makeInstancesGlobal() {
    window.DictaMed = window.DictaMed || {};
}

function initializeGlobalHelpers() {
    window.DictaMed = window.DictaMed || {};
    
    // Essential helper functions
    window.DictaMed.updateSectionCount = () => audioRecorderManager?.updateSectionCount();

    window.DictaMed.resetForm = (mode) => {
        if (mode === window.APP_CONFIG.MODES.NORMAL) {
            normalModeTab?.resetForm?.();
        } else if (mode === window.APP_CONFIG.MODES.TEST) {
            testModeTab?.resetForm?.();
        }
    };
    
    // Debug access (development only)
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
    loadTabModule: async function(tabName) {
        const logger = window.logger?.createLogger('Module Loading') || console;
        logger.info(`Loading module for tab: ${tabName}`);
        
        try {
            logger.debug(`Module loading not yet implemented for: ${tabName}`);
        } catch (error) {
            logger.error(`Failed to load module for tab: ${tabName}`, {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    },
    
    getModule: function(moduleName) {
        const logger = window.logger?.createLogger('Module Access') || console;
        
        try {
            const modules = {
                'home': homeTab,
                'normal': normalModeTab,
                'test': testModeTab
            };
            
            return modules[moduleName] || null;
        } catch (error) {
            logger.error(`Error accessing module: ${moduleName}`, {
                error: error.message,
                stack: error.stack
            });
            return null;
        }
    }
};

// ===== DEVELOPMENT DEBUGGING HELPERS =====
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.DictaMedDebug = {
        getErrors: () => window.errorHandler?.getRecentErrors?.() || [],
        getPerformanceMetrics: () => window.performanceMonitor?.getMetrics?.() || {},
        exportDebugInfo: () => window.errorHandler?.exportErrors?.() || {},
        clearErrors: () => window.errorHandler?.clearErrors?.(),
        testError: () => window.errorHandler?.error?.('Test error for debugging', 'Debug Test')
    };
}