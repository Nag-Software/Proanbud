import { 
  ref,
  set,
  get,
  update,
  serverTimestamp,
  onValue,
  off,
  DataSnapshot,
} from 'firebase/database';
import { db, testFirebaseConnection } from '@/lib/firebase';
import { auth } from '@/lib/firebase';

// Analytics interfaces
export interface UserAnalytics {
  totalCustomers: number;
  totalTilbud: number;
  vunnetTilbud: number;
  totalRevenue: number;
  winRate: number;
  lastUpdated: number;
  monthlyData: MonthlyData[];
  dailyData?: DailyData[]; // Optional daily data for short periods
  jobbypeStats: JobbtypeStats[];
}

export interface MonthlyData {
  month: string;
  year: number;
  omsatt: number;
  tilbudt: number;
  antallTilbud: number;
  antallVunnet: number;
}

export interface DailyData {
  date: string; // Format: "24. sep"
  fullDate: string; // Format: "2025-09-24"
  omsatt: number;
  tilbudt: number;
  antallTilbud: number;
  antallVunnet: number;
}

export interface JobbtypeStats {
  jobbtype: string;
  antallTilbud: number;
  antallVunnet: number;
  treffprosent: number;
  totalVerdi: number;
  vunnetVerdi: number;
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

// Calculate and update user analytics
export const updateUserAnalytics = async (): Promise<void> => {
  try {
    await ensureConnection();
    
    // Get current user ID
    const userId = getCurrentUserId();
    
    // Get customers data
    const customersRef = ref(db, getUserPath(userId, 'kunder'));
    const customersSnapshot = await get(customersRef);
    
    // Get tilbud data
    const tilbudRef = ref(db, getUserPath(userId, 'tilbud'));
    const tilbudSnapshot = await get(tilbudRef);
    
    let totalCustomers = 0;
    let totalTilbud = 0;
    let vunnetTilbud = 0;
    let totalRevenue = 0;
    const monthlyDataMap = new Map<string, MonthlyData>();
    const jobbypeStatsMap = new Map<string, JobbtypeStats>();
    
    // Process customers
    if (customersSnapshot.exists()) {
      const customersData = customersSnapshot.val();
      totalCustomers = Object.keys(customersData).length;
    }
    
    // Process tilbud
    if (tilbudSnapshot.exists()) {
      const tilbudData = tilbudSnapshot.val();
      
      Object.values(tilbudData).forEach((tilbud: any) => {
        totalTilbud++;
        
        // Monthly data
        const date = new Date(tilbud.dato);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const monthName = date.toLocaleDateString('nb-NO', { month: 'short' });
        
        if (!monthlyDataMap.has(monthKey)) {
          monthlyDataMap.set(monthKey, {
            month: monthName,
            year: date.getFullYear(),
            omsatt: 0,
            tilbudt: 0,
            antallTilbud: 0,
            antallVunnet: 0,
          });
        }
        
        const monthData = monthlyDataMap.get(monthKey)!;
        monthData.antallTilbud++;
        monthData.tilbudt += tilbud.belop;
        
        // Jobbtype statistics
        if (!jobbypeStatsMap.has(tilbud.jobbtype)) {
          jobbypeStatsMap.set(tilbud.jobbtype, {
            jobbtype: tilbud.jobbtype,
            antallTilbud: 0,
            antallVunnet: 0,
            treffprosent: 0,
            totalVerdi: 0,
            vunnetVerdi: 0,
          });
        }
        
        const jobbypeStats = jobbypeStatsMap.get(tilbud.jobbtype)!;
        jobbypeStats.antallTilbud++;
        jobbypeStats.totalVerdi += tilbud.belop;
        
        if (tilbud.status === 'vunnet') {
          vunnetTilbud++;
          totalRevenue += tilbud.belop;
          monthData.antallVunnet++;
          monthData.omsatt += tilbud.belop;
          jobbypeStats.antallVunnet++;
          jobbypeStats.vunnetVerdi += tilbud.belop;
        }
      });
    }
    
    // Calculate win rate and jobbtype percentages
    const winRate = totalTilbud > 0 ? Math.round((vunnetTilbud / totalTilbud) * 100) : 0;
    
    // Update jobbtype percentages
    jobbypeStatsMap.forEach((stats) => {
      stats.treffprosent = stats.antallTilbud > 0 
        ? Math.round((stats.antallVunnet / stats.antallTilbud) * 100) 
        : 0;
    });
    
    // Prepare analytics data
    const analytics: UserAnalytics = {
      totalCustomers,
      totalTilbud,
      vunnetTilbud,
      totalRevenue,
      winRate,
      lastUpdated: Date.now(),
      monthlyData: Array.from(monthlyDataMap.values()).sort((a, b) => {
        return (a.year * 12 + a.month.length) - (b.year * 12 + b.month.length);
      }),
      jobbypeStats: Array.from(jobbypeStatsMap.values()).sort((a, b) => b.totalVerdi - a.totalVerdi),
    };
    
    // Save analytics
    const analyticsRef = ref(db, getUserPath(userId, 'analytics'));
    await set(analyticsRef, analytics);
    
  } catch (error) {
    throw handleDatabaseError(error, 'oppdatere analyser');
  }
};

// Get user analytics
export const getUserAnalytics = async (): Promise<UserAnalytics | null> => {
  try {
    await ensureConnection();
    
    // Get current user ID
    const userId = getCurrentUserId();
    
    const analyticsRef = ref(db, getUserPath(userId, 'analytics'));
    const snapshot = await get(analyticsRef);
    
    if (!snapshot.exists()) {
      // If no analytics exist, calculate them first
      await updateUserAnalytics();
      const newSnapshot = await get(analyticsRef);
      return newSnapshot.exists() ? newSnapshot.val() : null;
    }
    
    const analytics = snapshot.val() as UserAnalytics;
    
    // Check if analytics are older than 1 hour, if so, update them
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    if (analytics.lastUpdated < oneHourAgo) {
      await updateUserAnalytics();
      const updatedSnapshot = await get(analyticsRef);
      return updatedSnapshot.exists() ? updatedSnapshot.val() : analytics;
    }
    
    return analytics;
  } catch (error) {
    throw handleDatabaseError(error, 'hente analyser');
  }
};

// Initialize user data structure
export const initializeUserData = async (): Promise<void> => {
  try {
    await ensureConnection();
    
    // Get current user ID
    const userId = getCurrentUserId();
    
    // Check if user data already exists
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      // Initialize user data structure
      const initialData = {
        profile: {
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        },
        kunder: {},
        tilbud: {},
        analytics: {
          totalCustomers: 0,
          totalTilbud: 0,
          vunnetTilbud: 0,
          totalRevenue: 0,
          winRate: 0,
          lastUpdated: Date.now(),
          monthlyData: [],
          jobbypeStats: [],
        }
      };
      
      await set(userRef, initialData);
    } else {
      // Update last login
      const profileRef = ref(db, `users/${userId}/profile`);
      await update(profileRef, {
        lastLogin: serverTimestamp(),
      });
    }
  } catch (error) {
    throw handleDatabaseError(error, 'initialisere brukerdata');
  }
};

