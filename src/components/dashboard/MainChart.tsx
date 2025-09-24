'use client';

import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { getDashboardChartData } from '@/lib/services/analyticsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // Find the correct values based on dataKey
    const omsattData = payload.find(p => p.dataKey === 'omsatt');
    const tilbudtData = payload.find(p => p.dataKey === 'tilbudt');
    
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-lg">
        <p className="font-bold text-gray-800">{`${label}`}</p>
        <p className="text-sm text-green-600">{`Omsatt: ${(omsattData?.value || 0).toLocaleString('nb-NO')} kr`}</p>
        <p className="text-sm text-gray-500">{`Tilbudt: ${(tilbudtData?.value || 0).toLocaleString('nb-NO')} kr`}</p>
      </div>
    );
  }
  return null;
};

interface ChartDataPoint {
  date: string;
  omsatt: number;
  tilbudt: number;
}

export const MainChart = () => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChartData = async () => {
      try {
        const data = await getDashboardChartData();
        setChartData(data);
      } catch (error) {
        console.error('Failed to load chart data:', error);
        // Fallback to empty data
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Omsetning vs. Tilbudt Verdi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[350px] bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
            <span className="text-gray-500">Laster diagram...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Omsetning vs. Tilbudt Verdi</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" tick={{ fill: '#6D6D72', fontSize: 12 }} />
              <YAxis
                tickFormatter={(value) => `${(value / 1000).toLocaleString()}k`}
                tick={{ fill: '#6D6D72', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line
                type="monotone"
                dataKey="tilbudt"
                stroke="#1A4314"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#1A4314' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="omsatt"
                stroke="#26cd63b6"
                strokeWidth={2}
                dot={{ r: 4, fill: '#329d59ff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};