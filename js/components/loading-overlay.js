/**
 * DictaMed - Overlay de chargement
 * Version: 2.0.0 - Refactorisé pour une meilleure organisation
 */

// ===== LOADING OVERLAY =====
class LoadingOverlay {
    constructor() {
        this.overlay = null;
        this.isVisible = false;
    }

    show(text = 'Chargement...') {
        if (this.isVisible) return;
        
        this.overlay = document.createElement('div');
        this.overlay.className = 'loading-overlay';
        this.overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <div class="loading-text">${text}</div>
            </div>
        `;
        
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        `;
        
        document.body.appendChild(this.overlay);
        this.isVisible = true;
    }

    hide() {
        if (this.overlay && this.isVisible) {
            this.overlay.style.animation = 'fadeOut 0.2s ease forwards';
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                    this.overlay = null;
                    this.isVisible = false;
                }
            }, 200);
        }
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingOverlay;
} else {
    window.LoadingOverlay = LoadingOverlay;
}