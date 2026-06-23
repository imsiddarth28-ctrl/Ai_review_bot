"use client";

import { useEffect, useState } from 'react';
import { FolderGit2, AlertCircle, CheckCircle2, Clock, ArrowRight, History } from 'lucide-react';
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
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-black">Dashboard</h2>
          <p className="mt-0.5 text-sm text-neutral-500">Overview of your projects.</p>
        </div>
        <a 
          href="/dashboard/repositories" 
          className="flex items-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
        >
          Connect Repo
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </a>
      </div>

      {error && (
        <div className="border border-neutral-200 rounded-lg px-4 py-3 text-sm text-black">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Repositories', value: repositories.length, icon: FolderGit2 },
          { title: 'Critical Issues', value: criticalIssues, icon: AlertCircle },
          { title: 'Completed', value: completedReviews, icon: CheckCircle2 },
          { title: 'Review Mode', value: reviews.length ? 'Live' : '—', icon: Clock },
        ].map((stat, i) => (
          <div key={i} className="border border-neutral-200 rounded-lg p-5 hover:border-black transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">{stat.title}</span>
              <stat.icon className="h-4 w-4 text-neutral-300" />
            </div>
            <p className="mt-2 text-3xl font-semibold text-black tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="col-span-2 border border-neutral-200 rounded-lg p-5">
          <h3 className="text-sm font-medium text-black mb-4">Issues — 7 Days</h3>
          <div className="h-[260px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#000000" stopOpacity={0.08}/>
                      <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#a3a3a3" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a3a3a3" fontSize={11} tickLine={false} axisLine={false} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '0.375rem', color: '#000', fontSize: '0.8125rem' }}
                    itemStyle={{ color: '#000' }}
                  />
                  <Area type="monotone" dataKey="issues" stroke="#000000" strokeWidth={2} fillOpacity={1} fill="url(#colorIssues)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="border border-neutral-200 rounded-lg p-5 flex flex-col">
          <h3 className="text-sm font-medium text-black mb-4">Recent Reviews</h3>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {recentReviews.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center py-8">
                <History className="h-8 w-8 text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-500">No reviews yet.</p>
              </div>
            ) : (
              recentReviews.map((review) => (
                <div key={review.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-neutral-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-black">PR #{review.pr_number}</p>
                    <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-[160px]">{review.pr_title ?? 'Untitled'}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded border ${
                    review.status === 'completed' ? 'border-neutral-200 text-black' : 
                    review.status === 'failed' ? 'border-neutral-300 text-neutral-600' : 
                    'border-neutral-200 text-neutral-500'
                  }`}>
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
