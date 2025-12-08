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
        try {
            console.log('🔧 AuthModalSystem init() started');
            
            // Verify DOM elements exist before initializing
            const authButton = document.getElementById('authButton');
            const authModal = document.getElementById('authModal');
            
            if (!authButton) {
                console.warn('⚠️ AuthModalSystem: authButton element not found');
            }
            
            if (!authModal) {
                console.warn('⚠️ AuthModalSystem: authModal element not found');
            }
            
            this.initEventListeners();
            
            console.log('✅ AuthModalSystem init() completed successfully');
            
        } catch (error) {
            console.error('❌ AuthModalSystem init() failed:', error);
            // Don't throw, just log and continue
        }
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

        // Close button with data-action attribute
        const closeBtn = document.querySelector('[data-action="close-auth"]');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Password visibility toggle with data-action attribute
        const passwordToggle = document.querySelector('[data-action="toggle-password"]');
        if (passwordToggle) {
            passwordToggle.addEventListener('click', () => this.togglePasswordVisibility());
        }

        // Forgot password with data-action attribute
        const forgotPasswordLink = document.querySelector('[data-action="forgot-password"]');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showForgotPassword();
            });
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

    showForgotPassword() {
        const emailInput = document.getElementById('modalEmailInput');
        if (!emailInput) {
            console.warn('Modal email input not found');
            return;
        }
        
        const email = emailInput.value.trim();
        if (!email) {
            if (window.notificationSystem) {
                window.notificationSystem.warning('Veuillez d\'abord entrer votre adresse email pour réinitialiser votre mot de passe.', 'Email requis');
            } else {
                alert('Veuillez d\'abord entrer votre adresse email pour réinitialiser votre mot de passe.');
            }
            emailInput.focus();
            return;
        }
        
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().sendPasswordResetEmail(email)
                .then(() => {
                    if (window.notificationSystem) {
                        window.notificationSystem.success('Un email de réinitialisation a été envoyé à ' + email, 'Email envoyé');
                    } else {
                        alert('Un email de réinitialisation a été envoyé à ' + email);
                    }
                })
                .catch((error) => {
                    console.error('Erreur:', error);
                    if (error.code === 'auth/user-not-found') {
                        if (window.notificationSystem) {
                            window.notificationSystem.error('Aucun compte trouvé avec cet email', 'Erreur');
                        } else {
                            alert('Aucun compte trouvé avec cet email');
                        }
                    } else {
                        if (window.notificationSystem) {
                            window.notificationSystem.error('Impossible d\'envoyer l\'email de réinitialisation', 'Erreur');
                        } else {
                            alert('Impossible d\'envoyer l\'email de réinitialisation');
                        }
                    }
                });
        } else {
            if (window.notificationSystem) {
                window.notificationSystem.info('Un email de réinitialisation sera envoyé à: ' + email, 'Fonctionnalité de démonstration');
            } else {
                alert('Un email de réinitialisation sera envoyé à: ' + email);
            }
        }
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthModalSystem;
} else {
    window.AuthModalSystem = AuthModalSystem;
}