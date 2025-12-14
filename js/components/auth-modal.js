/**
 * DictaMed - Système modal d'authentification
 * Version: 4.0.0 - SDK modulaire avec UX améliorée et validation temps réel
 */

// ===== AUTHENTICATION MODAL SYSTEM =====
class AuthModalSystem {
    constructor() {
        this.isOpen = false;
        this.currentMode = 'signin'; // 'signin' or 'signup'
        this.validationTimeouts = new Map(); // Pour la validation en temps réel
        this.passwordStrength = { score: 0, strength: 'Très faible', feedback: [] };
        this.isValidating = false; // Pour éviter les validations concurrentes
        this.isGoogleSignInInProgress = false; // Empêcher les clics multiples sur le bouton Google
    }

    /**
     * Initialisation du système avec validation temps réel
     */
    init() {
        try {
            console.log('🔧 AuthModalSystem v4.0.0 init() started');
            
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
            this.initRealTimeValidation();
            this.initPasswordStrengthIndicator();
            
            console.log('✅ AuthModalSystem v4.0.0 init() completed successfully');
            
        } catch (error) {
            console.error('❌ AuthModalSystem init() failed:', error);
            // Don't throw, just log and continue
        }
    }

    /**
     * Validation en temps réel des champs
     */
    initRealTimeValidation() {
        const emailInput = document.getElementById('modalEmailInput');
        const passwordInput = document.getElementById('modalPasswordInput');

        if (emailInput) {
            // Validation email en temps réel
            emailInput.addEventListener('input', (e) => {
                this.debounceValidation('email', () => this.validateEmail(e.target.value), 500);
                this.updateSubmitButtonState();
            });

            emailInput.addEventListener('blur', (e) => {
                this.validateEmail(e.target.value, true);
                this.updateSubmitButtonState();
            });
        }

        if (passwordInput) {
            // Validation mot de passe en temps réel
            passwordInput.addEventListener('input', (e) => {
                this.updatePasswordStrength(e.target.value);
                this.debounceValidation('password', () => this.validatePassword(e.target.value), 300);
                this.updateSubmitButtonState();
            });

            passwordInput.addEventListener('blur', (e) => {
                this.validatePassword(e.target.value, true);
                this.updateSubmitButtonState();
            });
        }
    }

    /**
     * Indicateur de force du mot de passe
     */
    initPasswordStrengthIndicator() {
        const passwordStrengthDiv = document.getElementById('passwordStrength');
        if (passwordStrengthDiv) {
            passwordStrengthDiv.classList.remove('hidden');
        }
    }

    /**
     * Système de debouncing pour la validation
     */
    debounceValidation(field, validationFn, delay) {
        // Clear existing timeout
        if (this.validationTimeouts.has(field)) {
            clearTimeout(this.validationTimeouts.get(field));
        }

        // Set new timeout
        const timeout = setTimeout(() => {
            validationFn();
            this.validationTimeouts.delete(field);
        }, delay);

        this.validationTimeouts.set(field, timeout);
    }

    /**
     * Validation email en temps réel
     */
    validateEmail(email, showFeedback = false) {
        const emailInput = document.getElementById('modalEmailInput');

        if (!emailInput) return;

        // Remove existing validation classes
        emailInput.classList.remove('valid', 'invalid');

        if (!email) {
            if (showFeedback) {
                this.showFieldError(emailInput, 'L\'adresse email est requise');
            }
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);

        if (isValid) {
            emailInput.classList.add('valid');
            if (showFeedback) {
                this.clearFieldError(emailInput);
            }
        } else {
            emailInput.classList.add('invalid');
            if (showFeedback) {
                this.showFieldError(emailInput, 'Format d\'email invalide');
            }
        }

        return isValid;
    }

    /**
     * Validation mot de passe en temps réel
     */
    validatePassword(password, showFeedback = false) {
        const passwordInput = document.getElementById('modalPasswordInput');

        if (!passwordInput) return;

        // Remove existing validation classes
        passwordInput.classList.remove('valid', 'invalid');

        if (!password) {
            if (showFeedback) {
                this.showFieldError(passwordInput, 'Le mot de passe est requis');
            }
            return false;
        }

        const isValid = password.length >= 8;

        if (isValid) {
            passwordInput.classList.add('valid');
            if (showFeedback) {
                this.clearFieldError(passwordInput);
            }
        } else {
            passwordInput.classList.add('invalid');
            if (showFeedback) {
                this.showFieldError(passwordInput, 'Le mot de passe doit contenir au moins 8 caractères');
            }
        }

        return isValid;
    }

