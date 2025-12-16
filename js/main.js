/**
 * DictaMed - Point d'entrée principal
 * Version: 3.0.0 - Architecture modulaire simplifiée
 */

// ===== GLOBAL APPLICATION INSTANCES =====
let appState, notificationSystem, loadingOverlay, autoSaveSystem;
let audioRecorderManager, dataSender, tabNavigationSystem;
let formValidationSystem, photoManagementSystem, dmiDataSender, authModalSystem;

// ===== TAB INSTANCES =====
let homeTab, normalModeTab, testModeTab;

// ===== UTILITY: FONCTION RETRY GÉNÉRIQUE =====
/**
 * Crée une fonction avec logique de retry automatique
 * Élimine la duplication de code pour les fonctions globales
 */
function createRetryableFunction(name, getTarget, method, maxRetries = 5) {
    let retryCount = 0;

    return function(...args) {
        const target = getTarget();
        if (target && typeof target[method] === 'function') {
            retryCount = 0;
            return target[method](...args);
        }

        if (retryCount < maxRetries) {
            retryCount++;
            const delay = Math.min(100 * Math.pow(1.5, retryCount), 2000);
            console.warn(`⚠️ ${name}: système non prêt (tentative ${retryCount}/${maxRetries})`);
            return new Promise(resolve => {
                setTimeout(() => resolve(window[name](...args)), delay);
            });
        }

        console.error(`❌ ${name}: système non disponible après ${maxRetries} tentatives`);
        return Promise.resolve();
    };
}

// ===== GLOBAL FUNCTIONS (SIMPLIFIÉES) =====
window.switchTab = createRetryableFunction(
    'switchTab',
    () => tabNavigationSystem,
    'switchTab'
);

window.toggleAuthModal = createRetryableFunction(
    'toggleAuthModal',
    () => authModalSystem,
    'toggle',
    3
);

window.closeAuthModal = createRetryableFunction(
    'closeAuthModal',
    () => authModalSystem,
    'close',
    3
);

window.togglePasswordVisibility = createRetryableFunction(
    'togglePasswordVisibility',
    () => authModalSystem,
    'togglePasswordVisibility',
    3
);

