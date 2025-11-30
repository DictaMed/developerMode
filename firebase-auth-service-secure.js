/**
 * Secure Firebase Authentication Service for DictaMed
 * Addresses security vulnerabilities and improves architecture
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
import { secureFirebase } from './firebase-config-secure.js';

/**
 * Rate limiter for authentication attempts
 */
class RateLimiter {
    constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
        this.attempts = new Map();
    }
    
    /**
     * Check if an IP/user can make an attempt
     */
    canAttempt(identifier) {
        const now = Date.now();
        const userAttempts = this.attempts.get(identifier) || [];
        
        // Remove old attempts outside the window
        const recentAttempts = userAttempts.filter(
            timestamp => now - timestamp < this.windowMs
        );
        
        this.attempts.set(identifier, recentAttempts);
        
        return recentAttempts.length < this.maxAttempts;
    }
    
    /**
     * Record an attempt
     */
    recordAttempt(identifier) {
        const userAttempts = this.attempts.get(identifier) || [];
        userAttempts.push(Date.now());
        this.attempts.set(identifier, userAttempts);
    }
    
    /**
     * Reset attempts for an identifier
     */
    reset(identifier) {
        this.attempts.delete(identifier);
    }
}

/**
 * Input validation utilities
 */
class InputValidator {
    /**
     * Validate email format
     */
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    }
    
    /**
     * Validate password strength
     */
    static validatePassword(password) {
        const minLength = 6;
        const maxLength = 128;
        
        if (password.length < minLength || password.length > maxLength) {
            return { valid: false, message: `Password must be ${minLength}-${maxLength} characters` };
        }
        
        // Check for at least one letter and one number
        if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
            return { valid: false, message: 'Password must contain letters and numbers' };
        }
        
        return { valid: true };
    }
    
    /**
     * Validate access code format
     */
    static validateAccessCode(code) {
        const validChars = /^[a-zA-Z0-9_-]+$/;
        return validChars.test(code) && code.length >= 3 && code.length <= 20;
    }
    
    /**
     * Sanitize user input
     */
    static sanitizeInput(input) {
        return input.trim().replace(/[<>"/\\&']/g, '');
    }
}

/**
 * Secure Toast notification system
 */
const SecureToast = {
    success: (message, title = 'Succès') => {
        console.log(`✅ ${title}: ${message}`);
        showSecureNotification('success', message, title);
    },
    error: (message, title = 'Erreur') => {
        console.error(`❌ ${title}: ${message}`);
        showSecureNotification('error', message, title);
    },
    info: (message, title = 'Information') => {
        console.log(`ℹ️ ${title}: ${message}`);
        showSecureNotification('info', message, title);
    },
    warning: (message, title = 'Attention') => {
        console.warn(`⚠️ ${title}: ${message}`);
        showSecureNotification('warning', message, title);
    }
};

/**
 * Show secure notification (avoids XSS)
 */
function showSecureNotification(type, message, title) {
    // Create notification element safely
    const notification = document.createElement('div');
    notification.className = `secure-notification ${type}`;
    
    // Use textContent to prevent XSS
    notification.textContent = `${title}: ${message}`;
    
    // Style and append
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 24px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px',
        fontWeight: '600',
        zIndex: '10000',
        maxWidth: '300px',
        wordWrap: 'break-word',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    });
    
    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

