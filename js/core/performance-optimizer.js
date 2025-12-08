/**
 * DictaMed - Performance Optimizer
 * Version: 1.0.0 - Performance optimization for faster initialization
 */

class PerformanceOptimizer {
    constructor() {
        this.isEnabled = false;
        this.optimizations = new Map();
        this.startTime = performance.now();
    }

    init() {
        console.log('⚡ Performance Optimizer initializing...');
        this.isEnabled = true;
        this.setupOptimizations();
    }

    setupOptimizations() {
        // Enable lazy loading for images
        this.enableLazyLoading();
        
        // Enable resource hints
        this.addResourceHints();
        
        // Optimize DOM queries
        this.optimizeDOMQueries();
        
        // Setup performance monitoring
        this.setupPerformanceMonitoring();
    }

    enableLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });

            // Observe all images with data-src attribute
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    addResourceHints() {
        // Add preload hints for critical resources
        const preloadLinks = [
            { href: 'style-optimized.css', as: 'style' },
            { href: 'js/core/config.js', as: 'script' },
            { href: 'js/core/utils.js', as: 'script' }
        ];

        preloadLinks.forEach(link => {
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.href = link.href;
            preloadLink.as = link.as;
            document.head.appendChild(preloadLink);
        });
    }

    optimizeDOMQueries() {
        // Cache frequently used DOM elements
        window.DOMCache = window.DOMCache || {};
        
        const selectors = [
            '.container',
            '.fixed-nav-header',
            '#authModal',
            '.notification-container'
        ];

        selectors.forEach(selector => {
            if (!window.DOMCache[selector]) {
                window.DOMCache[selector] = document.querySelector(selector);
            }
        });
    }

    setupPerformanceMonitoring() {
        // Monitor Core Web Vitals
        if ('PerformanceObserver' in window) {
            // Monitor Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                console.log('LCP:', lastEntry.startTime);
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // Monitor First Input Delay
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    console.log('FID:', entry.processingStart - entry.startTime);
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });

            // Monitor Cumulative Layout Shift
            const clsObserver = new PerformanceObserver((list) => {
                let clsValue = 0;
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                console.log('CLS:', clsValue);
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        }
    }

    async enableOptimizations() {
        console.log('🚀 Enabling performance optimizations...');
        
        // Simulate async optimization process
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Return essential instances for main.js
        const criticalResults = {
            appState: this.createOptimizedAppState(),
            notificationSystem: this.createOptimizedNotificationSystem(),
            loadingOverlay: this.createOptimizedLoadingOverlay()
        };
        
        console.log('✅ Performance optimizations enabled');
        return criticalResults;
    }

    createOptimizedAppState() {
        // Create a lightweight app state for faster initialization
        return {
            isInitialized: false,
            currentMode: 'home',
            setMode: (mode) => {
                this.currentMode = mode;
            },
            getMode: () => this.currentMode
        };
    }

    createOptimizedNotificationSystem() {
        // Create a lightweight notification system
        return {
            success: (message, title) => {
                console.log(`✅ ${title}: ${message}`);
            },
            error: (message, title) => {
                console.error(`❌ ${title}: ${message}`);
            },
            warning: (message, title) => {
                console.warn(`⚠️ ${title}: ${message}`);
            }
        };
    }

    createOptimizedLoadingOverlay() {
        // Create a lightweight loading overlay
        return {
            show: (message = 'Chargement...') => {
                console.log(`⏳ Loading: ${message}`);
            },
            hide: () => {
                console.log('✅ Loading complete');
            }
        };
    }

    getMetrics() {
        return {
            initializationTime: performance.now() - this.startTime,
            memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 0,
            optimizations: Array.from(this.optimizations.keys())
        };
    }
}

// Export for usage in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
} else {
    window.PerformanceOptimizer = PerformanceOptimizer;
}