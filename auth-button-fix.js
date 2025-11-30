/**
 * Specific Fix for DictaMed Authentication Button Issues
 * Targets login/register buttons not responding to clicks
 */

console.log('🔧 Authentication Button Fix Loading...');

// ===== AUTHENTICATION BUTTON SPECIFIC FIX =====
class AuthButtonFix {
    constructor() {
        this.authButtons = ['loginBtn', 'registerBtn', 'showMigrationBtn'];
        this.retryCount = 0;
        this.maxRetries = 10;
        this.init();
    }

    init() {
        console.log('🔍 Starting Authentication Button Fix...');
        
        // Wait for DOM to be fully ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.fixAuthButtons();
            });
        } else {
            this.fixAuthButtons();
        }

        // Also retry after a delay to catch late-loading components
        setTimeout(() => this.fixAuthButtons(), 1000);
        setTimeout(() => this.fixAuthButtons(), 3000);
    }

    fixAuthButtons() {
        console.log('🔧 Attempting to fix authentication buttons...');
        
        let fixedCount = 0;
        
        this.authButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                this.fixSingleButton(button, buttonId);
                fixedCount++;
            } else {
                console.warn(`⚠️ Button not found: ${buttonId}`);
            }
        });

        if (fixedCount > 0) {
            console.log(`✅ Fixed ${fixedCount} authentication buttons`);
        } else if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`🔄 Retry ${this.retryCount}/${this.maxRetries} - buttons not found, will retry...`);
            setTimeout(() => this.fixAuthButtons(), 500);
        } else {
            console.error('❌ Authentication buttons could not be fixed after multiple retries');
            this.provideManualFixInstructions();
        }
    }

    fixSingleButton(button, buttonId) {
        console.log(`🔧 Fixing button: ${buttonId}`);
        
        // Remove all existing listeners to prevent conflicts
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Apply CSS fixes to ensure button is clickable
        this.applyButtonCSSFix(newButton);
        
        // Add click handler based on button type
        this.addClickHandler(newButton, buttonId);
        
        // Add additional event listeners for robustness
        this.addAdditionalEventListeners(newButton, buttonId);
    }

    applyButtonCSSFix(button) {
        // Force button to be clickable
        button.style.pointerEvents = 'auto';
        button.style.cursor = 'pointer';
        button.style.userSelect = 'none';
        button.style.position = 'relative';
        button.style.zIndex = '10';
        button.style.display = 'inline-block';
        button.style.visibility = 'visible';
        button.style.opacity = '1';
        
        // Remove any potential blocking styles
        button.style.overflow = 'visible';
        button.style.transform = 'none';
        
        console.log(`🎨 Applied CSS fixes to ${button.id}`);
    }

    addClickHandler(button, buttonId) {
        const clickHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log(`🖱️ ${buttonId} clicked successfully!`);
            
            // Add visual feedback
            this.addVisualFeedback(button);
            
            // Route to appropriate action based on button ID
            this.handleAuthAction(buttonId, button);
        };

        // Add multiple event listeners for robustness
        button.addEventListener('click', clickHandler);
        button.addEventListener('mousedown', (e) => {
            console.log(`🖱️ ${buttonId} mousedown detected`);
        });
        button.addEventListener('touchstart', (e) => {
            console.log(`📱 ${buttonId} touchstart detected`);
        });
    }

    addAdditionalEventListeners(button, buttonId) {
        // Keyboard accessibility
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                button.click();
            }
        });

        // Focus and blur events for debugging
        button.addEventListener('focus', () => {
            console.log(`🎯 ${buttonId} focused`);
        });
    }

    addVisualFeedback(button) {
        // Add temporary visual feedback
        const originalStyle = {
            transform: button.style.transform,
            boxShadow: button.style.boxShadow
        };
        
        button.style.transform = 'scale(0.95)';
        button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        
        setTimeout(() => {
            button.style.transform = originalStyle.transform;
            button.style.boxShadow = originalStyle.boxShadow;
        }, 150);
    }

    handleAuthAction(buttonId, button) {
        console.log(`🔐 Handling auth action for: ${buttonId}`);
        
        switch (buttonId) {
            case 'loginBtn':
                this.openLoginModal();
                break;
            case 'registerBtn':
                this.openRegisterModal();
                break;
            case 'showMigrationBtn':
                this.openMigrationModal();
                break;
            default:
                console.warn(`Unknown auth action: ${buttonId}`);
        }
    }

    openLoginModal() {
        console.log('🔐 Opening login modal...');
        
        // Check if auth components are available
        if (typeof authComponents !== 'undefined' && authComponents.showModal) {
            if (authComponents.isReady()) {
                const success = authComponents.showModal('loginModal');
                if (success) {
                    console.log('✅ Login modal opened successfully');
                } else {
                    console.error('❌ Failed to open login modal');
                    this.showFallbackModal('loginModal');
                }
            } else {
                console.warn('⚠️ Auth components not ready, retrying...');
                setTimeout(() => this.openLoginModal(), 1000);
            }
        } else {
            console.error('❌ Auth components not available');
            this.showFallbackModal('loginModal');
        }
    }

    openRegisterModal() {
        console.log('✨ Opening register modal...');
        
        if (typeof authComponents !== 'undefined' && authComponents.showModal) {
            if (authComponents.isReady()) {
                const success = authComponents.showModal('registerModal');
                if (success) {
                    console.log('✅ Register modal opened successfully');
                } else {
                    console.error('❌ Failed to open register modal');
                    this.showFallbackModal('registerModal');
                }
            } else {
                console.warn('⚠️ Auth components not ready, retrying...');
                setTimeout(() => this.openRegisterModal(), 1000);
            }
        } else {
            console.error('❌ Auth components not available');
            this.showFallbackModal('registerModal');
        }
    }

    openMigrationModal() {
        console.log('🔄 Opening migration modal...');
        
        if (typeof authComponents !== 'undefined' && authComponents.showModal) {
            if (authComponents.isReady()) {
                const success = authComponents.showModal('migrationModal');
                if (success) {
                    console.log('✅ Migration modal opened successfully');
                } else {
                    console.error('❌ Failed to open migration modal');
                    this.showFallbackModal('migrationModal');
                }
            } else {
                console.warn('⚠️ Auth components not ready, retrying...');
                setTimeout(() => this.openMigrationModal(), 1000);
            }
        } else {
            console.error('❌ Auth components not available');
            this.showFallbackModal('migrationModal');
        }
    }

    showFallbackModal(modalId) {
        console.log(`🚨 Showing fallback for modal: ${modalId}`);
        
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            modal.style.zIndex = '10000';
            console.log(`✅ Fallback modal ${modalId} shown`);
        } else {
            console.error(`❌ Fallback modal ${modalId} not found`);
            // Show alert as last resort
            this.showFallbackAlert(modalId);
        }
    }

    showFallbackAlert(modalId) {
        const messages = {
            'loginModal': 'Login functionality is being initialized. Please try again in a moment.',
            'registerModal': 'Registration functionality is being initialized. Please try again in a moment.',
            'migrationModal': 'Migration functionality is being initialized. Please try again in a moment.'
        };
        
        const message = messages[modalId] || 'Authentication system is initializing. Please try again.';
        alert(message);
    }

    provideManualFixInstructions() {
        console.log('📋 Manual Fix Instructions:');
        console.log('1. Check browser console for errors');
        console.log('2. Verify Firebase is properly configured');
        console.log('3. Try refreshing the page');
        console.log('4. Disable browser extensions that might block scripts');
        console.log('5. Test in incognito/private browsing mode');
    }
}

// ===== IMMEDIATE FIX APPLICATION =====
window.authButtonFix = new AuthButtonFix();

// ===== EXPORT FOR TESTING =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthButtonFix;
}