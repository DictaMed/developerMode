/**
 * DictaMed - Advanced Error Handling System
 * Version: 2.1 - Enhanced error handling and logging
 */

class ErrorHandler {
    constructor() {
        this.errors = [];
        this.maxErrors = 100;
        this.isDevelopment = this.isDevEnvironment();
        this.setupGlobalErrorHandling();
    }

    isDevEnvironment() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.search.includes('debug=true');
    }

    setupGlobalErrorHandling() {
        // Capture unhandled JavaScript errors
        window.addEventListener('error', (event) => {
            this.logError('JavaScript Error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                stack: event.error?.stack
            }, 'error');
        });

        // Capture unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection', {
                reason: event.reason,
                promise: event.promise,
                stack: event.reason?.stack
            }, 'error');
        });
    }

    logError(context, details, level = 'error', userMessage = null) {
        const errorEntry = {
            id: this.generateErrorId(),
            timestamp: new Date().toISOString(),
            context,
            details,
            level,
            userMessage,
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: this.getCurrentUserId()
        };

        // Add to internal storage
        this.errors.push(errorEntry);
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }

        // Console logging based on environment and level
        this.consoleLog(errorEntry);

        // Send to external service in production
        if (!this.isDevelopment) {
            this.sendToErrorService(errorEntry);
        }

        // Show user notification for critical errors
        if (level === 'error' && userMessage) {
            this.showUserNotification(userMessage, 'error');
        }

        return errorEntry.id;
    }

    consoleLog(errorEntry) {
        const { level, context, details, timestamp } = errorEntry;
        const formattedTime = new Date(timestamp).toLocaleTimeString();

        switch (level) {
            case 'error':
                console.error(`[${formattedTime}] ❌ ${context}:`, details);
                break;
            case 'warning':
                console.warn(`[${formattedTime}] ⚠️ ${context}:`, details);
                break;
            case 'info':
                console.info(`[${formattedTime}] ℹ️ ${context}:`, details);
                break;
            case 'debug':
                if (this.isDevelopment) {
                    console.debug(`[${formattedTime}] 🔧 ${context}:`, details);
                }
                break;
        }
    }

    async sendToErrorService(errorEntry) {
        try {
            // In a real application, you would send to your error tracking service
            // For now, we'll use a simple webhook or just log to console
            console.log('📤 Sending error to monitoring service:', errorEntry);
            
            // Example: Send to external service
            /*
            await fetch('/api/errors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(errorEntry)
            });
            */
        } catch (serviceError) {
            console.error('Failed to send error to service:', serviceError);
        }
    }

    showUserNotification(message, type = 'error') {
        // Use the notification system if available
        if (window.notificationSystem && typeof window.notificationSystem.show === 'function') {
            window.notificationSystem.show(message, type);
        } else {
            // Fallback to alert for critical errors
            if (type === 'error') {
                alert(`Erreur: ${message}`);
            }
        }
    }

    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getCurrentUserId() {
        // Get user ID from localStorage or session
        try {
            return localStorage.getItem('dictamed_user_id') || 'anonymous';
        } catch {
            return 'unknown';
        }
    }

    // Public methods for different error types
    critical(message, context, details = {}) {
        return this.logError(context, details, 'error', message);
    }

    error(message, context, details = {}) {
        return this.logError(context, details, 'error', message);
    }

    warning(message, context, details = {}) {
        return this.logError(context, details, 'warning');
    }

    info(message, context, details = {}) {
        return this.logError(context, details, 'info');
    }

    debug(message, context, details = {}) {
        return this.logError(context, details, 'debug');
    }

    // Async error wrapper
    async handleAsync(operation, context, fallbackMessage = 'Une erreur est survenue') {
        try {
            return await operation();
        } catch (error) {
            this.error(fallbackMessage, context, {
                error: error.message,
                stack: error.stack,
                operation: operation.toString()
            });
            throw error;
        }
    }

    // Sync error wrapper
    handleSync(operation, context, fallbackMessage = 'Une erreur est survenue') {
        try {
            return operation();
        } catch (error) {
            this.error(fallbackMessage, context, {
                error: error.message,
                stack: error.stack,
                operation: operation.toString()
            });
            throw error;
        }
    }

    // Get recent errors for debugging
    getRecentErrors(limit = 10) {
        return this.errors.slice(-limit);
    }

    // Clear error history
    clearErrors() {
        this.errors = [];
    }

    // Export errors for debugging
    exportErrors() {
        return {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            errors: this.errors
        };
    }
}

// Enhanced Logging System
class Logger {
    constructor(errorHandler) {
        this.errorHandler = errorHandler;
        this.isDevelopment = errorHandler.isDevelopment;
    }

    // Create contextual loggers
    createLogger(componentName) {
        return {
            critical: (message, details = {}) => {
                this.errorHandler.critical(message, componentName, details);
            },
            error: (message, details = {}) => {
                this.errorHandler.error(message, componentName, details);
            },
            warning: (message, details = {}) => {
                this.errorHandler.warning(message, componentName, details);
            },
            info: (message, details = {}) => {
                this.errorHandler.info(message, componentName, details);
            },
            debug: (message, details = {}) => {
                this.errorHandler.debug(message, componentName, details);
            },
            // Performance logging
            time: (label) => {
                if (this.isDevelopment) {
                    console.time(`⏱️ ${componentName}: ${label}`);
                }
                return () => {
                    if (this.isDevelopment) {
                        console.timeEnd(`⏱️ ${componentName}: ${label}`);
                    }
                };
            },
            // Memory usage logging
            memory: (label = 'Memory Check') => {
                if (this.isDevelopment && performance.memory) {
                    const mem = performance.memory;
                    this.debug(`${label}: ${Math.round(mem.usedJSHeapSize / 1048576)}MB used`, {
                        used: mem.usedJSHeapSize,
                        total: mem.totalJSHeapSize,
                        limit: mem.jsHeapSizeLimit
                    });
                }
            }
        };
    }
}

// Performance monitoring
class PerformanceMonitor {
    constructor(logger) {
        this.logger = logger;
        this.metrics = new Map();
    }

    startMeasure(name) {
        this.metrics.set(name, {
            start: performance.now(),
            marks: []
        });
    }

    endMeasure(name) {
        const metric = this.metrics.get(name);
        if (metric) {
            const duration = performance.now() - metric.start;
            this.metrics.delete(name);
            
            this.logger.createLogger('Performance').info(`Measurement completed: ${name}`, {
                duration: `${duration.toFixed(2)}ms`,
                name
            });

            return duration;
        }
        return 0;
    }

    mark(name, details = {}) {
        const metric = this.metrics.get(name);
        if (metric) {
            metric.marks.push({
                time: performance.now(),
                details
            });
        }
    }

    getMetrics() {
        const result = {};
        this.metrics.forEach((metric, name) => {
            result[name] = {
                start: metric.start,
                marks: metric.marks,
                current: performance.now() - metric.start
            };
        });
        return result;
    }
}

// Initialize global instances
window.ErrorHandler = ErrorHandler;
window.Logger = Logger;
window.PerformanceMonitor = PerformanceMonitor;

// Create global instances
window.errorHandler = new ErrorHandler();
window.logger = new Logger(window.errorHandler);
window.performanceMonitor = new PerformanceMonitor(window.logger);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ErrorHandler, Logger, PerformanceMonitor };
}