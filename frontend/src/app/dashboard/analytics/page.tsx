"use client";

import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api, Repository, Review } from '@/lib/api';
import { useNotification } from '@/components/Notifications';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const repoHealthScores = useMemo(() => {
    return repositories.map(repo => {
      const repoReviews = reviews.filter(r => r.repository_id === repo.id);
      
      let critical = 0;
      let high = 0;
      let medium = 0;
      let low = 0;
      
      repoReviews.forEach(r => {
        critical += r.severity_summary?.critical ?? 0;
        high += r.severity_summary?.high ?? 0;
        medium += r.severity_summary?.medium ?? 0;
        low += r.severity_summary?.low ?? 0;
      });
      
      let score = 100;
      if (repoReviews.length > 0) {
        const deduction = (critical * 15) + (high * 8) + (medium * 4) + (low * 1);
        const averageDeduction = deduction / repoReviews.length;
        score = Math.max(0, Math.round(100 - averageDeduction));
      }
      
      let grade = 'A';
      let color = 'text-green-600 border-green-200 bg-green-50';
      if (score < 50) {
        grade = 'D';
        color = 'text-red-600 border-red-200 bg-red-50';
      } else if (score < 70) {
        grade = 'C';
        color = 'text-orange-600 border-orange-200 bg-orange-50';
      } else if (score < 90) {
        grade = 'B';
        color = 'text-yellow-600 border-yellow-200 bg-yellow-50';
      }
      
      return {
        id: repo.id,
        name: repo.repo_name,
        owner: repo.owner,
        reviewsCount: repoReviews.length,
        critical,
        high,
        medium,
        low,
        score,
        grade,
        color
      };
    });
  }, [repositories, reviews]);

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

      {/* Repository Health Scorecard */}
      <div className="border border-neutral-200 rounded-lg p-5">
        <h3 className="text-sm font-medium text-black mb-4">Repository Health Scorecard</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repoHealthScores.length === 0 ? (
            <div className="col-span-full py-8 text-center text-neutral-400 text-sm">
              No repositories connected yet. Go to Repositories tab to connect.
            </div>
          ) : (
            repoHealthScores.map((repo) => (
              <div key={repo.id} className="border border-neutral-200 rounded-xl p-4 flex items-center justify-between hover:border-black transition-colors bg-white shadow-2xs">
                <div className="space-y-1 min-w-0 pr-4">
                  <span className="text-[10px] font-mono text-neutral-400">{repo.owner}</span>
                  <h4 className="text-sm font-semibold text-black truncate">{repo.name}</h4>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-[10px] text-neutral-500 font-medium">
                    <span>{repo.reviewsCount} reviews</span>
                    <span>·</span>
                    <span className="text-red-500">{repo.critical} critical</span>
                    <span>·</span>
                    <span className="text-orange-500">{repo.high + repo.medium} mid</span>
                    <span>·</span>
                    <span className="text-neutral-400">{repo.low} low</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-neutral-400 block uppercase tracking-wider">Health</span>
                    <span className="text-lg font-extrabold text-black">{repo.score}%</span>
                  </div>
                  <div className={cn(
                    "w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-lg shadow-3xs",
                    repo.color
                  )}>
                    {repo.grade}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
