/**
 * Enhanced UI System for DictaMed
 * Modern UI components and interactions
 */

class EnhancedUI {
    constructor() {
        this.toasts = [];
        this.toastContainer = null;
        this.init();
    }

    init() {
        this.createToastContainer();
        this.initProgressBars();
        this.initTooltips();
        this.initFloatingElements();
        this.initScrollEffects();
    }

    // Toast Notification System
    createToastContainer() {
        this.toastContainer = document.createElement('div');
        this.toastContainer.className = 'toast-container';
        document.body.appendChild(this.toastContainer);
    }

    showToast(message, type = 'info', title = null, duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getToastIcon(type);
        const toastTitle = title || this.getToastTitle(type);
        
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                ${toastTitle ? `<div class="toast-title">${toastTitle}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;

        // Add close button functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.removeToast(toast));

        this.toastContainer.appendChild(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentNode) {
                this.removeToast(toast);
            }
        }, duration);

        return toast;
    }

    removeToast(toast) {
        toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    getToastTitle(type) {
        const titles = {
            success: 'Succès',
            error: 'Erreur',
            warning: 'Attention',
            info: 'Information'
        };
        return titles[type];
    }

    // Progress Bar System
    updateProgressBar(sectionId, progress) {
        const progressBar = document.querySelector(`[data-section="${sectionId}"] .progress-bar-fill`);
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    initProgressBars() {
        // Initialize all progress bars
        const progressBars = document.querySelectorAll('.progress-bar-fill');
        progressBars.forEach(bar => {
            bar.style.width = '0%';
        });
    }

    // Tooltip System
    initTooltips() {
        const elementsWithTooltip = document.querySelectorAll('[data-tooltip]');
        elementsWithTooltip.forEach(element => {
            element.classList.add('tooltip');
        });
    }

    // Floating Elements
    initFloatingElements() {
        // Add floating animation to buttons
        const floatingBtns = document.querySelectorAll('.btn-float');
        floatingBtns.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.1) translateY(-4px)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1) translateY(0)';
            });
        });
    }

    // Scroll Effects
    initScrollEffects() {
        let ticking = false;

        const updateScrollEffects = () => {
            const scrolled = window.pageYOffset;
            const header = document.querySelector('header');
            const glassElements = document.querySelectorAll('.glass-bg-element');

            // Header scroll effect
            if (header) {
                if (scrolled > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            }

            // Parallax effect for glass elements
            glassElements.forEach((element, index) => {
                const speed = 0.5 + (index * 0.1);
                element.style.transform = `translateY(${scrolled * speed}px)`;
            });

            ticking = false;
        };

        const requestScrollUpdate = () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollEffects);
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestScrollUpdate);
    }

    // Enhanced Recording Feedback
    showRecordingFeedback(sectionId, status) {
        const section = document.querySelector(`[data-section="${sectionId}"]`);
        if (!section) return;

        const feedback = document.createElement('div');
        feedback.className = 'recording-feedback';
        feedback.innerHTML = `
            <div class="pulse-dot"></div>
            <span>${this.getStatusMessage(status)}</span>
        `;

        section.appendChild(feedback);

        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 3000);
    }

    getStatusMessage(status) {
        const messages = {
            recording: 'Enregistrement en cours...',
            paused: 'Enregistrement en pause',
            stopped: 'Enregistrement terminé',
            ready: 'Prêt à enregistrer'
        };
        return messages[status] || 'Statut inconnu';
    }

    // Success Animation
    showSuccessAnimation(targetElement) {
        const originalTransform = targetElement.style.transform;
        targetElement.style.animation = 'successBounce 0.6s ease-out';
        
        setTimeout(() => {
            targetElement.style.animation = '';
            targetElement.style.transform = originalTransform;
        }, 600);
    }

    // Loading State Management
    setLoadingState(element, loading = true) {
        if (loading) {
            element.disabled = true;
            element.dataset.originalText = element.innerHTML;
            element.innerHTML = `
                <span class="spinner" style="width: 20px; height: 20px; margin-right: 8px;"></span>
                Chargement...
            `;
        } else {
            element.disabled = false;
            if (element.dataset.originalText) {
                element.innerHTML = element.dataset.originalText;
            }
        }
    }
}

// Toast notification helper functions
const Toast = {
    enhancedUI: null,

    init() {
        this.enhancedUI = new EnhancedUI();
    },

    success(message, title = null, duration = 5000) {
        if (this.enhancedUI) {
            this.enhancedUI.showToast(message, 'success', title, duration);
        }
    },

    error(message, title = null, duration = 7000) {
        if (this.enhancedUI) {
            this.enhancedUI.showToast(message, 'error', title, duration);
        }
    },

    warning(message, title = null, duration = 6000) {
        if (this.enhancedUI) {
            this.enhancedUI.showToast(message, 'warning', title, duration);
        }
    },

    info(message, title = null, duration = 5000) {
        if (this.enhancedUI) {
            this.enhancedUI.showToast(message, 'info', title, duration);
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnhancedUI, Toast };
}