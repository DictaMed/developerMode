/**
 * Unified Debug System for DictaMed
 * Consolidates all debugging functionality into a single, maintainable system
 */

import { appConfig } from './config-manager.js';

/**
 * Debug System Configuration
 */
const DEBUG_CONFIG = {
    enabled: appConfig.get('ui.debugMode', false),
    consoleLogging: true,
    performanceMonitoring: true,
    errorTracking: true,
    networkMonitoring: true,
    uiDebugging: true
};

/**
 * Unified Debug Logger
 */
class UnifiedDebugLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
        this.startTime = Date.now();
        this.initializeDebugSystem();
    }
    
    /**
     * Initialize debug system
     */
    initializeDebugSystem() {
        if (!DEBUG_CONFIG.enabled) return;
        
        console.log('🔧 Unified Debug System initialized');
        this.setupGlobalErrorHandling();
        this.setupPerformanceMonitoring();
        this.setupNetworkMonitoring();
        this.setupUIMonitoring();
    }
    
    /**
     * Log with timestamp and categorization
     */
    log(category, level, message, data = null) {
        if (!DEBUG_CONFIG.enabled && level !== 'error') return;
        
        const timestamp = Date.now();
        const elapsed = timestamp - this.startTime;
        const logEntry = {
            timestamp,
            elapsed: `${elapsed}ms`,
            category,
            level,
            message,
            data: data ? JSON.stringify(data) : null
        };
        
        // Store log
        this.logs.push(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // Console output
        if (DEBUG_CONFIG.consoleLogging) {
            const prefix = `[${elapsed}ms][${category.toUpperCase()}]`;
            const coloredLevel = this.getColoredLevel(level);
            
            switch (level) {
                case 'error':
                    console.error(coloredLevel, prefix, message, data || '');
                    break;
                case 'warn':
                    console.warn(coloredLevel, prefix, message, data || '');
                    break;
                case 'info':
                    console.info(coloredLevel, prefix, message, data || '');
                    break;
                case 'debug':
                    console.debug(coloredLevel, prefix, message, data || '');
                    break;
                default:
                    console.log(coloredLevel, prefix, message, data || '');
            }
        }
        
        return logEntry;
    }
    
    /**
     * Get colored level for console output
     */
    getColoredLevel(level) {
        const colors = {
            error: '%c❌',
            warn: '%c⚠️',
            info: '%cℹ️',
            debug: '%c🔍',
            success: '%c✅'
        };
        
        const levelColors = {
            error: 'color: #ef4444; font-weight: bold;',
            warn: 'color: #f59e0b; font-weight: bold;',
            info: 'color: #3b82f6; font-weight: bold;',
            debug: 'color: #6b7280; font-weight: bold;',
            success: 'color: #10b981; font-weight: bold;'
        };
        
        return colors[level] || '%c📝';
    }
    
    /**
     * Setup global error handling
     */
    setupGlobalErrorHandling() {
        if (!DEBUG_CONFIG.errorTracking) return;
        
        // JavaScript errors
        window.addEventListener('error', (event) => {
            this.log('javascript', 'error', 'JavaScript Error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error?.stack
            });
        });
        
        // Promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.log('javascript', 'error', 'Unhandled Promise Rejection', {
                reason: event.reason,
                promise: event.promise
            });
        });
    }
    
    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        if (!DEBUG_CONFIG.performanceMonitoring) return;
        
        // Monitor Long Tasks
        if ('PerformanceObserver' in window) {
            const longTaskObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.log('performance', 'warn', 'Long Task Detected', {
                        duration: `${entry.duration}ms`,
                        startTime: `${entry.startTime}ms`,
                        entryType: entry.entryType
                    });
                }
            });
            
            try {
                longTaskObserver.observe({ entryTypes: ['longtask'] });
            } catch (error) {
                this.log('performance', 'warn', 'Long Task Observer not supported');
            }
        }
        
        // Monitor memory usage (if available)
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                this.log('performance', 'debug', 'Memory Usage', {
                    used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
                    total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
                    limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`
                });
            }, 30000); // Every 30 seconds
        }
    }
    
    /**
     * Setup network monitoring
     */
    setupNetworkMonitoring() {
        if (!DEBUG_CONFIG.networkMonitoring) return;
        
        // Monitor fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = Date.now();
            const url = typeof args[0] === 'string' ? args[0] : args[0].url;
            
            this.log('network', 'info', 'Fetch Request Started', {
                url,
                method: args[1]?.method || 'GET'
            });
            
            try {
                const response = await originalFetch(...args);
                const duration = Date.now() - startTime;
                
                this.log('network', 'info', 'Fetch Request Completed', {
                    url,
                    status: response.status,
                    statusText: response.statusText,
                    duration: `${duration}ms`
                });
                
                return response;
            } catch (error) {
                const duration = Date.now() - startTime;
                this.log('network', 'error', 'Fetch Request Failed', {
                    url,
                    error: error.message,
                    duration: `${duration}ms`
                });
                throw error;
            }
        };
    }
    
    /**
     * Setup UI monitoring
     */
    setupUIMonitoring() {
        if (!DEBUG_CONFIG.uiDebugging) return;
        
        // Monitor button clicks
        document.addEventListener('click', (event) => {
            const target = event.target;
            if (target.tagName === 'BUTTON' || target.classList.contains('btn')) {
                this.log('ui', 'debug', 'Button Clicked', {
                    buttonText: target.textContent.trim(),
                    buttonId: target.id,
                    buttonClass: target.className
                });
            }
        }, true);
        
        // Monitor form submissions
        document.addEventListener('submit', (event) => {
            this.log('ui', 'info', 'Form Submitted', {
                formId: event.target.id,
                formAction: event.target.action,
                method: event.target.method
            });
        });
        
        // Monitor tab switches
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('tab-btn')) {
                const targetTab = event.target.getAttribute('data-tab');
                this.log('ui', 'debug', 'Tab Switched', {
                    targetTab,
                    targetText: event.target.textContent.trim()
                });
            }
        });
    }
    
    /**
     * Generate debug report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            environment: appConfig.isEnvironment('development') ? 'development' : 'production',
            sessionDuration: `${Date.now() - this.startTime}ms`,
            summary: {
                totalLogs: this.logs.length,
                errorCount: this.logs.filter(log => log.level === 'error').length,
                warningCount: this.logs.filter(log => log.level === 'warn').length,
                networkRequests: this.logs.filter(log => log.category === 'network').length
            },
            logs: this.logs,
            performance: this.getPerformanceMetrics(),
            recommendations: this.getRecommendations()
        };
        
        return report;
    }
    
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        return {
            domContentLoaded: navigation?.domContentLoadedEventEnd || 0,
            loadComplete: navigation?.loadEventEnd || 0,
            firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
            firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
        };
    }
    
    /**
     * Get recommendations based on logs
     */
    getRecommendations() {
        const recommendations = [];
        const errors = this.logs.filter(log => log.level === 'error');
        const networkErrors = errors.filter(log => log.category === 'network');
        const performanceWarnings = this.logs.filter(log => log.category === 'performance' && log.level === 'warn');
        
        if (networkErrors.length > 0) {
            recommendations.push('Multiple network errors detected. Check API endpoints and connectivity.');
        }
        
        if (performanceWarnings.length > 0) {
            recommendations.push('Performance issues detected. Consider optimizing heavy operations.');
        }
        
        const longTasks = performance.getEntriesByType('longtask');
        if (longTasks.length > 5) {
            recommendations.push('Many long tasks detected. Consider breaking up heavy operations.');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('No critical issues detected. System appears to be running smoothly.');
        }
        
        return recommendations;
    }
    
    /**
     * Clear all logs
     */
    clear() {
        this.logs = [];
        console.clear();
        console.log('🧹 Debug logs cleared');
    }
    
    /**
     * Export logs as JSON
     */
    exportLogs() {
        const dataStr = JSON.stringify(this.generateReport(), null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `dictamed-debug-${Date.now()}.json`;
        link.click();
    }
}

/**
 * Button Debug System
 */
class ButtonDebugSystem {
    constructor(debugLogger) {
        this.logger = debugLogger;
        this.init();
    }
    
    init() {
        if (!DEBUG_CONFIG.enabled) return;
        
        this.logger.log('debug', 'info', 'Button Debug System initialized');
        this.fixCriticalIssues();
        this.startMonitoring();
    }
    
    /**
     * Fix critical UI issues
     */
    fixCriticalIssues() {
        this.fixLoadingOverlays();
        this.fixAuthModals();
        this.fixDisabledButtons();
        this.fixZIndexIssues();
    }
    
    /**
     * Fix loading overlay blocking issues
     */
    fixLoadingOverlays() {
        const overlays = document.querySelectorAll('.loading-overlay');
        overlays.forEach(overlay => {
            // Ensure overlays don't block clicks when not visible
            if (window.getComputedStyle(overlay).display === 'none') {
                overlay.style.pointerEvents = 'none';
            }
            overlay.style.zIndex = '9998';
            this.logger.log('debug', 'info', 'Loading overlay fixed');
        });
    }
    
    /**
     * Fix authentication modal issues
     */
    fixAuthModals() {
        const modals = ['loginModal', 'registerModal', 'passwordResetModal', 'migrationModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                // Ensure modals have proper event listeners
                modal.addEventListener('click', (e) => {
                    if (e.target === modal || e.target.classList.contains('auth-close-btn')) {
                        modal.style.display = 'none';
                        this.logger.log('debug', 'info', `Modal closed: ${modalId}`);
                    }
                });
            }
        });
    }
    
    /**
     * Fix disabled button states
     */
    fixDisabledButtons() {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            if (button.disabled) {
                button.style.cursor = 'not-allowed';
                this.logger.log('debug', 'debug', `Found disabled button: ${button.id || button.className}`);
            } else {
                button.style.cursor = 'pointer';
            }
        });
    }
    
    /**
     * Fix z-index conflicts
     */
    fixZIndexIssues() {
        const criticalElements = document.querySelectorAll('.btn, button, .tab-btn, .auth-modal');
        criticalElements.forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.position === 'fixed' || style.position === 'absolute') {
                if (parseInt(style.zIndex) > 10000) {
                    el.style.zIndex = '9999';
                    this.logger.log('debug', 'info', `Fixed z-index for: ${el.className}`);
                }
            }
        });
    }
    
    /**
     * Start continuous monitoring
     */
    startMonitoring() {
        setInterval(() => {
            this.checkBlockingElements();
            this.testButtonFunctionality();
        }, 5000);
        
        this.logger.log('debug', 'info', 'Button monitoring started');
    }
    
    /**
     * Check for blocking elements
     */
    checkBlockingElements() {
        const overlays = document.querySelectorAll('.loading-overlay');
        const visibleOverlays = Array.from(overlays).filter(overlay => 
            window.getComputedStyle(overlay).display !== 'none'
        );
        
        if (visibleOverlays.length > 0) {
            this.logger.log('debug', 'warn', `Blocking overlays detected: ${visibleOverlays.length}`);
        }
        
        const modals = document.querySelectorAll('.auth-modal');
        const visibleModals = Array.from(modals).filter(modal => 
            window.getComputedStyle(modal).display !== 'none'
        );
        
        if (visibleModals.length > 1) {
            this.logger.log('debug', 'warn', `Multiple visible modals detected: ${visibleModals.length}`);
        }
    }
    
    /**
     * Test button functionality
     */
    testButtonFunctionality() {
        const buttons = ['loginBtn', 'registerBtn', 'showMigrationBtn'];
        let workingButtons = 0;
        
        buttons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                const style = window.getComputedStyle(button);
                if (style.pointerEvents !== 'none' && style.visibility !== 'hidden') {
                    workingButtons++;
                }
            }
        });
        
        if (workingButtons !== buttons.length) {
            this.logger.log('debug', 'warn', `Button functionality issues: ${workingButtons}/${buttons.length} working`);
        }
    }
    
    /**
     * Generate button diagnostic report
     */
    generateButtonReport() {
        const buttons = ['loginBtn', 'registerBtn', 'showMigrationBtn'];
        const report = {
            timestamp: new Date().toISOString(),
            buttons: {},
            overlays: document.querySelectorAll('.loading-overlay').length,
            modals: document.querySelectorAll('.auth-modal').length
        };
        
        buttons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                const rect = button.getBoundingClientRect();
                const style = window.getComputedStyle(button);
                
                report.buttons[buttonId] = {
                    exists: true,
                    visible: style.visibility !== 'hidden',
                    clickable: style.pointerEvents !== 'none',
                    disabled: button.disabled,
                    position: { x: rect.left, y: rect.top },
                    size: { width: rect.width, height: rect.height },
                    styles: {
                        display: style.display,
                        opacity: style.opacity,
                        zIndex: style.zIndex
                    }
                };
            } else {
                report.buttons[buttonId] = { exists: false };
            }
        });
        
        return report;
    }
}

/**
 * Initialize the unified debug system
 */
class UnifiedDebugSystem {
    constructor() {
        this.logger = new UnifiedDebugLogger();
        this.buttonSystem = new ButtonDebugSystem(this.logger);
        this.initialize();
    }
    
    initialize() {
        if (!DEBUG_CONFIG.enabled) {
            console.log('🔧 Debug system disabled');
            return;
        }
        
        // Create global debug object
        window.dictamedDebug = {
            logger: this.logger,
            buttonSystem: this.buttonSystem,
            generateReport: () => this.generateFullReport(),
            clearLogs: () => this.logger.clear(),
            exportLogs: () => this.logger.exportLogs(),
            testButton: (buttonId) => this.testButton(buttonId),
            fixLoadingOverlays: () => this.buttonSystem.fixLoadingOverlays(),
            fixAuthModals: () => this.buttonSystem.fixAuthModals(),
            getButtonReport: () => this.buttonSystem.generateButtonReport()
        };
        
        this.logger.log('debug', 'success', 'Unified Debug System ready');
        
        // Make available for emergency fixes
        window.emergencyFix = {
            removeOverlays: () => {
                document.querySelectorAll('.loading-overlay').forEach(overlay => overlay.remove());
                this.logger.log('debug', 'info', 'All loading overlays removed');
            },
            closeModals: () => {
                document.querySelectorAll('.auth-modal').forEach(modal => {
                    modal.style.display = 'none';
                });
                this.logger.log('debug', 'info', 'All modals closed');
            },
            enableAllButtons: () => {
                document.querySelectorAll('button').forEach(button => {
                    button.disabled = false;
                    button.style.pointerEvents = 'auto';
                });
                this.logger.log('debug', 'info', 'All buttons enabled');
            }
        };
        
        console.log('🛠️ Debug commands available:');
        console.log('- dictamedDebug.generateReport()  // Full debug report');
        console.log('- dictamedDebug.clearLogs()       // Clear all logs');
        console.log('- dictamedDebug.exportLogs()      // Export logs as JSON');
        console.log('- emergencyFix.removeOverlays()   // Remove blocking overlays');
        console.log('- emergencyFix.closeModals()      // Close all modals');
        console.log('- emergencyFix.enableAllButtons() // Enable all buttons');
    }
    
    /**
     * Generate comprehensive debug report
     */
    generateFullReport() {
        return {
            ...this.logger.generateReport(),
            buttonSystem: this.buttonSystem.generateButtonReport(),
            environment: appConfig.export(),
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Test specific button functionality
     */
    testButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (!button) {
            this.logger.log('debug', 'error', `Button not found: ${buttonId}`);
            return false;
        }
        
        // Simulate click
        const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        
        button.dispatchEvent(clickEvent);
        this.logger.log('debug', 'info', `Button test performed: ${buttonId}`);
        
        return true;
    }
}

// Initialize the debug system
export const unifiedDebugSystem = new UnifiedDebugSystem();

// Auto-initialize when imported
if (typeof window !== 'undefined') {
    // Ensure DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            unifiedDebugSystem.logger.log('debug', 'info', 'DOM loaded, debug system active');
        });
    } else {
        unifiedDebugSystem.logger.log('debug', 'info', 'Debug system loaded');
    }
}