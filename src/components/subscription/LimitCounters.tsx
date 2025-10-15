'use client';

import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContextNew';
import { Progress } from '@/components/ui/progress';

export const LimitCounters = () => {
  const { usage, loading } = useSubscription();

  if (loading || !usage) {
    return (
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-text text-center">Laster...</div>
      </div>
    );
  }

  const getProgressPercentage = (used: number, limit: number) => {
    //if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return '#ef4444'; // red-500
    if (percentage >= 75) return '#f97316'; // orange-500
    return '#e1e1e1ff'; // green-500
  };

  return (
    <div className="p-4 border-t border-border space-y-3">
      <div className="text-xs font-medium text-muted-text uppercase tracking-wide">
        Abonnoment-grenser
      </div>
      
      {/* Quotes Counter */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-text">Tilbud</span>
          <span className="font-medium">
            {usage.quotesUsed} / {usage.quotesLimit === -1 ? '∞' : usage.quotesLimit}
          </span>
        </div>
        {usage.quotesLimit !== -1 && (
          <Progress 
            value={getProgressPercentage(usage.quotesUsed, usage.quotesLimit)} 
            color={getProgressColor(getProgressPercentage(usage.quotesUsed, usage.quotesLimit))}
            className="h-1"
          />
        )}
      </div>

      {/* Customers Counter */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-text">Kunder</span>
          <span className="font-medium">
            {usage.customersUsed} / {usage.customersLimit === -1 ? '∞' : usage.customersLimit}
          </span>
        </div>
        {usage.customersLimit !== -1 && (
          <Progress 
            value={getProgressPercentage(usage.customersUsed, usage.customersLimit)} 
            color={getProgressColor(getProgressPercentage(usage.customersUsed, usage.customersLimit))}
            className="h-1"
          />
        )}
      </div>

      {/* Storage Counter */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-text">Lagring</span>
          <span className="font-medium">
            {Math.round(usage.storageUsed / 1024)}MB / {usage.storageLimit === -1 ? '∞' : Math.round(usage.storageLimit / 1024)}MB
          </span>
        </div>
        {usage.storageLimit !== -1 && (
          <Progress 
            value={getProgressPercentage(usage.storageUsed, usage.storageLimit)} 
            color={getProgressColor(getProgressPercentage(usage.storageUsed, usage.storageLimit))}
            className="h-1"
          />
        )}
      </div>
    </div>
  );
};