    /**
     * Mise à jour de l'indicateur de force du mot de passe
     */
    updatePasswordStrength(password) {
        const authManager = window.FirebaseAuthManager || FirebaseAuthManager.getInstance();
        this.passwordStrength = authManager.evaluatePasswordStrength(password);
        
        const passwordStrengthDiv = document.getElementById('passwordStrength');
        const strengthBar = passwordStrengthDiv?.querySelector('.strength-bar');
        const strengthText = passwordStrengthDiv?.querySelector('.strength-text');

        if (passwordStrengthDiv && strengthBar && strengthText) {
            // Mettre à jour la barre de progression
            const percentage = (this.passwordStrength.score / 5) * 100;
            strengthBar.style.width = `${percentage}%`;
            
            // Mettre à jour le texte et les couleurs
            strengthText.textContent = `Force: ${this.passwordStrength.strength}`;
            
            // Classes CSS pour les couleurs
            strengthBar.className = 'strength-bar';
            if (this.passwordStrength.score >= 4) {
                strengthBar.classList.add('strength-strong');
            } else if (this.passwordStrength.score >= 3) {
                strengthBar.classList.add('strength-medium');
            } else {
                strengthBar.classList.add('strength-weak');
            }

            // Afficher les conseils si il y en a
            if (this.passwordStrength.feedback.length > 0 && password.length > 0) {
                this.showPasswordFeedback(this.passwordStrength.feedback);
            } else {
                this.hidePasswordFeedback();
            }
        }
    }

    /**
     * Affichage des conseils pour le mot de passe
     */
    showPasswordFeedback(feedback) {
        let feedbackDiv = document.getElementById('passwordFeedback');
        if (!feedbackDiv) {
            feedbackDiv = document.createElement('div');
            feedbackDiv.id = 'passwordFeedback';
            feedbackDiv.className = 'password-feedback';
            
            const passwordInput = document.getElementById('modalPasswordInput');
            if (passwordInput && passwordInput.parentNode) {
                passwordInput.parentNode.appendChild(feedbackDiv);
            }
        }

        feedbackDiv.innerHTML = feedback.map(tip => 
            `<div class="feedback-item">• ${tip}</div>`
        ).join('');
        
        feedbackDiv.classList.remove('hidden');
    }

    /**
     * Masquage des conseils pour le mot de passe
     */
    hidePasswordFeedback() {
        const feedbackDiv = document.getElementById('passwordFeedback');
        if (feedbackDiv) {
            feedbackDiv.classList.add('hidden');
        }
    }

    /**
     * Affichage d'erreur pour un champ spécifique
     */
    showFieldError(input, message) {
        this.clearFieldError(input);
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        
        input.parentNode.appendChild(errorElement);
        input.classList.add('invalid');
    }

    /**
     * Nettoyage d'erreur pour un champ spécifique
     */
    clearFieldError(input) {
        const existingError = input.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        input.classList.remove('invalid');
    }

