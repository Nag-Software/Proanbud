import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}


// NOTE: CRITICAL - Phone authentication setup required:
// 1. Go to Firebase Console: https://console.firebase.google.com/
// 2. Select project: proanbudas
// 3. Go to Authentication → Sign-in method
// 4. Find "Phone" in the provider list
// 5. Click "Enable" and save
// 6. Add authorized domains (including localhost for development)
// 7. For production: Add your domain and configure reCAPTCHA settings
//
// Without this setup, you'll get: "auth/operation-not-allowed"
// The current setup uses automatic reCAPTCHA verification

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Realtime Database and get a reference to the service
export const db = getDatabase(app);

// Initialize Firestore and get a reference to the service
export const firestore = getFirestore(app);

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
    
    // Simple test: try to read from katalog (which has public read access)
    const testRef = ref(db, 'katalog');
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