// Get dashboard KPI data
export const getDashboardKPIs = async () => {
  try {
    const analytics = await getUserAnalytics();
    
    if (!analytics) {
      return {
        totalRevenue: '0 kr',
        totalTilbud: '0',
        winRate: '0%',
        totalCustomers: '0'
      };
    }
    
    return {
      totalRevenue: `${analytics.totalRevenue.toLocaleString('nb-NO')} kr`,
      totalTilbud: analytics.totalTilbud.toString(),
      winRate: `${analytics.winRate}%`,
      totalCustomers: analytics.totalCustomers.toString()
    };
  } catch (error) {
    throw handleDatabaseError(error, 'hente dashboard KPIer');
  }
};

// Real-time analytics functions
export type AnalyticsUpdateCallback = (analytics: UserAnalytics | null) => void;

// Calculate analytics from tilbud data (optimized for the specific structure)
const calculateAnalyticsFromTilbud = (tilbudData: any, kundData: any): UserAnalytics => {
  let totalTilbud = 0;
  let vunnetTilbud = 0;
  let totalRevenue = 0;
  const monthlyDataMap = new Map<string, MonthlyData>();
  const jobbypeStatsMap = new Map<string, JobbtypeStats>();

  // Count customers
  const totalCustomers = kundData ? Object.keys(kundData).length : 0;

  // Process tilbud data
  if (tilbudData) {
    Object.values(tilbudData).forEach((tilbud: any) => {
      totalTilbud++;
      
      // Monthly data processing
      const date = new Date(tilbud.dato);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('nb-NO', { month: 'short' });
      
      if (!monthlyDataMap.has(monthKey)) {
        monthlyDataMap.set(monthKey, {
          month: monthName,
          year: date.getFullYear(),
          omsatt: 0,
          tilbudt: 0,
          antallTilbud: 0,
          antallVunnet: 0,
        });
      }
      
      const monthData = monthlyDataMap.get(monthKey)!;
      monthData.antallTilbud++;
      monthData.tilbudt += tilbud.belop || 0;
      
      // Jobbtype statistics
      const jobbtype = tilbud.jobbtype || 'Ukjent';
      if (!jobbypeStatsMap.has(jobbtype)) {
        jobbypeStatsMap.set(jobbtype, {
          jobbtype,
          antallTilbud: 0,
          antallVunnet: 0,
          treffprosent: 0,
          totalVerdi: 0,
          vunnetVerdi: 0,
        });
      }
      
      const jobbypeStats = jobbypeStatsMap.get(jobbtype)!;
      jobbypeStats.antallTilbud++;
      jobbypeStats.totalVerdi += tilbud.belop || 0;
      
      // Check if tilbud is won
      if (tilbud.status === 'vunnet') {
        vunnetTilbud++;
        totalRevenue += tilbud.belop || 0;
        monthData.antallVunnet++;
        monthData.omsatt += tilbud.belop || 0;
        jobbypeStats.antallVunnet++;
        jobbypeStats.vunnetVerdi += tilbud.belop || 0;
      }
    });
  }

  // Calculate win rate and jobbtype percentages
  const winRate = totalTilbud > 0 ? Math.round((vunnetTilbud / totalTilbud) * 100) : 0;
  
  // Update jobbtype percentages
  jobbypeStatsMap.forEach((stats) => {
    stats.treffprosent = stats.antallTilbud > 0 
      ? Math.round((stats.antallVunnet / stats.antallTilbud) * 100) 
      : 0;
  });

  // Fill gaps in monthly data
  const rawMonthlyData = Array.from(monthlyDataMap.values());
  const filledMonthlyData = fillMonthlyDataGaps(rawMonthlyData);

  return {
    totalCustomers,
    totalTilbud,
    vunnetTilbud,
    totalRevenue,
    winRate,
    lastUpdated: Date.now(),
    monthlyData: filledMonthlyData,
    jobbypeStats: Array.from(jobbypeStatsMap.values()).sort((a, b) => b.totalVerdi - a.totalVerdi),
  };
};

