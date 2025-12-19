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
import { updateUserAnalytics } from '@/lib/services/analyticsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { Button } from '@/components/ui/button';
import { HelpCircleIcon, Icon } from 'lucide-react';

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

interface MainChartProps {
  compact?: boolean;
}

export const MainChart = ({ compact = false }: MainChartProps) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '1y' | 'all'>('7d');

  useEffect(() => {
    const loadChartData = async () => {
      try {
        // We rely on getUserAnalytics inside getDashboardChartData to handle updates if data is stale
        const data = await getDashboardChartData(timeRange);
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
  }, [timeRange]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Omsetning og tilbudt verdi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`w-full ${compact ? 'h-[200px]' : 'h-[350px]'} bg-gray-200 animate-pulse rounded-lg flex items-center justify-center`}>
            <span className="text-gray-500">Laster diagram...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 w-full">
        <div className="flex flex-row space-y-4 sm:items-center sm:justify-between sm:space-y-0">
          {!compact && (
            <CardTitle className="text-base sm:text-lg">Hovedgraf omsetning</CardTitle>
          )}
          <div className={`flex items-center ${compact ? 'w-full justify-between' : 'gap-4'}`}>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={timeRange === '7d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('7d')}
                className="text-xs"
              >
                7d
              </Button>
              <Button
                variant={timeRange === '30d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('30d')}
                className="text-xs"
              >
                30d
              </Button>
              <Button
                variant={timeRange === '1y' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('1y')}
                className="text-xs"
              >
                1år
              </Button>
              <Button
                variant={timeRange === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('all')}
                className="text-xs"
              >
                Alle
              </Button>
            </div>
            <Button variant="outline" className="rounded-full w-10 h-10"><HelpCircleIcon /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div className={`w-full ${compact ? 'h-[200px]' : 'flex-1 min-h-[200px]'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#6D6D72', fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(value) => `${(value / 1000).toLocaleString()}k`}
                tick={{ fill: '#6D6D72', fontSize: 11 }}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                iconSize={12}
              />
              <Line
                type="monotone"
                dataKey="tilbudt"
                stroke="#1A4314"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={{ r: 2, fill: '#1A4314' }}
                activeDot={{ r: 4 }}
                name="Tilbudt"
              />
              <Line
                type="monotone"
                dataKey="omsatt"
                stroke="#26cd63b6"
                strokeWidth={2}
                dot={{ r: 3, fill: '#329d59ff' }}
                activeDot={{ r: 5 }}
                name="Omsatt"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};