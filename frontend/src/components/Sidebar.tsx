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
      className="glass-panel z-20 m-4 flex h-[calc(100vh-2rem)] w-64 flex-col rounded-3xl"
    >
      <div className="flex h-20 items-center px-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 mr-3 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <span className="font-bold text-xl">A</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Anti<span className="text-blue-500 text-glow">gravity</span>
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
                isActive ? "bg-white/10 text-white shadow-inner border border-white/5" : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" 
                />
              )}
              <Icon className={cn("mr-3 h-5 w-5 transition-colors", isActive ? "text-blue-400" : "text-gray-500 group-hover:text-gray-300")} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium text-gray-400 transition-all hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
