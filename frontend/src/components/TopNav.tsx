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
      className="bg-white border border-gray-200 shadow-sm mx-8 mt-4 flex h-16 items-center justify-between rounded-2xl px-6 z-20"
    >
      <div className="flex w-full max-w-md items-center rounded-xl bg-gray-50 border border-gray-200 px-4 py-2 transition-all focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
        <Search className="h-4 w-4 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search repositories, reviews..." 
          className="ml-3 w-full border-none bg-transparent text-sm text-gray-900 placeholder-gray-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center space-x-6">
        <button className="relative text-gray-400 hover:text-gray-900 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-blue-600"></span>
        </button>
        <div className="flex items-center space-x-3 border-l border-gray-200 pl-6">
          <span className="text-sm font-medium text-gray-700">{user?.name ?? 'Developer'}</span>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-sm"
          >
            {initial}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TopNav;