    /**
     * Validation complète du formulaire
     */
    validateForm() {
        const emailInput = document.getElementById('modalEmailInput');
        const passwordInput = document.getElementById('modalPasswordInput');

        if (!emailInput || !passwordInput) {
            return { isValid: false, errors: ['Éléments du formulaire manquants'] };
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        const errors = [];

        // Validation email
        if (!email) {
            errors.push('L\'adresse email est requise');
        } else if (!this.validateEmail(email)) {
            errors.push('L\'adresse email n\'est pas valide');
        }

        // Validation mot de passe
        if (!password) {
            errors.push('Le mot de passe est requis');
        } else if (password.length < 8) {
            errors.push('Le mot de passe doit contenir au moins 8 caractères');
        }

        // Validation spécifique pour l'inscription
        if (this.currentMode === 'signup') {
            if (this.passwordStrength.score < 2) {
                errors.push('Le mot de passe est trop faible');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Mise à jour de l'état du bouton de soumission
     */
    updateSubmitButtonState() {
        const submitBtn = document.getElementById('modalEmailSubmitBtn');
        if (!submitBtn) return;

        const validation = this.validateForm();
        const btnText = submitBtn.querySelector('.btn-text');
        const btnIcon = submitBtn.querySelector('.btn-icon');
        const spinner = submitBtn.querySelector('.loading-spinner-small');

        if (validation.isValid) {
            submitBtn.disabled = false;
            if (btnText) btnText.textContent = this.currentMode === 'signup' ? 'S\'inscrire' : 'Se connecter';
            if (btnIcon) btnIcon.textContent = '→';
            if (spinner) spinner.classList.add('hidden');
        } else {
            submitBtn.disabled = true;
            if (btnText) btnText.textContent = 'Formulaire incomplet';
            if (btnIcon) btnIcon.textContent = '⚠️';
            if (spinner) spinner.classList.add('hidden');
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
            modalSignInTab.addEventListener('click', () => {
                this.switchMode('signin');
                this.updateSubmitButtonState();
            });
        }
        
        if (modalSignUpTab) {
            modalSignUpTab.addEventListener('click', () => {
                this.switchMode('signup');
                this.updateSubmitButtonState();
            });
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
        this.updateSubmitButtonState();
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

            // Update button state
            this.updateSubmitButtonState();
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
        const authManager = window.FirebaseAuthManager || FirebaseAuthManager.getInstance();
        authManager.sendPasswordResetEmail(email)
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
        
        // Validation complète avant soumission
        const validation = this.validateForm();
        if (!validation.isValid) {
            this.showError(validation.errors.join('. '));
            return;
        }
        
        const emailInput = document.getElementById('modalEmailInput');
        const passwordInput = document.getElementById('modalPasswordInput');
        const submitBtn = document.getElementById('modalEmailSubmitBtn');
        
        if (!emailInput || !passwordInput || !submitBtn) {
            console.warn('Required auth form elements not found');
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

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
            const authManager = window.FirebaseAuthManager || FirebaseAuthManager.getInstance();
            
            if (this.currentMode === 'signup') {
                // Utiliser le nouveau FirebaseAuthManager.signUp
                result = await authManager.signUp(email, password);
                if (result.success) {
                    if (result.emailSent) {
                        this.showSuccess('Inscription réussie! Vérifiez votre email pour confirmer votre compte.');
                    } else {
                        this.showSuccess('Inscription réussie!');
                    }
                }
            } else {
                // Utiliser FirebaseAuthManager.signIn
                result = await authManager.signIn(email, password);
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
                // Gestion spéciale des erreurs de configuration API key
                if (result.needsConfigUpdate) {
                    this.showConfigError(result.error);
                } else {
                    this.showError(result.error || 'Une erreur est survenue');
                }
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
            this.updateSubmitButtonState();
        }
    }

    async handleGoogleSignIn() {
        try {
            // Empêcher les clics multiples
            if (this.isGoogleSignInInProgress) {
                console.warn('⚠️ Google Sign-In déjà en cours, ignore le clic');
                return;
            }

            this.isGoogleSignInInProgress = true;
            const modalGoogleSignInBtn = document.getElementById('modalGoogleSignInBtn');
            if (modalGoogleSignInBtn) {
                modalGoogleSignInBtn.disabled = true;
                modalGoogleSignInBtn.textContent = '⏳ Connexion en cours...';
            }

            // Utiliser FirebaseAuthManager pour Google Sign-In
            const authManager = window.FirebaseAuthManager || FirebaseAuthManager.getInstance();
            const result = await authManager.signInWithGoogle();

            if (result.success) {
                this.showSuccess('Connexion réussie avec Google!');
                setTimeout(() => {
                    this.close();
                    this.updateAuthButton();
                }, 1500);
            } else if (result.error && result.error.includes('conflicting popup')) {
                // L'authentification a probablement réussi mais la popup s'est fermée
                // Vérifier l'état de l'utilisateur
                console.warn('⚠️ Popup fermée mais authentification possiblement réussie');
                this.showSuccess('Connexion probablement réussie, fermeture en cours...');
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
            } else if (error.code === 'auth/cancelled-popup-request') {
                // Vérifier si l'authentification a réussi malgré l'erreur
                console.warn('⚠️ Popup fermée due à un conflit COOP');
                this.showSuccess('Connexion probablement réussie, fermeture en cours...');
                setTimeout(() => {
                    this.close();
                    this.updateAuthButton();
                }, 1500);
                return;
            }

            this.showError(errorMessage);
        } finally {
            // Réinitialiser le drapeau
            this.isGoogleSignInInProgress = false;
            const modalGoogleSignInBtn = document.getElementById('modalGoogleSignInBtn');
            if (modalGoogleSignInBtn) {
                modalGoogleSignInBtn.disabled = false;
                modalGoogleSignInBtn.textContent = 'Continuer avec Google';
            }
        }
    }

    async handleSignOut() {
        try {
            const authManager = window.FirebaseAuthManager || FirebaseAuthManager.getInstance();
            const result = await authManager.signOut();
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
    
    showConfigError(message) {
        const errorDiv = document.getElementById('modalAuthError');
        if (errorDiv) {
            const fullMessage = `
                ${message}
                
                🔧 Solutions:
                1. Vérifiez la clé API dans Firebase Console
                2. Ajoutez votre domaine dans les domaines autorisés
                3. Assurez-vous que l'authentification est activée
                
                📋 Consultez FIREBASE_API_KEY_FIX_GUIDE.md pour plus de détails.
            `;
            errorDiv.innerHTML = fullMessage.replace(/\n\s+/g, '<br>');
            errorDiv.classList.remove('hidden');
            
            // Auto-hide after 10 seconds for config errors
            setTimeout(() => {
                errorDiv.classList.add('hidden');
            }, 10000);
        }
    }

    updateAuthButton() {
        const authButton = document.getElementById('authButton');
        const authButtonText = document.getElementById('authButtonText');
        
        if (!authButton || !authButtonText) return;

        const authManager = window.FirebaseAuthManager || FirebaseAuthManager.getInstance();
        const user = authManager.getCurrentUser();
        
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

// Initialisation automatique quand le DOM est prêt
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Attendre que FirebaseAuthManager soit initialisé
            const initAuthModal = () => {
                if (window.FirebaseAuthManager) {
                    window.authModalSystem = new AuthModalSystem();
                    window.authModalSystem.init();
                } else {
                    // Réessayer dans 100ms
                    setTimeout(initAuthModal, 100);
                }
            };
            initAuthModal();
        });
    } else {
        // DOM déjà chargé
        const initAuthModal = () => {
            if (window.FirebaseAuthManager) {
                window.authModalSystem = new AuthModalSystem();
                window.authModalSystem.init();
            } else {
                setTimeout(initAuthModal, 100);
            }
        };
        initAuthModal();
    }
}