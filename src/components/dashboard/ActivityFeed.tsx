'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { getDashboardActivityFeed } from '@/lib/services/analyticsService';
import * as Icons from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db, auth } from '@/lib/firebase';

interface ActivityItem {
  id: string;
  type: 'tilbud_sendt' | 'tilbud_godkjent' | 'tilbud_tapt' | 'ny_kunde' | 'ny_melding';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  quoteId?: string;
}

type ActivityType = ActivityItem['type'];

const iconMap: Record<ActivityType, React.ReactElement> = {
  tilbud_sendt: <Icons.FileText className="h-5 w-5 text-blue-500" />,
  tilbud_godkjent: <Icons.Award className="h-5 w-5 text-green-500" />,
  tilbud_tapt: <Icons.XCircle className="h-5 w-5 text-red-500" />,
  ny_kunde: <Icons.UserPlus className="h-5 w-5 text-purple-500" />,
  ny_melding: <Icons.MessageCircle className="h-5 w-5 text-indigo-500" />,
};

export const ActivityFeed = ({ compact = false }: { compact?: boolean }) => {
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivityFeed = async () => {
      try {
        const data = await getDashboardActivityFeed((compact ? 5 : 9));
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

  // Realtime: refresh activity feed when a new inbox message arrives
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setup = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const messagesRef = ref(db, `users/${user.uid}/inbox`);

      unsubscribe = onValue(messagesRef, async () => {
        try {
          setLoading(true);
          const data = await getDashboardActivityFeed((compact ? 5 : 9));
          setActivityFeed(data);
        } catch (err) {
          console.error('Failed to refresh activity feed:', err);
        } finally {
          setLoading(false);
        }
      });
    };

    setup();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [compact]);

  if (loading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-base text-sm sm:text-lg">Siste Aktivitet</CardTitle>
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
          <CardTitle className="text-base text-sm sm:text-lg">Siste Aktivitet</CardTitle>
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
          <CardTitle className="text-base text-sm sm:text-lg">Siste Aktivitet</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto pr-2">
            <div className="space-y-3">
              {activityFeed.map((item) => (
                <div key={item.id} className="flex items-start gap-2.5 py-2 rounded-md hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    {iconMap[item.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm text-gray-900 truncate">{item.title}</p>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">{item.timestamp}</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
                    {item.amount && (
                      <p className="text-xs font-medium text-gray-900 mt-1">
                        {item.amount.toLocaleString('nb-NO')} kr
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
};