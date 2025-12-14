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

// ===== IMMEDIATE GLOBAL FUNCTION DEFINITIONS =====
// These functions are made available immediately to prevent onclick handler errors
window._switchTabRetryCount = 0;
window._switchTabMaxRetries = 5;

window.switchTab = async function(tabId) {
    // Store the request and execute when system is ready
    console.log(`🔄 switchTab called with: ${tabId}`);
    if (tabNavigationSystem && tabNavigationSystem.switchTab) {
        window._switchTabRetryCount = 0; // Reset retry counter on success
        await tabNavigationSystem.switchTab(tabId);
    } else if (window._switchTabRetryCount < window._switchTabMaxRetries) {
        console.warn(`⚠️ switchTab called but navigation system not ready (attempt ${window._switchTabRetryCount + 1}/${window._switchTabMaxRetries})`);
        // Retry after a short delay with exponential backoff
        window._switchTabRetryCount++;
        const delay = Math.min(100 * Math.pow(1.5, window._switchTabRetryCount), 2000);
        setTimeout(async () => {
            await window.switchTab(tabId); // Recursive call with retry logic
        }, delay);
    } else {
        console.error('❌ switchTab: Navigation system not ready after max retries');
    }
};

window._authModalRetryCount = 0;
window._authModalMaxRetries = 3;

window.toggleAuthModal = function() {
    console.log('🔄 toggleAuthModal called');
    if (authModalSystem && authModalSystem.toggle) {
        window._authModalRetryCount = 0;
        authModalSystem.toggle();
    } else if (window._authModalRetryCount < window._authModalMaxRetries) {
        console.warn(`⚠️ toggleAuthModal called but auth modal system not ready (attempt ${window._authModalRetryCount + 1}/${window._authModalMaxRetries})`);
        window._authModalRetryCount++;
        setTimeout(() => {
            window.toggleAuthModal();
        }, 100);
    } else {
        console.error('❌ toggleAuthModal: Auth modal system not ready after max retries');
    }
};

window.closeAuthModal = function() {
    console.log('🔄 closeAuthModal called');
    if (authModalSystem && authModalSystem.close) {
        window._authModalRetryCount = 0;
        authModalSystem.close();
    } else if (window._authModalRetryCount < window._authModalMaxRetries) {
        console.warn(`⚠️ closeAuthModal called but auth modal system not ready (attempt ${window._authModalRetryCount + 1}/${window._authModalMaxRetries})`);
        window._authModalRetryCount++;
        setTimeout(() => {
            window.closeAuthModal();
        }, 100);
    } else {
        console.error('❌ closeAuthModal: Auth modal system not ready after max retries');
    }
};