// Helper function to convert month name to number
const getMonthNumberFromName = (monthName: string): number => {
  const months = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 
                 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
  const index = months.indexOf(monthName.toLowerCase());
  return index >= 0 ? index : 0; // Return 0 (January) if not found
};

// Generate placeholder months with 0 values
const generatePlaceholderMonths = (startDate: Date, endDate: Date): MonthlyData[] => {
  const months: MonthlyData[] = [];
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  
  while (current <= end) {
    const monthName = current.toLocaleDateString('nb-NO', { month: 'short' });
    months.push({
      month: monthName,
      year: current.getFullYear(),
      omsatt: 0,
      tilbudt: 0,
      antallTilbud: 0,
      antallVunnet: 0,
    });
    
    // Move to next month
    current.setMonth(current.getMonth() + 1);
  }
  
  return months;
};

// Generate placeholder days with 0 values
const generatePlaceholderDays = (startDate: Date, endDate: Date): DailyData[] => {
  const days: DailyData[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dateStr = current.toLocaleDateString('nb-NO', { 
      day: 'numeric', 
      month: 'short' 
    });
    const fullDateStr = current.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    days.push({
      date: dateStr,
      fullDate: fullDateStr,
      omsatt: 0,
      tilbudt: 0,
      antallTilbud: 0,
      antallVunnet: 0,
    });
    
    // Move to next day
    current.setDate(current.getDate() + 1);
  }
  
  return days;
};

