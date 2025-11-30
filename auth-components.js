/**
 * Authentication UI Components for DictaMed
 * Modern login/register interface with Firebase Auth integration
 */

import { firebaseAuth } from './firebase-auth-service.js';

export class AuthComponents {
    constructor() {
        this.currentModal = null;
        this.isInitialized = false;
        this.init();
    }

    /**
     * Initialize authentication components
     */
    init() {
        console.log('AuthComponents: Initializing...');
        this.createAuthModals();
        this.bindEvents();
        this.isInitialized = true;
        console.log('AuthComponents: Initialization complete');
    }

    /**
     * Check if component is initialized
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * Create authentication modals
     */
    createAuthModals() {
        // Create login modal
        this.createLoginModal();
        
        // Create register modal
        this.createRegisterModal();
        
        // Create password reset modal
        this.createPasswordResetModal();
        
        // Create migration modal
        this.createMigrationModal();
    }

    /**
     * Create login modal
     */
    createLoginModal() {
        const modal = document.createElement('div');
        modal.id = 'loginModal';
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-modal-header">
                    <h2>🔐 Connexion</h2>
                    <button class="auth-close-btn" data-modal="loginModal">&times;</button>
                </div>
                <div class="auth-modal-body">
                    <form id="loginForm" class="auth-form">
                        <div class="form-group">
                            <label for="loginEmail">📧 Adresse email</label>
                            <input type="email" id="loginEmail" placeholder="votre@email.com" required>
                        </div>
                        <div class="form-group">
                            <label for="loginPassword">🔑 Mot de passe</label>
                            <input type="password" id="loginPassword" placeholder="Votre mot de passe" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-full" id="loginBtn">
                            Se connecter
                        </button>
                    </form>
                    
                    <div class="auth-divider">
                        <span>ou</span>
                    </div>
                    
                    <button class="btn btn-google btn-full" id="googleSignInBtn">
                        <span class="google-icon">🔴</span>
                        Continuer avec Google
                    </button>
                    
                    <div class="auth-links">
                        <a href="#" id="forgotPasswordLink">Mot de passe oublié ?</a>
                    </div>
                    
                    <div class="auth-switch">
                        <p>Pas encore de compte ? 
                            <a href="#" id="showRegisterLink">Créer un compte</a>
                        </p>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    /**
     * Create register modal
     */
    createRegisterModal() {
        const modal = document.createElement('div');
        modal.id = 'registerModal';
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-modal-header">
                    <h2>✨ Créer un compte</h2>
                    <button class="auth-close-btn" data-modal="registerModal">&times;</button>
                </div>
                <div class="auth-modal-body">
                    <form id="registerForm" class="auth-form">
                        <div class="form-group">
                            <label for="registerName">👤 Nom complet</label>
                            <input type="text" id="registerName" placeholder="Votre nom complet" required>
                        </div>
                        <div class="form-group">
                            <label for="registerEmail">📧 Adresse email</label>
                            <input type="email" id="registerEmail" placeholder="votre@email.com" required>
                        </div>
                        <div class="form-group">
                            <label for="registerPassword">🔒 Mot de passe</label>
                            <input type="password" id="registerPassword" placeholder="Minimum 6 caractères" required>
                            <small class="form-help">Minimum 6 caractères</small>
                        </div>
                        <div class="form-group">
                            <label for="registerAccessCode">🔑 Code d'accès</label>
                            <input type="text" id="registerAccessCode" placeholder="Votre code d'accès personnel" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-full" id="registerBtn">
                            Créer mon compte
                        </button>
                    </form>
                    
                    <div class="auth-divider">
                        <span>ou</span>
                    </div>
                    
                    <button class="btn btn-google btn-full" id="googleSignUpBtn">
                        <span class="google-icon">🔴</span>
                        S'inscrire avec Google
                    </button>
                    
                    <div class="auth-switch">
                        <p>Déjà un compte ? 
                            <a href="#" id="showLoginLink">Se connecter</a>
                        </p>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    /**
     * Create password reset modal
     */
    createPasswordResetModal() {
        const modal = document.createElement('div');
        modal.id = 'passwordResetModal';
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-modal-header">
                    <h2>🔐 Réinitialiser le mot de passe</h2>
                    <button class="auth-close-btn" data-modal="passwordResetModal">&times;</button>
                </div>
                <div class="auth-modal-body">
                    <form id="passwordResetForm" class="auth-form">
                        <div class="form-group">
                            <label for="resetEmail">📧 Adresse email</label>
                            <input type="email" id="resetEmail" placeholder="votre@email.com" required>
                            <small class="form-help">Un email de réinitialisation sera envoyé</small>
                        </div>
                        <button type="submit" class="btn btn-primary btn-full" id="resetPasswordBtn">
                            Envoyer la réinitialisation
                        </button>
                    </form>
                    
                    <div class="auth-switch">
                        <a href="#" id="backToLoginLink">Retour à la connexion</a>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    /**
     * Create migration modal for existing users
     */
    createMigrationModal() {
        const modal = document.createElement('div');
        modal.id = 'migrationModal';
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-modal-header">
                    <h2>🔄 Migration de compte</h2>
                    <button class="auth-close-btn" data-modal="migrationModal">&times;</button>
                </div>
                <div class="auth-modal-body">
                    <div class="migration-info">
                        <p><strong>Bienvenue !</strong> Pour continuer à utiliser DictaMed, veuillez migrer votre compte existant vers notre nouveau système d'authentification sécurisé.</p>
                    </div>
                    
                    <form id="migrationForm" class="auth-form">
                        <div class="form-group">
                            <label for="migrationUsername">👤 Ancien identifiant</label>
                            <input type="text" id="migrationUsername" placeholder="Votre ancien identifiant" required>
                        </div>
                        <div class="form-group">
                            <label for="migrationAccessCode">🔑 Ancien code d'accès</label>
                            <input type="text" id="migrationAccessCode" placeholder="Votre ancien code d'accès" required>
                        </div>
                        <div class="form-divider"></div>
                        <div class="form-group">
                            <label for="migrationNewEmail">📧 Nouvelle adresse email</label>
                            <input type="email" id="migrationNewEmail" placeholder="votre@email.com" required>
                        </div>
                        <div class="form-group">
                            <label for="migrationNewPassword">🔒 Nouveau mot de passe</label>
                            <input type="password" id="migrationNewPassword" placeholder="Minimum 6 caractères" required>
                            <small class="form-help">Choisissez un mot de passe sécurisé</small>
                        </div>
                        <button type="submit" class="btn btn-primary btn-full" id="migrateBtn">
                            Migrer mon compte
                        </button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Login form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'loginForm') {
                e.preventDefault();
                this.handleLogin();
            } else if (e.target.id === 'registerForm') {
                e.preventDefault();
                this.handleRegister();
            } else if (e.target.id === 'passwordResetForm') {
                e.preventDefault();
                this.handlePasswordReset();
            } else if (e.target.id === 'migrationForm') {
                e.preventDefault();
                this.handleMigration();
            }
        });

        // Google sign in buttons
        document.addEventListener('click', (e) => {
            if (e.target.id === 'googleSignInBtn' || e.target.closest('#googleSignInBtn')) {
                e.preventDefault();
                this.handleGoogleSignIn();
            } else if (e.target.id === 'googleSignUpBtn' || e.target.closest('#googleSignUpBtn')) {
                e.preventDefault();
                this.handleGoogleSignUp();
            }
        });

        // Modal controls
        document.addEventListener('click', (e) => {
            // Close modal buttons
            if (e.target.classList.contains('auth-close-btn')) {
                this.closeModal(e.target.dataset.modal);
            }
            
            // Modal background click
            if (e.target.classList.contains('auth-modal')) {
                this.closeModal(e.target.id);
            }
            
            // Show/hide modals
            if (e.target.id === 'forgotPasswordLink') {
                e.preventDefault();
                this.showModal('passwordResetModal');
            } else if (e.target.id === 'showRegisterLink') {
                e.preventDefault();
                this.switchModal('loginModal', 'registerModal');
            } else if (e.target.id === 'showLoginLink') {
                e.preventDefault();
                this.switchModal('registerModal', 'loginModal');
            } else if (e.target.id === 'backToLoginLink') {
                e.preventDefault();
                this.switchModal('passwordResetModal', 'loginModal');
            }
        });

        // Auth state changes
        firebaseAuth.onAuthStateChange((state, user) => {
            if (state === 'signed_in') {
                this.hideAuthSection();
                this.showUserProfile();
            } else if (state === 'signed_out') {
                this.showAuthSection();
                this.hideUserProfile();
            }
        });
    }

