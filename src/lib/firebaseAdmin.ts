import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    let serviceAccount = null;

    // Try to load from JSON string (Production - Vercel)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      console.log('📦 Loading service account from JSON string');
    }
    // Try to load from file path (Development - Local)
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const keyPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      if (fs.existsSync(keyPath)) {
        const fileContent = fs.readFileSync(keyPath, 'utf8');
        serviceAccount = JSON.parse(fileContent);
        console.log('📄 Loading service account from file:', keyPath);
      } else {
        console.error('❌ Service account file not found:', keyPath);
      }
    }

    if (serviceAccount) {
      // Initialize with service account
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
    } else {
      console.error('⚠️  Firebase Admin SDK not available');
      console.error('⚠️  Add FIREBASE_SERVICE_ACCOUNT_KEY (file path) or FIREBASE_SERVICE_ACCOUNT_JSON (JSON string)');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  }
}

// Safe exports - only create if app is properly initialized
let firestore: admin.firestore.Firestore | null = null;
let auth: admin.auth.Auth | null = null;

if (admin.apps.length > 0) {
  try {
    firestore = admin.firestore();
    auth = admin.auth();
    console.log('✅ Firebase Admin services initialized successfully');
  } catch (error) {
    console.error('⚠️  Failed to initialize Firebase Admin services:', error);
    firestore = null;
    auth = null;
  }
} else {
  console.error('⚠️  Firebase Admin app not initialized, cannot create services');
}

export { firestore, auth };

// Export adminAuth as an alias for auth for backward compatibility
export const adminAuth = auth;

// Helper function to check if admin SDK is available
export const isAdminAvailable = () => firestore !== null;
