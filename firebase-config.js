// Firebase configuration for DictaMed
// Using compat SDK for compatibility with existing code

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC9XYvHxbp3VW0PCW0W7xfoWuiMxsjoUZE",
  authDomain: "dictamed2025.firebaseapp.com",
  projectId: "dictamed2025",
  storageBucket: "dictamed2025.firebasestorage.app",
  messagingSenderId: "242034923776",
  appId: "1:242034923776:web:bd315e890c715b1d263be5",
  measurementId: "G-1B8DZ4B73R"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Analytics
const analytics = firebase.analytics();

// Make firebase available globally for compatibility
window.firebase = firebase;