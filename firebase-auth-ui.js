/**
 * Firebase Authentication UI Component
 * Handles the Firebase authentication interface and user interactions
 */

class FirebaseAuthUI {
  constructor() {
    this.authModal = null;
    this.loginForm = null;
    this.emailInput = null;
    this.passwordInput = null;
    this.rememberMeCheckbox = null;
    this.loginButton = null;
    this.logoutButton = null;
    this.userInfoElement = null;
    this.authStatusElement = null;
    this.loadingIndicator = null;

    this.currentUser = null;
    this.authStateUnsubscribe = null;
  }

  // Initialize the Firebase Auth UI
  async init() {
    try {
      // Import Firebase auth functions
      const { initFirebaseAuth, onAuthStateChange, signInWithFirebase, signOutFromFirebase, getFirebaseErrorMessage } = await import('./firebase-config.js');

      // Initialize Firebase Auth
      await initFirebaseAuth();

      // Set up auth state listener
      onAuthStateChange(this.handleAuthStateChange.bind(this));

      // Create UI elements
      this.createAuthUI();

      // Set up event listeners
      this.setupEventListeners();

      console.log('🔐 Firebase Auth UI initialized');

    } catch (error) {
      console.error('🔥 Error initializing Firebase Auth UI:', error);
      this.showError('Erreur d\'initialisation de l\'authentification');
    }
  }

  // Create the authentication UI elements
  createAuthUI() {
    // Create auth modal
    this.createAuthModal();

    // Create user info element in header
    this.createUserInfoElement();

    // Create auth status indicator
    this.createAuthStatusElement();
  }

  // Create the authentication modal
  createAuthModal() {
    this.authModal = document.createElement('div');
    this.authModal.id = 'firebase-auth-modal';
    this.authModal.className = 'auth-modal hidden';
    this.authModal.setAttribute('role', 'dialog');
    this.authModal.setAttribute('aria-modal', 'true');
    this.authModal.setAttribute('aria-hidden', 'true');

    this.authModal.innerHTML = `
      <div class="auth-modal-overlay"></div>
      <div class="auth-modal-content">
        <button class="auth-modal-close" aria-label="Fermer">×</button>

        <div class="auth-modal-header">
          <h2>🔐 Connexion DictaMed</h2>
          <p>Authentifiez-vous pour accéder au Mode Normal</p>
        </div>

        <form id="firebase-login-form" class="auth-form">
          <div class="form-group">
            <label for="firebase-email">📧 Adresse Email</label>
            <input type="email" id="firebase-email" placeholder="Votre email professionnel" autocomplete="email" required>
            <span class="error-message" id="email-error"></span>
          </div>

          <div class="form-group">
            <label for="firebase-password">🔑 Mot de passe</label>
            <input type="password" id="firebase-password" placeholder="Votre mot de passe" autocomplete="current-password" required>
            <span class="error-message" id="password-error"></span>
          </div>

          <div class="form-group remember-me">
            <label>
              <input type="checkbox" id="firebase-remember-me">
              <span>💾 Se souvenir de moi</span>
            </label>
          </div>

          <button type="submit" class="btn btn-primary auth-login-btn" disabled>
            <span class="btn-text">Se connecter</span>
            <span class="btn-loading hidden">⏳</span>
          </button>

          <div class="auth-error-container">
            <span class="auth-error-message" id="auth-error"></span>
          </div>
        </form>

        <div class="auth-footer">
          <p>💡 Besoin d'aide ? Contactez <a href="mailto:dictamed.contact@gmail.com">dictamed.contact@gmail.com</a></p>
        </div>
      </div>
    `;

    document.body.appendChild(this.authModal);

    // Cache elements
    this.loginForm = this.authModal.querySelector('#firebase-login-form');
    this.emailInput = this.authModal.querySelector('#firebase-email');
    this.passwordInput = this.authModal.querySelector('#firebase-password');
    this.rememberMeCheckbox = this.authModal.querySelector('#firebase-remember-me');
    this.loginButton = this.authModal.querySelector('.auth-login-btn');
    this.loadingIndicator = this.authModal.querySelector('.btn-loading');
    this.authErrorElement = this.authModal.querySelector('#auth-error');
  }

