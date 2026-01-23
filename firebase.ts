
// Standard modular Firebase imports for v9+
// Fix: Ensure named imports are properly resolved from the modular SDK.
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuration using environment variables.
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.VITE_FIREBASE_APP_ID || ""
};

// Initialize Firebase instance
// Fix: initializeApp is a named export from 'firebase/app' in modular SDK (v9+).
const app = initializeApp(firebaseConfig);

// Export service instances for use in the application
export const db = getFirestore(app);
export const storage = getStorage(app);
