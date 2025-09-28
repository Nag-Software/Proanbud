'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { TrendingUp, Users, FileText, DollarSign } from 'lucide-react';
import { getQuickStatsData, QuickStatItem } from '@/lib/services/analyticsService';
import * as Icons from 'lucide-react';

type IconName = keyof typeof Icons;

export const QuickStatsWidget = () => {
  const [stats, setStats] = useState<QuickStatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getQuickStatsData();
        setStats(data);
      } catch (error) {
        console.error('Failed to load quick stats:', error);
        // Fallback to default stats
        setStats([
          {
            title: 'Aktive Tilbud',
            value: '0',
            change: '+0',
            icon: 'FileText',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
          },
          {
            title: 'Totale Kunder',
            value: '0',
            change: '+0',
            icon: 'Users',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
          },
          {
            title: 'Månedlig Vekst',
            value: '0%',
            change: '+0%',
            icon: 'TrendingUp',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
          },
          {
            title: 'Gj.snitt Verdi',
            value: '0k',
            change: '+0k',
            icon: 'DollarSign',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="text-base sm:text-lg font-semibold text-slate-800">Hurtigstatistikk</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 auto-rows-fr">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50/50 min-h-[70px]">
                <div className="p-2 rounded-lg bg-gray-200 animate-pulse flex-shrink-0">
                  <div className="h-4 w-4 sm:h-5 sm:w-5 bg-gray-300 rounded"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="h-3 bg-gray-200 animate-pulse rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-base sm:text-lg font-semibold text-slate-800">Hurtigstatistikk</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 auto-rows-fr">
          {stats.map((stat, index) => {
            const Icon = Icons[stat.icon as IconName] as React.ElementType;
            return (
              <div key={index} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 transition-colors duration-200 min-h-[70px]">
                <div className={`p-2 rounded-lg ${stat.bgColor} flex-shrink-0`}>
                  {Icon && <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 truncate leading-tight">{stat.title}</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-base sm:text-lg font-bold text-slate-800">{stat.value}</span>
                    <span className={`text-xs font-medium ${stat.change.startsWith('+') ? 'text-green-600' : stat.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};