import { 
  ref,
  push,
  set,
  get,
  update,
  remove,
  query,
  orderByChild,
  limitToLast,
  equalTo,
  DataSnapshot,
  serverTimestamp,
  Database
} from 'firebase/database';
import { db, testFirebaseConnection } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { Kunde } from '@/lib/types';

export interface CustomerFormData {
  navn: string;
  epost: string;
  telefon: string;
  adresse?: string;
  postnummer?: string;
  poststed?: string;
  notater?: string;
}

export interface RealtimeCustomer extends Omit<Kunde, 'id' | 'sistAktivitet'> {
  sistAktivitet: number; // Unix timestamp in milliseconds
  opprettet: number;
  oppdatert: number;
}

export interface RealtimeCustomerInput extends Omit<Kunde, 'id' | 'sistAktivitet'> {
  sistAktivitet: number | object; // For server timestamps during creation
  opprettet: number | object;
  oppdatert: number | object;
}

// Helper function to get user-scoped path
const getUserPath = (userId: string, collection: string) => `users/${userId}/${collection}`;

// Helper function to ensure user is authenticated
const getCurrentUserId = (): string => {
  if (!auth.currentUser) {
    throw new Error('User not authenticated. Please log in.');
  }
  return auth.currentUser.uid;
};

// Convert Realtime Database data to Kunde type
const convertRealtimeCustomer = (key: string, data: RealtimeCustomer): Kunde => {
  if (!data) {
    throw new Error('Invalid customer data');
  }

  return {
    id: key,
    navn: data.navn,
    epost: data.epost,
    telefon: data.telefon,
    antallTilbud: data.antallTilbud || 0,
    antallVunnet: data.antallVunnet || 0,
    sistAktivitet: new Date(data.sistAktivitet).toISOString().split('T')[0], // Format as YYYY-MM-DD
    addresser: data.addresser || [],
    tilbud: data.tilbud || [],
  };
};

// Convert single snapshot to Kunde type
const convertSingleRealtimeCustomer = (snapshot: DataSnapshot): Kunde => {
  const data = snapshot.val() as RealtimeCustomer;
  
  if (!data || !snapshot.exists()) {
    throw new Error('Invalid customer data');
  }

  return {
    id: snapshot.key!,
    navn: data.navn,
    epost: data.epost,
    telefon: data.telefon,
    antallTilbud: data.antallTilbud || 0,
    antallVunnet: data.antallVunnet || 0,
    sistAktivitet: new Date(data.sistAktivitet).toISOString().split('T')[0], // Format as YYYY-MM-DD
    addresser: data.addresser || [],
    tilbud: data.tilbud || [],
  };
};

// Enhanced error handling function for Realtime Database
const handleDatabaseError = (error: any, operation: string): Error => {
  console.error(`Firebase Realtime Database ${operation} error:`, error);
  console.error('Error details:', {
    code: error.code,
    message: error.message,
    stack: error.stack
  });
  
  if (error.code) {
    switch (error.code) {
      case 'PERMISSION_DENIED':
        return new Error(`Ingen tilgang: Du har ikke tilgang til å ${operation}. Sjekk Database security rules.`);
      
      case 'NETWORK_ERROR':
        return new Error(`Nettverksfeil: Sjekk internettforbindelsen.`);
      
      case 'DISCONNECTED':
        return new Error(`Frakoblet: Database er midlertidig utilgjengelig.`);
        
      case 'DATA_STALE':
        return new Error(`Utdaterte data: Prøv å laste inn siden på nytt.`);
      
      case 'USER_CODE_EXCEPTION':
        return new Error(`Ugyldig input: Sjekk data som sendes inn.`);
      
      case 'INVALID_DATA':
        return new Error(`Ugyldig data: Data formatet er ikke støttet.`);
      
      default:
        return new Error(`Firebase feil (${error.code}): ${error.message || `Kunne ikke ${operation}`}`);
    }
  }
  
  // Check for network/connection issues
  if (error.message?.includes('network') || error.message?.includes('offline')) {
    return new Error(`Nettverksproblem: Sjekk internettforbindelsen og Firebase-konfigurasjonen.`);
  }
  
  // Generic error with more details
  return new Error(`Kunne ikke ${operation}: ${error.message || 'Ukjent feil'}`);
};

