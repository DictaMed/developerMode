/**
 * DictaMed - Système modal d'authentification
 * Version: 3.0.0 - Migration Firebase SDK modulaire
 */

// ===== AUTHENTICATION MODAL SYSTEM =====
class AuthModalSystem {
    constructor() {
        this.isOpen = false;
        this.currentMode = 'signin'; // 'signin' or 'signup'
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

        // Tab switching between sign in and sign up
        const modalSignInTab = document.getElementById('modalSignInTab');
        const modalSignUpTab = document.getElementById('modalSignUpTab');
        
        if (modalSignInTab) {
            modalSignInTab.addEventListener('click', () => this.switchMode('signin'));
        }
        
        if (modalSignUpTab) {
            modalSignUpTab.addEventListener('click', () => this.switchMode('signup'));
        }

        // Email form submission
        const modalEmailAuthForm = document.getElementById('modalEmailAuthForm');
        if (modalEmailAuthForm) {
            modalEmailAuthForm.addEventListener('submit', (e) => this.handleEmailAuth(e));
        }

        // Google sign in button
        const modalGoogleSignInBtn = document.getElementById('modalGoogleSignInBtn');
        if (modalGoogleSignInBtn) {
            modalGoogleSignInBtn.addEventListener('click', () => this.handleGoogleSignIn());
        }

        // Sign out button
        const modalSignOutBtn = document.getElementById('modalSignOutBtn');
        if (modalSignOutBtn) {
            modalSignOutBtn.addEventListener('click', () => this.handleSignOut());
        }
    }

    switchMode(mode) {
        this.currentMode = mode;
        const modalSignInTab = document.getElementById('modalSignInTab');
        const modalSignUpTab = document.getElementById('modalSignUpTab');
        const authModalTitle = document.getElementById('authModalTitle');
        const emailSubmitBtn = document.getElementById('modalEmailSubmitBtn');
        
        if (mode === 'signup') {
            // Switch to sign up mode
            if (modalSignInTab) modalSignInTab.classList.remove('active');
            if (modalSignUpTab) modalSignUpTab.classList.add('active');
            if (authModalTitle) authModalTitle.textContent = 'Inscription';
            if (emailSubmitBtn) {
                const btnText = emailSubmitBtn.querySelector('.btn-text');
                if (btnText) btnText.textContent = 'S\'inscrire';
            }
        } else {
            // Switch to sign in mode
            if (modalSignInTab) modalSignInTab.classList.add('active');
            if (modalSignUpTab) modalSignUpTab.classList.remove('active');
            if (authModalTitle) authModalTitle.textContent = 'Connexion';
            if (emailSubmitBtn) {
                const btnText = emailSubmitBtn.querySelector('.btn-text');
                if (btnText) btnText.textContent = 'Se connecter';
            }
        }
        
        console.log(`🔄 Mode switched to: ${mode}`);
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
            
            // Ensure default mode is set to signin
            if (this.currentMode !== 'signin' && this.currentMode !== 'signup') {
                this.currentMode = 'signin';
            }
            this.switchMode(this.currentMode);
            
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
        
        // Utiliser FirebaseAuthManager pour l'email de réinitialisation
        FirebaseAuthManager.sendPasswordResetEmail(email)
            .then(result => {
                if (result.success) {
                    if (window.notificationSystem) {
                        window.notificationSystem.success('Un email de réinitialisation a été envoyé à ' + email, 'Email envoyé');
                    } else {
                        alert('Un email de réinitialisation a été envoyé à ' + email);
                    }
                } else {
                    this.showError(result.error);
                }
            })
            .catch(error => {
                console.error('Password reset error:', error);
                this.showError('Impossible d\'envoyer l\'email de réinitialisation');
            });
    }