// Fill gaps in monthly data with placeholder months
const fillMonthlyDataGaps = (existingData: MonthlyData[]): MonthlyData[] => {
  if (existingData.length === 0) {
    // If no data exists, create last 6 months with 0 values
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 5); // Last 6 months
    return generatePlaceholderMonths(startDate, endDate);
  }
  
  // Sort existing data by date
  const sortedData = [...existingData].sort((a, b) => {
    const aDate = new Date(a.year, getMonthNumberFromName(a.month));
    const bDate = new Date(b.year, getMonthNumberFromName(b.month));
    return aDate.getTime() - bDate.getTime();
  });
  
  // Extend backwards to show at least last 6 months
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 5);
  
  const firstDataDate = new Date(sortedData[0].year, getMonthNumberFromName(sortedData[0].month));
  const startDate = firstDataDate < sixMonthsAgo ? firstDataDate : sixMonthsAgo;
  
  // Generate all months from start to now
  const allMonths = generatePlaceholderMonths(startDate, now);
  
  // Merge with existing data
  const dataMap = new Map<string, MonthlyData>();
  
  // Add placeholder months
  allMonths.forEach(month => {
    const key = `${month.year}-${month.month}`;
    dataMap.set(key, month);
  });
  
  // Override with real data
  sortedData.forEach(month => {
    const key = `${month.year}-${month.month}`;
    dataMap.set(key, month);
  });
  
  return Array.from(dataMap.values()).sort((a, b) => {
    const aDate = new Date(a.year, getMonthNumberFromName(a.month));
    const bDate = new Date(b.year, getMonthNumberFromName(b.month));
    return aDate.getTime() - bDate.getTime();
  });
};

// Time period filtering
export type TimePeriod = '7dager' | '30dager' | '1aar' | 'frastart';

// Calculate daily data from tilbud data
const calculateDailyData = (tilbudData: any, daysBack: number): DailyData[] => {
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - daysBack + 1);
  
  // Generate placeholder days
  const dailyDataMap = new Map<string, DailyData>();
  const placeholderDays = generatePlaceholderDays(startDate, now);
  
  placeholderDays.forEach(day => {
    dailyDataMap.set(day.fullDate, day);
  });
  
  // Process tilbud data if it exists
  if (tilbudData) {
    Object.values(tilbudData).forEach((tilbud: any) => {
      const tilbudDate = new Date(tilbud.dato);
      const dateKey = tilbudDate.toISOString().split('T')[0];
      
      // Only include if within our date range
      if (tilbudDate >= startDate && tilbudDate <= now) {
        const dayData = dailyDataMap.get(dateKey);
        if (dayData) {
          dayData.antallTilbud++;
          dayData.tilbudt += tilbud.belop || 0;
          
          if (tilbud.status === 'vunnet') {
            dayData.antallVunnet++;
            dayData.omsatt += tilbud.belop || 0;
          }
        }
      }
    });
  }
  
  return Array.from(dailyDataMap.values()).sort((a, b) => 
    new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
  );
};

