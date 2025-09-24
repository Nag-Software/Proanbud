
import { Metadata } from 'next';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileBreadcrumb } from '@/components/layout/MobileBreadcrumb';

export const metadata: Metadata = {
  title: "Proanbud AI - Admin Dashboard",
  description: "Admin dashboard for Proanbud AI",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex flex-col lg:flex-row h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <MobileBreadcrumb />
          <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}