/**
 * DictaMed - Utilitaires et fonctions helper
 * Version: 2.0.0 - Refactorisé pour une meilleure organisation
 */

// ===== UTILITY FUNCTIONS =====
const Utils = {
    // Format duration in MM:SS format
    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    },

    // Convert file to Base64
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Validate email format - with proper null check
    isValidEmail(email) {
        if (!email || typeof email !== 'string') {
            return false;
        }
        // RFC 5322 simplified regex (basic validation)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    },

    // Debounce function with validation
    debounce(func, wait) {
        if (typeof func !== 'function') {
            console.warn('Utils.debounce: func must be a function');
            return function() {}; // Return no-op function
        }
        if (wait < 0) {
            console.warn('Utils.debounce: wait must be >= 0');
            wait = 0;
        }
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                try {
                    func(...args);
                } catch (error) {
                    console.error('Utils.debounce: Error executing debounced function:', error);
                }
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function with validation
    throttle(func, limit) {
        if (typeof func !== 'function') {
            console.warn('Utils.throttle: func must be a function');
            return function() {}; // Return no-op function
        }
        if (limit < 0) {
            console.warn('Utils.throttle: limit must be >= 0');
            limit = 0;
        }
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                try {
                    func.apply(context, args);
                } catch (error) {
                    console.error('Utils.throttle: Error executing throttled function:', error);
                }
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} else {
    window.Utils = Utils;
}