// Test connection before operations
const ensureConnection = async (): Promise<void> => {
  console.log('🔍 Checking Firebase Realtime Database connection...');
  
  const isConnected = await testFirebaseConnection();
  if (!isConnected) {
    console.error('❌ Firebase connection test failed');
    throw new Error('Firebase tilkobling feilet. Sjekk:\n1. Internettforbindelse\n2. Realtime Database er aktivert i Firebase Console\n3. Database security rules tillater tilgang\n4. Database URL er korrekt');
  }
  
  console.log('✅ Firebase connection verified');
};

// Create a new customer
export const createCustomer = async (customerData: CustomerFormData): Promise<string> => {
  try {
    // Test connection first
    await ensureConnection();
    
    // Get current user ID
    const userId = getCurrentUserId();
    
    const now = serverTimestamp();
    const newCustomer: Omit<RealtimeCustomerInput, 'id'> = {
      navn: customerData.navn.trim(),
      epost: customerData.epost.trim().toLowerCase(),
      telefon: customerData.telefon.trim(),
      antallTilbud: 0,
      antallVunnet: 0,
      addresser: customerData.adresse ? [
        `${customerData.adresse}${customerData.postnummer ? `, ${customerData.postnummer}` : ''}${customerData.poststed ? ` ${customerData.poststed}` : ''}`
      ] : [],
      tilbud: [],
      sistAktivitet: now,
      opprettet: now,
      oppdatert: now,
    };

    // Add optional fields if they exist
    if (customerData.notater?.trim()) {
      (newCustomer as any).notater = customerData.notater.trim();
    }

    // Add to user's Realtime Database path
    const customersRef = ref(db, getUserPath(userId, 'kunder'));
    const newCustomerRef = push(customersRef);
    await set(newCustomerRef, newCustomer);

    return newCustomerRef.key!;
  } catch (error) {
    throw handleDatabaseError(error, 'opprette kunde');
  }
};// Get all customers
export const getCustomers = async (): Promise<Kunde[]> => {
  try {
    // Test connection first
    await ensureConnection();

    // Get current user ID
    const userId = getCurrentUserId();

    const customersRef = ref(db, getUserPath(userId, 'kunder'));

    const snapshot = await get(customersRef);
    
    if (!snapshot.exists()) {
      return [];
    }

    const customers: Kunde[] = [];
    const customerData = snapshot.val() as Record<string, RealtimeCustomer>;
    
    // Convert to array and sort by creation date (descending)
    Object.entries(customerData)
      .sort(([, a], [, b]) => b.opprettet - a.opprettet)
      .forEach(([key, data]) => {
        try {
          customers.push(convertRealtimeCustomer(key, data));
        } catch (error) {
          console.warn('Skipping invalid customer data:', key, error);
        }
      });
    
    return customers;
  } catch (error) {
    throw handleDatabaseError(error, 'hente kunder');
  }
};

// Get customers with pagination
export const getCustomersPaginated = async (limitCount: number = 50): Promise<Kunde[]> => {
  try {
    await ensureConnection();

    // Get current user ID
    const userId = getCurrentUserId();

    const customersRef = ref(db, getUserPath(userId, 'kunder'));
    const snapshot = await get(customersRef);
    
    if (!snapshot.exists()) {
      return [];
    }

    const customers: Kunde[] = [];
    const customerData = snapshot.val() as Record<string, RealtimeCustomer>;
    
    // Convert to array and sort by creation date (descending), then limit results
    Object.entries(customerData)
      .sort(([, a], [, b]) => b.opprettet - a.opprettet)
      .slice(0, limitCount) // Apply limit after sorting
      .forEach(([key, data]) => {
        try {
          customers.push(convertRealtimeCustomer(key, data));
        } catch (error) {
          console.warn('Skipping invalid customer data:', key, error);
        }
      });
    
    return customers;
  } catch (error) {
    throw handleDatabaseError(error, 'hente kunder');
  }
};