window.showForgotPassword = async function() {
    console.log('🔄 showForgotPassword called');
    const emailInput = document.getElementById('modalEmailInput');
    if (!emailInput) {
        console.warn('Modal email input not found');
        return;
    }

    const email = emailInput.value.trim();
    if (!email) {
        window.notificationSystem?.warning('Veuillez d\'abord entrer votre adresse email.', 'Email requis');
        emailInput.focus();
        return;
    }

    // Utiliser FirebaseAuthManager au lieu d'appeler directement Firebase
    const authManager = window.FirebaseAuthManager;
    if (authManager?.sendPasswordResetEmail) {
        const result = await authManager.sendPasswordResetEmail(email);
        if (result.success) {
            window.notificationSystem?.success(
                'Un email de réinitialisation a été envoyé.',
                'Email envoyé'
            );
        } else {
            window.notificationSystem?.error(result.error, 'Erreur');
        }
    } else {
        window.notificationSystem?.error('Service temporairement indisponible.', 'Erreur');
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

        // Initialize Mode Visibility Manager EARLY (before auth listeners are set up)
        // This must be done here so it exists when tabNavigationSystem.init() sets up auth listeners
        try {
            window.modeVisibilityManager = new ModeVisibilityManager();
            window.modeVisibilityManager.init();
            logger.info('✅ ModeVisibilityManager initialisé');
        } catch (error) {
            logger.warn('⚠️ Could not initialize ModeVisibilityManager:', error);
        }

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

/**
 * Fonction utilitaire pour initialiser un composant de manière sécurisée
 */
async function safeInit(Constructor, name, ...args) {
    if (typeof Constructor === 'undefined') {
        console.warn(`⚠️ ${name} non disponible`);
        return null;
    }
    try {
        const instance = new Constructor(...args);
        if (typeof instance.init === 'function') {
            await instance.init();
        }
        return instance;
    } catch (error) {
        console.warn(`⚠️ Erreur lors de l'initialisation de ${name}:`, error.message);
        return null;
    }
}

async function initializeComponents() {
    const logger = window.logger?.createLogger('Component Initialization') || console;
    const timer = logger.time?.('Component Initialization') || (() => {});

    logger.info('🔧 Initialisation des composants...');

    try {
        // Composants critiques
        audioRecorderManager = await safeInit(AudioRecorderManager, 'AudioRecorderManager', appState);
        window.audioRecorderManager = audioRecorderManager;

        tabNavigationSystem = await safeInit(TabNavigationSystem, 'TabNavigationSystem', appState);
        window.tabNavigationSystem = tabNavigationSystem;

        // Composants secondaires (en parallèle)
        const [formVal, photoMgmt, authModal, autoSave] = await Promise.all([
            safeInit(FormValidationSystem, 'FormValidationSystem'),
            safeInit(PhotoManagementSystem, 'PhotoManagementSystem'),
            safeInit(AuthModalSystem, 'AuthModalSystem'),
            safeInit(AutoSaveSystem, 'AutoSaveSystem', appState)
        ]);

        formValidationSystem = formVal;
        photoManagementSystem = photoMgmt;
        authModalSystem = authModal;
        autoSaveSystem = autoSave;

        // DMI data sender (dépend de photoManagementSystem)
        if (typeof DMIDataSender !== 'undefined') {
            dmiDataSender = new DMIDataSender(photoManagementSystem);
            window.dmiDataSender = dmiDataSender;
        }

        // Data sender
        if (typeof DataSender !== 'undefined') {
            dataSender = new DataSender(appState, audioRecorderManager);
            window.dataSender = dataSender;
        }

        // Firebase Auth (après les autres composants)
        setTimeout(() => {
            if (window.FirebaseAuthManager?.init) {
                try {
                    window.FirebaseAuthManager.init();
                } catch (e) {
                    logger.warn?.('Firebase Auth init error:', e.message);
                }
            }
        }, 200);

        timer();
        logger.info('✅ Composants initialisés');

    } catch (error) {
        timer();
        logger.error?.('❌ Erreur lors de l\'initialisation des composants', { error: error.message });
    }
}

async function initializeTabs() {
    const logger = window.logger?.createLogger('Tab Initialization') || console;
    const timer = logger.time?.('Tab Initialization') || (() => {});

    try {
        // Initialiser les onglets en parallèle avec safeInit
        const [home, normal, test] = await Promise.all([
            safeInit(HomeTab, 'HomeTab', appState, tabNavigationSystem),
            safeInit(NormalModeTab, 'NormalModeTab', appState, tabNavigationSystem, audioRecorderManager, dataSender),
            safeInit(TestModeTab, 'TestModeTab', appState, tabNavigationSystem, audioRecorderManager, dataSender)
        ]);

        homeTab = home;
        normalModeTab = normal;
        testModeTab = test;

        timer();
        logger.info('✅ Tab modules initialisés');

    } catch (error) {
        timer();
        logger.error?.('❌ Erreur lors de l\'initialisation des onglets', { error: error.message });
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

    // Update mode visibility based on current authentication status
    // ModeVisibilityManager was already created in initializeCore()
    try {
        if (window.modeVisibilityManager) {
            const currentUser = window.FirebaseAuthManager?.getCurrentUser?.();
            const isAuthenticated = !!currentUser;
            window.modeVisibilityManager.updateVisibility(isAuthenticated);
            console.log('✅ Mode visibility initialized based on auth state');
        }
    } catch (error) {
        console.warn('⚠️ Could not update mode visibility:', error);
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
 *
 * @param {boolean} isAuthenticated - L'utilisateur est-il authentifié?
 */
function updateModeVisibility(isAuthenticated) {
    if (!window.modeVisibilityManager) {
        console.warn('⚠️ ModeVisibilityManager n\'est pas encore disponible');
        // Retry after a short delay - ModeVisibilityManager should be created soon
        setTimeout(() => {
            if (window.modeVisibilityManager) {
                console.log('ℹ️ Retrying updateModeVisibility after ModeVisibilityManager became available');
                window.modeVisibilityManager.updateVisibility(isAuthenticated);
            } else {
                console.error('❌ ModeVisibilityManager failed to initialize');
            }
        }, 100);
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