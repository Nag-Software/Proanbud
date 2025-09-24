'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { MainChart } from '@/components/dashboard/MainChart';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { getDashboardKPIsWithChange } from '@/lib/services/analyticsService';
import { useEffect, useState } from 'react';

interface KpiData {
  title: string;
  value: string;
  change: string;
  icon: string;
}

export default function DashboardPage() {
  const [kpiData, setKpiData] = useState<KpiData[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div>
      <PageHeader title="Dashboard" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {kpiData.map((kpi) => (
          <KpiCard 
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            icon={kpi.icon}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MainChart />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}