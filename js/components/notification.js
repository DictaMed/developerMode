/**
 * DictaMed - Système de notifications
 * Version: 2.0.0 - Refactorisé pour une meilleure organisation
 */

// ===== NOTIFICATION SYSTEM =====
class NotificationSystem {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.init();
    }

    init() {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 5000) {
        try {
            // Fallback if Utils not available
            const id = window.Utils?.generateId?.() || Date.now().toString();
            const notification = this.createNotification(id, message, type);
            this.notifications.set(id, notification);
            
            if (this.container) {
                this.container.appendChild(notification);
                
                // Trigger animation
                setTimeout(() => {
                    notification.classList.add('show');
                }, 10);
                
                // Auto remove
                if (duration > 0) {
                    setTimeout(() => {
                        this.remove(id);
                    }, duration);
                }
            } else {
                // Fallback to console if container not available
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
            
            return id;
        } catch (error) {
            console.error('Erreur lors de l\'affichage de la notification:', error);
            // Fallback to alert for critical errors
            if (type === 'error') {
                alert(`Erreur: ${message}`);
            }
            return null;
        }
    }

    createNotification(id, message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: ${this.getBackgroundColor(type)};
            color: ${this.getTextColor(type)};
            padding: 16px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            transition: all 0.3s ease;
            pointer-events: auto;
            position: relative;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 1.2em;">${this.getIcon(type)}</span>
                <span style="flex: 1;">${message}</span>
                <button onclick="notificationSystem.remove('${id}')" 
                        style="background: none; border: none; font-size: 1.2em; cursor: pointer; opacity: 0.7;">
                    ×
                </button>
            </div>
        `;
        
        return notification;
    }

    remove(id) {
        const notification = this.notifications.get(id);
        if (notification) {
            notification.classList.remove('show');
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.notifications.delete(id);
            }, 300);
        }
    }

    getBackgroundColor(type) {
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        return colors[type] || colors.info;
    }

    getTextColor(type) {
        return 'white';
    }

    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationSystem;
} else {
    window.NotificationSystem = NotificationSystem;
}