  // Create user info element in header
  createUserInfoElement() {
    const header = document.querySelector('header .header-content');
    if (header) {
      this.userInfoElement = document.createElement('div');
      this.userInfoElement.className = 'user-info hidden';
      this.userInfoElement.innerHTML = `
        <div class="user-avatar">👤</div>
        <div class="user-details">
          <span class="user-email"></span>
          <button class="btn-logout">🔐 Déconnexion</button>
        </div>
      `;

      header.appendChild(this.userInfoElement);
    }
  }

  // Create auth status indicator
  createAuthStatusElement() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      this.authStatusElement = document.createElement('div');
      this.authStatusElement.className = 'auth-status-indicator';
      this.authStatusElement.innerHTML = `
        <div class="auth-status-icon">🔒</div>
        <div class="auth-status-text">Authentification requise pour le Mode Normal</div>
        <button class="auth-login-trigger">Se connecter</button>
      `;

      // Insert before the first tab content
      const firstTabContent = mainContent.querySelector('.tab-content');
      if (firstTabContent) {
        mainContent.insertBefore(this.authStatusElement, firstTabContent);
      }
    }
  }

  // Set up event listeners
  setupEventListeners() {
    // Close modal button
    const closeButton = this.authModal.querySelector('.auth-modal-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.closeAuthModal());
    }

    // Close modal when clicking overlay
    const overlay = this.authModal.querySelector('.auth-modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.closeAuthModal());
    }

    // Login form submission
    if (this.loginForm) {
      this.loginForm.addEventListener('submit', (e) => this.handleLoginSubmit(e));
    }

    // Input validation
    if (this.emailInput) {
      this.emailInput.addEventListener('input', () => this.validateForm());
    }

    if (this.passwordInput) {
      this.passwordInput.addEventListener('input', () => this.validateForm());
    }

    // Login trigger button
    const loginTrigger = document.querySelector('.auth-login-trigger');
    if (loginTrigger) {
      loginTrigger.addEventListener('click', () => this.openAuthModal());
    }

    // Logout button
    const logoutButton = document.querySelector('.btn-logout');
    if (logoutButton) {
      logoutButton.addEventListener('click', () => this.handleLogout());
    }

    // Also add logout to the existing logout functionality if it exists
    const existingLogoutBtn = document.getElementById('logout-btn');
    if (existingLogoutBtn) {
      existingLogoutBtn.addEventListener('click', () => this.handleLogout());
    }
  }

  // Handle auth state changes
  async handleAuthStateChange(user) {
    this.currentUser = user;

    if (user) {
      // User is authenticated
      this.showAuthenticatedState(user);
      this.updateNormalModeAccess(true);
    } else {
      // User is not authenticated
      this.showUnauthenticatedState();
      this.updateNormalModeAccess(false);
    }

    // Update UI elements
    this.updateUIForAuthState(user);
  }

  // Show authenticated state
  showAuthenticatedState(user) {
    console.log('👤 User authenticated:', user.email);

    // Update user info
    if (this.userInfoElement) {
      this.userInfoElement.querySelector('.user-email').textContent = user.email;
      this.userInfoElement.classList.remove('hidden');
    }

    // Hide auth status indicator for authenticated users
    if (this.authStatusElement) {
      this.authStatusElement.classList.add('authenticated');
      this.authStatusElement.querySelector('.auth-status-text').textContent = 'Connecté en tant que ' + user.email;
      this.authStatusElement.querySelector('.auth-status-icon').textContent = '👤';
      this.authStatusElement.querySelector('.auth-login-trigger').textContent = 'Changer de compte';
    }

    // Close auth modal if open
    this.closeAuthModal();

    // Show success toast
    this.showSuccess('Connecté avec succès !');
  }

  // Show unauthenticated state
  showUnauthenticatedState() {
    console.log('👤 No user authenticated');

    // Hide user info
    if (this.userInfoElement) {
      this.userInfoElement.classList.add('hidden');
    }

    // Show auth status indicator
    if (this.authStatusElement) {
      this.authStatusElement.classList.remove('authenticated');
      this.authStatusElement.querySelector('.auth-status-text').textContent = 'Authentification requise pour le Mode Normal';
      this.authStatusElement.querySelector('.auth-status-icon').textContent = '🔒';
      this.authStatusElement.querySelector('.auth-login-trigger').textContent = 'Se connecter';
    }
  }

  // Update UI based on auth state
  updateUIForAuthState(user) {
    // Update normal mode tab accessibility
    this.updateNormalModeAccess(!!user);

    // Update any other UI elements that depend on auth state
    const authDependentElements = document.querySelectorAll('[data-requires-auth]');
    authDependentElements.forEach(element => {
      if (user) {
        element.classList.remove('requires-auth');
        element.removeAttribute('disabled');
      } else {
        element.classList.add('requires-auth');
        element.setAttribute('disabled', 'true');
      }
    });
  }

  // Update normal mode access based on authentication
  updateNormalModeAccess(isAuthenticated) {
    const normalModeTab = document.querySelector('[data-tab="mode-normal"]');
    const normalModeContent = document.getElementById('mode-normal');

    if (normalModeTab && normalModeContent) {
      if (isAuthenticated) {
        // User is authenticated - allow access
        normalModeTab.classList.remove('requires-auth');
        normalModeTab.removeAttribute('disabled');
        normalModeTab.setAttribute('title', 'Mode Normal - Accès autorisé');

        // Remove any auth-related messages from the content
        const authCards = normalModeContent.querySelectorAll('.auth-card');
        authCards.forEach(card => {
          card.style.display = 'none';
        });

      } else {
        // User is not authenticated - restrict access
        normalModeTab.classList.add('requires-auth');
        normalModeTab.setAttribute('disabled', 'true');
        normalModeTab.setAttribute('title', 'Authentification requise pour accéder au Mode Normal');

        // Show auth card in normal mode
        const authCards = normalModeContent.querySelectorAll('.auth-card');
        authCards.forEach(card => {
          card.style.display = 'block';
        });
      }
    }
  }

  // Open authentication modal
  openAuthModal() {
    if (this.authModal) {
      this.authModal.classList.remove('hidden');
      this.authModal.setAttribute('aria-hidden', 'false');
      this.authModal.querySelector('.auth-modal-content').focus();

      // Reset form
      this.resetAuthForm();
    }
  }

  // Close authentication modal
  closeAuthModal() {
    if (this.authModal) {
      this.authModal.classList.add('hidden');
      this.authModal.setAttribute('aria-hidden', 'true');

      // Reset form
      this.resetAuthForm();
    }
  }

  // Reset authentication form
  resetAuthForm() {
    if (this.loginForm) {
      this.loginForm.reset();
      this.clearErrorMessages();
      this.loginButton.disabled = true;
    }
  }

  // Validate form inputs
  validateForm() {
    const email = this.emailInput.value.trim();
    const password = this.passwordInput.value.trim();

    let isValid = true;

    // Validate email
    if (!email) {
      this.showFieldError('email-error', 'Veuillez entrer votre email');
      isValid = false;
    } else if (!this.isValidEmail(email)) {
      this.showFieldError('email-error', 'Email invalide');
      isValid = false;
    } else {
      this.clearFieldError('email-error');
    }

    // Validate password
    if (!password) {
      this.showFieldError('password-error', 'Veuillez entrer votre mot de passe');
      isValid = false;
    } else if (password.length < 6) {
      this.showFieldError('password-error', 'Mot de passe trop court');
      isValid = false;
    } else {
      this.clearFieldError('password-error');
    }

    // Enable/disable login button
    if (this.loginButton) {
      this.loginButton.disabled = !isValid;
    }

    return isValid;
  }

  // Check if email is valid
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Show field error
  showFieldError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add('visible');
    }
  }

  // Clear field error
  clearFieldError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.remove('visible');
    }
  }

  // Clear all error messages
  clearErrorMessages() {
    this.clearFieldError('email-error');
    this.clearFieldError('password-error');
    if (this.authErrorElement) {
      this.authErrorElement.textContent = '';
      this.authErrorElement.classList.remove('visible');
    }
  }

  // Handle login form submission
  async handleLoginSubmit(e) {
    e.preventDefault();

    if (!this.validateForm()) {
      return;
    }

    const email = this.emailInput.value.trim();
    const password = this.passwordInput.value.trim();
    const rememberMe = this.rememberMeCheckbox.checked;

    // Show loading state
    this.showLoading(true);

    try {
      // Import Firebase auth function
      const { signInWithFirebase } = await import('./firebase-config.js');

      // Attempt to sign in
      const user = await signInWithFirebase(email, password);
      console.log('🎉 Login successful:', user.email);

      // Handle remember me functionality
      if (rememberMe) {
        this.handleRememberMe(email, password);
      }

      // Close modal
      this.closeAuthModal();

    } catch (error) {
      console.error('🔥 Login error:', error);

      // Get user-friendly error message
      const { getFirebaseErrorMessage } = await import('./firebase-config.js');
      const errorMessage = getFirebaseErrorMessage(error.code) || 'Erreur de connexion';

      // Show error message
      this.showAuthError(errorMessage);

    } finally {
      // Hide loading state
      this.showLoading(false);
    }
  }

  // Handle remember me functionality
  handleRememberMe(email, password) {
    try {
      // Store credentials securely (in a real app, use more secure storage)
      localStorage.setItem('dictamed_remembered_email', email);

      // Note: In a production app, you would NOT store the password
      // This is just for demo purposes
      if (password) {
        localStorage.setItem('dictamed_remembered_password_temp', password);
      }

      console.log('💾 Remember me set for:', email);
    } catch (error) {
      console.error('Error saving remember me:', error);
    }
  }

  // Handle logout
  async handleLogout() {
    try {
      // Import Firebase auth function
      const { signOutFromFirebase } = await import('./firebase-config.js');

      // Show loading state
      this.showLoading(true);

      // Attempt to sign out
      await signOutFromFirebase();

      // Clear remember me data
      this.clearRememberMe();

      console.log('🎉 Logout successful');

    } catch (error) {
      console.error('🔥 Logout error:', error);
      this.showError('Erreur lors de la déconnexion');

    } finally {
      // Hide loading state
      this.showLoading(false);
    }
  }

  // Clear remember me data
  clearRememberMe() {
    try {
      localStorage.removeItem('dictamed_remembered_email');
      localStorage.removeItem('dictamed_remembered_password_temp');
      console.log('💾 Remember me cleared');
    } catch (error) {
      console.error('Error clearing remember me:', error);
    }
  }

  // Show loading state
  showLoading(isLoading) {
    if (this.loginButton && this.loadingIndicator) {
      if (isLoading) {
        this.loginButton.disabled = true;
        this.loadingIndicator.classList.remove('hidden');
        this.loginButton.querySelector('.btn-text').classList.add('hidden');
      } else {
        this.loginButton.disabled = false;
        this.loadingIndicator.classList.add('hidden');
        this.loginButton.querySelector('.btn-text').classList.remove('hidden');
      }
    }
  }

  // Show authentication error
  showAuthError(message) {
    if (this.authErrorElement) {
      this.authErrorElement.textContent = message;
      this.authErrorElement.classList.add('visible');
    }
  }

  // Show success message
  showSuccess(message) {
    // In a real app, you would use a toast notification system
    console.log('✅ Success:', message);

    // For now, just show a temporary message
    if (this.authStatusElement) {
      const successElement = document.createElement('div');
      successElement.className = 'auth-success-message';
      successElement.textContent = message;

      this.authStatusElement.appendChild(successElement);

      setTimeout(() => {
        successElement.remove();
      }, 3000);
    }
  }

  // Show error message
  showError(message) {
    // In a real app, you would use a toast notification system
    console.error('❌ Error:', message);

    // For now, just show a temporary message
    if (this.authStatusElement) {
      const errorElement = document.createElement('div');
      errorElement.className = 'auth-error-message';
      errorElement.textContent = message;

      this.authStatusElement.appendChild(errorElement);

      setTimeout(() => {
        errorElement.remove();
      }, 5000);
    }
  }

  // Check if user is authenticated (for external use)
  isUserAuthenticated() {
    return !!this.currentUser;
  }

  // Get current user email (for external use)
  getCurrentUserEmail() {
    return this.currentUser?.email || null;
  }
}

// Export singleton instance
const firebaseAuthUI = new FirebaseAuthUI();
export default firebaseAuthUI;