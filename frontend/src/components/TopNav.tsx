"use client";

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api, User } from '@/lib/api';

const TopNav = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null));
  }, []);

  const initial = user?.name?.charAt(0).toUpperCase() ?? 'U';

  return (
    <div className="border-b border-neutral-200 flex h-14 items-center justify-between px-6 bg-white">
      <div className="flex w-full max-w-sm items-center rounded-lg border border-neutral-200 px-3 py-1.5 transition-colors focus-within:border-black">
        <Search className="h-4 w-4 text-neutral-400" />
        <input 
          type="text" 
          placeholder="Search..." 
          className="ml-2 w-full border-none bg-transparent text-sm text-black placeholder-neutral-400 focus:outline-none"
        />
      </div>

      <div className="flex items-center space-x-3">
        <span className="text-sm text-neutral-600">{user?.name ?? 'User'}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-medium text-white">
          {initial}
        </div>
      </div>
    </div>
  );
};

export default TopNav;
