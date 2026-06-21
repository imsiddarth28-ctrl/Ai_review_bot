"use client";

import { useEffect, useState } from 'react';
import { FolderGit2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api, Repository, Review } from '@/lib/api';

const data = [
  { name: 'Mon', issues: 4 },
  { name: 'Tue', issues: 3 },
  { name: 'Wed', issues: 7 },
  { name: 'Thu', issues: 2 },
  { name: 'Fri', issues: 5 },
  { name: 'Sat', issues: 1 },
  { name: 'Sun', issues: 0 },
];

export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    Promise.all([api.repositories(), api.reviews()])
      .then(([repositoryData, reviewData]) => {
        setRepositories(repositoryData);
        setReviews(reviewData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load dashboard'));
  }, []);

  const criticalIssues = reviews.reduce((total, review) => total + (review.severity_summary?.critical ?? 0), 0);
  const completedReviews = reviews.filter((review) => review.status === 'completed').length;
  const recentReviews = reviews.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <a href="/dashboard/repositories" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Connect Repository
        </a>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Total Repositories</h3>
            <FolderGit2 className="h-5 w-5 text-blue-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">{repositories.length}</p>
          <p className="mt-1 text-sm text-gray-500">Connected to your account</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Critical Issues</h3>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">{criticalIssues}</p>
          <p className="mt-1 text-sm text-red-600">Requires attention</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Reviews Completed</h3>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">{completedReviews}</p>
          <p className="mt-1 text-sm text-gray-500">All time</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Avg. Review Time</h3>
            <Clock className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">{reviews.length ? 'Live' : '-'}</p>
          <p className="mt-1 text-sm text-green-600">Webhook driven</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Issue Trend (7 Days)</h3>
          <div className="h-72 w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="issues" stroke="#3b82f6" fillOpacity={1} fill="url(#colorIssues)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Reviews</h3>
          <div className="space-y-4">
            {recentReviews.length === 0 ? (
              <p className="text-sm text-gray-500">No reviews yet. New pull request reviews will appear here.</p>
            ) : (
              recentReviews.map((review) => (
                <div key={review.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">PR #{review.pr_number}</p>
                    <p className="text-xs text-gray-500">{review.pr_title ?? 'Untitled pull request'}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    {review.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