window.togglePasswordVisibility = function() {
    console.log('🔄 togglePasswordVisibility called');
    if (authModalSystem && authModalSystem.togglePasswordVisibility) {
        window._authModalRetryCount = 0;
        authModalSystem.togglePasswordVisibility();
    } else if (window._authModalRetryCount < window._authModalMaxRetries) {
        console.warn(`⚠️ togglePasswordVisibility called but auth modal system not ready (attempt ${window._authModalRetryCount + 1}/${window._authModalMaxRetries})`);
        window._authModalRetryCount++;
        setTimeout(() => {
            window.togglePasswordVisibility();
        }, 100);
    } else {
        console.error('❌ togglePasswordVisibility: Auth modal system not ready after max retries');
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

    // BUG FIX: Validate email format before sending
    if (!window.Utils?.isValidEmail?.(email)) {
        alert('Veuillez entrer une adresse email valide.');
        emailInput.focus();
        return;
    }

    // Rate limiting check for password reset
    const lastPasswordResetTime = sessionStorage.getItem('dictamed_last_password_reset');
    const now = Date.now();
    const resetCooldown = 60000; // 1 minute between attempts

    if (lastPasswordResetTime && (now - parseInt(lastPasswordResetTime) < resetCooldown)) {
        const waitSeconds = Math.ceil((resetCooldown - (now - parseInt(lastPasswordResetTime))) / 1000);
        alert(`Veuillez attendre ${waitSeconds} secondes avant de réessayer.`);
        return;
    }

    sessionStorage.setItem('dictamed_last_password_reset', now.toString());

    if (typeof firebase !== 'undefined' && firebase?.auth) {
        firebase.auth().sendPasswordResetEmail(email)
            .then(() => {
                if (window.notificationSystem) {
                    window.notificationSystem.success(
                        'Un email de réinitialisation a été envoyé. Veuillez vérifier votre boîte de réception.',
                        'Email envoyé',
                        5000
                    );
                } else {
                    alert('Un email de réinitialisation a été envoyé.');
                }
            })
            .catch((error) => {
                console.error('Password reset error:', error);
                if (error?.code === 'auth/user-not-found') {
                    alert('Aucun compte trouvé avec cet email');
                } else {
                    alert('Erreur: Impossible d\'envoyer l\'email de réinitialisation');
                }
            });
    } else {
        alert('Service de réinitialisation temporairement indisponible.');
    }
};

// ===== APPLICATION INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    const logger = window.logger?.createLogger('App Initialization') || console;
    
    try {
        const timer = logger.time('Total Initialization Time');
        
        logger.info('🚀 Initialisation de DictaMed v2.2 (Optimisations de performance)...');
        
        // Validate dependencies before initialization
        await validateDependencies();
        
        // Check if performance optimizer is available
        if (window.PerformanceOptimizer) {
            logger.info('⚡ Using Performance Optimizer for faster initialization...');
            
            // Initialize performance optimizer
            const optimizer = new window.PerformanceOptimizer();
            optimizer.init();
            
            // Enable performance optimizations
            const criticalResults = await optimizer.enableOptimizations();
            
            // Use optimized results
            appState = criticalResults.appState;
            notificationSystem = criticalResults.notificationSystem;
            loadingOverlay = criticalResults.loadingOverlay;
            
            // Initialize event listeners with optimizer
            initializeEventListeners();
            
            // Final initialization
            await finalizeInitialization();
            
            // Show success notification
            setTimeout(() => {
                if (notificationSystem) {
                    notificationSystem.success('DictaMed est prêt à l\'utilisation (optimisé)', 'Application initialisée');
                }
            }, 500);
            
        } else {
            logger.info('📦 Using standard initialization...');
            
            // Fallback to standard initialization if optimizer not available
            await initializeCore();
            await initializeComponents();
            await initializeTabs();
            initializeEventListeners();
            await finalizeInitialization();
            
            // Show success notification
            setTimeout(() => {
                if (notificationSystem) {
                    notificationSystem.success('DictaMed est prêt à l\'utilisation', 'Application initialisée');
                }
            }, 500);
        }
        
        timer();
        logger.info('✅ DictaMed v2.2 initialisé avec succès!');
        
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
        if (window.logger) {
            window.logger.createLogger('Error').memory('Memory usage at error');
        }
    }
});

