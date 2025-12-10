/**
 * DictaMed - Gestionnaire d'authentification Firebase
 * Version: 2.0.0 - Correction des problèmes de création de compte
 */

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
            if (typeof firebase === 'undefined' || !firebase.auth) {
                console.warn('⚠️ Firebase Auth not available - using fallback implementation');
                FirebaseAuthManager.showFallbackMessage();
                return;
            }

            // Initialiser l'instance
            const authManager = new FirebaseAuthManager();
            authManager.auth = firebase.auth();
            
            // Configuration Firebase Auth basique
            authManager.auth.onAuthStateChanged((user) => {
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
            if (typeof firebase === 'undefined' || !firebase.auth) {
                console.error('❌ Firebase not available');
                return false;
            }

            // Test de la configuration
            const config = firebase.app().options;
            console.log('📊 Firebase config:', {
                projectId: config.projectId,
                authDomain: config.authDomain,
                hasApiKey: !!config.apiKey
            });

            // Test de l'authentification
            const currentUser = firebase.auth().currentUser;
            console.log('👤 Current user:', currentUser ? currentUser.email : 'none');

            // Test des providers disponibles
            try {
                const auth = firebase.auth();
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
            
            if (typeof firebase === 'undefined' || !firebase.auth) {
                throw new Error('Firebase Auth not available');
            }

            const result = await firebase.auth().signInWithEmailAndPassword(email, password);
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
            
            if (typeof firebase === 'undefined' || !firebase.auth) {
                throw new Error('Firebase Auth not available');
            }

            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Mettre à jour le profil si un nom d'affichage est fourni
            if (displayName && user.updateProfile) {
                await user.updateProfile({ displayName: displayName });
            }

            // Envoyer un email de vérification
            if (user.sendEmailVerification) {
                await user.sendEmailVerification();
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
            if (typeof firebase !== 'undefined' && firebase.auth) {
                await firebase.auth().signOut();
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
            
            if (typeof firebase === 'undefined' || !firebase.auth) {
                throw new Error('Firebase Auth not available');
            }

            await firebase.auth().sendPasswordResetEmail(email);
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
            if (typeof firebase === 'undefined') {
                return {
                    isConfigured: false,
                    error: 'Firebase SDK not loaded'
                };
            }

            if (!firebase.auth) {
                return {
                    isConfigured: false,
                    error: 'Firebase Auth SDK not loaded'
                };
            }

            // Tester une opération simple pour vérifier la configuration
            const auth = firebase.auth();
            const providers = auth.config?.providers || {};
            
            const config = {
                isConfigured: true,
                projectId: firebase.app().options.projectId,
                authDomain: firebase.app().options.authDomain,
                providers: {
                    emailPassword: providers.email || false,
                    google: providers.google || false,
                    anonymous: providers.anonymous || false
                },
                currentUser: auth.currentUser ? auth.currentUser.email : null
            };

            console.log('📊 Auth configuration:', config);
            return config;

        } catch (error) {
            console.error('❌ Auth configuration check failed:', error);
            return {
                isConfigured: false,
                error: error.message
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