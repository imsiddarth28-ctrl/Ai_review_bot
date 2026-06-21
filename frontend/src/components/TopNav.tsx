"use client";

import { useEffect, useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { api, User } from '@/lib/api';

const TopNav = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null));
  }, []);

  const initial = user?.name?.charAt(0).toUpperCase() ?? 'D';

  return (
    <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-8">
      <div className="flex w-full max-w-md items-center rounded-md border border-gray-300 px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500">
        <Search className="h-4 w-4 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search repositories, reviews..." 
          className="ml-2 w-full border-none bg-transparent text-sm focus:outline-none"
        />
      </div>

      <div className="flex items-center space-x-4">
        <button className="text-gray-500 hover:text-gray-700">
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center space-x-2">
          <div
            aria-label="Developer avatar"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700"
          >
            {initial}
          </div>
          <span className="text-sm font-medium text-gray-700">{user?.name ?? 'Developer'}</span>
        </div>
      </div>
    </div>
  );
};

export default TopNav;
