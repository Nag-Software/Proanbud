'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAutoSubscriptionInit } from '@/hooks/useAutoSubscriptionInit';
import { useSubscriptionAccess } from '@/components/subscription/SubscriptionGuard';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresSubscription?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  requiresSubscription = false 
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { hasAccess, loading: subscriptionLoading } = useSubscriptionAccess('free');
  
  // Auto-initialize subscription for new users
  useAutoSubscriptionInit();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Check subscription access if required
  useEffect(() => {
    if (requiresSubscription && !subscriptionLoading && !hasAccess) {
      // Redirect to upgrade page or show upgrade prompt
      router.push('/innstillinger?upgrade=true');
    }
  }, [requiresSubscription, hasAccess, subscriptionLoading, router]);

  if (loading || (requiresSubscription && subscriptionLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-text">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};