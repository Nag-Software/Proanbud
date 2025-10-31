'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { KpiGrid } from '@/components/dashboard/KpiGrid';
import { MainChart } from '@/components/dashboard/MainChart';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { DashboardPieChart } from '@/components/dashboard/PieChart';
import { QuotesDataTable } from '@/components/dashboard/QuotesDataTable';
import { CustomersDataTable } from '@/components/dashboard/CustomersDataTable';
import { QuickStatsWidget } from '@/components/dashboard/QuickStatsWidget';
import { CustomerDetailsDrawer } from '@/components/kunder';
import { QuoteDetailsDrawer } from '@/components/tilbud';
import { getDashboardKPIsWithChange } from '@/lib/services/analyticsService';
import { getUserSettings, updateUserSettings, initializeUserSettings } from '@/lib/services/userSettingsService';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { WidthProvider, Responsive } from 'react-grid-layout';
import { Button } from '@/components/ui/button';
import { Settings, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { deleteCustomer } from '@/lib/services/customerService';
import { deleteTilbud, updateTilbud } from '@/lib/services/tilbudService';
import { Kunde, Tilbud } from '@/lib/types';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import '@/styles/dashboard.css';

interface KpiData {
  title: string;
  value: string;
  change: string;
  icon: string;
}

interface DashboardComponent {
  id: string;
  component: React.ReactNode;
  title: string;
}

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [kpiData, setKpiData] = useState<KpiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [desktopLayout, setDesktopLayout] = useState<any[]>([]);
  const [mobileLayout, setMobileLayout] = useState<any[]>([]);
  const [availableComponents, setAvailableComponents] = useState<DashboardComponent[]>([]);

  const [updatingQuotes, setUpdatingQuotes] = useState<Set<string>>(new Set());

  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');

  // State for detail drawers
  const [selectedCustomer, setSelectedCustomer] = useState<Kunde | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Tilbud | null>(null);
  const [isCustomerDetailsOpen, setIsCustomerDetailsOpen] = useState(false);
  const [isQuoteDetailsOpen, setIsQuoteDetailsOpen] = useState(false);

  // Callback functions for table actions
  const handleEditCustomer = (customer: Kunde) => {
    router.push('/kunder');
  };

  const handleDeleteCustomer = async (customer: Kunde) => {
    if (confirm(`Er du sikker på at du vil slette kunden "${customer.navn}"?`)) {
      try {
        await deleteCustomer(customer.id);
        // The real-time listener will automatically update the UI
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Kunne ikke slette kunden. Prøv igjen.');
      }
    }
  };

  const handleSendQuote = (quote: Tilbud) => {
    router.push('/tilbud');
  };

  const handleMarkAsWon = async (quote: Tilbud) => {
    setUpdatingQuotes(prev => new Set(prev).add(quote.id));
    try {
      await updateTilbud(quote.id, { status: 'vunnet' });
    } catch (error) {
      console.error('Error updating quote:', error);
      alert('Kunne ikke oppdatere tilbudet. Prøv igjen.');
    } finally {
      setUpdatingQuotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(quote.id);
        return newSet;
      });
    }
  };

  const handleMarkAsLost = async (quote: Tilbud) => {
    setUpdatingQuotes(prev => new Set(prev).add(quote.id));
    try {
      await updateTilbud(quote.id, { status: 'tapt' });
    } catch (error) {
      console.error('Error updating quote:', error);
      alert('Kunne ikke oppdatere tilbudet. Prøv igjen.');
    } finally {
      setUpdatingQuotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(quote.id);
        return newSet;
      });
    }
  };

  // Row click handlers for opening detail drawers
  const handleCustomerRowClick = (customer: Kunde) => {
    setSelectedCustomer(customer);
    setIsCustomerDetailsOpen(true);
  };

  const handleQuoteRowClick = (quote: Tilbud) => {
    // On desktop (lg/md breakpoints), navigate to dedicated page
    if (currentBreakpoint === 'lg' || currentBreakpoint === 'md') {
      router.push(`/tilbud/${quote.id}`);
    } else {
      // On mobile (sm/xs/xxs breakpoints), open drawer
      setSelectedQuote(quote);
      setIsQuoteDetailsOpen(true);
    }
  };

  // Get current layout based on breakpoint
  const getCurrentLayout = () => {
    return currentBreakpoint === 'lg' || currentBreakpoint === 'md' ? desktopLayout : mobileLayout;
  };

  // Set current layout based on breakpoint
  const setCurrentLayout = (newLayout: any[]) => {
    if (currentBreakpoint === 'lg' || currentBreakpoint === 'md') {
      setDesktopLayout(newLayout);
    } else {
      setMobileLayout(newLayout);
    }
  };

  // Handler to dynamically adjust KPI cards height
  const handleKpiGridHeightChange = (height: number) => {
    const rowHeight = 30; // matches ResponsiveGridLayout rowHeight
    const margin = 20; // matches ResponsiveGridLayout margin
    const padding = 34; // p-4 = 16px top + 16px bottom = 32px
    const headerHeight = isEditMode ? 41 : 0; // drag handle height when in edit mode
    
    // Calculate required grid units (h) based on actual content height
    const totalHeight = height + padding + headerHeight;
    const requiredHeight = Math.ceil(totalHeight / (rowHeight + margin));
    
    // Update layout if KPI cards height needs to change (desktop only)
    if (currentBreakpoint === 'lg' || currentBreakpoint === 'md') {
      setDesktopLayout(prevLayout => {
        const kpiCardItem = prevLayout.find(item => item.i === 'kpi-cards');
        if (kpiCardItem && kpiCardItem.h !== requiredHeight && requiredHeight >= 4) {
          const updatedLayout = prevLayout.map(item => {
            if (item.i === 'kpi-cards') {
              return { ...item, h: requiredHeight };
            }
            return item;
          });
          return updatedLayout;
        }
        return prevLayout;
      });
    }
  };

  // Handler to dynamically adjust quotes table height
  const handleQuotesTableHeightChange = (height: number) => {
    const rowHeight = 30; // matches ResponsiveGridLayout rowHeight
    const margin = 20; // matches ResponsiveGridLayout margin
    const padding = 26; // CardContent vertical padding (py-4) + extra space
    const headerHeight = isEditMode ? 41 : 0; // drag handle height when in edit mode

    // Calculate required grid units (h) based on actual content height
    const totalHeight = height + padding + headerHeight;
    const requiredHeight = Math.ceil(totalHeight / (rowHeight + margin));

    // Update layout if quotes table height needs to change (desktop only)
    if (currentBreakpoint === 'lg' || currentBreakpoint === 'md') {
      setDesktopLayout(prevLayout => {
        const quotesTableItem = prevLayout.find(item => item.i === 'quotes-table');
        if (quotesTableItem && quotesTableItem.h !== requiredHeight && requiredHeight >= 8) {
          const updatedLayout = prevLayout.map(item => {
            if (item.i === 'quotes-table') {
              return { ...item, h: requiredHeight };
            }
            return item;
          });
          return updatedLayout;
        }
        return prevLayout;
      });
    }
  };

  // Handler to dynamically adjust customers table height
  const handleCustomersTableHeightChange = (height: number) => {
    const rowHeight = 30; // matches ResponsiveGridLayout rowHeight
    const margin = 20; // matches ResponsiveGridLayout margin
    const padding = 20; // CardContent vertical padding (py-4) + extra space
    const headerHeight = isEditMode ? 41 : 0; // drag handle height when in edit mode

    // Calculate required grid units (h) based on actual content height
    const totalHeight = height + padding + headerHeight;
    const requiredHeight = Math.ceil(totalHeight / (rowHeight + margin));

    // Update layout if customers table height needs to change (desktop only)
    if (currentBreakpoint === 'lg' || currentBreakpoint === 'md') {
      setDesktopLayout(prevLayout => {
        const customersTableItem = prevLayout.find(item => item.i === 'customers-table');
        if (customersTableItem && customersTableItem.h !== requiredHeight && requiredHeight >= 8) {
          const updatedLayout = prevLayout.map(item => {
            if (item.i === 'customers-table') {
              return { ...item, h: requiredHeight };
            }
            return item;
          });
          return updatedLayout;
        }
        return prevLayout;
      });
    }
  };

  // Clean layout data to remove undefined properties before saving to Firebase
  const cleanLayoutData = (layout: any[]): any[] => {
    return layout.map(item => {
      const cleanedItem: any = {};
      // Only include defined properties
      if (item.i !== undefined) cleanedItem.i = item.i;
      if (item.x !== undefined) cleanedItem.x = item.x;
      if (item.y !== undefined) cleanedItem.y = item.y;
      if (item.w !== undefined) cleanedItem.w = item.w;
      if (item.h !== undefined) cleanedItem.h = item.h;
      if (item.minW !== undefined) cleanedItem.minW = item.minW;
      if (item.minH !== undefined) cleanedItem.minH = item.minH;
      if (item.maxW !== undefined) cleanedItem.maxW = item.maxW;
      if (item.maxH !== undefined) cleanedItem.maxH = item.maxH;
      return cleanedItem;
    });
  };

  const handleLayoutChange = async (newLayout: any[], allLayouts: any) => {
    // Ensure no component goes above y=0 (solid top)
    const constrainedLayout = newLayout.map(item => ({
      ...item,
      y: Math.max(0, item.y) // Prevent negative y values
    }));

    // Only save layout changes when in edit mode
    if (isEditMode) {
      console.log('📐 Layout changed (Edit Mode):', constrainedLayout, 'Breakpoint:', currentBreakpoint);
      setCurrentLayout(constrainedLayout);
      try {
        // Save the updated layout for the current breakpoint
        const layoutsToSave = {
          dashboardLayout: (currentBreakpoint === 'lg' || currentBreakpoint === 'md') ? cleanLayoutData(constrainedLayout) : cleanLayoutData(desktopLayout),
          dashboardLayoutMobile: (currentBreakpoint === 'lg' || currentBreakpoint === 'md') ? cleanLayoutData(mobileLayout) : cleanLayoutData(constrainedLayout)
        };
        await updateUserSettings(layoutsToSave);
        console.log('💾 Dashboard layouts saved:', layoutsToSave);
      } catch (error) {
        console.error('Failed to save dashboard layout:', error);
        // Fallback: save current layouts to localStorage
        localStorage.setItem('dashboard-layout-desktop', JSON.stringify(desktopLayout));
        localStorage.setItem('dashboard-layout-mobile', JSON.stringify(mobileLayout));
      }
    } else {
      // Just update local state without saving
      console.log('📐 Layout changed (View Mode):', constrainedLayout);
      setCurrentLayout(constrainedLayout);
    }
  };

  const handleBreakpointChange = (newBreakpoint: string, newCols: number) => {
    console.log('📱 Breakpoint changed:', newBreakpoint);
    setCurrentBreakpoint(newBreakpoint);
  };

  const toggleEditMode = () => {
    // Only allow edit mode on desktop
    if (window.innerWidth < 768) {
      alert('Tilpasning av dashboard er kun tilgjengelig på desktop.');
      return;
    }
    setIsEditMode(!isEditMode);
  };

  const getComponentById = (id: string) => {
    return availableComponents.find(comp => comp.id === id)?.component;
  };

  const addComponent = async (componentId: string) => {
    const component = availableComponents.find(c => c.id === componentId);
    if (!component) return;

    const currentLayout = getCurrentLayout();
    const newItem = {
      i: componentId,
      x: (currentLayout.length * 2) % 12,
      y: Math.floor(currentLayout.length / 6) * 4,
      w: componentId.includes('table') ? 6 : 4,
      h: componentId.includes('table') ? 8 : 6,
      minH: componentId.includes('table') ? 6 : 4,
    };

    const newLayout = [...currentLayout, newItem];
    console.log('➕ Adding component to layout:', componentId, newLayout);
    setCurrentLayout(newLayout);
    try {
      const cleanedDesktop = cleanLayoutData(desktopLayout);
      const cleanedMobile = cleanLayoutData(mobileLayout);
      await updateUserSettings({ 
        dashboardLayout: cleanedDesktop,
        dashboardLayoutMobile: cleanedMobile
      });
      console.log('💾 Component added and layout saved to database:', componentId);
    } catch (error) {
      console.error('Failed to save dashboard layout:', error);
      localStorage.setItem('dashboard-layout-desktop', JSON.stringify(desktopLayout));
      localStorage.setItem('dashboard-layout-mobile', JSON.stringify(mobileLayout));
    }
  };

  const removeComponent = async (componentId: string) => {
    const currentLayout = getCurrentLayout();
    const newLayout = currentLayout.filter(item => item.i !== componentId);
    console.log('➖ Removing component from layout:', componentId, newLayout);
    setCurrentLayout(newLayout);
    try {
      const cleanedDesktop = cleanLayoutData(desktopLayout);
      const cleanedMobile = cleanLayoutData(mobileLayout);
      await updateUserSettings({ 
        dashboardLayout: cleanedDesktop,
        dashboardLayoutMobile: cleanedMobile
      });
      console.log('💾 Component removed and layout saved to database:', componentId);
    } catch (error) {
      console.error('Failed to save dashboard layout:', error);
      localStorage.setItem('dashboard-layout-desktop', JSON.stringify(desktopLayout));
      localStorage.setItem('dashboard-layout-mobile', JSON.stringify(mobileLayout));
    }
  };

  const isComponentInLayout = (componentId: string) => {
    const currentLayout = getCurrentLayout();
    return currentLayout.some(item => item.i === componentId);
  };

  const resetLayout = async () => {
    const defaultDesktop = [
      { i: 'kpi-cards', x: 0, y: 0, w: 12, h: 4, minH: 4 },
      { i: 'main-chart', x: 0, y: 4, w: 8, h: 9, minH: 6 },
      { i: 'quick-stats', x: 3, y: 6, w: 5, h: 7, minH: 4 },
      { i: 'activity-feed', x: 9, y: 4, w: 4, h: 16, minH: 4 },
      { i: 'pie-chart', x: 0, y: 6, w: 3, h: 7, minH: 4 },
      { i: 'quotes-table', x: 0, y: 8, w: 12, h: 8, minH: 7 },
      { i: 'customers-table', x: 0, y: 8, w: 12, h: 8, minH: 7 },
    ];
    console.log('🔄 Resetting layout to default:', defaultDesktop);
    setDesktopLayout(defaultDesktop);
    setMobileLayout(defaultDesktop); // Use same default for mobile initially
    try {
      const cleanedLayout = cleanLayoutData(defaultDesktop);
      await updateUserSettings({ 
        dashboardLayout: cleanedLayout,
        dashboardLayoutMobile: cleanedLayout
      });
      console.log('💾 Layout reset and saved to database');
    } catch (error) {
      console.error('Failed to save dashboard layout:', error);
      localStorage.setItem('dashboard-layout-desktop', JSON.stringify(defaultDesktop));
      localStorage.setItem('dashboard-layout-mobile', JSON.stringify(defaultDesktop));
    }
  };

  useEffect(() => {
    const loadKpiData = async () => {
      // Wait for authentication to be established
      if (authLoading || !user) {
        return;
      }

      try {
        // Clear any previous auth errors
        setAuthError(null);
        
        // Ensure user token is fresh
        await user.getIdToken(true); // Force refresh
        
        const data = await getDashboardKPIsWithChange();
        setKpiData(data);
      } catch (error: any) {
        console.error('Failed to load KPI data:', error);
        
        // Check if it's an authentication error
        if (error.message?.includes('invalid token') || error.message?.includes('Autentiseringsfeil')) {
          setAuthError('Din økt har utløpt. Vennligst logg inn på nytt.');
          // Redirect to login after a short delay
          setTimeout(() => {
            window.location.href = '/login';
          }, 3000);
          return;
        }
        
        // Fallback to empty data for other errors
        setKpiData([
          { title: 'Total Omsetning', value: '0 kr', change: '+0%', icon: 'DollarSign' },
          { title: 'Aktive Tilbud', value: '0', change: '+0%', icon: 'FileText' },
          { title: 'Vunnede Tilbud', value: '0', change: '+0%', icon: 'Award' },
          { title: 'Treffprosent', value: '0%', change: '+0%', icon: 'Target' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadKpiData();
  }, [authLoading, user]);

  useEffect(() => {
    // Initialize available components
    const components: DashboardComponent[] = [
      {
        id: 'kpi-cards',
        title: 'KPI Cards',
        component: (
          <KpiGrid 
            data={kpiData}
            className="p-0 m-0"
            onHeightChange={handleKpiGridHeightChange}
          />
        ),
      },
      {
        id: 'main-chart',
        title: 'Hovedgraf',
        component: (
          <div className="h-full flex flex-col">
            <MainChart />
          </div>
        ),
      },

      {
        id: 'pie-chart',
        title: 'Tilbud Status',
        component: (
          <div className="h-full flex flex-col">
            <DashboardPieChart />
          </div>
        ),
      },
      {
        id: 'quotes-table',
        title: 'Tilbud Tabell',
        component: (
          <div className="h-full flex flex-col">
            <QuotesDataTable 
              handleSendQuote={handleSendQuote}
              handleMarkAsWon={handleMarkAsWon}
              handleMarkAsLost={handleMarkAsLost}
              updatingQuotes={updatingQuotes}
              onRowClick={handleQuoteRowClick}
              onHeightChange={handleQuotesTableHeightChange}
            />
          </div>
        ),
      },
      {
        id: 'customers-table',
        title: 'Kunder Tabell',
        component: (
          <div className="h-full flex flex-col">
            <CustomersDataTable 
              onEditCustomer={handleEditCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onRowClick={handleCustomerRowClick}
              onHeightChange={handleCustomersTableHeightChange}
            />
          </div>
        ),
      },
      {
        id: 'quick-stats',
        title: 'Hurtigstatistikk',
        component: (
          <div className="h-full flex flex-col">
            <QuickStatsWidget />
          </div>
        ),
      },
      {
        id: 'activity-feed',
        title: 'Siste Aktiviteter',
        component: (
          <div className="h-full flex flex-col">
            <ActivityFeed />
          </div>
        ),
      },
    ];
    setAvailableComponents(components);

    // Load layout from user settings or use default
    const loadLayout = async () => {
      const defaultDesktop = [
        { i: 'kpi-cards', x: 0, y: 0, w: 10, h: 4, minH: 4 },
        { i: 'main-chart', x: 0, y: 4, w: 8, h: 9, minH: 6 },
        { i: 'quick-stats', x: 3, y: 6, w: 5, h: 7, minH: 4 },
        { i: 'activity-feed', x: 9, y: 4, w: 4, h: 16, minH: 4 },
        { i: 'pie-chart', x: 0, y: 6, w: 3, h: 7, minH: 4 },
        { i: 'quotes-table', x: 0, y: 8, w: 12, h: 8, minH: 7 },
        { i: 'customers-table', x: 0, y: 8, w: 12, h: 8, minH: 7 },
      ];

      try {
        const userSettings = await getUserSettings();
        
        let desktop: any;
        let mobile: any;
        
        if (!userSettings) {
          // Initialize user settings for new users
          console.log('🔄 Initializing user settings for new user');
          await initializeUserSettings({ 
            name: user?.displayName || '', 
            email: user?.email || '' 
          }, user?.uid);
          // Reload settings after initialization
          const newUserSettings = await getUserSettings();
          desktop = newUserSettings?.dashboardLayout;
          mobile = newUserSettings?.dashboardLayoutMobile;
        } else {
          desktop = userSettings.dashboardLayout;
          mobile = userSettings.dashboardLayoutMobile;
        }
        
        // Check if user has no dashboard layout or invalid format
        const needsMigration = !desktop || !Array.isArray(desktop) || desktop.length === 0 ||
                               !mobile || !Array.isArray(mobile) || mobile.length === 0;
        
        if (needsMigration) {
          console.log('🔄 Migrating user dashboard layout to default structure');
          
          // Use default layouts
          desktop = defaultDesktop;
          mobile = [
              { i: 'kpi-cards', x: 0, y: 0, w: 12, h: 4, minH: 4 },
              { i: 'main-chart', x: 0, y: 4, w: 8, h: 9, minH: 6 },
              { i: 'quick-stats', x: 3, y: 6, w: 5, h: 7, minH: 4 },
              { i: 'activity-feed', x: 9, y: 4, w: 4, h: 16, minH: 4 },
              { i: 'pie-chart', x: 0, y: 6, w: 3, h: 7, minH: 4 },
              { i: 'quotes-table', x: 0, y: 8, w: 12, h: 8, minH: 7 },
              { i: 'customers-table', x: 0, y: 8, w: 12, h: 8, minH: 7 },
          ];
          
          // Save the default layout to user settings
          try {
            await updateUserSettings({ 
              dashboardLayout: desktop,
              dashboardLayoutMobile: mobile
            });
            console.log('✅ Default dashboard layout saved for user');
          } catch (saveError) {
            console.warn('Could not save default dashboard layout:', saveError);
          }
        }
        
        setDesktopLayout(desktop || defaultDesktop);
        setMobileLayout(mobile || defaultDesktop);
        console.log('📋 Layouts loaded - Desktop:', desktop || defaultDesktop, 'Mobile:', mobile || defaultDesktop);
      } catch (error) {
        console.error('Failed to load dashboard layout:', error);
        // Fallback to localStorage if Firebase fails
        const savedDesktop = localStorage.getItem('dashboard-layout-desktop');
        const savedMobile = localStorage.getItem('dashboard-layout-mobile');
        
        if (savedDesktop || savedMobile) {
          const desktop = savedDesktop ? JSON.parse(savedDesktop) : defaultDesktop;
          const mobile = savedMobile ? JSON.parse(savedMobile) : defaultDesktop;
          setDesktopLayout(desktop);
          setMobileLayout(mobile);
          console.log('📋 Layouts loaded from localStorage - Desktop:', desktop, 'Mobile:', mobile);
        } else {
          setDesktopLayout(defaultDesktop);
          setMobileLayout(defaultDesktop);
          console.log('📋 Using default layouts:', defaultDesktop);
        }
      }
    };

    loadLayout();
  }, [kpiData]);
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && isEditMode) {
        setIsEditMode(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isEditMode]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-gray-200 animate-pulse rounded-lg"></div>
          <div className="h-96 bg-gray-200 animate-pulse rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Show loading state while authentication is being established
  if (authLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-lg mb-6 w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-200 rounded-lg"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    window.location.href = '/login';
    return null;
  }

  return (
    <div className="min-h-screen rounded-xl">
      {/* Authentication Error Banner */}
      {authError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 mx-4 mt-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>{authError}</span>
          </div>
        </div>
      )}
      
      {/* Edit Mode Sidebar */}
      {isEditMode && (
        <div className="absolute inset-y-0 left-0 w-[280px] bg-white border-r border-slate-200 shadow-xl overflow-y-auto" style={{ zIndex: 9999, position: 'fixed' }}>
          <div className="py-6">
            <div className="flex items-center justify-between mb-6 px-6">
              <h3 className="text-xl font-semibold text-slate-800">Tilpass Dashboard</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetLayout}
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleEditMode}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Live Components Section */}
            <div className="mb-6 px-6">
              <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live Komponenter ({getCurrentLayout().length})
              </h4>
              <div className="space-y-2">
                {getCurrentLayout().length === 0 ? (
                  <p className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded-lg">
                    Ingen komponenter aktive. Legg til komponenter fra listen under.
                  </p>
                ) : (
                  getCurrentLayout().map((item) => {
                    const component = availableComponents.find(c => c.id === item.i);
                    if (!component) return null;
                    return (
                      <div 
                        key={item.i} 
                        className="group flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                          <span className="text-sm font-medium text-slate-700 truncate">{component.title}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeComponent(component.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Available Components Section */}
            <div className="px-6">
              <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                Tilgjengelige Komponenter ({availableComponents.filter(c => !isComponentInLayout(c.id)).length})
              </h4>
              <div className="space-y-2">
                {availableComponents.filter(c => !isComponentInLayout(c.id)).length === 0 ? (
                  <p className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded-lg">
                    Alle komponenter er allerede lagt til.
                  </p>
                ) : (
                  availableComponents
                    .filter(c => !isComponentInLayout(c.id))
                    .map((component) => (
                      <div 
                        key={component.id} 
                        className="group flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full flex-shrink-0"></div>
                          <span className="text-sm font-medium text-slate-700 truncate">{component.title}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addComponent(component.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Always full width */}
      
      <div className={`w-full rounded-xl transition-all duration-300 ease-in-out`}>
        <div className="">

            <div className="flex justify-between items-center mt-1">
              <PageHeader title="Dashboard"/>
              <Button
                onClick={toggleEditMode}
                variant="outline"
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border-slate-200 hover:border-slate-300 transition-all duration-200"
              >
                <Settings className="h-4 w-4" />
                {isEditMode ? 'Avslutt Tilpasning' : 'Tilpass Siden'}
              </Button>
            </div>

          {/* Grid Background Pattern */}
          <div className="relative">
            <div className="absolute inset-0 opacity-30 z-5 left-[-25px] rounded-2xl top-[-84px] w-[calc(100%+50px)] h-[calc(100%+100px)] overflow-hidden pointer-events-none">
              <div className="absolute inset-0" style={{
                backgroundImage: `
                  linear-gradient(rgba(148, 163, 184, 0.0) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(148, 163, 184, 0.0) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }}></div>
            </div>

            <ResponsiveGridLayout
              className="layout relative z-10"
              layouts={{
                lg: desktopLayout,
                md: desktopLayout,
                sm: mobileLayout,
                xs: mobileLayout,
                xxs: mobileLayout
              }}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
              rowHeight={30}
              onLayoutChange={handleLayoutChange}
              onBreakpointChange={handleBreakpointChange}
              isDraggable={isEditMode}
              isResizable={isEditMode}
              margin={[20, 20]}
              containerPadding={[0, 0]}
              draggableHandle=".drag-handle"
              preventCollision={false}
              compactType="vertical"
              verticalCompact={true}
            >
              {getCurrentLayout().map((item) => (
                <div key={item.i} className={`overflow-auto transition-all duration-200 flex flex-col h-full ${isEditMode ? 'ring-2 ring-blue-200 ring-opacity-50' : ''}`}>
                  {isEditMode && (
                    <div className="drag-handle bg-slate-50 px-4 py-2 border-b border-slate-200 cursor-move flex items-center gap-2 flex-shrink-0">
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                      </div>
                      <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                        {availableComponents.find(c => c.id === item.i)?.title}
                      </span>
                    </div>
                  )}
                  <div className={`flex-1 flex flex-col ${item.i === 'kpi-cards' ? '' : isEditMode ? '' : 'h-full'} ${item.i === 'kpi-cards' ? '' : 'p-0'}`}>
                    {getComponentById(item.i)}
                  </div>
                </div>
              ))}
            </ResponsiveGridLayout>
          </div>
        </div>
      </div>

      {/* Overlay when edit mode is active on mobile */}
      {isEditMode && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40 md:hidden" onClick={toggleEditMode}></div>
      )}

      {/* Detail Drawers */}
      {selectedCustomer && (
        <CustomerDetailsDrawer
          customer={selectedCustomer}
          open={isCustomerDetailsOpen}
          onOpenChange={(open) => {
            setIsCustomerDetailsOpen(open);
            if (!open) setSelectedCustomer(null);
          }}
        />
      )}

      {selectedQuote && (
        <QuoteDetailsDrawer
          quote={selectedQuote}
          open={isQuoteDetailsOpen}
          onOpenChange={(open) => {
            setIsQuoteDetailsOpen(open);
            if (!open) setSelectedQuote(null);
          }}
        />
      )}
    </div>
  );
}