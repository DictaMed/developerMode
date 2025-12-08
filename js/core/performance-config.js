/**
 * DictaMed - Configuration des Optimisations de Performance
 * Version: 1.0.0 - Configuration centralisée des optimisations
 * Date: 2025-12-08
 */

// ===== CONFIGURATION DES PERFORMANCES =====
const PERFORMANCE_CONFIG = {
    // Configuration du lazy loading
    LAZY_LOADING: {
        enabled: true,
        delay: 100, // Délai en ms avant le chargement lazy
        prefetchDelay: 2000, // Délai avant le préchargement
        maxConcurrentLoads: 3 // Nombre maximum de chargements simultanés
    },

    // Configuration du chemin critique
    CRITICAL_PATH: {
        enabled: true,
        parallelInitialization: true,
        timeout: 5000, // Timeout pour l'initialisation critique
        retryAttempts: 2
    },

    // Configuration de la mémoire
    MEMORY: {
        enabled: true,
        gcInterval: 30000, // Garbage collection toutes les 30s
        memoryWarningThreshold: 50 * 1024 * 1024, // 50MB
        maxMemoryUsage: 100 * 1024 * 1024 // 100MB
    },

    // Configuration du caching
    CACHING: {
        enabled: true,
        cacheSize: 10, // Nombre d'éléments en cache
        cacheTimeout: 5 * 60 * 1000, // 5 minutes
        preloadCritical: true
    },

    // Configuration du monitoring
    MONITORING: {
        enabled: true,
        logPerformance: true,
        reportInterval: 10000, // Rapport toutes les 10s
        alertThreshold: 2000 // Alerte si init > 2s
    },

    // Modules critiques (doivent être chargés immédiatement)
    CRITICAL_MODULES: [
        'APP_CONFIG',
        'Utils',
        'ErrorHandler',
        'AppState',
        'NotificationSystem',
        'LoadingOverlay',
        'AudioRecorderManager',
        'TabNavigationSystem'
    ],

    // Modules lazy (peuvent être chargés à la demande)
    LAZY_MODULES: [
        'FormValidationSystem',
        'PhotoManagementSystem',
        'AuthModalSystem',
        'AutoSaveSystem',
        'DataSender',
        'HomeTab',
        'NormalModeTab',
        'TestModeTab',
        'DMIDataSender'
    ],

    // Ressources à précharger
    PRELOAD_RESOURCES: [
        {
            type: 'link',
            rel: 'prefetch',
            href: 'tab-home.html'
        },
        {
            type: 'link',
            rel: 'prefetch',
            href: 'tab-mode-test.html'
        },
        {
            type: 'link',
            rel: 'dns-prefetch',
            href: 'https://www.gstatic.com'
        },
        {
            type: 'link',
            rel: 'dns-prefetch',
            href: 'https://n8n.srv1104707.hstgr.cloud'
        }
    ],

    // Seuils de performance
    PERFORMANCE_THRESHOLDS: {
        criticalPath: 1000, // 1s max pour le chemin critique
        totalInitialization: 3000, // 3s max pour l'init complète
        componentLoad: 500, // 500ms max par composant
        memoryUsage: 50 * 1024 * 1024 // 50MB max
    },

    // Configuration du debouncing
    DEBOUNCING: {
        initialization: 50,
        tabSwitch: 100,
        formValidation: 300,
        autoSave: 1000
    }
};

// ===== MÉTHODES D'OPTIMISATION =====

/**
 * Configure le préchargement des ressources
 */
function configureResourcePreloading() {
    if (!PERFORMANCE_CONFIG.CACHING.preloadCritical) {
        return;
    }

    console.log('🔄 Configuring resource preloading...');

    PERFORMANCE_CONFIG.PRELOAD_RESOURCES.forEach(resource => {
        try {
            const element = document.createElement(resource.type);
            
            Object.keys(resource).forEach(key => {
                if (key !== 'type') {
                    element.setAttribute(key, resource[key]);
                }
            });
            
            document.head.appendChild(element);
            console.log(`✅ Preloaded: ${resource.href}`);
        } catch (error) {
            console.warn(`⚠️ Failed to preload: ${resource.href}`, error);
        }
    });
}

