'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
} from 'recharts';
import { 
  getUserAnalytics, 
  UserAnalytics, 
  subscribeToAnalytics, 
  getAnalyticsWithRealTimeUpdates,
  filterAnalyticsByTimePeriod,
  TimePeriod
} from '@/lib/services/analyticsService';
import { useAuth } from '@/contexts/AuthContext';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Icons for insights
const TrendUpIcon = () => (
  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8L11 17L8 14l-4 4" />
  </svg>
);

const TrendDownIcon = () => (
  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-4-4" />
  </svg>
);

const LightbulbIcon = () => (
  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

// Time filter component
const TimeFilterDropdown = ({ selected, onSelect }: { 
  selected: TimePeriod; 
  onSelect: (period: TimePeriod) => void; 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsOpen(false);
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);
  
  const periods = [
    { id: '7dager' as const, label: '7 dager' },
    { id: '30dager' as const, label: '30 dager' },
    { id: '1aar' as const, label: '1 år' },
    { id: 'frastart' as const, label: 'Fra start' },
  ];

  const selectedPeriod = periods.find(p => p.id === selected) || periods[2];

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-sm font-medium">{selectedPeriod.label}</span>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          {periods.map(period => (
            <button
              key={period.id}
              onClick={() => {
                onSelect(period.id);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                selected === period.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Insight card component
const InsightCard = ({ icon, title, insight, trend }: {
  icon: React.ReactNode;
  title: string;
  insight: string;
  trend?: 'up' | 'down' | 'neutral';
}) => (
  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-xl border-l-4 border-blue-500">
    <div className="flex items-start gap-3">
      <div className="p-2 bg-white rounded-lg shadow-sm">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">{title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{insight}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trend === 'up' && <TrendUpIcon />}
            {trend === 'down' && <TrendDownIcon />}
            <span className={`text-xs font-medium ${
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trend === 'up' ? 'Positiv trend' : trend === 'down' ? 'Negativ trend' : 'Stabil'}
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Performance metric component
const PerformanceMetric = ({ label, value, subtitle, change, isGood }: {
  label: string;
  value: string;
  subtitle?: string;
  change?: string;
  isGood?: boolean;
}) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium text-gray-600">{label}</h3>
      {change && (
        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
          isGood ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {isGood ? <TrendUpIcon /> : <TrendDownIcon />}
          {change}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
    {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
  </div>
);

export default function AnalysePage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('30dager');

  // Handle time period changes
  const handleTimePeriodChange = useCallback((period: TimePeriod) => {
    setSelectedTimePeriod(period);
  }, []);

  // Analytics update callback for real-time updates
  const handleAnalyticsUpdate = useCallback((newAnalytics: UserAnalytics | null) => {
    setAnalytics(newAnalytics);
    if (loading) setLoading(false);
    if (error) setError(null);
  }, [loading, error]);

  // Set up real-time analytics subscription
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const initializeAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get initial analytics data
        const initialData = await getAnalyticsWithRealTimeUpdates();
        setAnalytics(initialData);
        setLoading(false);

        // Set up real-time listener
        unsubscribe = subscribeToAnalytics(handleAnalyticsUpdate);
        
      } catch (err) {
        console.error('Error setting up analytics:', err);
        setError(err instanceof Error ? err.message : 'Kunne ikke laste analysedata');
        setLoading(false);
      }
    };

    initializeAnalytics();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, handleAnalyticsUpdate]);

  // Apply time filter to analytics
  const filteredAnalytics = useMemo(() => {
    if (!analytics) return null;
    const rawTilbudData = (analytics as any).rawTilbudData;
    return filterAnalyticsByTimePeriod(analytics, selectedTimePeriod, rawTilbudData);
  }, [analytics, selectedTimePeriod]);

  // Calculate key insights
  const insights = useMemo(() => {
    if (!filteredAnalytics) return [];

    const bestJobType = filteredAnalytics.jobbypeStats.reduce((best, current) => 
      current.vunnetVerdi > best.vunnetVerdi ? current : best, 
      filteredAnalytics.jobbypeStats[0] || { jobbtype: 'Ingen', vunnetVerdi: 0, treffprosent: 0 }
    );

    const worstJobType = filteredAnalytics.jobbypeStats.filter(j => j.antallTilbud > 0).reduce((worst, current) => 
      current.treffprosent < worst.treffprosent ? current : worst,
      filteredAnalytics.jobbypeStats[0] || { jobbtype: 'Ingen', treffprosent: 100 }
    );

    const recentMonths = filteredAnalytics.monthlyData.slice(-3);
    const avgRecentRevenue = recentMonths.reduce((sum, month) => sum + month.omsatt, 0) / Math.max(recentMonths.length, 1);
    const avgRecentWinRate = recentMonths.reduce((sum, month) => 
      sum + (month.antallTilbud > 0 ? (month.antallVunnet / month.antallTilbud) * 100 : 0), 0
    ) / Math.max(recentMonths.length, 1);

    return [
      {
        icon: <StarIcon />,
        title: "Mest Lønnsomme Jobbtype",
        insight: `${bestJobType.jobbtype} har generert ${bestJobType.vunnetVerdi.toLocaleString('nb-NO')} kr med ${bestJobType.treffprosent}% suksessrate. Fokuser mer på denne type oppdrag.`,
        trend: 'up' as const
      },
      {
        icon: <LightbulbIcon />,
        title: "Forbedringsområde",
        insight: `${worstJobType.jobbtype} har kun ${worstJobType.treffprosent}% treffprosent. Vurder å justere priser eller tilnærming på disse oppdragene.`,
        trend: worstJobType.treffprosent < 50 ? 'down' as const : 'neutral' as const
      },
      {
        icon: <TrendUpIcon />,
        title: "Siste 3 Måneder",
        insight: `Gjennomsnittlig månedlig omsetning på ${avgRecentRevenue.toLocaleString('nb-NO')} kr med ${avgRecentWinRate.toFixed(0)}% vinnrate.`,
        trend: avgRecentWinRate > filteredAnalytics.winRate ? 'up' as const : 'down' as const
      }
    ];
  }, [filteredAnalytics]);

  // Prepare chart data for top performing job types
  const topJobTypes = useMemo(() => {
    if (!filteredAnalytics) return [];
    
    return filteredAnalytics.jobbypeStats
      .filter(job => job.antallTilbud > 0)
      .sort((a, b) => b.vunnetVerdi - a.vunnetVerdi)
      .slice(0, 5)
      .map(job => ({
        name: job.jobbtype.length > 12 ? job.jobbtype.substring(0, 12) + '...' : job.jobbtype,
        omsetning: job.vunnetVerdi,
        tilbud: job.antallTilbud,
        vunnet: job.antallVunnet,
        rate: job.treffprosent
      }));
  }, [filteredAnalytics]);

  // Prepare chart data - daily for short periods, monthly for long periods
  const chartData = useMemo(() => {
    if (!filteredAnalytics) return { data: [], isDailyData: false };
    
    console.log('Chart data calculation:', {
      selectedTimePeriod,
      hasDailyData: !!filteredAnalytics.dailyData,
      dailyDataLength: filteredAnalytics.dailyData?.length || 0,
      hasMonthlyData: !!filteredAnalytics.monthlyData,
      monthlyDataLength: filteredAnalytics.monthlyData?.length || 0
    });
    
    // Bruk daglig data for korte perioder (7 dager, 30 dager)
    if (filteredAnalytics.dailyData && filteredAnalytics.dailyData.length > 0 && 
        (selectedTimePeriod === '7dager' || selectedTimePeriod === '30dager')) {
      console.log('Using daily data:', filteredAnalytics.dailyData);
      return {
        data: filteredAnalytics.dailyData.map(day => ({
          period: day.date,
          fullDate: day.fullDate,
          omsetning: day.omsatt,
          tilbud: day.antallTilbud,
          vinnrate: day.antallTilbud > 0 ? Math.round((day.antallVunnet / day.antallTilbud) * 100) : 0
        })),
        isDailyData: true
      };
    }
    
    // Bruk månedlig data for lengre perioder (1 år, fra start)
    console.log('Using monthly data:', filteredAnalytics.monthlyData);
    return {
      data: filteredAnalytics.monthlyData.map(month => ({
        period: month.month,
        omsetning: month.omsatt,
        tilbud: month.antallTilbud,
        vinnrate: month.antallTilbud > 0 ? Math.round((month.antallVunnet / month.antallTilbud) * 100) : 0
      })),
      isDailyData: false
    };
  }, [filteredAnalytics, selectedTimePeriod]);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Logg inn for å se analyser</h3>
          <p className="text-gray-600">Du må være logget inn for å se forretningsanalyser</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Analyserer dine data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Kunne ikke laste data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Prøv igjen
          </button>
        </div>
      </div>
    );
  }

  if (!analytics || !filteredAnalytics) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingen data å analysere</h3>
          <p className="text-gray-600">Start med å legge til kunder og tilbud for å se analyser</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <PageHeader title="Forretningsanalyse" />
        <div className="flex items-center gap-4">
          <TimeFilterDropdown selected={selectedTimePeriod} onSelect={handleTimePeriodChange} />
          {analytics && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Oppdatert: {new Date(analytics.lastUpdated).toLocaleString('nb-NO')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PerformanceMetric
          label="Total Omsetning"
          value={`${filteredAnalytics.totalRevenue.toLocaleString('nb-NO')} kr`}
          subtitle="Fra vunnede tilbud"
          change="+12%" 
          isGood={true}
        />
        <PerformanceMetric
          label="Vinnrate"
          value={`${filteredAnalytics.winRate}%`}
          subtitle={`${filteredAnalytics.vunnetTilbud} av ${filteredAnalytics.totalTilbud} tilbud`}
          change="+5%"
          isGood={filteredAnalytics.winRate > 50}
        />
        <PerformanceMetric
          label="Gjennomsnittlig Tilbudsverdi"
          value={`${Math.round(filteredAnalytics.totalRevenue / Math.max(filteredAnalytics.vunnetTilbud, 1)).toLocaleString('nb-NO')} kr`}
          subtitle="Per vunnet tilbud"
        />
        <PerformanceMetric
          label="Aktive Jobtyper"
          value={filteredAnalytics.jobbypeStats.filter(j => j.antallTilbud > 0).length.toString()}
          subtitle={`${filteredAnalytics.totalCustomers} kunder totalt`}
        />
      </div>

      {/* Business Insights */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">💡 Smarte Innsikter</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <InsightCard key={index} {...insight} />
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Omsetningsutvikling</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <LineChart data={chartData.data} key={`revenue-${selectedTimePeriod}-${chartData.isDailyData ? 'daily' : 'monthly'}`}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fill: '#6D6D72', fontSize: 12 }}
                    tickFormatter={chartData.isDailyData ? (value) => {
                      // If value is already formatted (e.g., "1 okt"), return as is
                      if (typeof value === 'string' && value.includes(' ')) {
                        return value;
                      }
                      // Otherwise, format from date
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    } : undefined}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000).toLocaleString()}k`}
                    tick={{ fill: '#6D6D72', fontSize: 12 }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const displayLabel = chartData.isDailyData && payload[0]?.payload?.fullDate 
                          ? new Date(payload[0].payload.fullDate).toLocaleDateString('nb-NO', { weekday: 'short', day: 'numeric', month: 'short' })
                          : label;
                        return (
                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-lg">
                            <p className="font-bold text-gray-800">{displayLabel}</p>
                            <p className="text-sm text-green-600">{`Omsetning: ${payload[0].value.toLocaleString('nb-NO')} kr`}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="omsetning"
                    stroke="#1A4314"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#1A4314' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Job Types Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Topp 5 Jobtyper (omsetning)</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <BarChart data={topJobTypes} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} key={`jobtypes-${selectedTimePeriod}-${topJobTypes.length}`}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#6D6D72', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    tick={{ fill: '#6D6D72', fontSize: 12 }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-lg">
                            <p className="font-bold text-gray-800">{label}</p>
                            <p className="text-sm text-green-600">{`Omsetning: ${payload[0].value.toLocaleString('nb-NO')} kr`}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="omsetning" fill="#1A4314" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Win Rate Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Vinnrate Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <LineChart data={chartData.data} key={`winrate-${selectedTimePeriod}-${chartData.isDailyData ? 'daily' : 'monthly'}`}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fill: '#6D6D72', fontSize: 12 }}
                  tickFormatter={chartData.isDailyData ? (value) => {
                    // If value is already formatted (e.g., "1 okt"), return as is
                    if (typeof value === 'string' && value.includes(' ')) {
                      return value;
                    }
                    // Otherwise, format from date
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  } : undefined}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: '#6D6D72', fontSize: 12 }}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const displayLabel = chartData.isDailyData && payload[0]?.payload?.fullDate 
                        ? new Date(payload[0].payload.fullDate).toLocaleDateString('nb-NO', { weekday: 'short', day: 'numeric', month: 'short' })
                        : label;
                      return (
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-lg">
                          <p className="font-bold text-gray-800">{displayLabel}</p>
                          <p className="text-sm text-blue-600">{`Vinnrate: ${payload[0].value}%`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="vinnrate" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#2563eb' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}