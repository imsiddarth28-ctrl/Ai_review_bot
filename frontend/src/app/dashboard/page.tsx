"use client";

import { useEffect, useState } from 'react';
import { FolderGit2, AlertCircle, CheckCircle2, Clock, ArrowRight, History } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api, Repository, Review } from '@/lib/api';
import { motion } from 'framer-motion';

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <motion.h2 variants={itemVariants} className="text-3xl font-bold tracking-tight text-gray-900">
            Dashboard Overview
          </motion.h2>
          <motion.p variants={itemVariants} className="mt-1 text-sm text-gray-500">
            Welcome back. Here's what's happening with your projects today.
          </motion.p>
        </div>
        <motion.a 
          variants={itemVariants}
          href="/dashboard/repositories" 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all hover:bg-blue-500 hover:shadow-[0_0_25px_rgba(59,130,246,0.6)]"
        >
          Connect Repository
          <ArrowRight className="ml-2 h-4 w-4" />
        </motion.a>
      </div>

      {error && (
        <motion.div variants={itemVariants} className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 backdrop-blur-md">
          {error}
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Repositories', value: repositories.length, subtitle: 'Connected to your account', icon: FolderGit2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Critical Issues', value: criticalIssues, subtitle: 'Requires attention', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { title: 'Reviews Completed', value: completedReviews, subtitle: 'All time', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { title: 'Avg. Review Time', value: reviews.length ? 'Live' : '-', subtitle: 'Webhook driven', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants} className="minimal-card flex flex-col justify-between p-6 rounded-2xl relative overflow-hidden group">
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 ${stat.bg}`}></div>
            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 relative z-10">
              <p className="text-4xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-500">{stat.subtitle}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div variants={itemVariants} className="col-span-2 minimal-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Issue Trend (7 Days)</h3>
          <div className="h-[300px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', color: '#0f172a' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Area type="monotone" dataKey="issues" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIssues)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="minimal-card rounded-2xl p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Reviews</h3>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {recentReviews.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <History className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No reviews yet.</p>
                <p className="text-xs text-gray-400 mt-1">New PR reviews will appear here.</p>
              </div>
            ) : (
              recentReviews.map((review) => (
                <div key={review.id} className="group relative flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 p-4 hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">PR #{review.pr_number}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[150px]">{review.pr_title ?? 'Untitled pull request'}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${
                    review.status === 'completed' ? 'bg-green-50 text-green-600 border-green-200' : 
                    review.status === 'failed' ? 'bg-red-50 text-red-600 border-red-200' : 
                    'bg-yellow-50 text-yellow-600 border-yellow-200'
                  }`}>
                    {review.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