// ===== DEPENDENCY VALIDATION =====
async function validateDependencies() {
    const logger = window.logger?.createLogger('Dependency Validation') || console;
    
    logger.info('🔍 Validation des dépendances...');
    
    // Log current state before validation
    logger.info('📊 État global avant validation:', {
        globals: Object.keys(window).filter(key => key.match(/^[A-Z_]/)),
        domReady: document.readyState,
        timestamp: new Date().toISOString()
    });
    
    const requiredGlobals = ['APP_CONFIG', 'Utils', 'ErrorHandler'];
    const missingGlobals = requiredGlobals.filter(global => typeof window[global] === 'undefined');
    
    logger.info('🔍 Vérification des dépendances critiques:', {
        required: requiredGlobals,
        missing: missingGlobals,
        available: requiredGlobals.map(global => ({
            name: global,
            available: typeof window[global] !== 'undefined',
            type: typeof window[global]
        }))
    });
    
    if (missingGlobals.length > 0) {
        const errorMsg = `Dépendances manquantes: ${missingGlobals.join(', ')}`;
        window.errorHandler.critical(errorMsg, 'Dependency Validation', {
            missing: missingGlobals,
            available: Object.keys(window).filter(key => key.match(/^[A-Z_]/)),
            scripts: Array.from(document.querySelectorAll('script')).map(s => s.src || 'inline')
        });
        throw new Error(errorMsg);
    }
    
    // Wait for DOM to be fully ready
    await new Promise(resolve => {
        if (document.readyState === 'loading') {
            logger.info('⏳ Attente du DOM...');
            document.addEventListener('DOMContentLoaded', resolve);
        } else {
            logger.info('✅ DOM déjà prêt');
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
        // Verify that constructors are available
        if (typeof AppState === 'undefined') {
            throw new Error('AppState constructor not available');
        }
        if (typeof NotificationSystem === 'undefined') {
            throw new Error('NotificationSystem constructor not available');
        }
        if (typeof LoadingOverlay === 'undefined') {
            throw new Error('LoadingOverlay constructor not available');
        }
        
        logger.info('📦 Vérification des constructeurs OK, création des instances...');
        
        appState = new AppState();
        notificationSystem = new NotificationSystem();
        loadingOverlay = new LoadingOverlay();
        
        // Verify instances are properly created
        if (!appState || !notificationSystem || !loadingOverlay) {
            throw new Error('Échec de la création des instances des modules core');
        }
        
        // Test basic functionality of critical instances
        if (typeof appState.setMode !== 'function') {
            throw new Error('AppState instance invalid - missing setMode method');
        }
        
        // Expose instances globally immediately for other modules
        window.appState = appState;
        window.notificationSystem = notificationSystem;
        window.loadingOverlay = loadingOverlay;
        
        timer();
        logger.info('✅ Modules core initialisés et exposés globalement');
        
    } catch (error) {
        timer();
        logger.error('❌ Erreur lors de l\'initialisation des modules core', {
            error: error.message,
            stack: error.stack,
            availableGlobals: Object.keys(window).filter(key => key.match(/^[A-Z_]/))
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
        if (typeof AudioRecorderManager === 'undefined') {
            throw new Error('AudioRecorderManager constructor not available');
        }
        audioRecorderManager = new AudioRecorderManager(appState);
        // Note: init() will be called when tabs load to ensure DOM elements exist

        // Expose audio recorder manager globally
        window.audioRecorderManager = audioRecorderManager;
        
        // Initialize navigation system
        if (typeof TabNavigationSystem === 'undefined') {
            throw new Error('TabNavigationSystem constructor not available');
        }
        tabNavigationSystem = new TabNavigationSystem(appState);
        await tabNavigationSystem.init();
        
        // Expose navigation system globally
        window.tabNavigationSystem = tabNavigationSystem;
        
        // Make switchTab function available immediately for onclick handlers
        // This will be properly set up once navigation system is initialized
        window.switchTab = async (tabId) => {
            if (tabNavigationSystem && tabNavigationSystem.switchTab) {
                await tabNavigationSystem.switchTab(tabId);
            } else {
                console.warn('⚠️ switchTab called before navigation system ready');
                // Retry after a short delay
                setTimeout(async () => {
                    if (tabNavigationSystem && tabNavigationSystem.switchTab) {
                        await tabNavigationSystem.switchTab(tabId);
                    }
                }, 100);
            }
        };
        
        // Initialize other components with proper error handling
        const componentPromises = [];
        
        // Helper function for safe async operations
        const safeAsyncOperation = async (operation, context, fallbackMessage) => {
            try {
                if (window.errorHandler && typeof window.errorHandler.handleAsync === 'function') {
                    return await window.errorHandler.handleAsync(operation, context, fallbackMessage);
                } else {
                    // Fallback if errorHandler not available
                    return await operation();
                }
            } catch (error) {
                logger.warning(`Erreur lors de l'initialisation de ${context}`, {
                    error: error.message,
                    stack: error.stack
                });
                // Don't throw, just log and continue
                return null;
            }
        };
        
        // Form validation system
        if (typeof FormValidationSystem !== 'undefined') {
            formValidationSystem = new FormValidationSystem();
            componentPromises.push(
                safeAsyncOperation(
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
                safeAsyncOperation(
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
                safeAsyncOperation(
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
                safeAsyncOperation(
                    () => autoSaveSystem.init(),
                    'AutoSaveSystem',
                    'Erreur lors de l\'initialisation du système de sauvegarde automatique'
                )
            );
        }
        
        // Data sender
        if (typeof DataSender !== 'undefined') {
            dataSender = new DataSender(appState, audioRecorderManager);
            window.dataSender = dataSender; // Expose globally for fallback
        }
        
        // Wait for all component initializations to complete
        const results = await Promise.allSettled(componentPromises);
        
        // Log any failed component initializations but don't fail the entire process
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
        // Don't throw the error, just log it and continue
        // The application should still function even if some components fail to initialize
    }
}

async function initializeTabs() {
    const logger = window.logger?.createLogger('Tab Initialization') || console;
    const timer = logger.time('Tab Initialization');
    
    try {
        // Initialize tab-specific modules
        const tabPromises = [];
        
        // Helper function for safe async operations
        const safeAsyncOperation = async (operation, context, fallbackMessage) => {
            try {
                if (window.errorHandler && typeof window.errorHandler.handleAsync === 'function') {
                    return await window.errorHandler.handleAsync(operation, context, fallbackMessage);
                } else {
                    // Fallback if errorHandler not available
                    return await operation();
                }
            } catch (error) {
                logger.warning(`Erreur lors de l'initialisation de ${context}`, {
                    error: error.message,
                    stack: error.stack
                });
                // Don't throw, just log and continue
                return null;
            }
        };
        
        if (typeof HomeTab !== 'undefined') {
            homeTab = new HomeTab(appState, tabNavigationSystem);
            tabPromises.push(
                safeAsyncOperation(
                    () => homeTab.init(),
                    'HomeTab',
                    'Erreur lors de l\'initialisation de l\'onglet d\'accueil'
                )
            );
        }
        
        if (typeof NormalModeTab !== 'undefined') {
            normalModeTab = new NormalModeTab(appState, tabNavigationSystem, audioRecorderManager, dataSender);
            tabPromises.push(
                safeAsyncOperation(
                    () => normalModeTab.init(),
                    'NormalModeTab',
                    'Erreur lors de l\'initialisation du mode normal'
                )
            );
        }
        
        if (typeof TestModeTab !== 'undefined') {
            testModeTab = new TestModeTab(appState, tabNavigationSystem, audioRecorderManager, dataSender);
            tabPromises.push(
                safeAsyncOperation(
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
        // Don't throw the error, just log it and continue
        // The application should still function even if some tabs fail to initialize
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
    // Only set up tab change listeners if navigation system is available
    if (!tabNavigationSystem || !tabNavigationSystem.switchTab) {
        console.warn('⚠️ setupTabChangeListeners: tabNavigationSystem not ready, skipping');
        return;
    }
    
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

    // Initialize the Mode Visibility Manager (handles button visibility based on auth)
    try {
        window.modeVisibilityManager = new ModeVisibilityManager();
        window.modeVisibilityManager.init();

        // Set initial mode visibility based on current authentication status
        const currentUser = window.FirebaseAuthManager?.getCurrentUser?.();
        const isAuthenticated = !!currentUser;
        window.modeVisibilityManager.updateVisibility(isAuthenticated);

        console.log('✅ Mode visibility management initialized successfully');
    } catch (error) {
        console.warn('⚠️ Could not initialize mode visibility manager:', error);
    }
}

function makeInstancesGlobal() {
    // Limit global exposure to essential functions only
    // All internal instances are now encapsulated in the DictaMed namespace
    window.DictaMed = window.DictaMed || {};
    
    // Only expose essential global functions for backward compatibility
    // These are already set up early in the file with safety checks
    // No need to reassign them here to avoid timing issues
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

    // Mode visibility management based on authentication status
    window.DictaMed.updateModeVisibility = (isAuthenticated) => {
        updateModeVisibility(isAuthenticated);
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

// ===== MODE VISIBILITY MANAGEMENT SYSTEM =====
/**
 * Classe pour gérer la visibilité des modes en fonction de l'état d'authentification
 *
 * Responsabilités:
 * - Cacher/afficher les boutons de mode selon l'authentification
 * - Gérer les transitions entre les modes
 * - Gérer le cache des éléments DOM
 * - Fournir des callbacks pour les changements d'état
 *
 * Architecture:
 * - Mode Normal: visible uniquement si authentifié
 * - Mode DMI: visible uniquement si authentifié
 * - Mode Test: visible uniquement si NON authentifié
 */
class ModeVisibilityManager {
    constructor() {
        // État interne
        this.currentAuthState = null;
        this.isInitialized = false;
        this.modeElements = {
            normal: null,
            dmi: null,
            test: null
        };

        // Callbacks pour les changements d'état
        this.callbacks = {
            onAuthStateChange: [],
            onModeVisibilityChange: []
        };

        // Constantes
        this.MODES = {
            AUTHENTICATED: 'authenticated',
            UNAUTHENTICATED: 'unauthenticated'
        };
    }

    /**
     * Initialiser le gestionnaire de visibilité des modes
     * Doit être appelé une seule fois au démarrage de l'app
     */
    init() {
        if (this.isInitialized) {
            console.warn('⚠️ ModeVisibilityManager déjà initialisé');
            return;
        }

        try {
            // Cacher les éléments DOM
            this.cacheDOMElements();

            // Vérifier que tous les éléments sont trouvés
            if (!this.validateElements()) {
                throw new Error('Un ou plusieurs boutons de mode manquent dans le DOM');
            }

            // Appliquer les styles CSS pour les transitions
            this.setupTransitionStyles();

            this.isInitialized = true;
            console.log('✅ ModeVisibilityManager initialisé avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation ModeVisibilityManager:', error);
            throw error;
        }
    }

    /**
     * Cacher tous les éléments DOM dans les propriétés de l'instance
     * Cela améliore les performances en évitant les recherches répétées
     */
    cacheDOMElements() {
        this.modeElements.normal = document.getElementById('modeNormalBtn');
        this.modeElements.dmi = document.getElementById('modeDmiBtn');
        this.modeElements.test = document.getElementById('modeTestBtn');
    }

    /**
     * Valider que tous les éléments ont été trouvés
     */
    validateElements() {
        const missingElements = Object.entries(this.modeElements)
            .filter(([, element]) => !element)
            .map(([name]) => name);

        if (missingElements.length > 0) {
            console.warn(`⚠️ Éléments manquants: ${missingElements.join(', ')}`);
            return false;
        }

        return true;
    }

    /**
     * Appliquer les styles CSS pour les transitions fluides
     */
    setupTransitionStyles() {
        // Ajouter une classe pour les transitions si elle n'existe pas
        const style = document.createElement('style');
        style.textContent = `
            .mode-btn-transition {
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }

            .mode-btn-hidden {
                opacity: 0;
                visibility: hidden;
                pointer-events: none;
            }

            .mode-btn-visible {
                opacity: 1;
                visibility: visible;
                pointer-events: auto;
            }
        `;
        document.head.appendChild(style);

        // Ajouter les classes de transition à tous les boutons de mode
        Object.values(this.modeElements).forEach(element => {
            if (element) {
                element.classList.add('mode-btn-transition');
            }
        });
    }

    /**
     * Mettre à jour la visibilité des modes en fonction de l'état d'authentification
     * @param {boolean} isAuthenticated - L'utilisateur est-il authentifié?
     */
    updateVisibility(isAuthenticated) {
        // Éviter les mises à jour redondantes
        if (this.currentAuthState === isAuthenticated) {
            console.log('ℹ️ État d\'authentification inchangé, pas de mise à jour nécessaire');
            return;
        }

        this.currentAuthState = isAuthenticated;

        if (isAuthenticated) {
            this.showAuthenticatedModes();
        } else {
            this.showUnauthenticatedModes();
        }

        // Exécuter les callbacks
        this.executeCallbacks('onAuthStateChange', isAuthenticated);
    }

    /**
     * Afficher les modes pour utilisateur authentifié
     * Mode Normal + Mode DMI visibles
     * Mode Test caché
     */
    showAuthenticatedModes() {
        console.log('🔓 Affichage des modes pour utilisateur authentifié');

        // Afficher Mode Normal avec animation
        this.showElement(this.modeElements.normal, 'modeNormalBtn');

        // Afficher Mode DMI avec animation
        this.showElement(this.modeElements.dmi, 'modeDmiBtn');

        // Cacher Mode Test
        this.hideElement(this.modeElements.test, 'modeTestBtn');

        console.log('✅ Mode Normal et Mode DMI activés');
        this.executeCallbacks('onModeVisibilityChange', {
            state: this.MODES.AUTHENTICATED,
            visible: ['normal', 'dmi'],
            hidden: ['test']
        });
    }

    /**
     * Afficher les modes pour utilisateur NON authentifié
     * Mode Test visible
     * Mode Normal + Mode DMI cachés
     */
    showUnauthenticatedModes() {
        console.log('🔒 Affichage des modes pour utilisateur NON authentifié');

        // Cacher Mode Normal avec animation
        this.hideElement(this.modeElements.normal, 'modeNormalBtn');

        // Cacher Mode DMI avec animation
        this.hideElement(this.modeElements.dmi, 'modeDmiBtn');

        // Afficher Mode Test
        this.showElement(this.modeElements.test, 'modeTestBtn');

        console.log('✅ Mode Test activé');
        this.executeCallbacks('onModeVisibilityChange', {
            state: this.MODES.UNAUTHENTICATED,
            visible: ['test'],
            hidden: ['normal', 'dmi']
        });
    }

    /**
     * Afficher un élément avec transition
     * @param {HTMLElement} element - L'élément à afficher
     * @param {string} elementId - L'ID pour le logging
     */
    showElement(element, elementId) {
        if (!element) return;

        // Utiliser display pour accessible + classes pour l'animation
        element.style.display = '';
        element.classList.remove('mode-btn-hidden');
        element.classList.add('mode-btn-visible');

        console.log(`  → Affichage de ${elementId}`);
    }

    /**
     * Cacher un élément avec transition
     * @param {HTMLElement} element - L'élément à cacher
     * @param {string} elementId - L'ID pour le logging
     */
    hideElement(element, elementId) {
        if (!element) return;

        element.classList.remove('mode-btn-visible');
        element.classList.add('mode-btn-hidden');

        // Cacher avec display après la transition pour l'accessibilité
        setTimeout(() => {
            if (!element.classList.contains('mode-btn-visible')) {
                element.style.display = 'none';
            }
        }, 300); // Match la durée de transition en CSS

        console.log(`  → Masquage de ${elementId}`);
    }

    /**
     * Ajouter un callback pour les changements d'état
     * @param {string} event - Type d'événement (onAuthStateChange, onModeVisibilityChange)
     * @param {function} callback - Fonction à appeler
     */
    onAuthStateChange(callback) {
        if (typeof callback === 'function') {
            this.callbacks.onAuthStateChange.push(callback);
        }
    }

    /**
     * Ajouter un callback pour les changements de visibilité
     * @param {string} event - Type d'événement
     * @param {function} callback - Fonction à appeler
     */
    onModeVisibilityChange(callback) {
        if (typeof callback === 'function') {
            this.callbacks.onModeVisibilityChange.push(callback);
        }
    }

    /**
     * Exécuter tous les callbacks pour un événement donné
     * @param {string} eventType - Type d'événement
     * @param {*} data - Données à passer aux callbacks
     */
    executeCallbacks(eventType, data) {
        if (!this.callbacks[eventType]) {
            return;
        }

        this.callbacks[eventType].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`❌ Erreur lors de l'exécution du callback ${eventType}:`, error);
            }
        });
    }

    /**
     * Obtenir l'état actuel d'authentification
     */
    getCurrentAuthState() {
        return this.currentAuthState;
    }

    /**
     * Obtenir l'état actuel des modes visibles
     */
    getModeVisibilityState() {
        return {
            isAuthenticated: this.currentAuthState,
            normalVisible: this.modeElements.normal?.style.display !== 'none',
            dmiVisible: this.modeElements.dmi?.style.display !== 'none',
            testVisible: this.modeElements.test?.style.display !== 'none'
        };
    }
}

// Créer l'instance globale du gestionnaire de visibilité des modes
window.modeVisibilityManager = null;

/**
 * Fonction wrapper pour la compatibilité avec le code existant
 * Appelle le ModeVisibilityManager
 */
function updateModeVisibility(isAuthenticated) {
    if (!window.modeVisibilityManager) {
        console.warn('⚠️ ModeVisibilityManager n\'est pas initialisé');
        return;
    }
    window.modeVisibilityManager.updateVisibility(isAuthenticated);
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