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
          <div className="flex-1 flex flex-col bg-background p-4 lg:ml-[280px]">
            <main className="flex-1 px-3 lg:px-6 pt-2 pb-3 lg:pb-6 shadow-md bg-white rounded-2xl">
              <TrialHeader />
              <MobileBreadcrumb />
              {children}
            </main>
          </div>
        </div>
      </SubscriptionBlocker>
    </ProtectedRoute>
  );
}