    async handleEmailAuth(event) {
        event.preventDefault();
        
        const emailInput = document.getElementById('modalEmailInput');
        const passwordInput = document.getElementById('modalPasswordInput');
        const submitBtn = document.getElementById('modalEmailSubmitBtn');
        const errorDiv = document.getElementById('modalAuthError');
        
        if (!emailInput || !passwordInput || !submitBtn) {
            console.warn('Required auth form elements not found');
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            this.showError('Veuillez remplir tous les champs');
            return;
        }

        // Show loading state
        const btnText = submitBtn.querySelector('.btn-text');
        const btnIcon = submitBtn.querySelector('.btn-icon');
        const spinner = submitBtn.querySelector('.loading-spinner-small');
        
        if (btnText) btnText.textContent = this.currentMode === 'signup' ? 'Inscription...' : 'Connexion...';
        if (btnIcon) btnIcon.textContent = '';
        if (spinner) spinner.classList.remove('hidden');
        submitBtn.disabled = true;

        try {
            let result;
            if (this.currentMode === 'signup') {
                // Utiliser le nouveau FirebaseAuthManager.signUp
                result = await FirebaseAuthManager.signUp(email, password);
                if (result.success) {
                    if (result.emailSent) {
                        this.showSuccess('Inscription réussie! Vérifiez votre email pour confirmer votre compte.');
                    } else {
                        this.showSuccess('Inscription réussie!');
                    }
                }
            } else {
                // Utiliser FirebaseAuthManager.signIn
                result = await FirebaseAuthManager.signIn(email, password);
                if (result.success) {
                    this.showSuccess('Connexion réussie!');
                }
            }

            if (result.success) {
                setTimeout(() => {
                    this.close();
                    this.updateAuthButton();
                }, 1500);
            } else {
                this.showError(result.error || 'Une erreur est survenue');
            }
        } catch (error) {
            console.error('Auth error:', error);
            
            // Gérer les erreurs qui arrivent malgré les vérifications
            let errorMessage = 'Une erreur est survenue';
            
            if (error.code) {
                switch (error.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'Aucun compte trouvé avec cet email';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Mot de passe incorrect';
                        break;
                    case 'auth/email-already-in-use':
                        errorMessage = 'Cet email est déjà utilisé';
                        break;
                    case 'auth/weak-password':
                        errorMessage = 'Le mot de passe est trop faible';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Format d\'email invalide';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet';
                        break;
                    default:
                        errorMessage = error.message;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showError(errorMessage);
        } finally {
            // Reset button state
            if (btnText) btnText.textContent = this.currentMode === 'signup' ? 'S\'inscrire' : 'Se connecter';
            if (btnIcon) btnIcon.textContent = '→';
            if (spinner) spinner.classList.add('hidden');
            submitBtn.disabled = false;
        }
    }

    async handleGoogleSignIn() {
        try {
            // Utiliser FirebaseAuthManager pour Google Sign-In
            const result = await FirebaseAuthManager.signInWithGoogle();
            
            if (result.success) {
                this.showSuccess('Connexion réussie avec Google!');
                setTimeout(() => {
                    this.close();
                    this.updateAuthButton();
                }, 1500);
            } else {
                this.showError(result.error || 'Erreur lors de la connexion avec Google');
            }
        } catch (error) {
            console.error('Google sign in error:', error);
            
            let errorMessage = 'Erreur lors de la connexion avec Google';
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Connexion annulée par l\'utilisateur';
            } else if (error.code === 'auth/popup-blocked') {
                errorMessage = 'Popup bloquée par le navigateur';
            }
            
            this.showError(errorMessage);
        }
    }

    async handleSignOut() {
        try {
            const result = await FirebaseAuthManager.signOut();
            if (result.success) {
                this.showSuccess('Déconnexion réussie');
                setTimeout(() => {
                    this.close();
                    this.updateAuthButton();
                }, 1000);
            } else {
                this.showError(result.error || 'Erreur lors de la déconnexion');
            }
        } catch (error) {
            console.error('Sign out error:', error);
            this.showError('Erreur lors de la déconnexion');
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('modalAuthError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorDiv.classList.add('hidden');
            }, 5000);
        }
    }

    showSuccess(message) {
        if (window.notificationSystem) {
            window.notificationSystem.success(message, 'Authentification');
        } else {
            alert(message);
        }
    }

    updateAuthButton() {
        const authButton = document.getElementById('authButton');
        const authButtonText = document.getElementById('authButtonText');
        
        if (!authButton || !authButtonText) return;

        const user = FirebaseAuthManager.getCurrentUser();
        
        if (user) {
            authButtonText.textContent = user.displayName || user.email || 'Connecté';
            authButton.classList.add('authenticated');
        } else {
            authButtonText.textContent = 'Connexion';
            authButton.classList.remove('authenticated');
        }
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthModalSystem;
} else {
    window.AuthModalSystem = AuthModalSystem;
}