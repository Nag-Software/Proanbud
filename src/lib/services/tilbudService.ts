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
import { Tilbud, PriceComponent } from '@/lib/types';
import { updateCustomerQuoteStats, getCustomers } from './customerService';
import { updateUserAnalytics } from './analyticsService';
import { createInboxMessage } from './inboxService';

// Get unique categories from all user's quotes
export const getUniqueCategoriesFromQuotes = async (): Promise<string[]> => {
  try {
    await ensureConnection();
    const userId = getCurrentUserId();
    
    const tilbudRef = ref(db, getUserPath(userId, 'tilbud'));
    const snapshot = await get(tilbudRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const categorySet = new Set<string>();
    
    // Add default categories
    const defaultCategories = ['materialer', 'arbeid', 'transport', 'utstyr', 'margin', 'annet'];
    defaultCategories.forEach(cat => categorySet.add(cat));
    
    // Extract categories from all quotes
    const tilbudData = snapshot.val() as Record<string, any>;
    Object.values(tilbudData).forEach((tilbud: any) => {
      if (tilbud.prisgrunnlag) {
        tilbud.prisgrunnlag.forEach((component: any) => {
          if (component.category && !defaultCategories.includes(component.category)) {
            categorySet.add(component.category);
          }
        });
      }
    });
    
    return Array.from(categorySet).sort();
  } catch (error) {
    console.warn('Could not load categories from quotes:', error);
    return ['materialer', 'arbeid', 'transport', 'utstyr', 'margin', 'annet'];
  }
};

export interface TilbudFormData {
  kundenavn: string;
  prosjekt: string;
  jobbtype: string;
  belop: number;
  status: 'draft' | 'venter' | 'vunnet' | 'tapt';
  dato: string;
  svarfrist: string;
  beskrivelse?: string;
  notater?: string;
  prisgrunnlag?: PriceComponent[];
  template?: string;
}

export interface RealtimeTilbud extends Omit<Tilbud, 'id'> {
  opprettet: number;
  oppdatert: number;
  userId: string;
}

export interface RealtimeTilbudInput extends Omit<Tilbud, 'id'> {
  opprettet: number | object;
  oppdatert: number | object;
  userId: string;
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

// Helper function to find customer ID by name
const findCustomerIdByName = async (customerName: string): Promise<string | null> => {
  try {
    const customers = await getCustomers();
    const customer = customers.find(c => c.navn.toLowerCase() === customerName.toLowerCase());
    return customer?.id || null;
  } catch (error) {
    console.warn('Could not find customer by name:', error);
    return null;
  }
};

// Convert Realtime Database data to Tilbud type
const convertRealtimeTilbud = (key: string, data: RealtimeTilbud): Tilbud => {
  if (!data) {
    throw new Error('Invalid tilbud data');
  }

  return {
    id: key,
    kundenavn: data.kundenavn,
    prosjekt: data.prosjekt,
    jobbtype: data.jobbtype,
    belop: data.belop,
    status: data.status,
    dato: data.dato,
    svarfrist: data.svarfrist,
    prisgrunnlag: (data as any).prisgrunnlag,
    viewToken: (data as any).viewToken, // Include viewToken for customer access
    userId: (data as any).userId, // Include userId for ownership
  };
};

// Convert single snapshot to Tilbud type
const convertSingleRealtimeTilbud = (snapshot: DataSnapshot): Tilbud => {
  const data = snapshot.val() as RealtimeTilbud;
  
  if (!data || !snapshot.exists()) {
    throw new Error('Invalid tilbud data');
  }

  return {
    id: snapshot.key!,
    kundenavn: data.kundenavn,
    prosjekt: data.jobbtype,
    jobbtype: data.jobbtype,
    belop: data.belop,
    status: data.status,
    dato: data.dato,
    svarfrist: data.svarfrist,
    prisgrunnlag: (data as any).prisgrunnlag,
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

// Helper function to generate a secure random token
const generateViewToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// Create a new tilbud
export const createTilbud = async (tilbudData: TilbudFormData): Promise<string> => {
  try {
    // Test connection first
    await ensureConnection();
    
    // Get current user ID
    const userId = getCurrentUserId();
    
    // Check subscription limits before creating quote
    try {
      const userRef = ref(db, `users/${userId}`);
      const userSnapshot = await get(userRef);
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        const subscription = userData.subscription;
        
        // Count existing quotes
        const quotesData = userData.tilbud || {};
        const quotesCount = Object.keys(quotesData).length;
        
        // Only enforce limits for non-pro plans
        if (subscription?.plan !== 'pro') {
          const plan = subscription?.plan || 'free';
          const { SUBSCRIPTION_PLANS } = await import('@/lib/stripe');
          const planDetails = SUBSCRIPTION_PLANS.find(p => p.id === plan);
          const quotesLimit = planDetails?.limits.quotes || 5;
          
          if (quotesLimit !== -1 && quotesCount >= quotesLimit) {
            const isTrialing = subscription?.plan === 'free' && subscription?.status === 'active' && !!subscription?.trialEnd;
            const planName = isTrialing ? 'prøveperiode' : plan === 'free' ? 'gratis prøveperiode' : plan + ' plan';
            throw new Error(`Du har nådd grensen på ${quotesLimit} tilbud for din ${planName}. Oppgrader for å opprette flere tilbud.`);
          }
        }
      }
    } catch (limitError) {
      console.warn('Could not verify subscription limits:', limitError);
      // Only throw if it's a limit error, not a technical error
      if (limitError instanceof Error && limitError.message.includes('grensen på')) {
        throw limitError;
      }
    }
    
    const now = serverTimestamp();
    const viewToken = generateViewToken(); // Generate unique token for customer access
    
    console.log('🔑 Generated viewToken for new quote:', viewToken);
    
    const newTilbud: Omit<RealtimeTilbudInput, 'id'> = {
      kundenavn: tilbudData.kundenavn.trim(),
      prosjekt: tilbudData.prosjekt.trim(),
      jobbtype: tilbudData.jobbtype,
      belop: tilbudData.belop,
      status: tilbudData.status,
      dato: tilbudData.dato,
      svarfrist: tilbudData.svarfrist,
      opprettet: now,
      oppdatert: now,
      userId: userId,
      viewToken: viewToken, // Add view token
    };

    // Add optional fields if they exist
    if (tilbudData.beskrivelse?.trim()) {
      (newTilbud as any).beskrivelse = tilbudData.beskrivelse.trim();
    }
    if (tilbudData.notater?.trim()) {
      (newTilbud as any).notater = tilbudData.notater.trim();
    }
    if (tilbudData.prisgrunnlag) {
      (newTilbud as any).prisgrunnlag = tilbudData.prisgrunnlag;
    }
    if (tilbudData.template) {
      (newTilbud as any).template = tilbudData.template;
    }

    // Add to user's Realtime Database path
    const tilbudRef = ref(db, getUserPath(userId, 'tilbud'));
    const newTilbudRef = push(tilbudRef);
    console.log('💾 Saving quote with ID:', newTilbudRef.key);
    console.log('💾 Quote data includes viewToken:', newTilbud.viewToken);
    await set(newTilbudRef, newTilbud);
    console.log('✅ Quote saved successfully');

    // Update customer statistics (increment tilbud count)
    try {
      const customerId = await findCustomerIdByName(tilbudData.kundenavn);
      if (customerId) {
        await updateCustomerQuoteStats(customerId, { tilbud: 1 });
      }
    } catch (error) {
      console.warn('Could not update customer quote stats:', error);
    }

    // Update analytics
    try {
      await updateUserAnalytics();
    } catch (error) {
      console.warn('Could not update user analytics:', error);
    }

    // Create inbox message for quote sent (only for non-draft quotes)
    if (tilbudData.status !== 'draft') {
      try {
        const customerId = await findCustomerIdByName(tilbudData.kundenavn);
        await createInboxMessage({
          from: tilbudData.kundenavn,
          subject: `Tilbud sendt: ${tilbudData.prosjekt}`,
          message: `Et nytt tilbud på ${tilbudData.belop.toLocaleString('nb-NO')} kr for prosjektet "${tilbudData.prosjekt}" har blitt sendt til ${tilbudData.kundenavn}.`,
          timestamp: new Date().toISOString(),
          isRead: false,
          quoteId: newTilbudRef.key!,
          customerId: customerId || undefined,
          type: 'quote_sent',
          customerName: tilbudData.kundenavn,
          quoteTitle: tilbudData.prosjekt,
        });
      } catch (error) {
        console.warn('Could not create inbox message:', error);
      }
    }

    const tilbudCountRef = ref(db, `users/${userId}/tilbudCount`);
    const tilbudSnapshot = await get(tilbudCountRef);
    if(tilbudSnapshot.exists()) {
      const currentCount = tilbudSnapshot.val() as number;
      await set(tilbudCountRef, currentCount + 1);
    }

    return newTilbudRef.key!;
  } catch (error) {
    throw handleDatabaseError(error, 'opprette tilbud');
  }
};

// Get tilbud by ID
export const getTilbudById = async (tilbudId: string): Promise<Tilbud | null> => {
  try {
    await ensureConnection();
    const userId = getCurrentUserId();

    const tilbudRef = ref(db, `${getUserPath(userId, 'tilbud')}/${tilbudId}`);
    console.log('🔍 Fetching quote from path:', `${getUserPath(userId, 'tilbud')}/${tilbudId}`);
    const snapshot = await get(tilbudRef);
    
    if (!snapshot.exists()) {
      console.log('❌ Quote not found');
      return null;
    }

    const rawData = snapshot.val() as RealtimeTilbud;
    console.log('📦 Raw quote data:', rawData);
    console.log('🔑 ViewToken in raw data:', (rawData as any).viewToken);
    
    const converted = convertRealtimeTilbud(tilbudId, rawData);
    console.log('✅ Converted quote:', converted);
    console.log('🔑 ViewToken in converted quote:', converted.viewToken);
    
    return converted;
  } catch (error) {
    throw handleDatabaseError(error, 'hente tilbud');
  }
};

// Get all tilbud
export const getTilbud = async (): Promise<Tilbud[]> => {
  try {
    // Test connection first
    await ensureConnection();

    // Get current user ID
    const userId = getCurrentUserId();

    const tilbudRef = ref(db, getUserPath(userId, 'tilbud'));
    const snapshot = await get(tilbudRef);
    
    if (!snapshot.exists()) {
      return [];
    }

    const tilbud: Tilbud[] = [];
    const tilbudData = snapshot.val() as Record<string, RealtimeTilbud>;
    
    // Convert to array and sort by last modified date (descending)
    Object.entries(tilbudData)
      .sort(([, a], [, b]) => {
        const aDate = a.oppdatert || a.opprettet;
        const bDate = b.oppdatert || b.opprettet;
        return bDate - aDate;
      })
      .forEach(([key, data]) => {
        try {
          tilbud.push(convertRealtimeTilbud(key, data));
        } catch (error) {
          console.warn('Skipping invalid tilbud data:', key, error);
        }
      });
    
    return tilbud;
  } catch (error) {
    throw handleDatabaseError(error, 'hente tilbud');
  }
};

// Get tilbud with pagination
export const getTilbudPaginated = async (limitCount: number = 50): Promise<Tilbud[]> => {
  try {
    await ensureConnection();

    // Get current user ID
    const userId = getCurrentUserId();

    const tilbudRef = ref(db, getUserPath(userId, 'tilbud'));
    const snapshot = await get(tilbudRef);
    
    if (!snapshot.exists()) {
      return [];
    }

    const tilbud: Tilbud[] = [];
    const tilbudData = snapshot.val() as Record<string, RealtimeTilbud>;
    
    // Convert to array and sort by last modified date (descending), then limit results
    Object.entries(tilbudData)
      .sort(([, a], [, b]) => {
        const aDate = a.oppdatert || a.opprettet;
        const bDate = b.oppdatert || b.opprettet;
        return bDate - aDate;
      })
      .slice(0, limitCount) // Apply limit after sorting
      .forEach(([key, data]) => {
        try {
          tilbud.push(convertRealtimeTilbud(key, data));
        } catch (error) {
          console.warn('Skipping invalid tilbud data:', key, error);
        }
      });
    
    return tilbud;
  } catch (error) {
    throw handleDatabaseError(error, 'hente tilbud');
  }
};

// Search tilbud by customer name or project
export const searchTilbud = async (searchTerm: string): Promise<Tilbud[]> => {
  try {
    await ensureConnection();
    
    // Get current user ID
    const userId = getCurrentUserId();
    
    const searchLower = searchTerm.toLowerCase();
    const tilbudRef = ref(db, getUserPath(userId, 'tilbud'));
    const snapshot = await get(tilbudRef);
    
    if (!snapshot.exists()) {
      return [];
    }

    const tilbud: Tilbud[] = [];
    const tilbudData = snapshot.val() as Record<string, RealtimeTilbud>;
    
    Object.entries(tilbudData).forEach(([key, data]) => {
      try {
        const tilbudItem = convertRealtimeTilbud(key, data);
        // Simple text search in customer name and project
        if (
          tilbudItem.kundenavn.toLowerCase().includes(searchLower) ||
          tilbudItem.prosjekt.toLowerCase().includes(searchLower)
        ) {
          tilbud.push(tilbudItem);
        }
      } catch (error) {
        console.warn('Skipping invalid tilbud data:', key, error);
      }
    });
    
    return tilbud;
  } catch (error) {
    throw handleDatabaseError(error, 'søke tilbud');
  }
};

// Update a tilbud
export const updateTilbud = async (tilbudId: string, updates: Partial<TilbudFormData>): Promise<void> => {
  try {
    await ensureConnection();

    // Get current user ID
    const userId = getCurrentUserId();

    const tilbudRef = ref(db, `${getUserPath(userId, 'tilbud')}/${tilbudId}`);
    
    const updateData: any = {
      oppdatert: serverTimestamp(),
    };

    // Add only the fields that are being updated
    if (updates.kundenavn !== undefined) updateData.kundenavn = updates.kundenavn.trim();
    if (updates.prosjekt !== undefined) updateData.prosjekt = updates.prosjekt.trim();
    if (updates.jobbtype !== undefined) updateData.jobbtype = updates.jobbtype;
    if (updates.belop !== undefined) updateData.belop = updates.belop;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.dato !== undefined) updateData.dato = updates.dato;
    if (updates.svarfrist !== undefined) updateData.svarfrist = updates.svarfrist;
    if (updates.beskrivelse !== undefined) updateData.beskrivelse = updates.beskrivelse?.trim() || null;
    if (updates.notater !== undefined) updateData.notater = updates.notater?.trim() || null;
    if (updates.prisgrunnlag !== undefined) updateData.prisgrunnlag = updates.prisgrunnlag;
    if (updates.template !== undefined) updateData.template = updates.template;

    // Get current data to check status change and update stats accordingly
    let shouldUpdateStats = false;
    let customerName = '';
    let oldStatus: 'draft' | 'venter' | 'vunnet' | 'tapt' | null = null;
    let newStatus: 'draft' | 'venter' | 'vunnet' | 'tapt' | null = null;
    
    if (updates.status !== undefined) {
      const snapshot = await get(tilbudRef);
      if (snapshot.exists()) {
        const currentData = snapshot.val() as RealtimeTilbud;
        oldStatus = currentData.status;
        newStatus = updates.status;
        
        // Only update stats if status is actually changing
        if (oldStatus !== newStatus) {
          shouldUpdateStats = true;
          customerName = updates.kundenavn || currentData.kundenavn;
        }
      }
    }

    await update(tilbudRef, updateData);

    // Update customer statistics based on status changes
    if (shouldUpdateStats && customerName && oldStatus && newStatus) {
      try {
        const customerId = await findCustomerIdByName(customerName);
        if (customerId) {
          const statsUpdate: { vunnet?: number } = {};
          
          // Handle transitions from vunnet to other statuses (decrement vunnet count)
          if (oldStatus === 'vunnet' && newStatus !== 'vunnet') {
            statsUpdate.vunnet = -1;
          }
          
          // Handle transitions to vunnet from other statuses (increment vunnet count)
          if (oldStatus !== 'vunnet' && newStatus === 'vunnet') {
            statsUpdate.vunnet = 1;
          }
          
          // Only update if there are actual changes to make
          if (Object.keys(statsUpdate).length > 0) {
            await updateCustomerQuoteStats(customerId, statsUpdate);
          }
        }
      } catch (error) {
        console.warn('Could not update customer quote stats:', error);
      }
    }

    // Update analytics
    try {
      await updateUserAnalytics();
    } catch (error) {
      console.warn('Could not update user analytics:', error);
    }
  } catch (error) {
    throw handleDatabaseError(error, 'oppdatere tilbud');
  }
};

// Delete a tilbud
export const deleteTilbud = async (tilbudId: string): Promise<void> => {
  try {
    await ensureConnection();

    // Get current user ID
    const userId = getCurrentUserId();

    const tilbudRef = ref(db, `${getUserPath(userId, 'tilbud')}/${tilbudId}`);
    
    // Get current data before deletion to update customer stats
    const snapshot = await get(tilbudRef);
    let shouldDecrementStats = false;
    let customerName = '';
    let wasVunnet = false;
    
    if (snapshot.exists()) {
      const currentData = snapshot.val() as RealtimeTilbud;
      shouldDecrementStats = true;
      customerName = currentData.kundenavn;
      wasVunnet = currentData.status === 'vunnet';
    }
    
    await remove(tilbudRef);
    
    // Update customer statistics (decrement counts)
    if (shouldDecrementStats && customerName) {
      try {
        const customerId = await findCustomerIdByName(customerName);
        if (customerId) {
          const decrementData: { tilbud?: number; vunnet?: number } = { tilbud: -1 };
          if (wasVunnet) {
            decrementData.vunnet = -1;
          }
          await updateCustomerQuoteStats(customerId, decrementData);
        }
      } catch (error) {
        console.warn('Could not update customer quote stats after deletion:', error);
      }
    }

    // Update analytics
    try {
      await updateUserAnalytics();
    } catch (error) {
      console.warn('Could not update user analytics:', error);
    }
  } catch (error) {
    throw handleDatabaseError(error, 'slette tilbud');
  }
};

// Get tilbud by status
export const getTilbudByStatus = async (status: 'venter' | 'vunnet' | 'tapt'): Promise<Tilbud[]> => {
  try {
    await ensureConnection();
    
    // Get current user ID
    const userId = getCurrentUserId();
    
    const tilbudRef = ref(db, getUserPath(userId, 'tilbud'));
    const snapshot = await get(tilbudRef);
    
    if (!snapshot.exists()) {
      return [];
    }

    const tilbud: Tilbud[] = [];
    const tilbudData = snapshot.val() as Record<string, RealtimeTilbud>;
    
    // Filter by status and sort by last modified date (descending)
    Object.entries(tilbudData)
      .filter(([, data]) => data.status === status)
      .sort(([, a], [, b]) => {
        const aDate = a.oppdatert || a.opprettet;
        const bDate = b.oppdatert || b.opprettet;
        return bDate - aDate;
      })
      .forEach(([key, data]) => {
        try {
          tilbud.push(convertRealtimeTilbud(key, data));
        } catch (error) {
          console.warn('Skipping invalid tilbud data:', key, error);
        }
      });
    
    return tilbud;
  } catch (error) {
    throw handleDatabaseError(error, 'hente tilbud etter status');
  }
};

// Get analytics data for tilbud
export const getTilbudAnalytics = async () => {
  try {
    await ensureConnection();
    
    // Get current user ID
    const userId = getCurrentUserId();
    
    const tilbudRef = ref(db, getUserPath(userId, 'tilbud'));
    const snapshot = await get(tilbudRef);
    
    if (!snapshot.exists()) {
      return {
        totalTilbud: 0,
        vunnetTilbud: 0,
        ventendeTilbud: 0,
        tapteTilbud: 0,
        totalVerdi: 0,
        vunnetVerdi: 0,
        treffprosent: 0
      };
    }

    const tilbudData = snapshot.val() as Record<string, RealtimeTilbud>;
    
    let totalTilbud = 0;
    let vunnetTilbud = 0;
    let ventendeTilbud = 0;
    let tapteTilbud = 0;
    let totalVerdi = 0;
    let vunnetVerdi = 0;
    
    Object.values(tilbudData).forEach((data) => {
      totalTilbud++;
      totalVerdi += data.belop;
      
      switch (data.status) {
        case 'vunnet':
          vunnetTilbud++;
          vunnetVerdi += data.belop;
          break;
        case 'venter':
          ventendeTilbud++;
          break;
        case 'tapt':
          tapteTilbud++;
          break;
      }
    });
    
    const treffprosent = totalTilbud > 0 ? Math.round((vunnetTilbud / totalTilbud) * 100) : 0;
    
    return {
      totalTilbud,
      vunnetTilbud,
      ventendeTilbud,
      tapteTilbud,
      totalVerdi,
      vunnetVerdi,
      treffprosent
    };
  } catch (error) {
    throw handleDatabaseError(error, 'hente tilbud-analyser');
  }
};

// Add viewToken to an existing quote that doesn't have one
export const ensureViewToken = async (tilbudId: string): Promise<string> => {
  try {
    await ensureConnection();
    const userId = getCurrentUserId();

    const tilbudRef = ref(db, `${getUserPath(userId, 'tilbud')}/${tilbudId}`);
    const snapshot = await get(tilbudRef);
    
    if (!snapshot.exists()) {
      throw new Error('Quote not found');
    }

    const data = snapshot.val() as RealtimeTilbud;
    
    // If viewToken already exists, return it
    if ((data as any).viewToken) {
      console.log('✅ ViewToken already exists:', (data as any).viewToken);
      return (data as any).viewToken;
    }

    // Generate and save new viewToken
    const viewToken = generateViewToken();
    console.log('🔑 Generating new viewToken for existing quote:', viewToken);
    
    await update(tilbudRef, { viewToken });
    console.log('✅ ViewToken saved successfully');
    
    return viewToken;
  } catch (error) {
    throw handleDatabaseError(error, 'legge til viewToken');
  }
};