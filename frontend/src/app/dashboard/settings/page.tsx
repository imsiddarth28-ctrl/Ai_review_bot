"use client";

import { FormEvent, useEffect, useState } from 'react';
import { User as UserIcon, Bell, Key, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Github } from '@/components/Icons';
import { api, User } from '@/lib/api';
import { motion } from 'framer-motion';
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
      addNotification('Profile saved successfully.', 'success');
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h2>
        <p className="mt-1 text-sm text-gray-500">Manage your account settings and connected platforms.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <nav className="space-y-2">
            <a href="#" className="bg-white border border-gray-200 text-gray-900 flex items-center px-4 py-3 text-sm font-medium rounded-xl shadow-sm">
              <UserIcon className="mr-3 flex-shrink-0 h-5 w-5 text-blue-600" />
              Profile
            </a>
            <a href="#" className="text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center px-4 py-3 text-sm font-medium rounded-xl">
              <Bell className="mr-3 flex-shrink-0 h-5 w-5 text-gray-500" />
              Notifications
            </a>
            <a href="#" className="text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center px-4 py-3 text-sm font-medium rounded-xl">
              <Key className="mr-3 flex-shrink-0 h-5 w-5 text-gray-500" />
              API Keys
            </a>
            <a href="#" className="text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center px-4 py-3 text-sm font-medium rounded-xl">
              <Shield className="mr-3 flex-shrink-0 h-5 w-5 text-gray-500" />
              Security
            </a>
          </nav>
        </div>

        <div className="md:col-span-3 space-y-8">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="minimal-card sm:rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-6 border-b border-gray-100">
              <h3 className="text-xl leading-6 font-semibold text-gray-900">Profile Information</h3>
              <p className="mt-1 text-sm text-gray-500">Update your account details and public profile.</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-6 space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                    <div className="mt-2">
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="bg-white border border-gray-200 block w-full sm:text-sm text-gray-900 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow rounded-xl shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                    <div className="mt-2">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="bg-white border border-gray-200 block w-full sm:text-sm text-gray-900 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow rounded-xl shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-right">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-600 border border-transparent rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)] py-2.5 px-6 inline-flex justify-center text-sm font-medium text-white hover:bg-blue-500 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="minimal-card sm:rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-6 border-b border-gray-100">
              <h3 className="text-xl leading-6 font-semibold text-gray-900">Connected Accounts</h3>
              <p className="mt-1 text-sm text-gray-500">Link external accounts to enable AI code reviews.</p>
            </div>
            <div className="px-6 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-900">
                    <Github className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">GitHub Integration</p>
                    <p className="text-sm text-gray-500">
                      {user?.oauth_provider === 'github' ? 'Connected via OAuth' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <div>
                  {user?.oauth_provider === 'github' ? (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-600 border border-green-200">
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      Connected
                    </span>
                  ) : (
                    <button
                      onClick={handleConnectGithub}
                      className="bg-white border border-gray-200 inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:border-blue-600 transition-colors shadow-sm"
                    >
                      Connect Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
