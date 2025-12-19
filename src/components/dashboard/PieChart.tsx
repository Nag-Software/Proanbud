'use client';

import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { getTilbudStatusData, TilbudStatusData } from '@/lib/services/analyticsService';

interface ChartData {
  name: string;
  value: number;
  count: number;
  color: string;
  [key: string]: any;
}

export const DashboardPieChart = () => {
  const [pieData, setPieData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPieData = async () => {
      try {
        const data = await getTilbudStatusData();
        // Transform the data to match chart requirements
        const chartData: ChartData[] = data.map(item => ({
          ...item,
          // Add index signature compatibility
        }));
        setPieData(chartData);
      } catch (error) {
        console.error('Failed to load tilbud status data:', error);
        // Fallback to empty data
        setPieData([]);
      } finally {
        setLoading(false);
      }
    };

    loadPieData();
  }, []);

  if (loading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-base sm:text-lg text-center">Tilbud Status</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center min-h-0">
          <div className="flex-1 min-h-0 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
            <span className="text-gray-500 text-sm">Laster data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-base sm:text-lg text-left">Tilbud Status</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center min-h-0">
        {pieData.length > 0 ? (
          <div className="flex-1 min-h-0 flex items-center justify-center pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }: any) => `${name} ${value}%`}
                  outerRadius="70%"
                  fill="#8884d8"
                  dataKey="value"
                  fontSize={12}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `${value}% (${props.payload.count} tilbud)`, 
                    'Andel'
                  ]}
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--foreground)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">Ingen tilbudsdata tilgjengelig</p>
              <p className="text-xs text-gray-400 mt-1">Opprett tilbud for å se statusfordeling</p>
            </div>
          </div>
        )}
        
        {/* Legend */}
        {pieData.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {pieData.map((entry, index) => (
              <div key={`legend-${index}`} className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-gray-600">
                  {entry.name} ({entry.count})
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};