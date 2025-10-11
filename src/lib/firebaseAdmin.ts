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

    if (serviceAccount && process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) {
      // Initialize with service account
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
      console.log('📍 Database URL:', process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL);
    } else {
      console.error('⚠️  Firebase Admin SDK not available');
      if (!serviceAccount) {
        console.error('⚠️  Add FIREBASE_SERVICE_ACCOUNT_KEY (file path) or FIREBASE_SERVICE_ACCOUNT_JSON (JSON string)');
      }
      if (!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) {
        console.error('⚠️  Add NEXT_PUBLIC_FIREBASE_DATABASE_URL to .env.local');
      }
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  }
}

// Safe exports - only create if app is properly initialized
let adminDb: admin.database.Database | null = null;
let adminAuth: admin.auth.Auth | null = null;

if (admin.apps.length > 0 && process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) {
  try {
    adminDb = admin.database();
    adminAuth = admin.auth();
  } catch (error) {
    console.error('⚠️  Failed to initialize Firebase Admin services:', error);
  }
}

export { adminDb, adminAuth };

// Helper function to check if admin SDK is available
export const isAdminAvailable = () => adminDb !== null;

// Helper function to store invoice
export async function storeInvoice(
  userId: string,
  invoiceId: string,
  invoiceData: {
    amount: number;
    currency: string;
    status: string;
    paidAt?: number;
    invoiceUrl?: string;
    invoicePdf?: string;
  }
): Promise<void> {
  if (!adminDb) {
    throw new Error('Firebase Admin SDK not initialized');
  }

  const invoiceRef = adminDb.ref(`users/${userId}/invoices/${invoiceId}`);
  
  await invoiceRef.set({
    ...invoiceData,
    createdAt: Date.now(),
  });
}
