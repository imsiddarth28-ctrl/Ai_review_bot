git push origin main
"use client";

import { FormEvent, useEffect, useState } from 'react';
import { User, Bell, Key, Shield } from 'lucide-react';
import { api } from '@/lib/api';

export default function Settings() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.me()
      .then((user) => {
        setName(user.name);
        setEmail(user.email);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load profile'));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);

    try {
      const user = await api.updateMe({ name, email });
      setName(user.name);
      setEmail(user.email);
      setMessage('Profile saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="mt-1 text-sm text-gray-500">Manage your account and preferences.</p>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <nav className="space-y-1">
            <a href="#" className="bg-gray-100 text-blue-700 flex items-center px-3 py-2 text-sm font-medium rounded-md">
              <User className="mr-3 flex-shrink-0 h-5 w-5 text-blue-500" />
              Profile
            </a>
            <a href="#" className="text-gray-900 hover:bg-gray-50 hover:text-gray-900 flex items-center px-3 py-2 text-sm font-medium rounded-md">
              <Bell className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400" />
              Notifications
            </a>
            <a href="#" className="text-gray-900 hover:bg-gray-50 hover:text-gray-900 flex items-center px-3 py-2 text-sm font-medium rounded-md">
              <Key className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400" />
              API Keys
            </a>
            <a href="#" className="text-gray-900 hover:bg-gray-50 hover:text-gray-900 flex items-center px-3 py-2 text-sm font-medium rounded-md">
              <Shield className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400" />
              Security
            </a>
          </nav>
        </div>

        <div className="md:col-span-3 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white shadow-sm sm:rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
              <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2 border text-gray-900"
                    />
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2 border text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 rounded-b-lg border-t border-gray-200">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
