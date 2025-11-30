/**
 * Firebase Authentication Service for DictaMed
 * Replaces the previous AuthManager with Firebase-based authentication
 */

import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    collection, 
    query, 
    where, 
    getDocs 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { auth, db } from './firebase-config.js';

// Toast notification system (existing)
const Toast = {
    success: (message, title = 'Succès') => {
        console.log(`✅ ${title}: ${message}`);
        // You can integrate with your existing toast system
    },
    error: (message, title = 'Erreur') => {
        console.error(`❌ ${title}: ${message}`);
        // You can integrate with your existing toast system
    },
    info: (message, title = 'Information') => {
        console.log(`ℹ️ ${title}: ${message}`);
        // You can integrate with your existing toast system
    }
};

export class FirebaseAuthService {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.userProfile = null;
        this.authStateListeners = [];
        
        // Initialize auth state listener
        this.initAuthStateListener();
    }

    /**
     * Initialize Firebase auth state listener
     */
    initAuthStateListener() {
        onAuthStateChanged(auth, async (user) => {
            this.currentUser = user;
            
            if (user) {
                // User is signed in
                await this.loadUserProfile(user.uid);
                await this.loadUserRole(user.uid);
                this.notifyAuthStateChange('signed_in', user);
            } else {
                // User is signed out
                this.userRole = null;
                this.userProfile = null;
                this.notifyAuthStateChange('signed_out', null);
            }
        });
    }

    /**
     * Register a new user with email and password
     */
    async register(email, password, displayName, accessCode) {
        try {
            Toast.info('Création du compte en cours...', 'Inscription');

            // Create user with email and password
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update user profile with display name
            await updateProfile(user, {
                displayName: displayName
            });

            // Save additional user data to Firestore
            await this.saveUserProfile(user.uid, {
                email: email,
                displayName: displayName,
                accessCode: accessCode,
                role: await this.determineUserRole(accessCode),
                createdAt: new Date().toISOString(),
                emailVerified: false
            });

            // Send email verification
            await sendEmailVerification(user);

            Toast.success('Compte créé avec succès ! Vérifiez votre email pour confirmer votre compte.', 'Inscription réussie');
            return { success: true, user: user };

        } catch (error) {
            console.error('Registration error:', error);
            let errorMessage = 'Erreur lors de la création du compte.';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Cette adresse email est déjà utilisée.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Le mot de passe est trop faible.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Adresse email invalide.';
                    break;
                default:
                    errorMessage = error.message;
            }
            
            Toast.error(errorMessage, 'Erreur d\'inscription');
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Sign in with email and password
     */
    async signInWithEmail(email, password) {
        try {
            Toast.info('Connexion en cours...', 'Authentification');

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if email is verified
            if (!user.emailVerified) {
                await this.signOut();
                Toast.error('Veuillez vérifier votre email avant de vous connecter.', 'Email non vérifié');
                return { success: false, error: 'Email not verified' };
            }

            // Load user profile and role
            await this.loadUserProfile(user.uid);
            await this.loadUserRole(user.uid);

            Toast.success('Connexion réussie !', 'Bienvenue');
            return { success: true, user: user };

        } catch (error) {
            console.error('Sign in error:', error);
            let errorMessage = 'Erreur de connexion.';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Aucun compte trouvé avec cette adresse email.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Mot de passe incorrect.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Adresse email invalide.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'Ce compte a été désactivé.';
                    break;
                default:
                    errorMessage = error.message;
            }
            
            Toast.error(errorMessage, 'Erreur de connexion');
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Sign in with Google
     */
    async signInWithGoogle() {
        try {
            Toast.info('Connexion avec Google en cours...', 'Authentification');

            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: 'select_account'
            });

            const userCredential = await signInWithPopup(auth, provider);
            const user = userCredential.user;

            // Check if user profile exists, if not create it
            const profileExists = await this.checkUserProfileExists(user.uid);
            
            if (!profileExists) {
                // New Google user - create profile
                await this.saveUserProfile(user.uid, {
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    role: 'user', // Default role for Google users
                    provider: 'google',
                    createdAt: new Date().toISOString(),
                    emailVerified: user.emailVerified
                });
            } else {
                // Existing user - load profile
                await this.loadUserProfile(user.uid);
                await this.loadUserRole(user.uid);
            }

            Toast.success('Connexion avec Google réussie !', 'Bienvenue');
            return { success: true, user: user };

        } catch (error) {
            console.error('Google sign in error:', error);
            let errorMessage = 'Erreur lors de la connexion avec Google.';
            
            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    errorMessage = 'Connexion annulée.';
                    break;
                case 'auth/popup-blocked':
                    errorMessage = 'Popup bloquée. Veuillez autoriser les popups.';
                    break;
                default:
                    errorMessage = error.message;
            }
            
            Toast.error(errorMessage, 'Erreur Google');
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Sign out current user
     */
    async signOut() {
        try {
            await signOut(auth);
            this.currentUser = null;
            this.userRole = null;
            this.userProfile = null;
            
            Toast.info('Déconnexion réussie.', 'Au revoir');
            this.notifyAuthStateChange('signed_out', null);
            
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            Toast.error('Erreur lors de la déconnexion.', 'Erreur');
            return { success: false, error: error.message };
        }
    }

    /**
     * Send password reset email
     */
    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            Toast.success('Email de réinitialisation envoyé !', 'Mot de passe');
            return { success: true };
        } catch (error) {
            console.error('Password reset error:', error);
            let errorMessage = 'Erreur lors de l\'envoi de l\'email.';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Aucun compte trouvé avec cette adresse email.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Adresse email invalide.';
                    break;
                default:
                    errorMessage = error.message;
            }
            
            Toast.error(errorMessage, 'Erreur de réinitialisation');
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Save user profile to Firestore
     */
    async saveUserProfile(uid, profileData) {
        try {
            await setDoc(doc(db, 'users', uid), profileData, { merge: true });
        } catch (error) {
            console.error('Error saving user profile:', error);
            throw error;
        }
    }

    /**
     * Load user profile from Firestore
     */
    async loadUserProfile(uid) {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                this.userProfile = userDoc.data();
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    /**
     * Load user role from Firestore
     */
    async loadUserRole(uid) {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                this.userRole = userDoc.data().role || 'user';
            }
        } catch (error) {
            console.error('Error loading user role:', error);
            this.userRole = 'user';
        }
    }

    /**
     * Check if user profile exists
     */
    async checkUserProfileExists(uid) {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            return userDoc.exists();
        } catch (error) {
            console.error('Error checking user profile:', error);
            return false;
        }
    }

    /**
     * Determine user role based on access code
     * This maintains your current role system
     */
    async determineUserRole(accessCode) {
        // This logic should be adapted to your existing role system
        // For now, assuming 'admin' role for specific access codes
        const adminAccessCodes = ['ADMIN123', 'MEDADMIN', 'SUPERUSER'];
        return adminAccessCodes.includes(accessCode) ? 'admin' : 'user';
    }

    /**
     * Migrate existing users to Firebase
     */
    async migrateUser(existingUsername, existingAccessCode, newEmail, newPassword) {
        try {
            // First, register the user with Firebase
            const result = await this.register(newEmail, newPassword, existingUsername, existingAccessCode);
            
            if (result.success) {
                Toast.success(`Utilisateur ${existingUsername} migré avec succès !`, 'Migration réussie');
                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Migration error:', error);
            Toast.error('Erreur lors de la migration de l\'utilisateur.', 'Erreur de migration');
            return { success: false, error: error.message };
        }
    }

    /**
     * Get current authenticated user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Get current user role
     */
    getCurrentUserRole() {
        return this.userRole;
    }

    /**
     * Get current user profile
     */
    getCurrentUserProfile() {
        return this.userProfile;
    }

    /**
     * Check if user has specific role
     */
    hasRole(requiredRole) {
        if (!this.userRole) return false;
        if (requiredRole === 'user') return true;
        return this.userRole === requiredRole;
    }

    /**
     * Register auth state change listener
     */
    onAuthStateChange(callback) {
        this.authStateListeners.push(callback);
    }

    /**
     * Notify all auth state change listeners
     */
    notifyAuthStateChange(state, user) {
        this.authStateListeners.forEach(callback => {
            callback(state, user);
        });
    }

    /**
     * Update user profile
     */
    async updateUserProfile(updates) {
        try {
            if (!this.currentUser) {
                throw new Error('No authenticated user');
            }

            // Update Firebase Auth profile if needed
            if (updates.displayName || updates.photoURL) {
                await updateProfile(this.currentUser, {
                    displayName: updates.displayName || this.currentUser.displayName,
                    photoURL: updates.photoURL || this.currentUser.photoURL
                });
            }

            // Update Firestore profile
            await updateDoc(doc(db, 'users', this.currentUser.uid), updates);

            // Reload profile
            await this.loadUserProfile(this.currentUser.uid);

            Toast.success('Profil mis à jour avec succès !', 'Profil');
            return { success: true };

        } catch (error) {
            console.error('Update profile error:', error);
            Toast.error('Erreur lors de la mise à jour du profil.', 'Erreur');
            return { success: false, error: error.message };
        }
    }
}

// Create singleton instance
export const firebaseAuth = new FirebaseAuthService();