export const filterAnalyticsByTimePeriod = (analytics: UserAnalytics, period: TimePeriod, rawTilbudData?: any): UserAnalytics => {
  const now = new Date();

  switch (period) {
    case '7dager': {
      // Return daily data for last 7 days
      const dailyData = rawTilbudData ? calculateDailyData(rawTilbudData, 7) : generatePlaceholderDays(
        new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), 
        now
      );
      
      // Calculate totals from daily data
      const totals = dailyData.reduce((acc, day) => {
        acc.totalRevenue += day.omsatt;
        acc.totalTilbud += day.antallTilbud;
        acc.vunnetTilbud += day.antallVunnet;
        return acc;
      }, { totalRevenue: 0, totalTilbud: 0, vunnetTilbud: 0 });
      
      const winRate = totals.totalTilbud > 0 
        ? Math.round((totals.vunnetTilbud / totals.totalTilbud) * 100) 
        : 0;
      
      return {
        ...analytics,
        totalRevenue: totals.totalRevenue,
        totalTilbud: totals.totalTilbud,
        vunnetTilbud: totals.vunnetTilbud,
        winRate,
        dailyData,
        monthlyData: [], // Empty for daily view
      };
    }
    
    case '30dager': {
      // Return daily data for last 30 days
      const dailyData = rawTilbudData ? calculateDailyData(rawTilbudData, 30) : generatePlaceholderDays(
        new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000), 
        now
      );
      
      // Calculate totals from daily data
      const totals = dailyData.reduce((acc, day) => {
        acc.totalRevenue += day.omsatt;
        acc.totalTilbud += day.antallTilbud;
        acc.vunnetTilbud += day.antallVunnet;
        return acc;
      }, { totalRevenue: 0, totalTilbud: 0, vunnetTilbud: 0 });
      
      const winRate = totals.totalTilbud > 0 
        ? Math.round((totals.vunnetTilbud / totals.totalTilbud) * 100) 
        : 0;
      
      return {
        ...analytics,
        totalRevenue: totals.totalRevenue,
        totalTilbud: totals.totalTilbud,
        vunnetTilbud: totals.vunnetTilbud,
        winRate,
        dailyData,
        monthlyData: [], // Empty for daily view
      };
    }
    
    case '1aar': {
      // Show last 12 months (monthly data)
      const monthStartDate = new Date();
      monthStartDate.setMonth(now.getMonth() - 11);
      
      const placeholderMonths = generatePlaceholderMonths(monthStartDate, now);
      const existingDataMap = new Map<string, MonthlyData>();
      
      analytics.monthlyData.forEach(month => {
        const key = `${month.year}-${month.month}`;
        existingDataMap.set(key, month);
      });
      
      const finalMonthlyData = placeholderMonths.map(placeholder => {
        const key = `${placeholder.year}-${placeholder.month}`;
        return existingDataMap.get(key) || placeholder;
      });
      
      const totals = finalMonthlyData.reduce((acc, month) => {
        acc.totalRevenue += month.omsatt;
        acc.totalTilbud += month.antallTilbud;
        acc.vunnetTilbud += month.antallVunnet;
        return acc;
      }, { totalRevenue: 0, totalTilbud: 0, vunnetTilbud: 0 });
      
      const winRate = totals.totalTilbud > 0 
        ? Math.round((totals.vunnetTilbud / totals.totalTilbud) * 100) 
        : 0;
      
      return {
        ...analytics,
        totalRevenue: totals.totalRevenue,
        totalTilbud: totals.totalTilbud,
        vunnetTilbud: totals.vunnetTilbud,
        winRate,
        monthlyData: finalMonthlyData,
        dailyData: undefined,
      };
    }
    
    case 'frastart':
    default:
      return {
        ...analytics,
        monthlyData: fillMonthlyDataGaps(analytics.monthlyData),
        dailyData: undefined,
      };
  }
};

// Set up real-time analytics listener
export const subscribeToAnalytics = (callback: AnalyticsUpdateCallback): (() => void) => {
  const userId = getCurrentUserId();
  
  // References to listen to
  const tilbudRef = ref(db, getUserPath(userId, 'tilbud'));
  const kundeRef = ref(db, getUserPath(userId, 'kunder'));
  
  let tilbudData: any = null;
  let kundeData: any = null;
  
  // Function to recalculate and update analytics
  const updateAnalytics = async () => {
    try {
      const analytics = calculateAnalyticsFromTilbud(tilbudData, kundeData);
      
      // Save updated analytics to database
      const analyticsRef = ref(db, getUserPath(userId, 'analytics'));
      await set(analyticsRef, analytics);
      
      // Store raw tilbud data for daily calculations
      (analytics as any).rawTilbudData = tilbudData;
      
      // Call the callback with new data
      callback(analytics);
    } catch (error) {
      console.error('Error updating real-time analytics:', error);
      callback(null);
    }
  };

  // Set up listeners
  const tilbudListener = onValue(tilbudRef, (snapshot: DataSnapshot) => {
    tilbudData = snapshot.exists() ? snapshot.val() : null;
    updateAnalytics();
  });

  const kundeListener = onValue(kundeRef, (snapshot: DataSnapshot) => {
    kundeData = snapshot.exists() ? snapshot.val() : null;
    updateAnalytics();
  });

  // Return cleanup function
  return () => {
    off(tilbudRef, 'value', tilbudListener);
    off(kundeRef, 'value', kundeListener);
  };
};

// Manual trigger for analytics update (optional - real-time listeners handle this automatically)
export const triggerAnalyticsUpdate = async (): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    
    // Get current data
    const tilbudRef = ref(db, getUserPath(userId, 'tilbud'));
    const kundeRef = ref(db, getUserPath(userId, 'kunder'));
    
    const [tilbudSnapshot, kundeSnapshot] = await Promise.all([
      get(tilbudRef),
      get(kundeRef)
    ]);
    
    const tilbudData = tilbudSnapshot.exists() ? tilbudSnapshot.val() : null;
    const kundeData = kundeSnapshot.exists() ? kundeSnapshot.val() : null;
    
    const analytics = calculateAnalyticsFromTilbud(tilbudData, kundeData);
    
    // Save updated analytics
    const analyticsRef = ref(db, getUserPath(userId, 'analytics'));
    await set(analyticsRef, analytics);
    
  } catch (error) {
    console.error('Error manually triggering analytics update:', error);
    throw handleDatabaseError(error, 'oppdatere analyser manuelt');
  }
};

