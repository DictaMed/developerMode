/**
 * Firebase Configuration and Authentication
 * This file handles Firebase initialization and authentication services
 */

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB7drb3A3xL_JVZz_tLGtsRCc4ZZlFfSNQ",
  authDomain: "dictamed-2025.firebaseapp.com",
  projectId: "dictamed-2025",
  storageBucket: "dictamed-2025.firebasestorage.app",
  messagingSenderId: "565675197934",
  appId: "1:565675197934:web:d3bd5a9f86d274e581baff",
  measurementId: "G-R3MN277B7F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let analytics;

// Initialize analytics only in production
if (import.meta.env.PROD) {
  analytics = getAnalytics(app);
}

// Authentication state
let currentUser = null;
let authStateListeners = [];

// Initialize Firebase Auth and set up state listener
export function initFirebaseAuth() {
  console.log('🔥 Initializing Firebase Authentication...');

  return new Promise((resolve, reject) => {
    try {
      // Set up auth state listener
      onAuthStateChanged(auth, (user) => {
        currentUser = user;
        console.log('🔥 Auth state changed:', user ? 'User signed in' : 'No user');

        // Notify all listeners
        authStateListeners.forEach(callback => {
          try {
            callback(user);
          } catch (error) {
            console.error('Error in auth state listener:', error);
          }
        });

        if (user) {
          console.log('👤 User signed in:', user.email);
          resolve(user);
        } else {
          console.log('👤 No user signed in');
          resolve(null);
        }
      });
    } catch (error) {
      console.error('🔥 Firebase auth initialization error:', error);
      reject(error);
    }
  });
}

// Add auth state listener
export function onAuthStateChange(callback) {
  if (typeof callback === 'function') {
    authStateListeners.push(callback);

    // Call immediately with current state
    if (currentUser !== undefined) {
      callback(currentUser);
    }
  }
}

// Remove auth state listener
export function removeAuthStateListener(callback) {
  const index = authStateListeners.indexOf(callback);
  if (index > -1) {
    authStateListeners.splice(index, 1);
  }
}

// Sign in with email and password
export async function signInWithFirebase(email, password) {
  try {
    console.log('🔐 Attempting to sign in user:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('🎉 User signed in successfully:', user.email);
    return user;
  } catch (error) {
    console.error('🔥 Firebase sign-in error:', error);
    throw error;
  }
}

// Sign out current user
export async function signOutFromFirebase() {
  try {
    console.log('🔐 Signing out user...');
    await signOut(auth);
    console.log('🎉 User signed out successfully');
    return true;
  } catch (error) {
    console.error('🔥 Firebase sign-out error:', error);
    throw error;
  }
}

// Get current user
export function getCurrentUser() {
  return currentUser;
}

// Check if user is authenticated
export function isAuthenticated() {
  return currentUser !== null;
}

// Get user email if authenticated
export function getUserEmail() {
  return currentUser?.email || null;
}

// Get user UID if authenticated
export function getUserUID() {
  return currentUser?.uid || null;
}

// Firebase Auth Error Codes
export const FirebaseAuthErrorCodes = {
  INVALID_EMAIL: 'auth/invalid-email',
  USER_DISABLED: 'auth/user-disabled',
  USER_NOT_FOUND: 'auth/user-not-found',
  WRONG_PASSWORD: 'auth/wrong-password',
  EMAIL_ALREADY_IN_USE: 'auth/email-already-in-use',
  OPERATION_NOT_ALLOWED: 'auth/operation-not-allowed',
  TOO_MANY_ATTEMPTS: 'auth/too-many-requests',
  NETWORK_ERROR: 'auth/network-request-failed'
};

// Get user-friendly error message
export function getFirebaseErrorMessage(errorCode) {
  const messages = {
    [FirebaseAuthErrorCodes.INVALID_EMAIL]: '📧 Adresse email invalide',
    [FirebaseAuthErrorCodes.USER_DISABLED]: '🚫 Compte désactivé',
    [FirebaseAuthErrorCodes.USER_NOT_FOUND]: '👤 Utilisateur non trouvé',
    [FirebaseAuthErrorCodes.WRONG_PASSWORD]: '🔑 Mot de passe incorrect',
    [FirebaseAuthErrorCodes.EMAIL_ALREADY_IN_USE]: '📧 Email déjà utilisé',
    [FirebaseAuthErrorCodes.OPERATION_NOT_ALLOWED]: '🚫 Opération non autorisée',
    [FirebaseAuthErrorCodes.TOO_MANY_ATTEMPTS]: '⏳ Trop de tentatives. Veuillez réessayer plus tard',
    [FirebaseAuthErrorCodes.NETWORK_ERROR]: '🌐 Erreur réseau. Veuillez vérifier votre connexion'
  };

  return messages[errorCode] || '🔥 Erreur d\'authentification';
}

// Export auth object for direct access if needed
export { auth };