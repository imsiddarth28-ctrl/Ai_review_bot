"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Github } from '@/components/Icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const registerResponse = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!registerResponse.ok) {
        const data = await registerResponse.json().catch(() => null);
        throw new Error(data?.detail ?? 'Unable to create account');
      }

      const body = new URLSearchParams();
      body.set('username', email);
      body.set('password', password);

      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (!loginResponse.ok) {
        throw new Error('Account created, but automatic sign in failed');
      }

      const data = await loginResponse.json();
      localStorage.setItem('access_token', data.access_token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-black">ReviewCodeBot</h1>
          <p className="mt-1 text-sm text-neutral-500">Create an account</p>
        </div>
        
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => window.location.href = `${API_URL}/auth/github/login`}
            className="flex w-full items-center justify-center rounded-lg border border-neutral-200 bg-white py-2.5 px-4 text-sm font-medium text-black hover:bg-neutral-50 transition-colors"
          >
            <Github className="mr-2 h-4 w-4" />
            Continue with GitHub
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-neutral-400">or</span>
            </div>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="block w-full rounded-lg border border-neutral-200 py-2.5 px-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors"
              placeholder="Name"
            />
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="block w-full rounded-lg border border-neutral-200 py-2.5 px-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors"
              placeholder="Email"
            />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="block w-full rounded-lg border border-neutral-200 py-2.5 px-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors"
              placeholder="Password"
            />

            {error && (
              <p className="text-sm text-black border border-neutral-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-black py-2.5 px-3 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-500">
            Have an account?{' '}
            <Link href="/login" className="text-black underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
