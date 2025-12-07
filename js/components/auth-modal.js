/**
 * DictaMed - Système modal d'authentification
 * Version: 2.0.0 - Refactorisé pour une meilleure organisation
 */

// ===== AUTHENTICATION MODAL SYSTEM =====
class AuthModalSystem {
    constructor() {
        this.isOpen = false;
    }

    init() {
        this.initEventListeners();
    }

    initEventListeners() {
        // Modal toggle
        const authButton = document.getElementById('authButton');
        if (authButton) {
            authButton.addEventListener('click', () => this.toggle());
        }

        // Close on outside click
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) {
                    this.close();
                }
            });
        }

        // Close button
        const closeBtn = document.querySelector('.auth-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Password visibility toggle
        const passwordToggle = document.querySelector('.password-toggle');
        if (passwordToggle) {
            passwordToggle.addEventListener('click', () => this.togglePasswordVisibility());
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.classList.remove('hidden');
            this.isOpen = true;
            
            // Focus on first input
            const firstInput = authModal.querySelector('input[type="email"]');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    close() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.classList.add('hidden');
            this.isOpen = false;
        }
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('modalPasswordInput');
        const eyeIcon = document.querySelector('.password-toggle .eye-icon');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeIcon.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            eyeIcon.textContent = '👁️';
        }
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthModalSystem;
} else {
    window.AuthModalSystem = AuthModalSystem;
}