export class SecureFirebaseAuthService {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.userProfile = null;
        this.authStateListeners = [];
        this.rateLimiter = new RateLimiter();
        this.isInitialized = false;
        this.auth = null;
        this.db = null;
    }
    
    /**
     * Initialize the authentication service
     */
    async initialize() {
        try {
            const { auth, db } = secureFirebase.getServices();
            this.auth = auth;
            this.db = db;
            
            this.setupAuthStateListener();
            this.isInitialized = true;
            
            console.log('✅ Secure Firebase Auth Service initialized');
        } catch (error) {
            console.error('❌ Auth service initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Setup Firebase auth state listener with error handling
     */
    setupAuthStateListener() {
        onAuthStateChanged(this.auth, async (user) => {
            try {
                this.currentUser = user;
                
                if (user) {
                    await this.loadUserProfile(user.uid);
                    await this.loadUserRole(user.uid);
                    this.notifyAuthStateChange('signed_in', user);
                } else {
                    this.userRole = null;
                    this.userProfile = null;
                    this.notifyAuthStateChange('signed_out', null);
                }
            } catch (error) {
                console.error('Auth state change error:', error);
                SecureToast.error('Authentication state error occurred', 'Auth Error');
            }
        });
    }
    
    /**
     * Rate-limited user registration with enhanced validation
     */
    async register(email, password, displayName, accessCode) {
        try {
            // Rate limiting check
            const identifier = `register_${email}`;
            if (!this.rateLimiter.canAttempt(identifier)) {
                SecureToast.warning('Too many registration attempts. Please try again later.', 'Rate Limited');
                return { success: false, error: 'Rate limit exceeded' };
            }
            
            // Input validation
            if (!InputValidator.validateEmail(email)) {
                return { success: false, error: 'Invalid email format' };
            }
            
            const passwordValidation = InputValidator.validatePassword(password);
            if (!passwordValidation.valid) {
                return { success: false, error: passwordValidation.message };
            }
            
            if (!InputValidator.validateAccessCode(accessCode)) {
                return { success: false, error: 'Invalid access code format' };
            }
            
            const sanitizedName = InputValidator.sanitizeInput(displayName);
            const sanitizedEmail = email.toLowerCase().trim();
            const sanitizedAccessCode = InputValidator.sanitizeInput(accessCode);
            
            SecureToast.info('Creating your account...', 'Registration');
            
            // Create user with email and password
            const userCredential = await createUserWithEmailAndPassword(
                this.auth, 
                sanitizedEmail, 
                password
            );
            
            const user = userCredential.user;
            
            // Update user profile with sanitized display name
            await updateProfile(user, {
                displayName: sanitizedName
            });
            
            // Save additional user data to Firestore
            await this.saveUserProfile(user.uid, {
                email: sanitizedEmail,
                displayName: sanitizedName,
                accessCode: sanitizedAccessCode,
                role: await this.determineUserRole(sanitizedAccessCode),
                createdAt: new Date().toISOString(),
                emailVerified: false,
                lastLogin: null,
                loginAttempts: 0
            });
            
            // Send email verification
            await sendEmailVerification(user);
            
            // Reset rate limiting on successful registration
            this.rateLimiter.reset(identifier);
            
            SecureToast.success(
                'Account created successfully! Please check your email to verify your account.', 
                'Registration Complete'
            );
            
            return { success: true, user: user };
            
        } catch (error) {
            // Record failed attempt
            this.rateLimiter.recordAttempt(`register_${email}`);
            
            console.error('Registration error:', error);
            let errorMessage = 'Registration failed. Please try again.';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'This email is already registered.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = 'Registration is currently disabled.';
                    break;
                default:
                    if (error.message.includes('rate')) {
                        errorMessage = 'Too many attempts. Please wait before trying again.';
                    }
            }
            
            SecureToast.error(errorMessage, 'Registration Error');
            return { success: false, error: errorMessage };
        }
    }
    
    /**
     * Rate-limited sign in with enhanced security
     */
    async signInWithEmail(email, password) {
        try {
            // Rate limiting check
            const identifier = `signin_${email}`;
            if (!this.rateLimiter.canAttempt(identifier)) {
                SecureToast.warning('Too many login attempts. Please try again later.', 'Rate Limited');
                return { success: false, error: 'Rate limit exceeded' };
            }
            
            // Input validation
            if (!InputValidator.validateEmail(email)) {
                return { success: false, error: 'Invalid email format' };
            }
            
            const sanitizedEmail = email.toLowerCase().trim();
            SecureToast.info('Signing you in...', 'Authentication');
            
            const userCredential = await signInWithEmailAndPassword(
                this.auth, 
                sanitizedEmail, 
                password
            );
            
            const user = userCredential.user;
            
            // Check if email is verified
            if (!user.emailVerified) {
                await this.signOut();
                SecureToast.warning('Please verify your email before signing in.', 'Email Required');
                return { success: false, error: 'Email not verified' };
            }
            
            // Update last login and reset login attempts
            await this.updateLoginStats(user.uid);
            
            // Load user profile and role
            await this.loadUserProfile(user.uid);
            await this.loadUserRole(user.uid);
            
            // Reset rate limiting on successful login
            this.rateLimiter.reset(identifier);
            
            SecureToast.success('Welcome back!', 'Login Successful');
            return { success: true, user: user };
            
        } catch (error) {
            // Record failed attempt
            this.rateLimiter.recordAttempt(`signin_${email}`);
            
            console.error('Sign in error:', error);
            let errorMessage = 'Login failed. Please check your credentials.';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many failed attempts. Please wait and try again.';
                    break;
                default:
                    if (error.message.includes('rate')) {
                        errorMessage = 'Too many attempts. Please wait before trying again.';
                    }
            }
            
            SecureToast.error(errorMessage, 'Login Error');
            return { success: false, error: errorMessage };
        }
    }
    
    /**
     * Update user login statistics
     */
    async updateLoginStats(uid) {
        try {
            const userDoc = await getDoc(doc(this.db, 'users', uid));
            if (userDoc.exists()) {
                await updateDoc(doc(this.db, 'users', uid), {
                    lastLogin: new Date().toISOString(),
                    loginAttempts: 0
                });
            }
        } catch (error) {
            console.error('Error updating login stats:', error);
        }
    }
    
    /**
     * Enhanced Google sign in with security measures
     */
    async signInWithGoogle() {
        try {
            SecureToast.info('Connecting with Google...', 'Authentication');
            
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            
            const userCredential = await signInWithPopup(this.auth, provider);
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
                    emailVerified: user.emailVerified,
                    lastLogin: new Date().toISOString()
                });
            } else {
                // Existing user - update login stats
                await this.updateLoginStats(user.uid);
                await this.loadUserProfile(user.uid);
                await this.loadUserRole(user.uid);
            }
            
            SecureToast.success('Signed in with Google successfully!', 'Welcome');
            return { success: true, user: user };
            
        } catch (error) {
            console.error('Google sign in error:', error);
            let errorMessage = 'Google sign in failed.';
            
            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    errorMessage = 'Sign in cancelled.';
                    break;
                case 'auth/popup-blocked':
                    errorMessage = 'Popup blocked. Please allow popups and try again.';
                    break;
                case 'auth/unauthorized-domain':
                    errorMessage = 'This domain is not authorized for Google sign in.';
                    break;
                default:
                    errorMessage = error.message;
            }
            
            SecureToast.error(errorMessage, 'Google Sign In Error');
            return { success: false, error: errorMessage };
        }
    }
    
    /**
     * Enhanced sign out with cleanup
     */
    async signOut() {
        try {
            await signOut(this.auth);
            this.currentUser = null;
            this.userRole = null;
            this.userProfile = null;
            
            // Clear any cached data
            this.clearUserCache();
            
            SecureToast.info('Signed out successfully.', 'Goodbye');
            this.notifyAuthStateChange('signed_out', null);
            
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            SecureToast.error('Error during sign out.', 'Sign Out Error');
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Clear user-specific cached data
     */
    clearUserCache() {
        // Clear rate limiting for the current user
        if (this.currentUser?.email) {
            this.rateLimiter.reset(`signin_${this.currentUser.email}`);
            this.rateLimiter.reset(`register_${this.currentUser.email}`);
        }
        
        // Clear any other cached user data
        sessionStorage.removeItem('dictamed_user_cache');
    }
    
    /**
     * Rate-limited password reset
     */
    async resetPassword(email) {
        try {
            // Rate limiting check
            const identifier = `reset_${email}`;
            if (!this.rateLimiter.canAttempt(identifier)) {
                SecureToast.warning('Too many password reset attempts. Please try again later.', 'Rate Limited');
                return { success: false, error: 'Rate limit exceeded' };
            }
            
            if (!InputValidator.validateEmail(email)) {
                return { success: false, error: 'Invalid email format' };
            }
            
            await sendPasswordResetEmail(this.auth, email.toLowerCase().trim());
            
            // Reset rate limiting on successful request
            this.rateLimiter.reset(identifier);
            
            SecureToast.success('Password reset email sent! Check your inbox.', 'Reset Sent');
            return { success: true };
        } catch (error) {
            // Record failed attempt
            this.rateLimiter.recordAttempt(`reset_${email}`);
            
            console.error('Password reset error:', error);
            let errorMessage = 'Password reset failed.';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many requests. Please wait and try again.';
                    break;
            }
            
            SecureToast.error(errorMessage, 'Reset Error');
            return { success: false, error: errorMessage };
        }
    }
    
    /**
     * Secure user profile management
     */
    async saveUserProfile(uid, profileData) {
        try {
            // Sanitize all profile data
            const sanitizedData = {};
            for (const [key, value] of Object.entries(profileData)) {
                if (typeof value === 'string') {
                    sanitizedData[key] = InputValidator.sanitizeInput(value);
                } else {
                    sanitizedData[key] = value;
                }
            }
            
            await setDoc(doc(this.db, 'users', uid), sanitizedData, { merge: true });
        } catch (error) {
            console.error('Error saving user profile:', error);
            throw new Error('Failed to save user profile');
        }
    }
    
    /**
     * Load user profile with error handling
     */
    async loadUserProfile(uid) {
        try {
            const userDoc = await getDoc(doc(this.db, 'users', uid));
            if (userDoc.exists()) {
                this.userProfile = userDoc.data();
            } else {
                this.userProfile = null;
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            this.userProfile = null;
        }
    }
    
    /**
     * Load user role with fallback
     */
    async loadUserRole(uid) {
        try {
            const userDoc = await getDoc(doc(this.db, 'users', uid));
            if (userDoc.exists()) {
                this.userRole = userDoc.data().role || 'user';
            } else {
                this.userRole = 'user';
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
            const userDoc = await getDoc(doc(this.db, 'users', uid));
            return userDoc.exists();
        } catch (error) {
            console.error('Error checking user profile:', error);
            return false;
        }
    }
    
    /**
     * Determine user role with enhanced security
     */
    async determineUserRole(accessCode) {
        // This should be replaced with a secure server-side role determination
        const adminAccessCodes = ['ADMIN123', 'MEDADMIN', 'SUPERUSER'];
        return adminAccessCodes.includes(accessCode) ? 'admin' : 'user';
    }
    
    /**
     * Enhanced user migration with validation
     */
    async migrateUser(existingUsername, existingAccessCode, newEmail, newPassword) {
        try {
            // Validate input
            if (!InputValidator.validateEmail(newEmail)) {
                return { success: false, error: 'Invalid email format' };
            }
            
            const passwordValidation = InputValidator.validatePassword(newPassword);
            if (!passwordValidation.valid) {
                return { success: false, error: passwordValidation.message };
            }
            
            if (!InputValidator.validateAccessCode(existingAccessCode)) {
                return { success: false, error: 'Invalid access code format' };
            }
            
            SecureToast.info('Migrating your account...', 'Migration');
            
            // Register the user with Firebase
            const result = await this.register(
                newEmail, 
                newPassword, 
                existingUsername, 
                existingAccessCode
            );
            
            if (result.success) {
                SecureToast.success(
                    `User ${existingUsername} migrated successfully!`, 
                    'Migration Complete'
                );
                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Migration error:', error);
            SecureToast.error('Migration failed. Please try again.', 'Migration Error');
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Getters
     */
    getCurrentUser() {
        return this.currentUser;
    }
    
    getCurrentUserRole() {
        return this.userRole;
    }
    
    getCurrentUserProfile() {
        return this.userProfile;
    }
    
    hasRole(requiredRole) {
        if (!this.userRole) return false;
        if (requiredRole === 'user') return true;
        return this.userRole === requiredRole;
    }
    
    isReady() {
        return this.isInitialized;
    }
    
    /**
     * Auth state change management
     */
    onAuthStateChange(callback) {
        this.authStateListeners.push(callback);
    }
    
    notifyAuthStateChange(state, user) {
        this.authStateListeners.forEach(callback => {
            try {
                callback(state, user);
            } catch (error) {
                console.error('Auth state listener error:', error);
            }
        });
    }
    
    /**
     * Update user profile with enhanced security
     */
    async updateUserProfile(updates) {
        try {
            if (!this.currentUser) {
                throw new Error('No authenticated user');
            }
            
            // Sanitize update data
            const sanitizedUpdates = {};
            for (const [key, value] of Object.entries(updates)) {
                if (typeof value === 'string') {
                    sanitizedUpdates[key] = InputValidator.sanitizeInput(value);
                } else {
                    sanitizedUpdates[key] = value;
                }
            }
            
            // Update Firebase Auth profile if needed
            if (sanitizedUpdates.displayName || sanitizedUpdates.photoURL) {
                await updateProfile(this.currentUser, {
                    displayName: sanitizedUpdates.displayName || this.currentUser.displayName,
                    photoURL: sanitizedUpdates.photoURL || this.currentUser.photoURL
                });
            }
            
            // Update Firestore profile
            await updateDoc(doc(this.db, 'users', this.currentUser.uid), sanitizedUpdates);
            
            // Reload profile
            await this.loadUserProfile(this.currentUser.uid);
            
            SecureToast.success('Profile updated successfully!', 'Profile Updated');
            return { success: true };
            
        } catch (error) {
            console.error('Update profile error:', error);
            SecureToast.error('Failed to update profile.', 'Update Error');
            return { success: false, error: error.message };
        }
    }
}

// Export singleton instance
export const secureFirebaseAuth = new SecureFirebaseAuthService();