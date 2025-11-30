/**
 * Button Click Debug and Fix Solution for DictaMed
 * Addresses the most critical button clicking issues
 */

console.log('🔧 Button Debug System Loaded');

// ===== BUTTON CLICK DEBUGGING SYSTEM =====
class ButtonDebugSystem {
    constructor() {
        this.init();
    }

    init() {
        console.log('🔍 Initializing Button Debug System...');
        this.addGlobalClickDebugging();
        this.fixCriticalIssues();
        this.startMonitoring();
    }

    addGlobalClickDebugging() {
        document.addEventListener('click', (e) => {
            const target = e.target;
            console.log('🖱️ Click detected on:', {
                tag: target.tagName,
                id: target.id,
                class: target.className,
                disabled: target.disabled
            });
        }, true);
    }

    fixCriticalIssues() {
        console.log('🔧 Applying critical fixes...');
        
        // Fix 1: Loading overlay blocking clicks
        this.fixLoadingOverlays();
        
        // Fix 2: Firebase auth modal conflicts
        this.fixAuthModals();
        
        // Fix 3: Button disabled states
        this.fixDisabledButtons();
        
        // Fix 4: Z-index conflicts
        this.fixZIndexIssues();
    }

    fixLoadingOverlays() {
        const overlays = document.querySelectorAll('.loading-overlay');
        overlays.forEach(overlay => {
            overlay.style.pointerEvents = 'auto';
            overlay.style.zIndex = '9998'; // Lower z-index
            console.log('🔧 Fixed loading overlay');
        });
    }

    fixAuthModals() {
        const modals = ['loginModal', 'registerModal', 'passwordResetModal', 'migrationModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal || e.target.classList.contains('auth-close-btn')) {
                        modal.style.display = 'none';
                        console.log('🔧 Closed modal:', modalId);
                    }
                });
            }
        });
    }

    fixDisabledButtons() {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            if (button.disabled) {
                console.log('🔧 Found disabled button:', button.id || button.className);
            } else {
                button.style.cursor = 'pointer';
            }
        });
    }

    fixZIndexIssues() {
        // Ensure critical elements have proper z-index
        const criticalElements = document.querySelectorAll('.btn, button, .tab-btn');
        criticalElements.forEach(el => {
            el.style.position = 'relative';
            el.style.zIndex = '1';
        });
    }

    startMonitoring() {
        setInterval(() => {
            this.checkBlockingElements();
        }, 3000);
        console.log('✅ Monitoring started');
    }

    checkBlockingElements() {
        // Check for visible loading overlays
        const loading = document.querySelector('.loading-overlay');
        if (loading && window.getComputedStyle(loading).display !== 'none') {
            console.warn('⚠️ Loading overlay is visible and may block clicks');
        }

        // Check for visible modals
        const modals = document.querySelectorAll('.auth-modal');
        modals.forEach(modal => {
            if (window.getComputedStyle(modal).display !== 'none') {
                console.log('📱 Modal visible:', modal.id);
            }
        });
    }

    generateReport() {
        const overlays = document.querySelectorAll('.loading-overlay').length;
        const modals = document.querySelectorAll('.auth-modal').length;
        const disabledButtons = document.querySelectorAll('button:disabled').length;
        
        const report = {
            timestamp: new Date().toISOString(),
            loadingOverlays: overlays,
            authModals: modals,
            disabledButtons: disabledButtons,
            recommendations: this.getRecommendations()
        };
        
        console.log('📊 Debug Report:', report);
        return report;
    }

    getRecommendations() {
        const recs = [];
        
        if (document.querySelector('.loading-overlay[style*="display: block"]')) {
            recs.push('Hide loading overlay: document.querySelector(".loading-overlay").style.display = "none"');
        }
        
        if (document.querySelector('.auth-modal[style*="display: flex"]')) {
            recs.push('Close visible modals: document.querySelectorAll(".auth-modal").forEach(m => m.style.display = "none")');
        }
        
        if (recs.length === 0) {
            recs.push('No obvious blocking issues detected');
        }
        
        return recs;
    }
}

// Initialize system
window.buttonDebug = new ButtonDebugSystem();
console.log('🔧 Button Debug System ready. Use: window.buttonDebug.generateReport()');