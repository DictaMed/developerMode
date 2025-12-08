/**
 * DictaMed - Performance Optimizer (Version Corrigée)
 * Version: 2.0.0 - Correction pour navigation fonctionnelle
 */

class PerformanceOptimizer {
    constructor() {
        this.isEnabled = false;
        this.optimizations = new Map();
        this.startTime = performance.now();
    }

    init() {
        console.log('⚡ Performance Optimizer initializing (Fixed Version)...');
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
        console.log('🚀 Enabling performance optimizations (Fixed Version)...');
        
        // Simulate async optimization process
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // IMPORTANT: Use real instances instead of lightweight versions
        // This fixes the navigation issue by ensuring all systems are properly initialized
        const criticalResults = {
            appState: this.createRealAppState(),
            notificationSystem: this.createRealNotificationSystem(),
            loadingOverlay: this.createRealLoadingOverlay()
        };
        
        console.log('✅ Performance optimizations enabled with real instances');
        return criticalResults;
    }

    createRealAppState() {
        // Use real AppState constructor if available, otherwise create a proper fallback
        if (typeof AppState !== 'undefined') {
            console.log('📦 Using real AppState constructor');
            return new AppState();
        } else {
            console.log('⚠️ AppState constructor not available, using enhanced fallback');
            return {
                isInitialized: false,
                currentMode: 'home',
                setMode: (mode) => {
                    this.currentMode = mode;
                    console.log(`🔄 Mode changed to: ${mode}`);
                },
                getMode: () => this.currentMode,
                // Add missing methods that navigation system might need
                init: function() {
                    this.isInitialized = true;
                    console.log('✅ AppState fallback initialized');
                }
            };
        }
    }

    createRealNotificationSystem() {
        // Use real NotificationSystem constructor if available
        if (typeof NotificationSystem !== 'undefined') {
            console.log('📦 Using real NotificationSystem constructor');
            return new NotificationSystem();
        } else {
            console.log('⚠️ NotificationSystem constructor not available, using enhanced fallback');
            return {
                success: (message, title) => {
                    console.log(`✅ ${title}: ${message}`);
                    // Also show a visual notification if possible
                    this.showVisualNotification('success', title, message);
                },
                error: (message, title) => {
                    console.error(`❌ ${title}: ${message}`);
                    this.showVisualNotification('error', title, message);
                },
                warning: (message, title) => {
                    console.warn(`⚠️ ${title}: ${message}`);
                    this.showVisualNotification('warning', title, message);
                },
                info: (message, title) => {
                    console.info(`ℹ️ ${title}: ${message}`);
                    this.showVisualNotification('info', title, message);
                },
                // Visual notification fallback
                showVisualNotification: (type, title, message) => {
                    // Create a simple visual notification
                    const notification = document.createElement('div');
                    notification.className = `notification-${type}`;
                    notification.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        padding: 12px 20px;
                        border-radius: 8px;
                        color: white;
                        font-weight: 600;
                        z-index: 10000;
                        animation: slideIn 0.3s ease;
                        ${type === 'success' ? 'background: #10b981;' : ''}
                        ${type === 'error' ? 'background: #ef4444;' : ''}
                        ${type === 'warning' ? 'background: #f59e0b;' : ''}
                        ${type === 'info' ? 'background: #3b82f6;' : ''}
                    `;
                    notification.textContent = `${title}: ${message}`;
                    
                    document.body.appendChild(notification);
                    
                    // Remove after 5 seconds
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 5000);
                }
            };
        }
    }

    createRealLoadingOverlay() {
        // Use real LoadingOverlay constructor if available
        if (typeof LoadingOverlay !== 'undefined') {
            console.log('📦 Using real LoadingOverlay constructor');
            return new LoadingOverlay();
        } else {
            console.log('⚠️ LoadingOverlay constructor not available, using enhanced fallback');
            return {
                show: (message = 'Chargement...') => {
                    console.log(`⏳ Loading: ${message}`);
                    this.showVisualLoading(message);
                },
                hide: () => {
                    console.log('✅ Loading complete');
                    this.hideVisualLoading();
                },
                // Visual loading fallback
                showVisualLoading: (message) => {
                    // Remove existing loader if any
                    this.hideVisualLoading();
                    
                    const loader = document.createElement('div');
                    loader.id = 'performance-optimizer-loader';
                    loader.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.5);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 10000;
                        backdrop-filter: blur(5px);
                    `;
                    
                    const content = document.createElement('div');
                    content.style.cssText = `
                        background: white;
                        padding: 30px;
                        border-radius: 12px;
                        text-align: center;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    `;
                    
                    content.innerHTML = `
                        <div style="width: 40px; height: 40px; margin: 0 auto 15px; border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        <p style="margin: 0; font-weight: 600; color: #374151;">${message}</p>
                    `;
                    
                    loader.appendChild(content);
                    document.body.appendChild(loader);
                    
                    // Add CSS animation
                    const style = document.createElement('style');
                    style.textContent = `
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        @keyframes slideIn {
                            from { transform: translateX(100%); opacity: 0; }
                            to { transform: translateX(0); opacity: 1; }
                        }
                    `;
                    document.head.appendChild(style);
                },
                hideVisualLoading: () => {
                    const loader = document.getElementById('performance-optimizer-loader');
                    if (loader) {
                        loader.remove();
                    }
                }
            };
        }
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