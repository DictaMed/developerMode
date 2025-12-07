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
    console.log('Initialisation de DictaMed v2.0 (Architecture modulaire)...');
    
    try {
        // Initialize core systems in order
        await initializeCore();
        
        // Initialize components
        await initializeComponents();
        
        // Initialize tabs
        await initializeTabs();
        
        // Initialize event listeners
        initializeEventListeners();
        
        // Final initialization
        await finalizeInitialization();
        
        console.log('✅ DictaMed v2.0 initialisé avec succès (Architecture modulaire)!');
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        if (notificationSystem) {
            notificationSystem.error('Erreur lors de l\'initialisation de l\'application', 'Erreur d\'initialisation');
        }
    }
});

// ===== INITIALIZATION FUNCTIONS =====
async function initializeCore() {
    // Core modules are loaded via script tags in HTML
    appState = new AppState();
    notificationSystem = new NotificationSystem();
    loadingOverlay = new LoadingOverlay();
    
    console.log('✅ Core modules initialisés');
}

async function initializeComponents() {
    // Initialize audio recorder manager first
    audioRecorderManager = new AudioRecorderManager(appState);
    audioRecorderManager.init();
    
    // Initialize other components
    tabNavigationSystem = new TabNavigationSystem(appState);
    tabNavigationSystem.init();
    
    // Initialize validation and other systems
    if (typeof FormValidationSystem !== 'undefined') {
        formValidationSystem = new FormValidationSystem();
        formValidationSystem.init();
    }
    
    if (typeof PhotoManagementSystem !== 'undefined') {
        photoManagementSystem = new PhotoManagementSystem();
        photoManagementSystem.init();
    }
    
    if (typeof DMIDataSender !== 'undefined') {
        dmiDataSender = new DMIDataSender(photoManagementSystem);
    }
    
    if (typeof AuthModalSystem !== 'undefined') {
        authModalSystem = new AuthModalSystem();
        authModalSystem.init();
    }
    
    // Initialize auto-save system
    if (typeof AutoSaveSystem !== 'undefined') {
        autoSaveSystem = new AutoSaveSystem(appState);
        autoSaveSystem.init();
    }
    
    // Initialize data sender
    if (typeof DataSender !== 'undefined') {
        dataSender = new DataSender(appState, audioRecorderManager);
    }
    
    // Initialize Firebase Auth with delay
    setTimeout(() => {
        if (typeof FirebaseAuthManager !== 'undefined') {
            FirebaseAuthManager.init();
        }
    }, 100);
    
    console.log('✅ Components initialisés');
}

async function initializeTabs() {
    // Initialize tab-specific modules
    if (typeof HomeTab !== 'undefined') {
        homeTab = new HomeTab(appState, tabNavigationSystem);
        homeTab.init();
    }
    
    if (typeof NormalModeTab !== 'undefined') {
        normalModeTab = new NormalModeTab(appState, tabNavigationSystem, audioRecorderManager, dataSender);
        normalModeTab.init();
    }
    
    if (typeof TestModeTab !== 'undefined') {
        testModeTab = new TestModeTab(appState, tabNavigationSystem, audioRecorderManager, dataSender);
        testModeTab.init();
    }
    
    console.log('✅ Tab modules initialisés');
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
    // Make instances available globally for backward compatibility
    window.appState = appState;
    window.notificationSystem = notificationSystem;
    window.loadingOverlay = loadingOverlay;
    window.autoSaveSystem = autoSaveSystem;
    window.audioRecorderManager = audioRecorderManager;
    window.dataSender = dataSender;
    window.tabNavigationSystem = tabNavigationSystem;
    window.formValidationSystem = formValidationSystem;
    window.photoManagementSystem = photoManagementSystem;
    window.dmiDataSender = dmiDataSender;
    window.authModalSystem = authModalSystem;
    
    // Tab instances
    window.homeTab = homeTab;
    window.normalModeTab = normalModeTab;
    window.testModeTab = testModeTab;
}

function initializeGlobalHelpers() {
    // Global helper functions for backward compatibility
    window.updateSectionCount = () => {
        if (audioRecorderManager) {
            audioRecorderManager.updateSectionCount();
        }
    };

    window.resetForm = (mode) => {
        if (mode === window.APP_CONFIG.MODES.NORMAL && normalModeTab) {
            normalModeTab.resetForm();
        } else if (mode === window.APP_CONFIG.MODES.TEST && testModeTab) {
            testModeTab.resetForm();
        }
    };
}

// ===== GLOBAL EXPORTS FOR COMPATIBILITY =====
window.switchTab = async (tabId) => {
    await tabNavigationSystem.switchTab(tabId);
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
        alert('Veuillez d\'abord entrer votre adresse email pour réinitialiser votre mot de passe.');
        document.getElementById('modalEmailInput').focus();
        return;
    }
    
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().sendPasswordResetEmail(email)
            .then(() => {
                notificationSystem.success('Un email de réinitialisation a été envoyé à ' + email, 'Email envoyé');
            })
            .catch((error) => {
                console.error('Erreur:', error);
                if (error.code === 'auth/user-not-found') {
                    notificationSystem.error('Aucun compte trouvé avec cet email', 'Erreur');
                } else {
                    notificationSystem.error('Impossible d\'envoyer l\'email de réinitialisation', 'Erreur');
                }
            });
    } else {
        alert('Un email de réinitialisation sera envoyé à: ' + email);
    }
};

// ===== MODULE SYSTEM FOR DYNAMIC LOADING =====
window.DictaMedModules = {
    // Method to dynamically load a tab module
    loadTabModule: async function(tabName) {
        // This can be extended to load modules on demand
        console.log(`Loading module for tab: ${tabName}`);
        // Implementation for lazy loading if needed
    },
    
    // Method to get a specific module instance
    getModule: function(moduleName) {
        switch(moduleName) {
            case 'home': return homeTab;
            case 'normal': return normalModeTab;
            case 'test': return testModeTab;
            default: return null;
        }
    }
};