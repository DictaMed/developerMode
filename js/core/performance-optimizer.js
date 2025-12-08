/**
 * DictaMed - Optimiseur de Performances d'Initialisation
 * Version: 1.0.0 - Optimisations des performances critiques
 * Date: 2025-12-08
 * 
 * Ce module fournit des optimisations pour améliorer les performances
 * d'initialisation de l'application DictaMed.
 */

// ===== PERFORMANCE OPTIMIZER =====
class PerformanceOptimizer {
    constructor() {
        this.performanceMetrics = {
            initializationStart: null,
            criticalPathTime: 0,
            componentInitTimes: new Map(),
            totalInitTime: 0,
            memoryUsage: {}
        };
        this.criticalModules = new Set();
        this.lazyModules = new Set();
        this.initializedModules = new Set();
    }

    /**
     * Initialise l'optimiseur de performances
     */
    init() {
        this.performanceMetrics.initializationStart = performance.now();
        
        // Définir les modules critiques (nécessaires immédiatement)
        this.criticalModules = new Set([
            'APP_CONFIG',
            'Utils',
            'ErrorHandler',
            'AppState',
            'NotificationSystem',
            'LoadingOverlay',
            'AudioRecorderManager',
            'TabNavigationSystem'
        ]);

        // Définir les modules qui peuvent être initialisés en lazy loading
        this.lazyModules = new Set([
            'FormValidationSystem',
            'PhotoManagementSystem',
            'AuthModalSystem',
            'AutoSaveSystem',
            'DataSender',
            'HomeTab',
            'NormalModeTab',
            'TestModeTab'
        ]);

        console.log('🚀 PerformanceOptimizer initialized');
        console.log(`Critical modules: ${Array.from(this.criticalModules).join(', ')}`);
        console.log(`Lazy modules: ${Array.from(this.lazyModules).join(', ')}`);
    }

