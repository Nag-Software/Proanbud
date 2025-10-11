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
  totalProfit: number; // Total profit from won quotes (margin category)
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
  profitt: number; // Profit for this month
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

// Helper function to ensure user is authenticated and get a valid user ID
const getCurrentUserId = (): string => {
  if (!auth.currentUser) {
    throw new Error('Bruker ikke autentisert. Vennligst logg inn på nytt.');
  }
  
  const uid = auth.currentUser.uid;
  
  // Validate that the UID doesn't contain invalid characters for Firebase paths
  if (!uid || typeof uid !== 'string' || uid.trim().length === 0) {
    throw new Error('Ugyldig bruker-ID. Vennligst logg inn på nytt.');
  }
  
  // Firebase path segments cannot contain . # $ [ ] or /
  const invalidChars = /[.#$[\]/]/;
  if (invalidChars.test(uid)) {
    console.error('Invalid characters found in user ID:', uid);
    throw new Error('Ugyldig bruker-ID format. Vennligst kontakt support.');
  }
  
  return uid;
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
  
  // Check for token/authentication issues
  if (error.message?.includes('invalid token') || error.message?.includes('Invalid token')) {
    return new Error(`Autentiseringsfeil: Ugyldig token. Vennligst logg ut og inn igjen.`);
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
    let totalProfit = 0;
    const monthlyDataMap = new Map<string, MonthlyData>();
    const dailyDataMap = new Map<string, DailyData>();
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
        const date = new Date(tilbud.opprettet);
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
            profitt: 0,
          });
        }
        
        const monthData = monthlyDataMap.get(monthKey)!;
        monthData.antallTilbud++;
        if (tilbud.status !== 'tapt') {
          monthData.tilbudt += tilbud.belop;
        }
        
        // Daily data (for all time, but we'll limit to last 30 days when saving)
        const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        const dayDisplay = date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' });
        
        if (!dailyDataMap.has(dayKey)) {
          dailyDataMap.set(dayKey, {
            date: dayDisplay,
            fullDate: dayKey,
            omsatt: 0,
            tilbudt: 0,
            antallTilbud: 0,
            antallVunnet: 0,
          });
        }
        
        const dayData = dailyDataMap.get(dayKey)!;
        dayData.antallTilbud++;
        if (tilbud.status !== 'tapt') {
          dayData.tilbudt += tilbud.belop;
        }

        if (tilbud.status === 'vunnet') {
          dayData.antallVunnet++;
          dayData.omsatt += tilbud.belop;
        }

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
          
          // Calculate profit from priceMarkup in prisgrunnlag components
          if (tilbud.prisgrunnlag && Array.isArray(tilbud.prisgrunnlag)) {
            let tilbudProfit = 0;
            
            console.log('📊 [updateUserAnalytics] Calculating profit for tilbud:', tilbud.id || 'unknown', 'Status:', tilbud.status);
            console.log('   Prisgrunnlag components:', tilbud.prisgrunnlag.length);
            
            tilbud.prisgrunnlag.forEach((comp: any, idx: number) => {
              // Calculate profit from markup percentage
              if (comp.priceMarkup && comp.priceMarkup > 0 && comp.amount) {
                // The amount includes the markup, so we need to calculate the base price first
                // Formula: basePrice = amount / (1 + markup/100)
                // Profit = amount - basePrice
                const markupMultiplier = 1 + (comp.priceMarkup / 100);
                const basePrice = comp.amount / markupMultiplier;
                const profit = comp.amount - basePrice;
                console.log(`   Component ${idx}: ${comp.name} - Amount: ${comp.amount}, Markup: ${comp.priceMarkup}%, Profit: ${profit.toFixed(2)}`);
                tilbudProfit += profit;
              }
              
              // Also include direct margin components
              if (comp.category === 'margin' && comp.amount) {
                console.log(`   Component ${idx}: ${comp.name} - Margin: ${comp.amount}`);
                tilbudProfit += comp.amount;
              }
            });
            
            console.log('   ✅ Total profit for this tilbud:', tilbudProfit.toFixed(2));
            totalProfit += tilbudProfit;
            monthData.profitt += tilbudProfit;
          }
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

    console.log('💰 ANALYTICS SUMMARY [updateUserAnalytics]:');
    console.log('   Total Tilbud:', totalTilbud);
    console.log('   Vunnet Tilbud:', vunnetTilbud);
    console.log('   Total Revenue:', totalRevenue.toLocaleString('nb-NO'), 'kr');
    console.log('   Total Profit:', totalProfit.toLocaleString('nb-NO'), 'kr');
    console.log('   Win Rate:', winRate, '%');
    
    // Prepare analytics data
    const analytics: UserAnalytics = {
      totalCustomers,
      totalTilbud,
      vunnetTilbud,
      totalRevenue,
      totalProfit,
      winRate,
      lastUpdated: Date.now(),
      monthlyData: Array.from(monthlyDataMap.values()).sort((a, b) => {
        return (a.year * 12 + a.month.length) - (b.year * 12 + b.month.length);
      }),
      dailyData: Array.from(dailyDataMap.values())
        .sort((a, b) => a.fullDate.localeCompare(b.fullDate))
        .slice(-30), // Keep only the last 30 days
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
    
    const existingAnalytics = snapshot.val() as UserAnalytics;
    
    // Migrate old data structure: if monthlyData is an object, convert to array
    if (existingAnalytics.monthlyData && !Array.isArray(existingAnalytics.monthlyData)) {
      console.log('🔄 Migrating monthlyData from object to array structure');
      existingAnalytics.monthlyData = [];
      // Update the database with the corrected structure
      await updateUserAnalytics();
      const updatedSnapshot = await get(analyticsRef);
      return updatedSnapshot.exists() ? updatedSnapshot.val() : existingAnalytics;
    }
    
    // Check if analytics are older than 1 hour, or don't have dailyData, if so, update them
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const needsUpdate = existingAnalytics.lastUpdated < oneHourAgo || !existingAnalytics.dailyData;
    
    if (needsUpdate) {
      await updateUserAnalytics();
      const updatedSnapshot = await get(analyticsRef);
      return updatedSnapshot.exists() ? updatedSnapshot.val() : existingAnalytics;
    }
    
    return existingAnalytics;
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
  let totalProfit = 0;
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
          profitt: 0,
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

      if (tilbud.status === 'vunnet') {
        vunnetTilbud++;
        totalRevenue += tilbud.belop || 0;
        monthData.antallVunnet++;
        monthData.omsatt += tilbud.belop || 0;
        jobbypeStats.antallVunnet++;
        jobbypeStats.vunnetVerdi += tilbud.belop || 0;
        
        // Calculate profit from priceMarkup in prisgrunnlag components
        if (tilbud.prisgrunnlag && Array.isArray(tilbud.prisgrunnlag)) {
          let tilbudProfit = 0;
          
          tilbud.prisgrunnlag.forEach((comp: any, idx: number) => {
            // Calculate profit from markup percentage
            if (comp.priceMarkup && comp.priceMarkup > 0 && comp.amount) {
              // The amount includes the markup, so we need to calculate the base price first
              // Formula: basePrice = amount / (1 + markup/100)
              // Profit = amount - basePrice
              const markupMultiplier = 1 + (comp.priceMarkup / 100);
              const basePrice = comp.amount / markupMultiplier;
              const profit = comp.amount - basePrice;
              tilbudProfit += profit;
            }
            
            // Also include direct margin components
            if (comp.category === 'margin' && comp.amount) {
              tilbudProfit += comp.amount;
            }
          });
          
          totalProfit += tilbudProfit;
          monthData.profitt += tilbudProfit;
        }
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

  console.log('💰 ANALYTICS SUMMARY:');
  console.log('   Total Tilbud:', totalTilbud);
  console.log('   Vunnet Tilbud:', vunnetTilbud);
  console.log('   Total Revenue:', totalRevenue.toLocaleString('nb-NO'), 'kr');
  console.log('   Total Profit:', totalProfit.toLocaleString('nb-NO'), 'kr');
  console.log('   Win Rate:', winRate, '%');

  return {
    totalCustomers,
    totalTilbud,
    vunnetTilbud,
    totalRevenue,
    totalProfit,
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
      profitt: 0,
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
      
      // Ensure monthlyData exists and is an array
      const monthlyData = Array.isArray(analytics.monthlyData) ? analytics.monthlyData : [];
      
      monthlyData.forEach(month => {
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
      // Ensure monthlyData exists and is an array before calling fillMonthlyDataGaps
      const safeMonthlyData = Array.isArray(analytics.monthlyData) ? analytics.monthlyData : [];
      return {
        ...analytics,
        monthlyData: fillMonthlyDataGaps(safeMonthlyData),
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
        },
        {
          title: 'Total Profitt',
          value: '0 kr',
          change: '+0%',
          icon: 'TrendingUp'
        }
      ];
    }

    // Calculate changes from previous month (simple calculation)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Ensure monthlyData exists and is an array
    const monthlyData = Array.isArray(analytics.monthlyData) ? analytics.monthlyData : [];

    // Find current and previous month data
    const currentMonthData = monthlyData.find(m => 
      m.month === new Date(currentYear, currentMonth).toLocaleDateString('nb-NO', { month: 'short' }) && 
      m.year === currentYear
    );
    const previousMonthData = monthlyData.find(m => 
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
    const profitChange = calculatePercentageChange(
      currentMonthData?.profitt || 0, 
      previousMonthData?.profitt || 0
    );

    // Active tilbud are those with status 'venter'
    const activeTilbud = (analytics.totalTilbud || 0) - (analytics.vunnetTilbud || 0);
    
    return [
      {
        title: 'Total Omsetning',
        value: `${(analytics.totalRevenue || 0).toLocaleString('nb-NO')} kr`,
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
        value: (analytics.vunnetTilbud || 0).toString(),
        change: `${vunnetChange >= 0 ? '+' : ''}${vunnetChange.toFixed(1)}%`,
        icon: 'Award'
      },
      {
        title: 'Treffprosent',
        value: `${(analytics.winRate || 0).toFixed(1)}%`,
        change: `+4.1%`, // Placeholder - could be calculated with historical data
        icon: 'Target'
      },
      {
        title: 'Total Profitt',
        value: `${(analytics.totalProfit || 0).toLocaleString('nb-NO')} kr`,
        change: `${profitChange >= 0 ? '+' : ''}${profitChange.toFixed(1)}%`,
        icon: 'TrendingUp'
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
export const getDashboardChartData = async (timeRange: '7d' | '30d' | '1y' | 'all' = '1y') => {
  try {
    const analytics = await getUserAnalytics();
    
    if (!analytics) {
      return generateEmptyChartData(timeRange);
    }

    switch (timeRange) {
      case '7d':
        return getDailyChartData(analytics, 7);
      case '30d':
        return getDailyChartData(analytics, 30);
      case '1y':
        return getMonthlyChartData(analytics, 12);
      case 'all':
        return getAllTimeChartData(analytics);
      default:
        return getMonthlyChartData(analytics, 12);
    }
  } catch (error) {
    throw handleDatabaseError(error, 'hente diagram data');
  }
};

// Helper functions for chart data
const generateEmptyChartData = (timeRange: '7d' | '30d' | '1y' | 'all') => {
  const now = new Date();
  
  switch (timeRange) {
    case '7d':
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        return {
          date: date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' }),
          omsatt: 0,
          tilbudt: 0
        };
      });
    case '30d':
      return Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
        return {
          date: date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' }),
          omsatt: 0,
          tilbudt: 0
        };
      });
    case '1y':
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des'];
      return months.map(month => ({
        date: month,
        omsatt: 0,
        tilbudt: 0
      })).reverse();
    case 'all':
      // For 'all' time, return empty array - will be handled by getAllTimeChartData
      return [];
    default:
      return [];
  }
};

const getDailyChartData = (analytics: UserAnalytics, days: number) => {
  // Generate date range for the last N days (including today)
  const now = new Date();
  const dateRange = Array.from({ length: days }, (_, i) => {
    const date = new Date(now.getTime() - (days - 1 - i) * 24 * 60 * 60 * 1000);
    const fullDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    const displayDate = date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' });
    return { fullDate, displayDate };
  });

  // Create a map of existing daily data by fullDate for quick lookup
  const existingDataMap = new Map<string, DailyData>();
  if (analytics.dailyData) {
    analytics.dailyData.forEach(data => {
      existingDataMap.set(data.fullDate, data);
    });
  }

  // Build result array with carry-forward logic
  const result: { date: string; omsatt: number; tilbudt: number }[] = [];
  let lastKnownData: { omsatt: number; tilbudt: number } = { omsatt: 0, tilbudt: 0 };

  for (const { fullDate, displayDate } of dateRange) {
    const existingData = existingDataMap.get(fullDate);

    if (existingData) {
      // Use existing data for this date
      result.push({
        date: existingData.date,
        omsatt: existingData.omsatt,
        tilbudt: existingData.tilbudt
      });
      // Update last known data
      lastKnownData = { omsatt: existingData.omsatt, tilbudt: existingData.tilbudt };
    } else {
      // No data for this date, carry forward from previous day
      result.push({
        date: displayDate,
        omsatt: lastKnownData.omsatt,
        tilbudt: lastKnownData.tilbudt
      });
    }
  }

  return result;
};

const getMonthlyChartData = (analytics: UserAnalytics, months: number) => {
  if (!analytics.monthlyData || analytics.monthlyData.length === 0) {
    return generateEmptyChartData('1y');
  }

  // Sort by year and month, take last N months
  const sortedData = analytics.monthlyData
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const monthOrder = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
      return monthOrder.indexOf(a.month.toLowerCase()) - monthOrder.indexOf(b.month.toLowerCase());
    })
    .slice(-months);

  return sortedData.map(data => ({
    date: data.month,
    omsatt: data.omsatt,
    tilbudt: data.tilbudt
  })); // Return in chronological order
};

