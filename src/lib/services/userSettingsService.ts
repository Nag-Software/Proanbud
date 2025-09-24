import { 
  ref,
  set,
  get,
  update,
  serverTimestamp,
} from 'firebase/database';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';

export interface UserSettingsData {
  name: string;
  email: string;
  telefon: string;
  notifications: boolean;
  emailNotifications: boolean;
  language: string;
  timezone: string;
  lastUpdated?: number;
}

// Helper function to ensure user is authenticated
const getCurrentUserId = (): string => {
  if (!auth.currentUser) {
    throw new Error('User not authenticated. Please log in.');
  }
  return auth.currentUser.uid;
};

// Get user settings from database
export const getUserSettings = async (): Promise<UserSettingsData | null> => {
  try {
    const userId = getCurrentUserId();
    const settingsRef = ref(db, `users/${userId}/userSettings`);
    const snapshot = await get(settingsRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as UserSettingsData;
    }
    return null;
  } catch (error) {
    console.error('Failed to get user settings:', error);
    throw new Error('Kunne ikke hente brukerinnstillinger');
  }
};

// Save user settings to database
export const saveUserSettings = async (settings: Omit<UserSettingsData, 'lastUpdated'>): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const settingsRef = ref(db, `users/${userId}/userSettings`);
    
    const settingsWithTimestamp = {
      ...settings,
      lastUpdated: serverTimestamp()
    };
    
    await set(settingsRef, settingsWithTimestamp);
  } catch (error) {
    console.error('Failed to save user settings:', error);
    throw new Error('Kunne ikke lagre brukerinnstillinger');
  }
};

// Update specific user settings
export const updateUserSettings = async (updates: Partial<UserSettingsData>): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const settingsRef = ref(db, `users/${userId}/userSettings`);
    
    const updateData = {
      ...updates,
      lastUpdated: serverTimestamp()
    };
    
    await update(settingsRef, updateData);
  } catch (error) {
    console.error('Failed to update user settings:', error);
    throw new Error('Kunne ikke oppdatere brukerinnstillinger');
  }
};

// Initialize default user settings
export const initializeUserSettings = async (userData: { name: string; email: string }): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const settingsRef = ref(db, `users/${userId}/userSettings`);
    
    // Check if settings already exist
    const snapshot = await get(settingsRef);
    if (snapshot.exists()) {
      return; // Settings already exist, don't overwrite
    }
    
    const defaultSettings: UserSettingsData = {
      name: userData.name,
      email: userData.email,
      telefon: '',
      notifications: true,
      emailNotifications: true,
      language: 'no',
      timezone: 'Europe/Oslo',
      lastUpdated: Date.now()
    };
    
    await set(settingsRef, defaultSettings);
  } catch (error) {
    console.error('Failed to initialize user settings:', error);
    throw new Error('Kunne ikke initialisere brukerinnstillinger');
  }
};