    /**
     * Mesure le temps d'exécution d'une fonction
     */
    async measureExecution(name, fn) {
        const start = performance.now();
        try {
            const result = await fn();
            const duration = performance.now() - start;
            
            this.performanceMetrics.componentInitTimes.set(name, duration);
            console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
            
            return result;
        } catch (error) {
            const duration = performance.now() - start;
            console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms:`, error);
            throw error;
        }
    }

    /**
     * Optimise l'initialisation des composants critiques
     */
    async optimizeCriticalPath() {
        console.log('🔧 Optimizing critical path initialization...');
        
        const criticalStart = performance.now();
        
        // Phase 1: Initialisation parallèle des modules critiques
        const criticalPromises = [
            this.measureExecution('AppState', () => {
                if (typeof window.AppState === 'undefined') {
                    throw new Error('AppState not available');
                }
                return new Promise(resolve => {
                    const instance = new window.AppState();
                    window.appState = instance;
                    resolve(instance);
                });
            }),
            
            this.measureExecution('NotificationSystem', () => {
                if (typeof window.NotificationSystem === 'undefined') {
                    throw new Error('NotificationSystem not available');
                }
                return new Promise(resolve => {
                    const instance = new window.NotificationSystem();
                    window.notificationSystem = instance;
                    resolve(instance);
                });
            }),
            
            this.measureExecution('LoadingOverlay', () => {
                if (typeof window.LoadingOverlay === 'undefined') {
                    throw new Error('LoadingOverlay not available');
                }
                return new Promise(resolve => {
                    const instance = new window.LoadingOverlay();
                    window.loadingOverlay = instance;
                    resolve(instance);
                });
            })
        ];

        // Attendre que les modules critiques soient initialisés
        const [appState, notificationSystem, loadingOverlay] = await Promise.all(criticalPromises);
        
        this.initializedModules.add('AppState');
        this.initializedModules.add('NotificationSystem');
        this.initializedModules.add('LoadingOverlay');

        // Phase 2: Initialisation séquentielle des dépendances critiques
        await this.initializeCriticalDependencies(appState, notificationSystem, loadingOverlay);
        
        this.performanceMetrics.criticalPathTime = performance.now() - criticalStart;
        console.log(`✅ Critical path completed in ${this.performanceMetrics.criticalPathTime.toFixed(2)}ms`);
        
        return {
            appState,
            notificationSystem,
            loadingOverlay
        };
    }

    /**
     * Initialise les dépendances critiques séquentiellement
     */
    async initializeCriticalDependencies(appState, notificationSystem, loadingOverlay) {
        // AudioRecorderManager (dépendance critique)
        if (typeof window.AudioRecorderManager !== 'undefined') {
            await this.measureExecution('AudioRecorderManager', async () => {
                const audioRecorderManager = new window.AudioRecorderManager(appState);
                await audioRecorderManager.init();
                window.audioRecorderManager = audioRecorderManager;
                this.initializedModules.add('AudioRecorderManager');
                return audioRecorderManager;
            });
        }

        // TabNavigationSystem (nécessaire pour la navigation)
        if (typeof window.TabNavigationSystem !== 'undefined') {
            await this.measureExecution('TabNavigationSystem', async () => {
                const tabNavigationSystem = new window.TabNavigationSystem(appState);
                await tabNavigationSystem.init();
                window.tabNavigationSystem = tabNavigationSystem;
                this.initializedModules.add('TabNavigationSystem');
                return tabNavigationSystem;
            });
        }
    }

    /**
     * Initialise les modules non-critiques en lazy loading
     */
    async initializeLazyModules() {
        console.log('🗂️ Initializing lazy modules...');
        
        const lazyStart = performance.now();
        
        // Initialiser les modules en parallèle pour améliorer les performances
        const lazyPromises = [];

        // FormValidationSystem
        if (typeof window.FormValidationSystem !== 'undefined' && !this.initializedModules.has('FormValidationSystem')) {
            lazyPromises.push(
                this.measureExecution('FormValidationSystem', async () => {
                    const formValidationSystem = new window.FormValidationSystem();
                    await formValidationSystem.init();
                    window.formValidationSystem = formValidationSystem;
                    this.initializedModules.add('FormValidationSystem');
                    return formValidationSystem;
                }).catch(error => {
                    console.warn('FormValidationSystem initialization failed:', error);
                    return null;
                })
            );
        }

        // PhotoManagementSystem
        if (typeof window.PhotoManagementSystem !== 'undefined' && !this.initializedModules.has('PhotoManagementSystem')) {
            lazyPromises.push(
                this.measureExecution('PhotoManagementSystem', async () => {
                    const photoManagementSystem = new window.PhotoManagementSystem();
                    await photoManagementSystem.init();
                    window.photoManagementSystem = photoManagementSystem;
                    this.initializedModules.add('PhotoManagementSystem');
                    return photoManagementSystem;
                }).catch(error => {
                    console.warn('PhotoManagementSystem initialization failed:', error);
                    return null;
                })
            );
        }

        // AuthModalSystem
        if (typeof window.AuthModalSystem !== 'undefined' && !this.initializedModules.has('AuthModalSystem')) {
            lazyPromises.push(
                this.measureExecution('AuthModalSystem', async () => {
                    const authModalSystem = new window.AuthModalSystem();
                    await authModalSystem.init();
                    window.authModalSystem = authModalSystem;
                    this.initializedModules.add('AuthModalSystem');
                    return authModalSystem;
                }).catch(error => {
                    console.warn('AuthModalSystem initialization failed:', error);
                    return null;
                })
            );
        }

        // AutoSaveSystem
        if (typeof window.AutoSaveSystem !== 'undefined' && !this.initializedModules.has('AutoSaveSystem')) {
            lazyPromises.push(
                this.measureExecution('AutoSaveSystem', async () => {
                    const autoSaveSystem = new window.AutoSaveSystem(appState);
                    await autoSaveSystem.init();
                    window.autoSaveSystem = autoSaveSystem;
                    this.initializedModules.add('AutoSaveSystem');
                    return autoSaveSystem;
                }).catch(error => {
                    console.warn('AutoSaveSystem initialization failed:', error);
                    return null;
                })
            );
        }

        // DataSender
        if (typeof window.DataSender !== 'undefined' && !this.initializedModules.has('DataSender')) {
            lazyPromises.push(
                this.measureExecution('DataSender', async () => {
                    const dataSender = new window.DataSender(appState, window.audioRecorderManager);
                    window.dataSender = dataSender;
                    this.initializedModules.add('DataSender');
                    return dataSender;
                }).catch(error => {
                    console.warn('DataSender initialization failed:', error);
                    return null;
                })
            );
        }

        // Attendre que tous les modules lazy soient initialisés
        await Promise.allSettled(lazyPromises);
        
        const lazyDuration = performance.now() - lazyStart;
        console.log(`✅ Lazy modules initialized in ${lazyDuration.toFixed(2)}ms`);
    }

    /**
     * Initialise les onglets à la demande (lazy loading)
     */
    async initializeTabsOnDemand() {
        console.log('📄 Setting up on-demand tab initialization...');
        
        // Remplacer l'initialisation standard des tabs par du lazy loading
        if (window.tabNavigationSystem) {
            const originalInit = window.tabNavigationSystem.init.bind(window.tabNavigationSystem);
            
            window.tabNavigationSystem.init = async () => {
                await originalInit();
                
                // Initialiser seulement l'onglet Home immédiatement
                if (typeof window.HomeTab !== 'undefined') {
                    await this.measureExecution('HomeTab', async () => {
                        const homeTab = new window.HomeTab(appState, window.tabNavigationSystem);
                        await homeTab.init();
                        window.homeTab = homeTab;
                        this.initializedModules.add('HomeTab');
                        return homeTab;
                    });
                }
                
                // Programmer l'initialisation des autres tabs à la demande
                this.setupLazyTabLoading();
            };
        }
    }

    /**
     * Configure le chargement à la demande des onglets
     */
    setupLazyTabLoading() {
        // Intercepter les changements d'onglets pour charger à la demande
        const originalSwitchTab = window.tabNavigationSystem.switchTab.bind(window.tabNavigationSystem);
        
        window.tabNavigationSystem.switchTab = async (tabId) => {
            // Charger le module de l'onglet si nécessaire
            await this.loadTabModuleIfNeeded(tabId);
            
            // Procéder au changement d'onglet
            await originalSwitchTab(tabId);
        };
    }

    /**
     * Charge un module d'onglet à la demande
     */
    async loadTabModuleIfNeeded(tabId) {
        const tabModules = {
            'mode-normal': 'NormalModeTab',
            'mode-test': 'TestModeTab'
        };

        const moduleName = tabModules[tabId];
        if (!moduleName || this.initializedModules.has(moduleName)) {
            return;
        }

        console.log(`📄 Loading tab module on-demand: ${moduleName}`);
        
        try {
            await this.measureExecution(moduleName, async () => {
                const TabClass = window[moduleName];
                if (!TabClass) {
                    throw new Error(`${moduleName} not available`);
                }
                
                const tabInstance = new TabClass(
                    appState, 
                    window.tabNavigationSystem, 
                    window.audioRecorderManager, 
                    window.dataSender
                );
                
                await tabInstance.init();
                
                // Stocker l'instance selon le type d'onglet
                if (moduleName === 'NormalModeTab') {
                    window.normalModeTab = tabInstance;
                } else if (moduleName === 'TestModeTab') {
                    window.testModeTab = tabInstance;
                }
                
                this.initializedModules.add(moduleName);
                return tabInstance;
            });
        } catch (error) {
            console.error(`Failed to load tab module ${moduleName}:`, error);
        }
    }

    /**
     * Optimise les performances mémoire
     */
    optimizeMemory() {
        console.log('🧠 Optimizing memory usage...');
        
        // Nettoyer les références inutiles après initialisation
        setTimeout(() => {
            // Force garbage collection si disponible (Chrome)
            if (window.gc && typeof window.gc === 'function') {
                window.gc();
            }
            
            // Surveiller l'utilisation mémoire
            if (performance.memory) {
                this.performanceMetrics.memoryUsage = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                };
                
                console.log('📊 Memory usage after initialization:', {
                    used: `${(this.performanceMetrics.memoryUsage.used / 1024 / 1024).toFixed(2)}MB`,
                    total: `${(this.performanceMetrics.memoryUsage.total / 1024 / 1024).toFixed(2)}MB`,
                    limit: `${(this.performanceMetrics.memoryUsage.limit / 1024 / 1024).toFixed(2)}MB`
                });
            }
        }, 1000);
    }

    /**
     * Génère un rapport de performance
     */
    generatePerformanceReport() {
        this.performanceMetrics.totalInitTime = performance.now() - this.performanceMetrics.initializationStart;
        
        console.log('📊 PERFORMANCE REPORT');
        console.log('====================');
        console.log(`Total initialization time: ${this.performanceMetrics.totalInitTime.toFixed(2)}ms`);
        console.log(`Critical path time: ${this.performanceMetrics.criticalPathTime.toFixed(2)}ms`);
        console.log(`Lazy modules time: ${(this.performanceMetrics.totalInitTime - this.performanceMetrics.criticalPathTime).toFixed(2)}ms`);
        
        console.log('\n📈 Component initialization times:');
        this.performanceMetrics.componentInitTimes.forEach((time, name) => {
            console.log(`  ${name}: ${time.toFixed(2)}ms`);
        });
        
        console.log(`\n🎯 Modules initialized: ${this.initializedModules.size}`);
        console.log(`Critical modules: ${this.criticalModules.size}`);
        console.log(`Lazy modules: ${this.lazyModules.size}`);
        
        if (performance.memory) {
            console.log('\n🧠 Memory usage:');
            console.log(`  Used: ${(this.performanceMetrics.memoryUsage.used / 1024 / 1024).toFixed(2)}MB`);
            console.log(`  Total: ${(this.performanceMetrics.memoryUsage.total / 1024 / 1024).toFixed(2)}MB`);
        }
        
        return this.performanceMetrics;
    }

    /**
     * Active les optimisations de performance
     */
    async enableOptimizations() {
        console.log('⚡ Enabling performance optimizations...');
        
        try {
            // 1. Optimiser le chemin critique
            const criticalResults = await this.optimizeCriticalPath();
            
            // 2. Initialiser les modules lazy en arrière-plan
            setTimeout(() => {
                this.initializeLazyModules().catch(error => {
                    console.warn('Lazy modules initialization failed:', error);
                });
            }, 100);
            
            // 3. Configurer le chargement à la demande des onglets
            await this.initializeTabsOnDemand();
            
            // 4. Optimiser la mémoire
            this.optimizeMemory();
            
            // 5. Générer le rapport de performance
            setTimeout(() => {
                this.generatePerformanceReport();
            }, 2000);
            
            return criticalResults;
        } catch (error) {
            console.error('Performance optimization failed:', error);
            throw error;
        }
    }
}

// ===== UTILITAIRES D'OPTIMISATION =====

/**
 * Debounce pour éviter les initialisations multiples
 */
function createDebouncedInitializer(delay = 100) {
    let timeoutId;
    let initializationPromise;
    
    return {
        async initialize(initFunction) {
            if (initializationPromise) {
                return initializationPromise;
            }
            
            clearTimeout(timeoutId);
            
            initializationPromise = new Promise((resolve, reject) => {
                timeoutId = setTimeout(async () => {
                    try {
                        const result = await initFunction();
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    } finally {
                        initializationPromise = null;
                    }
                }, delay);
            });
            
            return initializationPromise;
        }
    };
}

/**
 * Préchargement des ressources critiques
 */
function preloadCriticalResources() {
    console.log('🔄 Preloading critical resources...');
    
    // Précharger les fichiers HTML des onglets critiques
    const criticalTabFiles = [
        'tab-home.html',
        'tab-mode-test.html'  // Mode test est souvent utilisé
    ];
    
    criticalTabFiles.forEach(file => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = file;
        document.head.appendChild(link);
    });
}

// ===== INITIALISATION AUTOMATIQUE =====
if (typeof window !== 'undefined') {
    // Exposer l'optimiseur globalement
    window.PerformanceOptimizer = PerformanceOptimizer;
    window.createDebouncedInitializer = createDebouncedInitializer;
    window.preloadCriticalResources = preloadCriticalResources;
    
    console.log('🚀 Performance Optimizer loaded');
    console.log('Available methods:');
    console.log('  - PerformanceOptimizer.enableOptimizations()');
    console.log('  - createDebouncedInitializer(delay)');
    console.log('  - preloadCriticalResources()');
}

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceOptimizer, createDebouncedInitializer, preloadCriticalResources };
}