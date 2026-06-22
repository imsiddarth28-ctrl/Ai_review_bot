import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import AuthGate from '@/components/AuthGate';
import { NotificationProvider } from '@/components/Notifications';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50/30 text-gray-900">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden relative z-10">
          <TopNav />
          <main className="flex-1 overflow-y-auto p-8 relative z-0">
            <AuthGate>{children}</AuthGate>
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}
