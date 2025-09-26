import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBz12rJWnXLbcmC1NaHvymCZ0i4WowljtQ",
  authDomain: "movieshub-f7c9d.firebaseapp.com",
  projectId: "movieshub-f7c9d",
  storageBucket: "movieshub-f7c9d.firebasestorage.app",
  messagingSenderId: "234358986405",
  appId: "1:234358986405:web:0d3aa61caae4a04dd41f4c",
  measurementId: "G-B5G0G3KVW5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