// Get analytics with real-time updates
export const getAnalyticsWithRealTimeUpdates = async (): Promise<UserAnalytics | null> => {
  try {
    await ensureConnection();
    
    // Get current user ID
    const userId = getCurrentUserId();
    
    // Try to get existing analytics first
    const analyticsRef = ref(db, getUserPath(userId, 'analytics'));
    const snapshot = await get(analyticsRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as UserAnalytics;
    }
    
    // If no analytics exist, calculate them from current data
    const tilbudRef = ref(db, getUserPath(userId, 'tilbud'));
    const kundeRef = ref(db, getUserPath(userId, 'kunder'));
    
    const [tilbudSnapshot, kundeSnapshot] = await Promise.all([
      get(tilbudRef),
      get(kundeRef)
    ]);
    
    const tilbudData = tilbudSnapshot.exists() ? tilbudSnapshot.val() : null;
    const kundeData = kundeSnapshot.exists() ? kundeSnapshot.val() : null;
    
    const analytics = calculateAnalyticsFromTilbud(tilbudData, kundeData);
    
    // Save initial analytics
    await set(analyticsRef, analytics);
    
    return analytics;
  } catch (error) {
    throw handleDatabaseError(error, 'hente realtids analyser');
  }
};

// Get dashboard KPI data with change percentages
export const getDashboardKPIsWithChange = async () => {
  try {
    const analytics = await getUserAnalytics();
    
    if (!analytics) {
      return [
        {
          title: 'Total Omsetning',
          value: '0 kr',
          change: '+0%',
          icon: 'DollarSign'
        },
        {
          title: 'Aktive Tilbud',
          value: '0',
          change: '+0%',
          icon: 'FileText'
        },
        {
          title: 'Vunnede Tilbud',
          value: '0',
          change: '+0%',
          icon: 'Award'
        },
        {
          title: 'Treffprosent',
          value: '0%',
          change: '+0%',
          icon: 'Target'
        }
      ];
    }

    // Calculate changes from previous month (simple calculation)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Find current and previous month data
    const currentMonthData = analytics.monthlyData.find(m => 
      m.month === new Date(currentYear, currentMonth).toLocaleDateString('nb-NO', { month: 'short' }) && 
      m.year === currentYear
    );
    const previousMonthData = analytics.monthlyData.find(m => 
      m.month === new Date(previousYear, previousMonth).toLocaleDateString('nb-NO', { month: 'short' }) && 
      m.year === previousYear
    );

    // Calculate changes
    const revenueChange = calculatePercentageChange(
      currentMonthData?.omsatt || 0, 
      previousMonthData?.omsatt || 0
    );
    const tilbudChange = calculatePercentageChange(
      currentMonthData?.antallTilbud || 0, 
      previousMonthData?.antallTilbud || 0
    );
    const vunnetChange = calculatePercentageChange(
      currentMonthData?.antallVunnet || 0, 
      previousMonthData?.antallVunnet || 0
    );

    // Active tilbud are those with status 'venter'
    const activeTilbud = analytics.totalTilbud - analytics.vunnetTilbud;
    
    return [
      {
        title: 'Total Omsetning',
        value: `${analytics.totalRevenue.toLocaleString('nb-NO')} kr`,
        change: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`,
        icon: 'DollarSign'
      },
      {
        title: 'Aktive Tilbud',
        value: activeTilbud.toString(),
        change: `${tilbudChange >= 0 ? '+' : ''}${tilbudChange.toFixed(1)}%`,
        icon: 'FileText'
      },
      {
        title: 'Vunnede Tilbud',
        value: analytics.vunnetTilbud.toString(),
        change: `${vunnetChange >= 0 ? '+' : ''}${vunnetChange.toFixed(1)}%`,
        icon: 'Award'
      },
      {
        title: 'Treffprosent',
        value: `${analytics.winRate.toFixed(1)}%`,
        change: `+4.1%`, // Placeholder - could be calculated with historical data
        icon: 'Target'
      }
    ];
  } catch (error) {
    throw handleDatabaseError(error, 'hente dashboard KPIer');
  }
};

// Helper function to calculate percentage change
const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Get chart data for the main dashboard chart
export const getDashboardChartData = async () => {
  try {
    const analytics = await getUserAnalytics();
    
    if (!analytics || !analytics.monthlyData || analytics.monthlyData.length === 0) {
      // Return current year months with zero data if no data exists
      const currentYear = new Date().getFullYear();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des'];
      return months.map(month => ({
        date: month,
        omsatt: 0,
        tilbudt: 0
      }));
    }

    // Sort by year and month, take last 12 months
    const sortedData = analytics.monthlyData
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        const monthOrder = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
        return monthOrder.indexOf(a.month.toLowerCase()) - monthOrder.indexOf(b.month.toLowerCase());
      })
      .slice(-12); // Take last 12 months

    return sortedData.map(data => ({
      date: data.month,
      omsatt: data.omsatt,
      tilbudt: data.tilbudt
    }));
  } catch (error) {
    throw handleDatabaseError(error, 'hente diagram data');
  }
};

// Get recent activity feed from actual data
export const getDashboardActivityFeed = async () => {
  try {
    const userId = getCurrentUserId();
    const tilbudRef = ref(db, getUserPath(userId, 'tilbud'));
    const kundeRef = ref(db, getUserPath(userId, 'kunder'));
    
    const [tilbudSnapshot, kundeSnapshot] = await Promise.all([
      get(tilbudRef),
      get(kundeRef)
    ]);
    
    const activities: any[] = [];
    
    // Process tilbud data for activities
    if (tilbudSnapshot.exists()) {
      const tilbudData = tilbudSnapshot.val();
      Object.entries(tilbudData).forEach(([id, tilbud]: [string, any]) => {
        const date = new Date(tilbud.dato);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let timestamp = '';
        if (diffDays === 0) {
          timestamp = 'I dag';
        } else if (diffDays === 1) {
          timestamp = '1 dag siden';
        } else if (diffDays < 7) {
          timestamp = `${diffDays} dager siden`;
        } else {
          timestamp = date.toLocaleDateString('nb-NO');
        }
        
        if (tilbud.status === 'vunnet') {
          activities.push({
            id: `tilbud_vunnet_${id}`,
            type: 'tilbud_vunnet',
            title: 'Tilbud vunnet',
            description: `${tilbud.prosjekt} - ${tilbud.kundenavn}`,
            timestamp,
            amount: tilbud.belop,
            date: date.getTime() // For sorting
          });
        } else if (tilbud.status === 'tapt') {
          activities.push({
            id: `tilbud_tapt_${id}`,
            type: 'tilbud_tapt',
            title: 'Tilbud tapt',
            description: `${tilbud.prosjekt} - ${tilbud.kundenavn}`,
            timestamp,
            amount: tilbud.belop,
            date: date.getTime()
          });
        } else {
          activities.push({
            id: `tilbud_sendt_${id}`,
            type: 'tilbud_sendt',
            title: 'Tilbud sendt',
            description: `${tilbud.prosjekt} - ${tilbud.kundenavn}`,
            timestamp,
            amount: tilbud.belop,
            date: date.getTime()
          });
        }
      });
    }
    
    // Process customer data for new customer activities
    if (kundeSnapshot.exists()) {
      const kundeData = kundeSnapshot.val();
      Object.entries(kundeData).forEach(([id, kunde]: [string, any]) => {
        if (kunde.opprettet) {
          const date = new Date(kunde.opprettet);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - date.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          let timestamp = '';
          if (diffDays === 0) {
            timestamp = 'I dag';
          } else if (diffDays === 1) {
            timestamp = '1 dag siden';
          } else if (diffDays < 7) {
            timestamp = `${diffDays} dager siden`;
          } else {
            timestamp = date.toLocaleDateString('nb-NO');
          }
          
          activities.push({
            id: `ny_kunde_${id}`,
            type: 'ny_kunde',
            title: 'Ny kunde registrert',
            description: kunde.navn,
            timestamp,
            date: date.getTime()
          });
        }
      });
    }
    
    // Sort by date (most recent first) and take top 5
    return activities
      .sort((a, b) => b.date - a.date)
      .slice(0, 5)
      .map(({ date, ...activity }) => activity); // Remove date field used for sorting
      
  } catch (error) {
    throw handleDatabaseError(error, 'hente aktivitets feed');
  }
};