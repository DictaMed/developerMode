/**
 * DictaMed - Gestionnaire d'authentification Firebase (Temporaire)
 * Version: 1.0.0 - Solution temporaire pour les références manquantes
 */

// ===== FIREBASE AUTHENTICATION MANAGER (TEMPORAIRE) =====
class FirebaseAuthManager {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
    }

    static init() {
        try {
            console.log('🔧 FirebaseAuthManager (temporary) init() started');
            
            // Vérifier si Firebase est disponible
            if (typeof firebase === 'undefined' || !firebase.auth) {
                console.warn('⚠️ Firebase Auth not available - using fallback implementation');
                return;
            }

            // Configuration Firebase Auth basique
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    console.log('✅ User authenticated:', user.email);
                    this.updateAuthUI(user);
                } else {
                    console.log('ℹ️ User not authenticated');
                    this.updateAuthUI(null);
                }
            });

            console.log('✅ FirebaseAuthManager (temporary) init() completed');
        } catch (error) {
            console.error('❌ FirebaseAuthManager init() failed:', error);
        }
    }

    static updateAuthUI(user) {
        const authButton = document.getElementById('authButton');
        const authButtonText = document.getElementById('authButtonText');
        
        if (authButton && authButtonText) {
            if (user) {
                authButtonText.textContent = user.displayName || user.email || 'Connecté';
                authButton.classList.add('authenticated');
            } else {
                authButtonText.textContent = 'Connexion';
                authButton.classList.remove('authenticated');
            }
        }
    }

    static isAuthenticated() {
        try {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                const user = firebase.auth().currentUser;
                return user !== null;
            }
            return false;
        } catch (error) {
            console.warn('FirebaseAuthManager.isAuthenticated() error:', error);
            return false;
        }
    }

    static getCurrentUser() {
        try {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                const user = firebase.auth().currentUser;
                if (user) {
                    return {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName
                    };
                }
            }
            return null;
        } catch (error) {
            console.warn('FirebaseAuthManager.getCurrentUser() error:', error);
            return null;
        }
    }

    static async signIn(email, password) {
        try {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                const result = await firebase.auth().signInWithEmailAndPassword(email, password);
                return {
                    success: true,
                    user: result.user
                };
            } else {
                throw new Error('Firebase Auth not available');
            }
        } catch (error) {
            console.error('Sign in error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    static async signOut() {
        try {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                await firebase.auth().signOut();
                return { success: true };
            }
            return { success: false, error: 'Firebase not available' };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseAuthManager;
} else {
    window.FirebaseAuthManager = FirebaseAuthManager;
}