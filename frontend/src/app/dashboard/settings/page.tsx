"use client";

import { FormEvent, useEffect, useState } from 'react';
import { User as UserIcon, Bell, Key, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Github } from '@/components/Icons';
import { api, User } from '@/lib/api';
import { useNotification } from '@/components/Notifications';
import { API_URL } from '@/lib/api';

export default function Settings() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { addNotification } = useNotification();

  useEffect(() => {
    api.me()
      .then((data) => {
        setUser(data);
        setName(data.name);
        setEmail(data.email);
      })
      .catch((err) => addNotification(err instanceof Error ? err.message : 'Unable to load profile', 'error'));
  }, [addNotification]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const updatedUser = await api.updateMe({ name, email });
      setUser(updatedUser);
      setName(updatedUser.name);
      setEmail(updatedUser.email);
      addNotification('Profile saved.', 'success');
    } catch (err) {
      addNotification(err instanceof Error ? err.message : 'Unable to save profile', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  function handleConnectGithub() {
    window.location.href = `${API_URL}/auth/github/login`;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-black">Settings</h2>
        <p className="mt-0.5 text-sm text-neutral-500">Account and integrations.</p>
      </div>

      {/* Profile */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-sm font-medium text-black">Profile</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-5 py-5 space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Name</label>
              <input
                type="text"
                name="name"
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>
          <div className="px-5 py-3 border-t border-neutral-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      {/* GitHub */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-sm font-medium text-black">Connected Accounts</h3>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200">
                <Github className="h-4 w-4 text-black" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-black">GitHub</p>
                <p className="text-xs text-neutral-400">
                  {user?.oauth_provider === 'github' ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
            <div>
              {user?.oauth_provider === 'github' ? (
                <span className="text-xs font-medium text-neutral-500 border border-neutral-200 px-2.5 py-1 rounded">
                  ✓ Connected
                </span>
              ) : (
                <button
                  onClick={handleConnectGithub}
                  className="text-xs font-medium border border-black text-black px-3 py-1.5 rounded-lg hover:bg-black hover:text-white transition-colors"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
