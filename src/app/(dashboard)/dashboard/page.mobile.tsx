"use client";

import { useState, useEffect} from "react";
import { useRouter } from 'next/navigation';
import { KpiGrid } from '@/components/dashboard/KpiGrid.mobile';
import { Kunde, Tilbud } from '@/lib/types';
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardKPIsWithChange, getDashboardChartData} from "@/lib/services/analyticsService";
import { KpiData } from "@/lib/types";
import { MainChart } from '@/components/dashboard/MainChart';
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuotesChart } from "@/components/dashboard/QuotesChart";



export default function MobileDashboardPage() {

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [kpiData, setKpiData] = useState<KpiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);;

  // State for detail drawers
  const [selectedCustomer, setSelectedCustomer] = useState<Kunde | null>(null);
  const [isCustomerDetailsOpen, setIsCustomerDetailsOpen] = useState(false);

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
        const filteredData = data.filter((kpi) => kpi.title !== 'Vunnede Tilbud'); // Remove 'Vunnede Tilbud' KPI for mobile view
        setKpiData(filteredData);
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
          { title: 'Total Omsetning', value: '?', change: '+0%', icon: 'DollarSign' },
          { title: 'Aktive Tilbud', value: '?', change: '+0%', icon: 'FileText' },
          { title: 'Vunnede Tilbud', value: '?', change: '+0%', icon: 'Award' },
          { title: 'Treffprosent', value: '?', change: '+0%', icon: 'Target' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadKpiData();
  }, [authLoading, user]);

  if (loading) {
    return (
      <div className="p-2">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    )
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
    <div className="min-h-screen">
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


      {/* MAIN DASHBOARD MOBILE CONTENT */}
      <div className="w-full transition-all duration-300 ease-in-out">
        <div className="p-2">
          <KpiGrid data={kpiData}/>
        </div>
        <div className="p-2">
          <MainChart compact />
        </div>
        <div className="p-2">
          <ActivityFeed compact/>
        </div>
        <div className="p-2">
          <QuotesChart compact />
        </div>
      </div>
    </div>
  )
}