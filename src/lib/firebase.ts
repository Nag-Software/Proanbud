import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAhSC5u_d12f2Y5GipOAD6TDEOWPlwDBVs",
  authDomain: "proanbudas.firebaseapp.com",
  databaseURL: "https://proanbudas-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "proanbudas",
  storageBucket: "proanbudas.firebasestorage.app",
  messagingSenderId: "956288932829",
  appId: "1:956288932829:web:5ac25a69767f31ed507434",
  measurementId: "G-B35G6SB47M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Realtime Database and get a reference to the service
export const db = getDatabase(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

// Configure Realtime Database settings for better reliability
if (typeof window !== 'undefined') {
  // Only run this in the browser
  try {
    // Realtime Database has built-in offline persistence
    // No additional configuration needed for offline support
  } catch (err) {
    console.warn('Firebase Realtime Database setup failed:', err);
  }
}

// Test Firebase Realtime Database connection
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing Firebase Realtime Database connection...');
    
    // Import Firebase database functions
    const { ref, get } = await import('firebase/database');
    
    // Simple test: try to read from the root (even if it's empty)
    const testRef = ref(db, 'connectionTest');
    await get(testRef);
    
    return true;

  } catch (error: any) {
    console.error('Firebase Realtime Database connection test failed:', error);
    
    // Log specific error details
    if (error.code) {
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
    }
    
    return false;
  }
};

export default app;