import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDXggpEr1zpGNq5IHQUVsYPousdxmg4_9Q",
    authDomain: "ping-social-app.firebaseapp.com",
    projectId: "ping-social-app",
    storageBucket: "ping-social-app.firebasestorage.app",
    messagingSenderId: "709206099352",
    appId: "1:709206099352:web:d643bde62436a6ed8ed7ed",
    measurementId: "G-V9MTXNME8X"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

export default app; 