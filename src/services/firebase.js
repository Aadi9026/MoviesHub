import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBz12rJWnXLbcmC1NaHvymCZ0i4WowljtQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "movieshub-f7c9d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "movieshub-f7c9d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "movieshub-f7c9d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "234358986405",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:234358986405:web:0d3aa61caae4a04dd41f4c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-B5G0G3KVW5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
