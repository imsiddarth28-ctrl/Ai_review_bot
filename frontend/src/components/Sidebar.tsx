"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, FolderGit2, History, BarChart3, Settings, LogOut } from 'lucide-react';
import { clearToken } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="bg-white border border-gray-200 shadow-sm z-20 m-4 flex h-[calc(100vh-2rem)] w-64 flex-col rounded-3xl"
    >
      <div className="flex h-20 items-center px-8 border-b border-gray-100">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 mr-3">
          <span className="font-bold text-xl">A</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          Anti<span className="text-blue-600">gravity</span>
        </h1>
      </div>
      
      <nav className="flex-1 space-y-2 px-4 py-6">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link 
              key={link.name} 
              href={link.href} 
              className={cn(
                "group relative flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-blue-600" 
                />
              )}
              <Icon className={cn("mr-3 h-5 w-5 transition-colors", isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600")} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition-all hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;

