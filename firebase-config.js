/**
 * Firebase Configuration for DictaMed
 * Configured with dictamed-2025 Firebase project
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    connectAuthEmulator 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    connectFirestoreEmulator 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration for DictaMed project
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

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// For development/testing - uncomment if using Firebase Emulator
/*
if (location.hostname === 'localhost') {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
}
*/

// Export the app instance if needed elsewhere
export default app;