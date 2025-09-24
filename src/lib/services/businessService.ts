import { 
  ref,
  set,
  get,
  update,
  serverTimestamp,
} from 'firebase/database';
import { 
  uploadBytes, 
  getDownloadURL, 
  ref as storageRef,
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { BusinessSettings } from '@/lib/types';

// Helper function to ensure user is authenticated
const getCurrentUserId = (): string => {
  if (!auth.currentUser) {
    throw new Error('User not authenticated. Please log in.');
  }
  return auth.currentUser.uid;
};

// Get business settings from database
export const getBusinessSettings = async (): Promise<BusinessSettings | null> => {
  try {
    const userId = getCurrentUserId();
    const settingsRef = ref(db, `users/${userId}/businessSettings`);
    const snapshot = await get(settingsRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as BusinessSettings;
    }
    return null;
  } catch (error) {
    console.error('Failed to get business settings:', error);
    throw new Error('Kunne ikke hente bedriftsinnstillinger');
  }
};

// Save business settings to database
export const saveBusinessSettings = async (settings: Omit<BusinessSettings, 'lastUpdated' | 'createdAt'>): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const settingsRef = ref(db, `users/${userId}/businessSettings`);
    
    // Check if settings exist to determine if this is a new creation
    const snapshot = await get(settingsRef);
    const isNew = !snapshot.exists();
    
    // Remove undefined values to prevent Firebase errors
    const cleanSettings = Object.fromEntries(
      Object.entries(settings).filter(([_, value]) => value !== undefined)
    );
    
    const settingsWithTimestamp = {
      ...cleanSettings,
      lastUpdated: serverTimestamp(),
      ...(isNew && { createdAt: serverTimestamp() })
    };
    
    await set(settingsRef, settingsWithTimestamp);
  } catch (error) {
    console.error('Failed to save business settings:', error);
    throw new Error('Kunne ikke lagre bedriftsinnstillinger');
  }
};

// Update specific business settings
export const updateBusinessSettings = async (updates: Partial<BusinessSettings>): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const settingsRef = ref(db, `users/${userId}/businessSettings`);
    
    const updateData = {
      ...updates,
      lastUpdated: serverTimestamp()
    };
    
    await update(settingsRef, updateData);
  } catch (error) {
    console.error('Failed to update business settings:', error);
    throw new Error('Kunne ikke oppdatere bedriftsinnstillinger');
  }
};

// Upload logo and return the download URL
export const uploadBusinessLogo = async (file: File): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    const logoRef = storageRef(storage, `users/${userId}/business/logo`);
    
    // Upload file
    const snapshot = await uploadBytes(logoRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Failed to upload logo:', error);
    throw new Error('Kunne ikke laste opp logo');
  }
};

// Delete existing logo
export const deleteBusinessLogo = async (): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const logoRef = storageRef(storage, `users/${userId}/business/logo`);
    
    await deleteObject(logoRef);
  } catch (error: any) {
    // If file doesn't exist, that's okay
    if (error.code !== 'storage/object-not-found') {
      console.error('Failed to delete logo:', error);
      throw new Error('Kunne ikke slette logo');
    }
  }
};

// Initialize default business settings
export const initializeBusinessSettings = async (userData: { companyName?: string; email?: string }): Promise<BusinessSettings> => {
  try {
    const userId = getCurrentUserId();
    const settingsRef = ref(db, `users/${userId}/businessSettings`);
    
    // Check if settings already exist
    const snapshot = await get(settingsRef);
    if (snapshot.exists()) {
      return snapshot.val() as BusinessSettings;
    }
    
    const defaultSettings: BusinessSettings = {
      // Company Information
      companyName: userData.companyName || '',
      organizationNumber: '',
      address: '',
      postalCode: '',
      city: '',
      phone: '',
      email: userData.email || '',
      website: '',
      
      // Business Details
      foundedYear: new Date().getFullYear(),
      employeeCount: 1,
      industry: '',
      businessType: 'as',
      annualRevenue: 0,
      serviceAreas: [],
      specializations: [],
      
      // Branding
      primaryColor: '#1A4314',
      secondaryColor: '#A2E4B8',
      brandDescription: '',
      
      // Financial Settings
      currency: 'NOK',
      vatRate: 25,
      defaultPaymentTerms: 30,
      bankAccount: '',
      
      // Quote Settings
      quoteValidityDays: 30,
      quotePrefix: 'TIL',
      invoicePrefix: 'FAK',
      defaultQuoteNotes: '',
      
      // AI Settings
      aiEnabled: true,
      marketSegment: '',
      competitorAnalysis: '',
      pricingStrategy: 'medium',
      
      // Metadata
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    };
    
    await set(settingsRef, defaultSettings);
    return defaultSettings;
  } catch (error) {
    console.error('Failed to initialize business settings:', error);
    throw new Error('Kunne ikke initialisere bedriftsinnstillinger');
  }
};

// Get business info for AI context
export const getBusinessContextForAI = async (): Promise<string> => {
  try {
    const settings = await getBusinessSettings();
    if (!settings) return '';
    
    return `
Bedrift: ${settings.companyName}
Bransje: ${settings.industry}
Ansatte: ${settings.employeeCount}
Etablert: ${settings.foundedYear}
Spesialiseringer: ${settings.specializations.join(', ')}
Serviceareer: ${settings.serviceAreas.join(', ')}
Prising strategi: ${settings.pricingStrategy}
Markeds segment: ${settings.marketSegment}
    `.trim();
  } catch (error) {
    console.error('Failed to get business context for AI:', error);
    return '';
  }
};