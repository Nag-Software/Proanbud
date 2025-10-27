import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';

export const useAutoSubscriptionInit = () => {
  const { refetch, loading } = useSubscription();

  React.useEffect(() => {
    if (!loading) {
      refetch();
    }
  }, [loading, refetch]);
};
