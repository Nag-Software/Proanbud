import { 
  ref,
  set,
  get,
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
  dashboardLayout?: any[];
  dashboardLayoutMobile?: any[];
  kunderCount?: number;
  tilbudCount?: number;
  lastUpdated?: number;
}

// Helper function to ensure user is authenticated
const getCurrentUserId = (): string | null => {
  if (!auth.currentUser) {
    console.warn('User not authenticated when trying to access user settings');
    return null;
  }
  return auth.currentUser.uid;
};

// Get user settings from database
export const getUserSettings = async (userId?: string): Promise<UserSettingsData | null> => {
  try {
    const uid = userId || getCurrentUserId();
    if (!uid) {
      console.warn('Cannot get user settings: user not authenticated');
      return null;
    }
    
    const settingsRef = ref(db, `users/${uid}/userSettings`);
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
export const saveUserSettings = async (settings: Omit<UserSettingsData, 'lastUpdated'>, userId?: string): Promise<void> => {
  try {
    const uid = userId || getCurrentUserId();
    if (!uid) {
      console.warn('Cannot save user settings: user not authenticated');
      throw new Error('User not authenticated. Please log in.');
    }
    
    const settingsRef = ref(db, `users/${uid}/userSettings`);
    
    // Remove undefined values - Firebase doesn't allow them
    const cleanSettings = Object.entries(settings).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      } else {
        // Convert undefined to empty string for string fields
        acc[key] = '';
      }
      return acc;
    }, {} as any);
    
    const settingsWithTimestamp = {
      ...cleanSettings,
      lastUpdated: serverTimestamp()
    };
    
    console.log('Saving user settings to:', `users/${uid}/userSettings`, settingsWithTimestamp);
    await set(settingsRef, settingsWithTimestamp);
    console.log('User settings saved successfully');
  } catch (error) {
    console.error('Failed to save user settings:', error);
    throw new Error('Kunne ikke lagre brukerinnstillinger');
  }
};

// Update specific user settings
export const updateUserSettings = async (updates: Partial<UserSettingsData>, userId?: string): Promise<void> => {
  try {
    const uid = userId || getCurrentUserId();
    if (!uid) {
      console.warn('Cannot update user settings: user not authenticated');
      throw new Error('User not authenticated. Please log in.');
    }
    
    const settingsRef = ref(db, `users/${uid}/userSettings`);
    
    // Get current settings to merge with updates
    const currentSnapshot = await get(settingsRef);
    const currentData = currentSnapshot.exists() ? currentSnapshot.val() : {};
    
    const updatedData = {
      ...currentData,
      ...updates,
      lastUpdated: serverTimestamp()
    };
    
    await set(settingsRef, updatedData);
  } catch (error) {
    console.error('Failed to update user settings:', error);
    throw new Error('Kunne ikke oppdatere brukerinnstillinger');
  }
};

// Initialize default user settings
export const initializeUserSettings = async (userData: { name: string; email: string }, userId?: string): Promise<void> => {
  try {
    const uid = userId || getCurrentUserId();
    if (!uid) {
      console.warn('Cannot initialize user settings: user not authenticated');
      return;
    }
    
    const settingsRef = ref(db, `users/${uid}/userSettings`);
    
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
      dashboardLayout: [
        { i: 'kpi-cards', x: 0, y: 0, w: 12, h: 4, minH: 4 },
        { i: 'main-chart', x: 0, y: 4, w: 9, h: 14, minH: 6 },
        { i: 'quick-stats', x: 3, y: 18, w: 6, h: 8, minH: 4 },
        { i: 'activity-feed', x: 9, y: 4, w: 3, h: 22, minH: 4 },
        { i: 'pie-chart', x: 0, y: 18, w: 3, h: 8, minH: 4 },
        { i: 'quotes-table', x: 0, y: 26, w: 7, h: 12, minH: 6 },
        { i: 'customers-table', x: 7, y: 26, w: 5, h: 12, minH: 6 },
      ],
      dashboardLayoutMobile: [
        { i: 'kpi-cards', x: 0, y: 0, w: 12, h: 4, minH: 4 },
        { i: 'main-chart', x: 0, y: 4, w: 12, h: 14, minH: 6 },
        { i: 'activity-feed', x: 0, y: 18, w: 12, h: 10, minH: 4 },
        { i: 'pie-chart', x: 0, y: 28, w: 12, h: 8, minH: 4 },
        { i: 'quick-stats', x: 0, y: 36, w: 12, h: 8, minH: 4 },
        { i: 'quotes-table', x: 0, y: 44, w: 12, h: 12, minH: 6 },
        { i: 'customers-table', x: 0, y: 56, w: 12, h: 12, minH: 6 },
      ],
      kunderCount: 0,
      tilbudCount: 0,
      lastUpdated: Date.now()
    };
    
    await set(settingsRef, defaultSettings);
  } catch (error) {
    console.error('Failed to initialize user settings:', error);
    throw new Error('Kunne ikke initialisere brukerinnstillinger');
  }
};