    /**
     * Handle login form submission
     */
    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const btn = document.getElementById('loginBtn');
        
        btn.textContent = 'Connexion...';
        btn.disabled = true;
        
        const result = await firebaseAuth.signInWithEmail(email, password);
        
        btn.textContent = 'Se connecter';
        btn.disabled = false;
        
        if (result.success) {
            this.closeModal('loginModal');
        }
    }

    /**
     * Handle register form submission
     */
    async handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const accessCode = document.getElementById('registerAccessCode').value;
        const btn = document.getElementById('registerBtn');
        
        btn.textContent = 'Création...';
        btn.disabled = true;
        
        const result = await firebaseAuth.register(email, password, name, accessCode);
        
        btn.textContent = 'Créer mon compte';
        btn.disabled = false;
        
        if (result.success) {
            this.closeModal('registerModal');
            this.showSuccessMessage('Compte créé ! Vérifiez votre email pour confirmer votre compte.');
        }
    }

    /**
     * Handle Google sign in
     */
    async handleGoogleSignIn() {
        const btn = document.getElementById('googleSignInBtn');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<span class="loading-spinner"></span> Connexion...';
        btn.disabled = true;
        
        const result = await firebaseAuth.signInWithGoogle();
        
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        if (result.success) {
            this.closeModal('loginModal');
        }
    }

    /**
     * Handle Google sign up
     */
    async handleGoogleSignUp() {
        const btn = document.getElementById('googleSignUpBtn');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<span class="loading-spinner"></span> Inscription...';
        btn.disabled = true;
        
        const result = await firebaseAuth.signInWithGoogle();
        
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        if (result.success) {
            this.closeModal('registerModal');
        }
    }

    /**
     * Handle password reset
     */
    async handlePasswordReset() {
        const email = document.getElementById('resetEmail').value;
        const btn = document.getElementById('resetPasswordBtn');
        
        btn.textContent = 'Envoi...';
        btn.disabled = true;
        
        const result = await firebaseAuth.resetPassword(email);
        
        btn.textContent = 'Envoyer la réinitialisation';
        btn.disabled = false;
        
        if (result.success) {
            this.showSuccessMessage('Email de réinitialisation envoyé !');
            this.closeModal('passwordResetModal');
        }
    }

    /**
     * Handle account migration
     */
    async handleMigration() {
        const username = document.getElementById('migrationUsername').value;
        const accessCode = document.getElementById('migrationAccessCode').value;
        const email = document.getElementById('migrationNewEmail').value;
        const password = document.getElementById('migrationNewPassword').value;
        const btn = document.getElementById('migrateBtn');
        
        btn.textContent = 'Migration...';
        btn.disabled = true;
        
        const result = await firebaseAuth.migrateUser(username, accessCode, email, password);
        
        btn.textContent = 'Migrer mon compte';
        btn.disabled = false;
        
        if (result.success) {
            this.closeModal('migrationModal');
            this.showSuccessMessage('Migration réussie ! Bienvenue dans le nouveau système.');
        }
    }

    /**
     * Show modal
     */
    showModal(modalId) {
        console.log('AuthComponents: Showing modal', modalId);
        if (!this.isReady()) {
            console.error('AuthComponents: Not initialized yet');
            return false;
        }
        
        const modal = document.getElementById(modalId);
        if (modal) {
            // FIX: Ensure modal doesn't block other clicks when shown
            modal.style.display = 'flex';
            modal.style.zIndex = '10000'; // Proper z-index
            modal.style.pointerEvents = 'auto';
            
            // Ensure modal content is clickable
            const content = modal.querySelector('.auth-modal-content');
            if (content) {
                content.style.zIndex = '10001';
                content.style.pointerEvents = 'auto';
            }
            
            this.currentModal = modalId;
            console.log('AuthComponents: Modal shown successfully with proper z-index');
            return true;
        } else {
            console.error('AuthComponents: Modal not found', modalId);
            return false;
        }
    }

    /**
     * Close modal
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            // FIX: Clean up any potential blocking states
            modal.style.pointerEvents = 'none';
            modal.style.zIndex = 'auto';
            
            if (this.currentModal === modalId) {
                this.currentModal = null;
            }
            
            console.log('AuthComponents: Modal closed successfully', modalId);
        }
    }

    /**
     * Switch between modals
     */
    switchModal(fromModalId, toModalId) {
        this.closeModal(fromModalId);
        setTimeout(() => this.showModal(toModalId), 300);
    }

    /**
     * Show auth section (when user is logged out)
     */
    showAuthSection() {
        const authSection = document.querySelector('.auth-card');
        if (authSection) {
            authSection.style.display = 'block';
        }
        
        // Show migration button if needed
        const showMigrationBtn = document.getElementById('showMigrationBtn');
        if (showMigrationBtn) {
            showMigrationBtn.style.display = 'inline-block';
        }
    }

    /**
     * Hide auth section (when user is logged in)
     */
    hideAuthSection() {
        const authSection = document.querySelector('.auth-card');
        if (authSection) {
            authSection.style.display = 'none';
        }
        
        // Hide migration button
        const showMigrationBtn = document.getElementById('showMigrationBtn');
        if (showMigrationBtn) {
            showMigrationBtn.style.display = 'none';
        }
    }

    /**
     * Show user profile section
     */
    showUserProfile() {
        let profileSection = document.getElementById('userProfileSection');
        if (!profileSection) {
            this.createUserProfileSection();
            profileSection = document.getElementById('userProfileSection');
        }
        
        profileSection.style.display = 'block';
    }

    /**
     * Hide user profile section
     */
    hideUserProfile() {
        const profileSection = document.getElementById('userProfileSection');
        if (profileSection) {
            profileSection.style.display = 'none';
        }
    }

    /**
     * Create user profile section
     */
    createUserProfileSection() {
        const profileSection = document.createElement('div');
        profileSection.id = 'userProfileSection';
        profileSection.className = 'card user-profile-card';
        profileSection.innerHTML = `
            <div class="user-profile-header">
                <h2>👤 Profil utilisateur</h2>
                <button class="btn btn-secondary" id="signOutBtn">Déconnexion</button>
            </div>
            <div class="user-profile-info">
                <p><strong>Nom :</strong> <span id="profileDisplayName"></span></p>
                <p><strong>Email :</strong> <span id="profileEmail"></span></p>
                <p><strong>Rôle :</strong> <span id="profileRole"></span></p>
            </div>
        `;
        
        // Insert after the auth section
        const authSection = document.querySelector('.auth-card');
        if (authSection) {
            authSection.parentNode.insertBefore(profileSection, authSection.nextSibling);
        }
        
        // Bind sign out button
        document.getElementById('signOutBtn').addEventListener('click', () => {
            firebaseAuth.signOut();
        });
        
        // Update profile info
        this.updateUserProfileInfo();
    }

    /**
     * Update user profile information
     */
    updateUserProfileInfo() {
        const user = firebaseAuth.getCurrentUser();
        const profile = firebaseAuth.getCurrentUserProfile();
        const role = firebaseAuth.getCurrentUserRole();
        
        if (user) {
            document.getElementById('profileDisplayName').textContent = user.displayName || 'Non renseigné';
            document.getElementById('profileEmail').textContent = user.email;
            document.getElementById('profileRole').textContent = role === 'admin' ? 'Administrateur' : 'Utilisateur';
        }
    }

    /**
     * Show success message
     */
    showSuccessMessage(message) {
        // You can integrate this with your existing toast system
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => successDiv.remove(), 300);
        }, 4000);
    }
}

// Create global instance
export const authComponents = new AuthComponents();