"use client";

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api, Repository, Review } from '@/lib/api';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'];

export default function Analytics() {
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
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load analytics'));
  }, []);

  const severityTotals = reviews.reduce(
    (totals, review) => {
      totals.Critical += review.severity_summary?.critical ?? 0;
      totals.High += review.severity_summary?.high ?? 0;
      totals.Medium += review.severity_summary?.medium ?? 0;
      totals.Low += review.severity_summary?.low ?? 0;
      return totals;
    },
    { Critical: 0, High: 0, Medium: 0, Low: 0 }
  );

  const issueData = Object.entries(severityTotals)
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0);

  const repositoryData = repositories.map((repo) => ({
    name: repo.repo_name,
    reviews: reviews.filter((review) => review.repository_id === repo.id).length,
    issues: reviews
      .filter((review) => review.repository_id === repo.id)
      .reduce((total, review) => total + Object.values(review.severity_summary ?? {}).reduce((sum, count) => sum + count, 0), 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Issue Categories</h3>
          <div className="h-80 w-full">
            {issueData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">No issue data yet.</div>
            ) : isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={issueData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {issueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Team Productivity</h3>
          <div className="h-80 w-full">
            {repositoryData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">No repository data yet.</div>
            ) : isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={repositoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Legend />
                  <Bar dataKey="reviews" name="PRs Reviewed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="issues" name="Issues Found" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
