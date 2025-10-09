'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { getDashboardActivityFeed } from '@/lib/services/analyticsService';
import * as Icons from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'tilbud_sendt' | 'tilbud_vunnet' | 'tilbud_tapt' | 'ny_kunde';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
}

type ActivityType = ActivityItem['type'];

const iconMap: Record<ActivityType, React.ReactElement> = {
  tilbud_sendt: <Icons.FileText className="h-5 w-5 text-blue-500" />,
  tilbud_vunnet: <Icons.Award className="h-5 w-5 text-green-500" />,
  tilbud_tapt: <Icons.XCircle className="h-5 w-5 text-red-500" />,
  ny_kunde: <Icons.UserPlus className="h-5 w-5 text-purple-500" />,
};

export const ActivityFeed = () => {
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivityFeed = async () => {
      try {
        const data = await getDashboardActivityFeed();
        setActivityFeed(data);
      } catch (error) {
        console.error('Failed to load activity feed:', error);
        // Fallback to empty data
        setActivityFeed([]);
      } finally {
        setLoading(false);
      }
    };

    loadActivityFeed();
  }, []);

  if (loading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-base sm:text-lg">Siste Aktivitet</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <div className="w-5 h-5 bg-gray-200 animate-pulse rounded flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 animate-pulse rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activityFeed.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-base sm:text-lg">Siste Aktivitet</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center py-8">
            <Icons.Activity className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Ingen aktivitet å vise</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">Aktivitet vil vises her når du oppretter tilbud eller kunder</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-base sm:text-lg">Siste Aktivitet</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="space-y-4">
            {activityFeed.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 mt-0.5">
                  {iconMap[item.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{item.title}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                  {item.amount && (
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {item.amount.toLocaleString('nb-NO')} kr
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{item.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};