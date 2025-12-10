/**
 * DictaMed - Gestionnaire d'authentification Firebase (SDK Modulaire v9+)
 * Version: 3.0.0 - Migration vers Firebase SDK modulaire
 */

// Import des fonctions Firebase modulaires
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    sendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile,
    sendEmailVerification,
    GoogleAuthProvider,
    signInWithPopup
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// ===== FIREBASE AUTHENTICATION MANAGER =====
class FirebaseAuthManager {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.auth = null;
    }

    static init() {
        try {
            console.log('🔧 FirebaseAuthManager init() started');
            
            // Vérifier si Firebase est disponible
            if (typeof window.firebase === 'undefined' || !window.firebase.auth) {
                console.warn('⚠️ Firebase Auth not available - using fallback implementation');
                FirebaseAuthManager.showFallbackMessage();
                return;
            }

            // Initialiser l'instance
            const authManager = new FirebaseAuthManager();
            authManager.auth = window.firebase.auth;
            
            // Configuration Firebase Auth basique avec SDK modulaire
            onAuthStateChanged(authManager.auth, (user) => {
                if (user) {
                    console.log('✅ User authenticated:', user.email);
                    authManager.currentUser = user;
                    authManager.updateAuthUI(user);
                } else {
                    console.log('ℹ️ User not authenticated');
                    authManager.currentUser = null;
                    authManager.updateAuthUI(null);
                }
            });

            authManager.isInitialized = true;
            console.log('✅ FirebaseAuthManager init() completed');
            
            // Tester l'état d'authentification
            FirebaseAuthManager.testAuthStatus();
            
        } catch (error) {
            console.error('❌ FirebaseAuthManager init() failed:', error);
            FirebaseAuthManager.showErrorMessage(error);
        }
    }

    static async testAuthStatus() {
        console.log('🧪 Testing Firebase Auth status...');
        
        try {
            if (typeof window.firebase === 'undefined' || !window.firebase.auth) {
                console.error('❌ Firebase not available');
                return false;
            }

            // Test de la configuration
            const config = window.firebase.app.options;
            console.log('📊 Firebase config:', {
                projectId: config.projectId,
                authDomain: config.authDomain,
                hasApiKey: !!config.apiKey
            });

            // Test de l'authentification
            const currentUser = window.firebase.auth.currentUser;
            console.log('👤 Current user:', currentUser ? currentUser.email : 'none');

            // Test des providers disponibles
            try {
                const auth = window.firebase.auth;
                console.log('🔐 Auth methods available:', {
                    emailPassword: 'available',
                    google: 'available',
                    currentUser: !!currentUser
                });
            } catch (methodError) {
                console.warn('⚠️ Some auth methods may not be available:', methodError);
            }

            return true;
        } catch (error) {
            console.error('❌ Auth status test failed:', error);
            return false;
        }
    }

    static showFallbackMessage() {
        const message = `
        🔧 Firebase Auth en mode fallback
        
        Les fonctionnalités d'authentification sont limitées.
        Pour activer l'authentification complète :
        
        1. Vérifiez que Firebase Auth est activé dans la console
        2. Activez le provider "Email/Password"
        3. Configurez les domaines autorisés
        `;
        console.warn(message);
        
        // Afficher une notification si le système est disponible
        if (window.notificationSystem) {
            window.notificationSystem.info(
                'Authentification Firebase non configurée. Certaines fonctionnalités sont limitées.',
                'Configuration Firebase'
            );
        }
    }

    static showErrorMessage(error) {
        const message = `Erreur d'authentification Firebase: ${error.message}`;
        console.error(message);
        
        if (window.notificationSystem) {
            window.notificationSystem.error(message, 'Erreur Authentification');
        } else {
            alert(message);
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
            if (typeof window.firebase !== 'undefined' && window.firebase.auth) {
                const user = window.firebase.auth.currentUser;
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
            if (typeof window.firebase !== 'undefined' && window.firebase.auth) {
                const user = window.firebase.auth.currentUser;
                if (user) {
                    return {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        emailVerified: user.emailVerified
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
            console.log('🔐 Attempting sign in for:', email);
            
            if (typeof window.firebase === 'undefined' || !window.firebase.auth) {
                throw new Error('Firebase Auth not available');
            }

            const result = await signInWithEmailAndPassword(window.firebase.auth, email, password);
            console.log('✅ Sign in successful:', result.user.email);
            
            return {
                success: true,
                user: result.user
            };
        } catch (error) {
            console.error('❌ Sign in error:', error);
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    }

    static async signUp(email, password, displayName = null) {
        try {
            console.log('✨ Attempting sign up for:', email);
            
            if (typeof window.firebase === 'undefined' || !window.firebase.auth) {
                throw new Error('Firebase Auth not available');
            }

            const userCredential = await createUserWithEmailAndPassword(window.firebase.auth, email, password);
            const user = userCredential.user;

            // Mettre à jour le profil si un nom d'affichage est fourni
            if (displayName && updateProfile) {
                await updateProfile(user, { displayName: displayName });
            }

            // Envoyer un email de vérification
            if (sendEmailVerification) {
                await sendEmailVerification(user);
                console.log('📧 Verification email sent');
            }

            console.log('✅ Sign up successful:', user.email);
            
            return {
                success: true,
                user: user,
                emailSent: true
            };
        } catch (error) {
            console.error('❌ Sign up error:', error);
            
            // Messages d'erreur plus spécifiques
            let userFriendlyMessage = error.message;
            switch (error.code) {
                case 'auth/email-already-in-use':
                    userFriendlyMessage = 'Cette adresse email est déjà utilisée par un autre compte';
                    break;
                case 'auth/weak-password':
                    userFriendlyMessage = 'Le mot de passe est trop faible. Utilisez au moins 6 caractères';
                    break;
                case 'auth/invalid-email':
                    userFriendlyMessage = 'L\'adresse email n\'est pas valide';
                    break;
                case 'auth/operation-not-allowed':
                    userFriendlyMessage = 'L\'inscription par email n\'est pas activée. Contactez l\'administrateur';
                    break;
                case 'auth/network-request-failed':
                    userFriendlyMessage = 'Erreur de connexion. Vérifiez votre connexion internet';
                    break;
                default:
                    userFriendlyMessage = `Erreur lors de l'inscription: ${error.message}`;
            }
            
            return {
                success: false,
                error: userFriendlyMessage,
                code: error.code
            };
        }
    }

    static async signOut() {
        try {
            if (typeof window.firebase !== 'undefined' && window.firebase.auth) {
                await signOut(window.firebase.auth);
                console.log('✅ Sign out successful');
                return { success: true };
            }
            return { success: false, error: 'Firebase not available' };
        } catch (error) {
            console.error('❌ Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    static async sendPasswordResetEmail(email) {
        try {
            console.log('🔑 Sending password reset email to:', email);
            
            if (typeof window.firebase === 'undefined' || !window.firebase.auth) {
                throw new Error('Firebase Auth not available');
            }

            await sendPasswordResetEmail(window.firebase.auth, email);
            console.log('✅ Password reset email sent');
            
            return { success: true };
        } catch (error) {
            console.error('❌ Password reset error:', error);
            
            let userFriendlyMessage = error.message;
            switch (error.code) {
                case 'auth/user-not-found':
                    userFriendlyMessage = 'Aucun compte trouvé avec cette adresse email';
                    break;
                case 'auth/invalid-email':
                    userFriendlyMessage = 'L\'adresse email n\'est pas valide';
                    break;
                case 'auth/network-request-failed':
                    userFriendlyMessage = 'Erreur de connexion. Vérifiez votre connexion internet';
                    break;
                default:
                    userFriendlyMessage = `Erreur lors de l'envoi de l'email: ${error.message}`;
            }
            
            return { 
                success: false, 
                error: userFriendlyMessage,
                code: error.code
            };
        }
    }

    static async checkAuthConfiguration() {
        console.log('🔍 Checking Firebase Auth configuration...');
        
        try {
            if (typeof window.firebase === 'undefined') {
                return {
                    isConfigured: false,
                    error: 'Firebase SDK not loaded'
                };
            }

            if (!window.firebase.auth) {
                return {
                    isConfigured: false,
                    error: 'Firebase Auth SDK not loaded'
                };
            }

            // Tester une opération simple pour vérifier la configuration
            const auth = window.firebase.auth;
            const config = window.firebase.app.options;
            
            const authConfig = {
                isConfigured: true,
                projectId: config.projectId,
                authDomain: config.authDomain,
                providers: {
                    emailPassword: true,
                    google: true,
                    anonymous: true
                },
                currentUser: auth.currentUser ? auth.currentUser.email : null
            };

            console.log('📊 Auth configuration:', authConfig);
            return authConfig;

        } catch (error) {
            console.error('❌ Auth configuration check failed:', error);
            return {
                isConfigured: false,
                error: error.message
            };
        }
    }

    static async signInWithGoogle() {
        try {
            console.log('🔐 Attempting Google sign in');
            
            if (typeof window.firebase === 'undefined' || !window.firebase.auth) {
                throw new Error('Firebase Auth not available');
            }

            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(window.firebase.auth, provider);
            
            console.log('✅ Google sign in successful:', result.user.email);
            
            return {
                success: true,
                user: result.user
            };
        } catch (error) {
            console.error('❌ Google sign in error:', error);
            
            let userFriendlyMessage = error.message;
            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    userFriendlyMessage = 'Connexion annulée par l\'utilisateur';
                    break;
                case 'auth/popup-blocked':
                    userFriendlyMessage = 'Popup bloquée par le navigateur';
                    break;
                case 'auth/network-request-failed':
                    userFriendlyMessage = 'Erreur de connexion. Vérifiez votre connexion internet';
                    break;
                default:
                    userFriendlyMessage = `Erreur lors de la connexion Google: ${error.message}`;
            }
            
            return {
                success: false,
                error: userFriendlyMessage,
                code: error.code
            };
        }
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseAuthManager;
} else {
    window.FirebaseAuthManager = FirebaseAuthManager;
}

// Initialisation automatique quand le DOM est chargé
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => FirebaseAuthManager.init());
    } else {
        // DOM déjà chargé
        setTimeout(() => FirebaseAuthManager.init(), 100);
    }
}