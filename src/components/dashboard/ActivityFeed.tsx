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
      <Card>
        <CardHeader>
          <CardTitle>Siste Aktivitet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-5 h-5 bg-gray-200 animate-pulse rounded"></div>
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
      <Card>
        <CardHeader>
          <CardTitle>Siste Aktivitet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Icons.Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Ingen aktivitet å vise</p>
            <p className="text-sm text-gray-400 mt-1">Aktivitet vil vises her når du oppretter tilbud eller kunder</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Siste Aktivitet</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {activityFeed.map((item) => (
            <div key={item.id} className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {iconMap[item.type]}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-text">{item.title}</p>
                <p className="text-sm text-muted-text">{item.description}</p>
                {item.amount && (
                  <p className="text-sm font-semibold text-text">
                    {item.amount.toLocaleString('nb-NO')} kr
                  </p>
                )}
                <p className="text-xs text-muted-text mt-1">{item.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};