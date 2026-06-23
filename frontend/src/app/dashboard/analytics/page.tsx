"use client";

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api, Repository, Review } from '@/lib/api';
import { useNotification } from '@/components/Notifications';
import { BarChart3 } from 'lucide-react';

const COLORS = ['#000000', '#525252', '#a3a3a3', '#d4d4d4'];

export default function Analytics() {
  const [isMounted, setIsMounted] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const { addNotification } = useNotification();

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
      .catch((err) => addNotification(err instanceof Error ? err.message : 'Unable to load analytics', 'error'));
  }, [addNotification]);

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
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-black">Analytics</h2>
        <p className="mt-0.5 text-sm text-neutral-500">Codebase health and review metrics.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="border border-neutral-200 rounded-lg p-5">
          <h3 className="text-sm font-medium text-black mb-4">Issues by Severity</h3>
          <div className="h-72 w-full relative">
            {issueData.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <BarChart3 className="h-8 w-8 text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-400">No data yet.</p>
              </div>
            ) : isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={issueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {issueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '0.375rem', color: '#000', fontSize: '0.8125rem' }}
                    itemStyle={{ color: '#000' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-neutral-600 text-xs ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="border border-neutral-200 rounded-lg p-5">
          <h3 className="text-sm font-medium text-black mb-4">By Repository</h3>
          <div className="h-72 w-full relative">
            {repositoryData.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <BarChart3 className="h-8 w-8 text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-400">No data yet.</p>
              </div>
            ) : isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={repositoryData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                  <XAxis dataKey="name" stroke="#a3a3a3" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a3a3a3" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '0.375rem', color: '#000', fontSize: '0.8125rem' }}
                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-neutral-600 text-xs ml-1">{value}</span>}
                  />
                  <Bar dataKey="reviews" name="Reviews" fill="#000000" radius={[3, 3, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="issues" name="Issues" fill="#a3a3a3" radius={[3, 3, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