// Search customers by name or email
export const searchCustomers = async (searchTerm: string): Promise<Kunde[]> => {
  try {
    await ensureConnection();
    
    // Get current user ID
    const userId = getCurrentUserId();
    
    const searchLower = searchTerm.toLowerCase();
    const customersRef = ref(db, getUserPath(userId, 'kunder'));
    const snapshot = await get(customersRef);
    
    if (!snapshot.exists()) {
      return [];
    }

    const customers: Kunde[] = [];
    const customerData = snapshot.val() as Record<string, RealtimeCustomer>;
    
    Object.entries(customerData).forEach(([key, data]) => {
      try {
        const customer = convertRealtimeCustomer(key, data);
        // Simple text search in name and email
        if (
          customer.navn.toLowerCase().includes(searchLower) ||
          customer.epost.toLowerCase().includes(searchLower)
        ) {
          customers.push(customer);
        }
      } catch (error) {
        console.warn('Skipping invalid customer data:', key, error);
      }
    });
    
    return customers;
  } catch (error) {
    throw handleDatabaseError(error, 'søke kunder');
  }
};

// Update customer
// Update a customer
export const updateCustomer = async (customerId: string, updates: Partial<CustomerFormData>): Promise<void> => {
  try {
    await ensureConnection();

    // Get current user ID
    const userId = getCurrentUserId();

    const customerRef = ref(db, `${getUserPath(userId, 'kunder')}/${customerId}`);
    
    const updateData: any = {
      oppdatert: serverTimestamp(),
    };

    // Add only the fields that are being updated
    if (updates.navn !== undefined) updateData.navn = updates.navn.trim();
    if (updates.epost !== undefined) updateData.epost = updates.epost.trim().toLowerCase();
    if (updates.telefon !== undefined) updateData.telefon = updates.telefon.trim();
    if (updates.notater !== undefined) updateData.notater = updates.notater?.trim() || null;

    await update(customerRef, updateData);
  } catch (error) {
    throw handleDatabaseError(error, 'oppdatere kunde');
  }
};// Delete a customer
export const deleteCustomer = async (customerId: string): Promise<void> => {
  try {
    await ensureConnection();

    // Get current user ID
    const userId = getCurrentUserId();

    const customerRef = ref(db, `${getUserPath(userId, 'kunder')}/${customerId}`);
    await remove(customerRef);
  } catch (error) {
    throw handleDatabaseError(error, 'slette kunde');
  }
};

// Update customer quote statistics (called when a quote is created/won)
export const updateCustomerQuoteStats = async (
  customerId: string, 
  increment: { tilbud?: number; vunnet?: number }
): Promise<void> => {
  try {
    await ensureConnection();
    
    // Get current user ID
    const userId = getCurrentUserId();
    
    const customerRef = ref(db, `${getUserPath(userId, 'kunder')}/${customerId}`);
    
    // Get current data first
    const snapshot = await get(customerRef);
    if (!snapshot.exists()) {
      throw new Error('Kunde ikke funnet');
    }

    const currentData = snapshot.val() as RealtimeCustomer;
    const updateData: any = {
      sistAktivitet: serverTimestamp(),
      oppdatert: serverTimestamp(),
    };

    // Update counters if provided
    if (increment.tilbud !== undefined) {
      updateData.antallTilbud = (currentData.antallTilbud || 0) + increment.tilbud;
    }
    if (increment.vunnet !== undefined) {
      updateData.antallVunnet = (currentData.antallVunnet || 0) + increment.vunnet;
    }
    
    await update(customerRef, updateData);
  } catch (error) {
    throw handleDatabaseError(error, 'oppdatere kundestatistikk');
  }
};