const getAllTimeChartData = (analytics: UserAnalytics) => {
  if (!analytics.monthlyData || analytics.monthlyData.length === 0) {
    return generateEmptyChartData('1y');
  }

  // Return all monthly data
  return analytics.monthlyData
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const monthOrder = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
      return monthOrder.indexOf(a.month.toLowerCase()) - monthOrder.indexOf(b.month.toLowerCase());
    })
    .map(data => ({
      date: `${data.month} ${data.year}`,
      omsatt: data.omsatt,
      tilbudt: data.tilbudt
    })); // Return in chronological order
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
    
    // Helper function to safely parse dates
    const parseDate = (dateValue: any): Date => {
      // Handle Firebase server timestamp (number in milliseconds)
      if (typeof dateValue === 'number') {
        // Firebase serverTimestamp returns milliseconds since epoch
        return new Date(dateValue);
      }
      
      // Handle string dates (YYYY-MM-DD format from forms)
      if (typeof dateValue === 'string') {
        if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return new Date(dateValue + 'T12:00:00'); // Use noon to avoid timezone issues
        }
        return new Date(dateValue);
      }
      
      // Handle Firebase timestamp objects (if they exist)
      if (dateValue && typeof dateValue === 'object') {
        if (dateValue.toDate && typeof dateValue.toDate === 'function') {
          return dateValue.toDate();
        }
        if (typeof dateValue.seconds === 'number') {
          return new Date(dateValue.seconds * 1000);
        }
      }
      
      // Fallback to current date
      console.warn('Could not parse date value:', dateValue, 'falling back to current date');
      return new Date();
    };
    
    // Process tilbud data for activities
    if (tilbudSnapshot.exists()) {
      const tilbudData = tilbudSnapshot.val();
      Object.entries(tilbudData).forEach(([id, tilbud]: [string, any]) => {
        // Use opprettet as primary date (when tilbud was created), oppdatert for updates, dato as fallback
        const lastModified = tilbud.oppdatert || tilbud.opprettet || tilbud.dato;
        const date = parseDate(lastModified);
        const now = new Date();
        
        // Calculate days difference more accurately
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffTime = nowDate.getTime() - activityDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
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
          // Use oppdatert date if available, otherwise use opprettet
          const lastModified = kunde.oppdatert || kunde.opprettet;
          const date = parseDate(lastModified);
          const now = new Date();
          
          // Calculate days difference more accurately
          const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const diffTime = nowDate.getTime() - activityDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
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
    const sortedActivities = activities
      .filter(activity => activity.date && !isNaN(activity.date)) // Filter out invalid dates
      .sort((a, b) => {
        const dateA = a.date || 0;
        const dateB = b.date || 0;
        
        // First sort by date (most recent first)
        const dateDiff = dateB - dateA;
        if (dateDiff !== 0) {
          return dateDiff;
        }
        
        // If dates are equal, prioritize tilbud activities over kunde activities
        const aIsTilbud = a.type.startsWith('tilbud_');
        const bIsTilbud = b.type.startsWith('tilbud_');
        if (aIsTilbud && !bIsTilbud) return -1;
        if (!aIsTilbud && bIsTilbud) return 1;
        
        return 0; // Keep original order if same type
      })
      .slice(0, 5);
    
    return sortedActivities.map(({ date, ...activity }) => activity); // Remove date field used for sorting
      
  } catch (error) {
    throw handleDatabaseError(error, 'hente aktivitets feed');
  }
};

// Interface for pie chart data
export interface TilbudStatusData {
  name: string;
  value: number;
  count: number;
  color: string;
}

// Get tilbud status distribution for pie chart
export const getTilbudStatusData = async (): Promise<TilbudStatusData[]> => {
  try {
    await ensureConnection();
    const userId = getCurrentUserId();
    
    const tilbudRef = ref(db, getUserPath(userId, 'tilbud'));
    const snapshot = await get(tilbudRef);
    
    if (!snapshot.exists()) {
      return [
        { name: 'Venter', value: 0, count: 0, color: '#FFBB28' },
        { name: 'Vunnet', value: 0, count: 0, color: '#00C49F' },
        { name: 'Tapt', value: 0, count: 0, color: '#FF8042' },
      ];
    }
    
    const tilbudData = snapshot.val() as Record<string, any>;
    const statusCounts = {
      venter: 0,
      vunnet: 0,
      tapt: 0
    };
    
    // Count tilbud by status
    Object.values(tilbudData).forEach((tilbud: any) => {
      const status = tilbud.status?.toLowerCase();
      if (status && statusCounts.hasOwnProperty(status)) {
        statusCounts[status as keyof typeof statusCounts]++;
      }
    });
    
    const total = statusCounts.venter + statusCounts.vunnet + statusCounts.tapt;
    
    // Return data with percentages
    return [
      {
        name: 'Venter',
        value: total > 0 ? Math.round((statusCounts.venter / total) * 100) : 0,
        count: statusCounts.venter,
        color: '#FFBB28'
      },
      {
        name: 'Vunnet',
        value: total > 0 ? Math.round((statusCounts.vunnet / total) * 100) : 0,
        count: statusCounts.vunnet,
        color: '#00C49F'
      },
      {
        name: 'Tapt',
        value: total > 0 ? Math.round((statusCounts.tapt / total) * 100) : 0,
        count: statusCounts.tapt,
        color: '#FF8042'
      }
    ].filter(item => item.count > 0); // Only show statuses that have data
    
  } catch (error) {
    throw handleDatabaseError(error, 'hente tilbudsstatus data');
  }
};

// Interface for quick stats data
export interface QuickStatItem {
  title: string;
  value: string;
  change: string;
  icon: string;
  color: string;
  bgColor: string;
}

// Get quick stats data for dashboard widget
export const getQuickStatsData = async (): Promise<QuickStatItem[]> => {
  try {
    await ensureConnection();
    const userId = getCurrentUserId();
    
    // Get current analytics
    const analytics = await getUserAnalytics();
    
    // Get tilbud data for active projects count
    const tilbudRef = ref(db, getUserPath(userId, 'tilbud'));
    const tilbudSnapshot = await get(tilbudRef);
    
    let activeProjects = 0;
    let avgQuoteValue = 0;
    let totalQuoteValue = 0;
    
    if (tilbudSnapshot.exists()) {
      const tilbudData = tilbudSnapshot.val() as Record<string, any>;
      const tilbudList = Object.values(tilbudData);
      
      // Count active projects (venter status)
      activeProjects = tilbudList.filter((t: any) => t.status === 'venter').length;
      
      // Calculate average quote value
      const totalValue = tilbudList.reduce((sum: number, t: any) => sum + (t.belop || 0), 0);
      avgQuoteValue = tilbudList.length > 0 ? totalValue / tilbudList.length : 0;
      totalQuoteValue = totalValue;
    }
    
    // Get customer count for "new customers" (simplified - showing total)
    const customersRef = ref(db, getUserPath(userId, 'kunder'));
    const customersSnapshot = await get(customersRef);
    const customerCount = customersSnapshot.exists() ? Object.keys(customersSnapshot.val()).length : 0;
    
    // Calculate monthly growth (simplified - comparing with previous month)
    const currentMonth = new Date().getMonth();
    let monthlyGrowth = 0;
    
    if (analytics && analytics.monthlyData && analytics.monthlyData.length > 0) {
      const thisMonthData = analytics.monthlyData.find(m => m.month === getMonthName(currentMonth));
      const lastMonthData = analytics.monthlyData.find(m => m.month === getMonthName(currentMonth - 1));
      
      if (thisMonthData && lastMonthData && lastMonthData.omsatt > 0) {
        monthlyGrowth = ((thisMonthData.omsatt - lastMonthData.omsatt) / lastMonthData.omsatt) * 100;
      }
    }
    
    return [
      {
        title: 'Aktive Tilbud',
        value: activeProjects.toString(),
        change: '+0', // Could be calculated by comparing with previous period
        icon: 'FileText',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      },
      {
        title: 'Totale Kunder',
        value: customerCount.toString(),
        change: '+0', // Could be calculated by comparing with previous period
        icon: 'Users',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      },
      {
        title: 'Månedlig Vekst',
        value: `${monthlyGrowth.toFixed(1)}%`,
        change: monthlyGrowth >= 0 ? `+${monthlyGrowth.toFixed(1)}%` : `${monthlyGrowth.toFixed(1)}%`,
        icon: 'TrendingUp',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
      },
      {
        title: 'Gj.snitt Verdi',
        value: `${Math.round(avgQuoteValue / 1000)}k`,
        change: '+0k', // Could be calculated by comparing with previous period
        icon: 'DollarSign',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
      },
    ];
    
  } catch (error) {
    throw handleDatabaseError(error, 'hente hurtigstatistikk data');
  }
};

// Helper function to get month name
function getMonthName(monthIndex: number): string {
  const months = [
    'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[monthIndex] || months[0];
}