'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileBreadcrumb } from '@/components/layout/MobileBreadcrumb';
import { TrialHeader } from '@/components/subscription/TrialHeader';
import { SubscriptionBlocker } from '@/components/subscription/SubscriptionBlocker';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <SubscriptionBlocker>
        <div className="flex flex-col lg:flex-row h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <TrialHeader />
            <MobileBreadcrumb />
            <main className="flex-1 p-4 lg:p-8 overflow-y-auto bg-background">
              {children}
            </main>
          </div>
        </div>
      </SubscriptionBlocker>
    </ProtectedRoute>
  );
}