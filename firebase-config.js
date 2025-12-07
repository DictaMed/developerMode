// Firebase Configuration for DictaMed
// Your web app's Firebase configuration
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
firebase.initializeApp(firebaseConfig);

// Make Firebase available globally
window.firebase = firebase;