"use client";

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api, Repository, Review } from '@/lib/api';
import { motion } from 'framer-motion';
import { useNotification } from '@/components/Notifications';
import { BarChart3 } from 'lucide-react';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6']; // Critical, High, Medium, Low

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Analytics</h2>
          <p className="mt-1 text-sm text-gray-500">Deep dive into your codebase health and review metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="minimal-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Issue Categories</h3>
          <div className="h-80 w-full relative">
            {issueData.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <BarChart3 className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No issue data yet.</p>
              </div>
            ) : isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={issueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {issueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', color: '#0f172a' }}
                    itemStyle={{ color: '#0f172a' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-gray-600 ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="minimal-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Repository Productivity</h3>
          <div className="h-80 w-full relative">
            {repositoryData.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <BarChart3 className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No repository data yet.</p>
              </div>
            ) : isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={repositoryData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', color: '#0f172a' }}
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-gray-600 ml-1">{value}</span>}
                  />
                  <Bar dataKey="reviews" name="PRs Reviewed" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="issues" name="Issues Found" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
