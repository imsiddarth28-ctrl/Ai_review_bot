import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import AuthGate from '@/components/AuthGate';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-8">
          <AuthGate>{children}</AuthGate>
        </main>
      </div>
    </div>
  );
}
