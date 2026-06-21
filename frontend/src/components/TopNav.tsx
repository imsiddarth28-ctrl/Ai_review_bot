"use client";

import { useEffect, useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { api, User } from '@/lib/api';
import { motion } from 'framer-motion';

const TopNav = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null));
  }, []);

  const initial = user?.name?.charAt(0).toUpperCase() ?? 'D';

  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-panel mx-8 mt-4 flex h-16 items-center justify-between rounded-2xl px-6 z-20"
    >
      <div className="flex w-full max-w-md items-center rounded-xl bg-white/5 border border-white/10 px-4 py-2 transition-all focus-within:bg-white/10 focus-within:border-white/20 focus-within:shadow-[0_0_15px_rgba(255,255,255,0.05)]">
        <Search className="h-4 w-4 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search repositories, reviews..." 
          className="ml-3 w-full border-none bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center space-x-6">
        <button className="relative text-gray-400 hover:text-white transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
        </button>
        <div className="flex items-center space-x-3 border-l border-white/10 pl-6">
          <span className="text-sm font-medium text-gray-300">{user?.name ?? 'Developer'}</span>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white shadow-lg"
          >
            {initial}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TopNav;
