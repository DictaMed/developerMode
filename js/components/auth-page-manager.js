/**
 * DictaMed - Gestionnaire d'authentification pour l'onglet connexion
 * Version: 1.0.0 - Gestion de l'authentification via un onglet entier
 */

class AuthPageManager {
    constructor() {
        this.currentMode = 'signin'; // 'signin' or 'signup'
        this.validationTimeouts = new Map();
        this.passwordStrength = { score: 0, strength: 'Très faible', feedback: [] };
        this.isValidating = false;
        this.isGoogleSignInInProgress = false;
    }

    /**
     * Initialisation du système
     */
    init() {
        try {
            console.log('🔧 AuthPageManager v1.0.0 init() started');

            this.setupEventListeners();
            this.initRealTimeValidation();
            this.initPasswordStrengthIndicator();
            this.setupTabSwitching();
            this.updateProfileDisplay();

            console.log('✅ AuthPageManager v1.0.0 init() completed successfully');
        } catch (error) {
            console.error('❌ AuthPageManager init() failed:', error);
        }
    }

    /**
     * Configuration des événements principaux
     */
    setupEventListeners() {
        // Form submission
        const form = document.getElementById('pageEmailAuthForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Sign in/up tab switching
        const signInTab = document.getElementById('pageSignInTab');
        const signUpTab = document.getElementById('pageSignUpTab');

        if (signInTab) {
            signInTab.addEventListener('click', () => this.switchAuthMode('signin'));
        }
        if (signUpTab) {
            signUpTab.addEventListener('click', () => this.switchAuthMode('signup'));
        }

        // Password toggle visibility
        const passwordToggles = document.querySelectorAll('[data-action="toggle-password"]');
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => this.togglePasswordVisibility(e));
        });

        // Forgot password
        const forgotLinks = document.querySelectorAll('[data-action="forgot-password"]');
        forgotLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });
        });

        // Google Sign In
        const googleBtn = document.getElementById('pageGoogleSignInBtn');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.handleGoogleSignIn());
        }

        // Sign Out
        const signOutBtn = document.getElementById('pageSignOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => this.handleSignOut());
        }
    }

    /**
     * Configuration des onglets Sign In / Sign Up
     */
    setupTabSwitching() {
        const tabs = document.querySelectorAll('[role="tab"]');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabPanel = tab.getAttribute('aria-controls');
                const isSelected = tab.getAttribute('aria-selected') === 'true';

                // Update tab states
                tabs.forEach(t => {
                    t.setAttribute('aria-selected', 'false');
                    t.classList.remove('active');
                });

                tab.setAttribute('aria-selected', 'true');
                tab.classList.add('active');

                // Update form title
                const title = document.getElementById('authPageTitle');
                if (title) {
                    title.textContent = tab.textContent.includes('Inscription') ? 'Inscription' : 'Connexion';
                }

                // Update button text
                const submitBtn = document.getElementById('pageEmailSubmitBtn');
                if (submitBtn) {
                    const btnText = submitBtn.querySelector('.btn-text');
                    if (btnText) {
                        btnText.textContent = tab.textContent.includes('Inscription') ? 'S\'inscrire' : 'Se connecter';
                    }
                }

                // Update mode
                this.currentMode = tab.textContent.includes('Inscription') ? 'signup' : 'signin';
            });
        });
    }

    /**
     * Validation en temps réel des champs
     */
    initRealTimeValidation() {
        const emailInput = document.getElementById('pageEmailInput');
        const passwordInput = document.getElementById('pagePasswordInput');

        if (emailInput) {
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
     * Initialisation de l'indicateur de force du mot de passe
     */
    initPasswordStrengthIndicator() {
        const passwordStrengthDiv = document.getElementById('pagePasswordStrength');
        if (passwordStrengthDiv) {
            passwordStrengthDiv.classList.remove('hidden');
        }
    }

    /**
     * Système de debouncing
     */
    debounceValidation(field, validationFn, delay) {
        if (this.validationTimeouts.has(field)) {
            clearTimeout(this.validationTimeouts.get(field));
        }

        const timeout = setTimeout(() => {
            validationFn();
            this.validationTimeouts.delete(field);
        }, delay);

        this.validationTimeouts.set(field, timeout);
    }

    /**
     * Validation email
     */
    validateEmail(email, showFeedback = false) {
        const emailInput = document.getElementById('pageEmailInput');

        if (!emailInput) return false;

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
     * Validation mot de passe
     */
    validatePassword(password, showFeedback = false) {
        const passwordInput = document.getElementById('pagePasswordInput');

        if (!passwordInput) return false;

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
        const authManager = window.FirebaseAuthManager;
        if (!authManager) {
            console.warn('⚠️ AuthPageManager: FirebaseAuthManager not available');
            return;
        }

        this.passwordStrength = authManager.evaluatePasswordStrength(password);

        const passwordStrengthDiv = document.getElementById('pagePasswordStrength');
        const strengthBar = passwordStrengthDiv?.querySelector('.strength-bar');
        const strengthText = passwordStrengthDiv?.querySelector('.strength-text');

        if (passwordStrengthDiv && strengthBar && strengthText) {
            const percentage = (this.passwordStrength.score / 5) * 100;
            strengthBar.style.width = `${percentage}%`;

            strengthText.textContent = `Force: ${this.passwordStrength.strength}`;

            strengthBar.className = 'strength-bar';
            if (this.passwordStrength.score >= 4) {
                strengthBar.classList.add('strength-strong');
            } else if (this.passwordStrength.score >= 3) {
                strengthBar.classList.add('strength-medium');
            } else {
                strengthBar.classList.add('strength-weak');
            }

            if (this.passwordStrength.feedback.length > 0 && password.length > 0) {
                this.showPasswordFeedback(this.passwordStrength.feedback);
            } else {
                this.hidePasswordFeedback();
            }
        }
    }

    /**
     * Affichage des conseils
     */
    showPasswordFeedback(feedback) {
        let feedbackDiv = document.getElementById('pagePasswordFeedback');
        if (!feedbackDiv) {
            feedbackDiv = document.createElement('div');
            feedbackDiv.id = 'pagePasswordFeedback';
            feedbackDiv.className = 'password-feedback';

            const passwordInput = document.getElementById('pagePasswordInput');
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
     * Masquage des conseils
     */
    hidePasswordFeedback() {
        const feedbackDiv = document.getElementById('pagePasswordFeedback');
        if (feedbackDiv) {
            feedbackDiv.classList.add('hidden');
        }
    }

    /**
     * Affichage d'erreur pour un champ
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
     * Nettoyage d'erreur
     */
    clearFieldError(input) {
        const existingError = input.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        input.classList.remove('invalid');
    }

    /**
     * Basculement de la visibilité du mot de passe
     */
    togglePasswordVisibility(e) {
        e.preventDefault();
        const passwordInput = document.getElementById('pagePasswordInput');
        if (passwordInput) {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';

            const eyeIcon = e.currentTarget.querySelector('.eye-icon');
            if (eyeIcon) {
                eyeIcon.textContent = isPassword ? '🙈' : '👁️';
            }
        }
    }

    /**
     * Mise à jour de l'état du bouton submit
     */
    updateSubmitButtonState() {
        const emailInput = document.getElementById('pageEmailInput');
        const passwordInput = document.getElementById('pagePasswordInput');
        const submitBtn = document.getElementById('pageEmailSubmitBtn');

        if (!submitBtn) return;

        const isEmailValid = emailInput && this.validateEmail(emailInput.value);
        const isPasswordValid = passwordInput && this.validatePassword(passwordInput.value);

        submitBtn.disabled = !(isEmailValid && isPasswordValid);
    }

    /**
     * Gestion de la soumission du formulaire
     */
    async handleFormSubmit(e) {
        e.preventDefault();

        const emailInput = document.getElementById('pageEmailInput');
        const passwordInput = document.getElementById('pagePasswordInput');
        const submitBtn = document.getElementById('pageEmailSubmitBtn');
        const errorDiv = document.getElementById('pageAuthError');

        if (!emailInput || !passwordInput || !submitBtn) return;

        // Validation
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!this.validateEmail(email, true) || !this.validatePassword(password, true)) {
            return;
        }

        // Show loading state
        const spinner = submitBtn.querySelector('.loading-spinner-small');
        if (spinner) spinner.classList.remove('hidden');
        submitBtn.disabled = true;

        try {
            const authManager = window.FirebaseAuthManager;
            if (!authManager) {
                throw new Error('FirebaseAuthManager not available');
            }

            let result;
            if (this.currentMode === 'signup') {
                result = await authManager.signUp(email, password);
            } else {
                result = await authManager.signIn(email, password);
            }

            if (result.success) {
                if (errorDiv) {
                    errorDiv.classList.add('hidden');
                }

                // Notification de succès
                if (window.notificationSystem) {
                    window.notificationSystem.success(
                        `Vous êtes ${this.currentMode === 'signup' ? 'inscrit' : 'connecté'} avec succès!`
                    );
                }

                // Mise à jour du profil
                this.updateProfileDisplay();

                // Redirection automatique vers Mode Normal après 1.5 secondes
                setTimeout(() => {
                    if (window.switchTab) {
                        console.log('🔄 Redirection automatique vers Mode Normal');
                        window.switchTab('mode-normal');
                    }
                }, 1500);

            } else {
                if (errorDiv) {
                    errorDiv.textContent = result.error || 'Une erreur s\'est produite';
                    errorDiv.classList.remove('hidden');
                }

                if (window.notificationSystem) {
                    window.notificationSystem.error(result.error || 'Erreur d\'authentification');
                }
            }
        } catch (error) {
            console.error('❌ AuthPageManager: Error during authentication:', error);
            if (errorDiv) {
                errorDiv.textContent = error.message || 'Une erreur s\'est produite';
                errorDiv.classList.remove('hidden');
            }

            if (window.notificationSystem) {
                window.notificationSystem.error(error.message || 'Erreur d\'authentification');
            }
        } finally {
            if (spinner) spinner.classList.add('hidden');
            submitBtn.disabled = false;
        }
    }

    /**
     * Gestion de la connexion Google
     */
    async handleGoogleSignIn() {
        if (this.isGoogleSignInInProgress) return;

        this.isGoogleSignInInProgress = true;
        const googleBtn = document.getElementById('pageGoogleSignInBtn');

        try {
            const authManager = window.FirebaseAuthManager;
            if (!authManager) {
                throw new Error('FirebaseAuthManager not available');
            }
            const result = await authManager.signInWithGoogle();

            if (result.success) {
                if (window.notificationSystem) {
                    window.notificationSystem.success('Connecté avec Google avec succès!');
                }

                this.updateProfileDisplay();

                // Redirection automatique
                setTimeout(() => {
                    if (window.switchTab) {
                        window.switchTab('mode-normal');
                    }
                }, 1500);
            } else {
                if (window.notificationSystem) {
                    window.notificationSystem.error(result.error || 'Erreur Google Sign In');
                }
            }
        } catch (error) {
            console.error('❌ AuthPageManager: Google Sign In error:', error);
            if (window.notificationSystem) {
                window.notificationSystem.error('Erreur lors de la connexion Google');
            }
        } finally {
            this.isGoogleSignInInProgress = false;
        }
    }

    /**
     * Gestion du mot de passe oublié
     */
    handleForgotPassword() {
        const emailInput = document.getElementById('pageEmailInput');
        const email = emailInput?.value.trim();

        if (!email) {
            if (window.notificationSystem) {
                window.notificationSystem.warning('Veuillez entrer votre email');
            }
            return;
        }

        if (window.FirebaseAuthManager && window.FirebaseAuthManager.sendPasswordReset) {
            window.FirebaseAuthManager.sendPasswordReset(email)
                .then(() => {
                    if (window.notificationSystem) {
                        window.notificationSystem.success('Email de réinitialisation envoyé!');
                    }
                })
                .catch(error => {
                    if (window.notificationSystem) {
                        window.notificationSystem.error(error.message);
                    }
                });
        }
    }

    /**
     * Changement du mode d'authentification
     */
    switchAuthMode(mode) {
        this.currentMode = mode;
    }

    /**
     * Gestion de la déconnexion
     */
    async handleSignOut() {
        try {
            const authManager = window.FirebaseAuthManager;
            if (!authManager) {
                throw new Error('FirebaseAuthManager not available');
            }
            await authManager.signOut();

            if (window.notificationSystem) {
                window.notificationSystem.success('Vous êtes déconnecté');
            }

            this.updateProfileDisplay();

            // Redirection vers l'accueil
            setTimeout(() => {
                if (window.switchTab) {
                    window.switchTab('home');
                }
            }, 1000);

        } catch (error) {
            console.error('❌ AuthPageManager: Sign out error:', error);
            if (window.notificationSystem) {
                window.notificationSystem.error('Erreur lors de la déconnexion');
            }
        }
    }

    /**
     * Mise à jour de l'affichage du profil
     */
    updateProfileDisplay() {
        const authManager = window.FirebaseAuthManager;
        if (!authManager) {
            console.warn('⚠️ AuthPageManager: FirebaseAuthManager not available for profile display');
            return;
        }
        const currentUser = authManager.getCurrentUser?.();

        const formContainer = document.getElementById('pageEmailAuthForm');
        const profileContainer = document.getElementById('pageUserProfile');

        if (currentUser) {
            // Afficher le profil
            if (formContainer) formContainer.classList.add('hidden');
            if (profileContainer) profileContainer.classList.remove('hidden');

            // Mettre à jour les informations
            const nameEl = document.getElementById('pageUserName');
            const emailEl = document.getElementById('pageUserEmail');

            if (nameEl) nameEl.textContent = currentUser.displayName || 'Utilisateur';
            if (emailEl) emailEl.textContent = currentUser.email || 'email@example.com';

            // Mettre à jour le bouton de navigation
            const authButton = document.querySelector('[data-tab="connexion"]');
            if (authButton) {
                const buttonText = authButton.querySelector('#authButtonText');
                if (buttonText) {
                    buttonText.textContent = currentUser.displayName || 'Profil';
                }
            }
        } else {
            // Afficher le formulaire
            if (formContainer) formContainer.classList.remove('hidden');
            if (profileContainer) profileContainer.classList.add('hidden');

            // Reset button text
            const authButton = document.querySelector('[data-tab="connexion"]');
            if (authButton) {
                const buttonText = authButton.querySelector('#authButtonText');
                if (buttonText) {
                    buttonText.textContent = 'Connexion';
                }
            }
        }
    }
}

// Créer une instance globale et l'initialiser au chargement
if (!window.authPageManager) {
    window.authPageManager = new AuthPageManager();
}
