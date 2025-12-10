// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);