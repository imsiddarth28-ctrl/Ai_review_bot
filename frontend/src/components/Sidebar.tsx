"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, FolderGit2, History, BarChart3, Settings, LogOut } from 'lucide-react';
import { clearToken } from '@/lib/api';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();

  function handleLogout() {
    clearToken();
    router.push('/login');
  }

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Repositories', href: '/dashboard/repositories', icon: FolderGit2 },
    { name: 'Reviews', href: '/dashboard/reviews', icon: History },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="border-r border-neutral-200 z-20 flex h-screen w-56 flex-col bg-white">
      <div className="flex h-16 items-center px-6 border-b border-neutral-200">
        <h1 className="text-base font-semibold tracking-tight text-black">
          ReviewCodeBot
        </h1>
      </div>
      
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link 
              key={link.name} 
              href={link.href} 
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
                isActive ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
              )}
            >
              <Icon className={cn("mr-2.5 h-4 w-4", isActive ? "text-white" : "text-neutral-400")} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-neutral-200">
        <button
          onClick={handleLogout}
          className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-black"
        >
          <LogOut className="mr-2.5 h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
