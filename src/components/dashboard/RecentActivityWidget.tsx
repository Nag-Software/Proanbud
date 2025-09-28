'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export const RecentActivityWidget = () => {
  const activities = [
    {
      id: 1,
      type: 'quote_sent',
      title: 'Tilbud sendt',
      description: 'Tilbud til Olsen AS på 125.000 kr',
      time: '2 timer siden',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      id: 2,
      type: 'customer_added',
      title: 'Ny kunde',
      description: 'Hansen Entreprenør lagt til',
      time: '4 timer siden',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 3,
      type: 'quote_expired',
      title: 'Tilbud utgått',
      description: 'Tilbud til Berg Bygg AS har utgått',
      time: '1 dag siden',
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      id: 4,
      type: 'payment_received',
      title: 'Betaling mottatt',
      description: '45.000 kr fra Larsen & Co',
      time: '2 dager siden',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
          Siste Aktiviteter
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 transition-colors duration-200">
                  <div className={`p-1.5 sm:p-2 rounded-lg ${activity.bgColor} flex-shrink-0`}>
                    <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-slate-800 truncate leading-tight">{activity.title}</p>
                    <p className="text-xs text-slate-600 mb-1 line-clamp-2">{activity.description}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};