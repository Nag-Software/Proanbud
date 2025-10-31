import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    let serviceAccount = null;

    // Try to load from JSON string (Production - Vercel) OR a path provided in the same var.
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      // If the env var looks like a path (ends with .json or starts with ./ or /), treat it as a file path.
      const looksLikePath = typeof raw === 'string' && /(^\.|\.json$|^\\|^\/)/i.test(raw);
      if (!looksLikePath) {
        try {
          serviceAccount = JSON.parse(raw);
          console.log('📦 Loading service account from JSON string');
        } catch (parseErr) {
          console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_JSON is set but not valid JSON. Will try to treat it as a file path. Error:', String(parseErr));
        }
      }

      // If parsing failed or the var looked like a path, try to read it as a file path
      if (!serviceAccount) {
        try {
          const keyPath = path.resolve(process.cwd(), raw);
          if (fs.existsSync(keyPath)) {
            const fileContent = fs.readFileSync(keyPath, 'utf8');
            serviceAccount = JSON.parse(fileContent);
            console.log('� Loading service account from file (via FIREBASE_SERVICE_ACCOUNT_JSON):', keyPath);
          } else {
            console.error('❌ Service account file not found at path from FIREBASE_SERVICE_ACCOUNT_JSON:', keyPath);
          }
        } catch (fileErr) {
          console.error('❌ Failed to read/parse service account from FIREBASE_SERVICE_ACCOUNT_JSON path:', String(fileErr));
        }
      }
    }
    // Try to load from file path (Development - Local)
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const keyPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        if (fs.existsSync(keyPath)) {
          const fileContent = fs.readFileSync(keyPath, 'utf8');
          serviceAccount = JSON.parse(fileContent);
          console.log('📄 Loading service account from file (FIREBASE_SERVICE_ACCOUNT_KEY):', keyPath);
        } else {
          console.error('❌ Service account file not found:', keyPath);
        }
      } catch (err) {
        console.error('❌ Failed to read/parse service account from FIREBASE_SERVICE_ACCOUNT_KEY:', String(err));
      }
    }

    if (serviceAccount) {
      // Initialize with service account
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://proanbudas-default-rtdb.europe-west1.firebasedatabase.app",
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
let database: admin.database.Database | null = null;

if (admin.apps.length > 0) {
  try {
    firestore = admin.firestore();
    auth = admin.auth();
    // Try to initialize database with explicit URL
    database = admin.database();
    console.log('✅ Firebase Admin services initialized successfully');
  } catch (error) {
    console.error('⚠️  Failed to initialize Firebase Admin services:', error);
    firestore = null;
    auth = null;
    database = null;
  }
} else {
  console.error('⚠️  Firebase Admin app not initialized, cannot create services');
}

export { firestore, auth, database };

// Export adminAuth as an alias for auth for backward compatibility
export const adminAuth = auth;

// Helper function to check if admin SDK is available
export const isAdminAvailable = () => firestore !== null;
