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
        <div className="flex flex-col z-1 lg:flex-row bg-background font-sans" data-dashboard>
          <Sidebar />
          <div className="flex-1 h-full flex flex-col bg-background p-2 overflow-y-auto lg:ml-[280px]">
            <main className="shadow-sm border border-gray-100 bg-white rounded-2xl">
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