/**
 * Configure le monitoring des performances
 */
function configurePerformanceMonitoring() {
    if (!PERFORMANCE_CONFIG.MONITORING.enabled) {
        return;
    }

    console.log('📊 Configuring performance monitoring...');

    // Observer de performance pour mesurer les métriques Core Web Vitals
    if ('PerformanceObserver' in window) {
        try {
            // Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                console.log(`📈 LCP: ${lastEntry.startTime.toFixed(2)}ms`);
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // First Input Delay
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    console.log(`📈 FID: ${entry.processingStart - entry.startTime}ms`);
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });

            // Cumulative Layout Shift
            const clsObserver = new PerformanceObserver((list) => {
                let clsValue = 0;
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                console.log(`📈 CLS: ${clsValue.toFixed(3)}`);
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });

        } catch (error) {
            console.warn('Performance monitoring setup failed:', error);
        }
    }

    // Monitoring de la mémoire
    if (PERFORMANCE_CONFIG.MEMORY.enabled && performance.memory) {
        setInterval(() => {
            const memInfo = performance.memory;
            const usedMB = memInfo.usedJSHeapSize / 1024 / 1024;
            
            if (usedMB > PERFORMANCE_CONFIG.PERFORMANCE_THRESHOLDS.memoryUsage / 1024 / 1024) {
                console.warn(`⚠️ High memory usage: ${usedMB.toFixed(2)}MB`);
                
                // Force garbage collection si disponible
                if (window.gc && typeof window.gc === 'function') {
                    window.gc();
                }
            }
        }, PERFORMANCE_CONFIG.MEMORY.gcInterval);
    }
}

/**
 * Configure le caching intelligent
 */
function configureIntelligentCaching() {
    if (!PERFORMANCE_CONFIG.CACHING.enabled) {
        return;
    }

    console.log('💾 Configuring intelligent caching...');

    // Cache pour les résultats de fonctions coûteuses
    const functionCache = new Map();
    const cacheTimeout = PERFORMANCE_CONFIG.CACHING.cacheTimeout;
    
    window.DictaMedCache = {
        get(key) {
            const item = functionCache.get(key);
            if (item && Date.now() - item.timestamp < cacheTimeout) {
                return item.value;
            }
            functionCache.delete(key);
            return null;
        },
        
        set(key, value) {
            // Limiter la taille du cache
            if (functionCache.size >= PERFORMANCE_CONFIG.CACHING.cacheSize) {
                const firstKey = functionCache.keys().next().value;
                functionCache.delete(firstKey);
            }
            
            functionCache.set(key, {
                value,
                timestamp: Date.now()
            });
        },
        
        clear() {
            functionCache.clear();
        },
        
        size() {
            return functionCache.size;
        }
    };
}

/**
 * Vérifie si les optimisations sont activées
 */
function isOptimizationEnabled() {
    return PERFORMANCE_CONFIG.CRITICAL_PATH.enabled && 
           PERFORMANCE_CONFIG.LAZY_LOADING.enabled;
}

/**
 * Applique toutes les optimisations de configuration
 */
function applyAllOptimizations() {
    console.log('⚡ Applying all performance optimizations...');
    
    configureResourcePreloading();
    configurePerformanceMonitoring();
    configureIntelligentCaching();
    
    console.log('✅ All performance optimizations applied');
}

// ===== EXPORT ET INITIALISATION =====
if (typeof window !== 'undefined') {
    window.PERFORMANCE_CONFIG = PERFORMANCE_CONFIG;
    window.configureResourcePreloading = configureResourcePreloading;
    window.configurePerformanceMonitoring = configurePerformanceMonitoring;
    window.configureIntelligentCaching = configureIntelligentCaching;
    window.isOptimizationEnabled = isOptimizationEnabled;
    window.applyAllOptimizations = applyAllOptimizations;
    
    // Initialisation automatique en mode développement
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🚀 Performance Config loaded (Development Mode)');
    }
}

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PERFORMANCE_CONFIG,
        configureResourcePreloading,
        configurePerformanceMonitoring,
        configureIntelligentCaching,
        isOptimizationEnabled,
        applyAllOptimizations
    };
}