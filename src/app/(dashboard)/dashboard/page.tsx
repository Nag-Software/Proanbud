'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { KpiGrid } from '@/components/dashboard/KpiGrid';
import { MainChart } from '@/components/dashboard/MainChart';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { DashboardPieChart } from '@/components/dashboard/PieChart';
import { QuotesDataTable } from '@/components/dashboard/QuotesDataTable';
import { CustomersDataTable } from '@/components/dashboard/CustomersDataTable';
import { QuickStatsWidget } from '@/components/dashboard/QuickStatsWidget';
import { getDashboardKPIsWithChange } from '@/lib/services/analyticsService';
import { getUserSettings, updateUserSettings } from '@/lib/services/userSettingsService';
import { useEffect, useState } from 'react';
import { WidthProvider, Responsive } from 'react-grid-layout';
import { Button } from '@/components/ui/button';
import { Settings, Plus, X } from 'lucide-react';
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
  const [kpiData, setKpiData] = useState<KpiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [layout, setLayout] = useState<any[]>([]);
  const [availableComponents, setAvailableComponents] = useState<DashboardComponent[]>([]);

  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');

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
    // Only save layout changes when in edit mode
    if (isEditMode) {
      setLayout(newLayout);
      try {
        const cleanedLayout = cleanLayoutData(newLayout);
        await updateUserSettings({ dashboardLayout: cleanedLayout });
        console.log('Dashboard layout saved to database:', cleanedLayout);
      } catch (error) {
        console.error('Failed to save dashboard layout:', error);
        // Fallback to localStorage if Firebase fails
        localStorage.setItem('dashboard-layout', JSON.stringify(newLayout));
      }
    } else {
      // Just update local state without saving
      setLayout(newLayout);
    }
  };

  const handleBreakpointChange = (newBreakpoint: string, newCols: number) => {
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

    const newItem = {
      i: componentId,
      x: (layout.length * 2) % 12,
      y: Math.floor(layout.length / 6) * 4,
      w: componentId.includes('table') ? 6 : 4,
      h: componentId.includes('table') ? 8 : 6,
      minH: componentId.includes('table') ? 6 : 4,
    };

    const newLayout = [...layout, newItem];
    setLayout(newLayout);
    try {
      const cleanedLayout = cleanLayoutData(newLayout);
      await updateUserSettings({ dashboardLayout: cleanedLayout });
      console.log('Component added and layout saved to database:', componentId, cleanedLayout);
    } catch (error) {
      console.error('Failed to save dashboard layout:', error);
      localStorage.setItem('dashboard-layout', JSON.stringify(newLayout));
    }
  };

  const removeComponent = async (componentId: string) => {
    const newLayout = layout.filter(item => item.i !== componentId);
    setLayout(newLayout);
    try {
      const cleanedLayout = cleanLayoutData(newLayout);
      await updateUserSettings({ dashboardLayout: cleanedLayout });
      console.log('Component removed and layout saved to database:', componentId, cleanedLayout);
    } catch (error) {
      console.error('Failed to save dashboard layout:', error);
      localStorage.setItem('dashboard-layout', JSON.stringify(newLayout));
    }
  };

  const isComponentInLayout = (componentId: string) => {
    return layout.some(item => item.i === componentId);
  };

  const resetLayout = async () => {
    const defaultLayout = [
      { i: 'kpi-cards', x: 0, y: 0, w: 12, h: 4, minH: 4 },
      { i: 'main-chart', x: 0, y: 4, w: 8, h: 8, minH: 6 },
      { i: 'quick-stats', x: 8, y: 4, w: 4, h: 4, minH: 4 },
      { i: 'pie-chart', x: 8, y: 8, w: 4, h: 6, minH: 4 },
      { i: 'activity-feed', x: 0, y: 12, w: 12, h: 6, minH: 4 },
    ];
    setLayout(defaultLayout);
    try {
      const cleanedLayout = cleanLayoutData(defaultLayout);
      await updateUserSettings({ dashboardLayout: cleanedLayout });
      console.log('Layout reset and saved to database:', cleanedLayout);
    } catch (error) {
      console.error('Failed to save dashboard layout:', error);
      localStorage.setItem('dashboard-layout', JSON.stringify(defaultLayout));
    }
  };

  useEffect(() => {
    const loadKpiData = async () => {
      try {
        const data = await getDashboardKPIsWithChange();
        setKpiData(data);
      } catch (error) {
        console.error('Failed to load KPI data:', error);
        // Fallback to empty data
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
  }, []);

  useEffect(() => {
    // Initialize available components
    const components: DashboardComponent[] = [
      {
        id: 'kpi-cards',
        title: 'KPI Cards',
        component: (
          <KpiGrid 
            data={kpiData}
            className="h-full flex items-center justify-center p-4"
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
          <div className="h-full flex flex-col items-center justify-center p-4">
            <DashboardPieChart />
          </div>
        ),
      },
      {
        id: 'quotes-table',
        title: 'Tilbud Tabell',
        component: (
          <div className="h-full flex flex-col">
            <QuotesDataTable />
          </div>
        ),
      },
      {
        id: 'customers-table',
        title: 'Kunder Tabell',
        component: (
          <div className="h-full flex flex-col">
            <CustomersDataTable />
          </div>
        ),
      },
      {
        id: 'quick-stats',
        title: 'Hurtigstatistikk',
        component: (
          <div className="h-full flex flex-col p-4">
            <QuickStatsWidget />
          </div>
        ),
      },
      {
        id: 'activity-feed',
        title: 'Siste Aktiviteter',
        component: (
          <div className="h-full flex flex-col overflow-hidden">
            <ActivityFeed />
          </div>
        ),
      },
    ];
    setAvailableComponents(components);

    // Load layout from user settings or use default
    const loadLayout = async () => {
      try {
        const userSettings = await getUserSettings();
        if (userSettings?.dashboardLayout) {
          setLayout(userSettings.dashboardLayout);
          console.log('Dashboard layout loaded from database:', userSettings.dashboardLayout);
        } else {
          // Default layout with more components
          const defaultLayout = [
            { i: 'kpi-cards', x: 0, y: 0, w: 12, h: 4, minH: 4 },
            { i: 'main-chart', x: 0, y: 4, w: 8, h: 8, minH: 6 },
            { i: 'quick-stats', x: 8, y: 4, w: 4, h: 4, minH: 4 },
            { i: 'pie-chart', x: 8, y: 8, w: 4, h: 6, minH: 4 },
            { i: 'activity-feed', x: 0, y: 12, w: 12, h: 6, minH: 4 },
          ];
          setLayout(defaultLayout);
          console.log('Using default dashboard layout:', defaultLayout);
        }
      } catch (error) {
        console.error('Failed to load dashboard layout:', error);
        // Fallback to localStorage if Firebase fails
        const savedLayout = localStorage.getItem('dashboard-layout');
        if (savedLayout) {
          setLayout(JSON.parse(savedLayout));
        } else {
          const defaultLayout = [
            { i: 'kpi-cards', x: 0, y: 0, w: 12, h: 4, minH: 4 },
            { i: 'main-chart', x: 0, y: 4, w: 8, h: 8, minH: 6 },
            { i: 'quick-stats', x: 8, y: 4, w: 4, h: 4, minH: 4 },
            { i: 'pie-chart', x: 8, y: 8, w: 4, h: 6, minH: 4 },
            { i: 'activity-feed', x: 0, y: 12, w: 12, h: 6, minH: 4 },
          ];
          setLayout(defaultLayout);
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
          {[1, 2, 3, 4].map((i) => (
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

  return (
    <div className="min-h-screen">
      {/* Edit Mode Sidebar */}
      {isEditMode && (
        <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white/95 backdrop-blur-sm border-r border-slate-200 shadow-xl transform transition-transform duration-300 ease-in-out">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-800">Tilgjengelige Komponenter</h3>
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
            <div className="space-y-3">
              {availableComponents.map((component) => (
                <div key={component.id} className="group flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all duration-200">
                  <span className="text-sm font-medium text-slate-700">{component.title}</span>
                  {isComponentInLayout(component.id) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeComponent(component.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => addComponent(component.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Always full width */}
      <div className="w-full transition-all duration-300 ease-in-out">
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <PageHeader title="Dashboard" />
            <Button
              onClick={toggleEditMode}
              variant={isEditMode ? "secondary" : "outline"}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border-slate-200 hover:border-slate-300 transition-all duration-200"
            >
              <Settings className="h-4 w-4" />
              {isEditMode ? 'Avslutt Tilpasning' : 'Tilpass Siden'}
            </Button>
          </div>

          {/* Grid Background Pattern */}
          <div className="relative">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0" style={{
                backgroundImage: `
                  linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px'
              }}></div>
            </div>

            <ResponsiveGridLayout
              className="layout relative z-10"
              layouts={{
                lg: layout,
                md: layout,
                sm: layout,
                xs: layout,
                xxs: layout
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
              compactType={null}
            >
              {layout.map((item) => (
                <div key={item.i} className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full ${isEditMode ? 'ring-2 ring-blue-200 ring-opacity-50' : ''}`}>
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
                  <div className={`flex-1 flex flex-col ${isEditMode ? '' : 'h-full'} ${item.i === 'kpi-cards' ? '' : 'p-4'}`}>
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
    </div>
  );
}