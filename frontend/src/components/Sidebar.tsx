"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, FolderGit2, History, BarChart3, Settings, LogOut } from 'lucide-react';
import { clearToken } from '@/lib/api';

const Sidebar = () => {
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.push('/login');
  }

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold tracking-tight text-white">
          <span className="text-blue-500">Anti</span>gravity
        </h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-4 py-4">
        <Link href="/dashboard" className="flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white">
          <Home className="mr-3 h-5 w-5" />
          Dashboard
        </Link>
        <Link href="/dashboard/repositories" className="flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white">
          <FolderGit2 className="mr-3 h-5 w-5" />
          Repositories
        </Link>
        <Link href="/dashboard/reviews" className="flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white">
          <History className="mr-3 h-5 w-5" />
          Reviews
        </Link>
        <Link href="/dashboard/analytics" className="flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white">
          <BarChart3 className="mr-3 h-5 w-5" />
          Analytics
        </Link>
        <Link href="/dashboard/settings" className="flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white">
          <Settings className="mr-3 h-5 w-5" />
          Settings
        </Link>
      </nav>

      <div className="border-t border-gray-800 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
