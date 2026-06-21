"use client";

import { useEffect, useState } from 'react';
import { FolderGit2, AlertCircle, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
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
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
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
          <motion.h2 variants={itemVariants} className="text-3xl font-bold tracking-tight text-white">
            Dashboard Overview
          </motion.h2>
          <motion.p variants={itemVariants} className="mt-1 text-sm text-gray-400">
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
          { title: 'Total Repositories', value: repositories.length, subtitle: 'Connected to your account', icon: FolderGit2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { title: 'Critical Issues', value: criticalIssues, subtitle: 'Requires attention', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
          { title: 'Reviews Completed', value: completedReviews, subtitle: 'All time', icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
          { title: 'Avg. Review Time', value: reviews.length ? 'Live' : '-', subtitle: 'Webhook driven', icon: Clock, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants} className="glass-card flex flex-col justify-between p-6 rounded-2xl relative overflow-hidden group">
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${stat.bg}`}></div>
            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-sm font-medium text-gray-400">{stat.title}</h3>
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 relative z-10">
              <p className="text-4xl font-bold text-white tracking-tight">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-500">{stat.subtitle}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div variants={itemVariants} className="col-span-2 glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Issue Trend (7 Days)</h3>
          <div className="h-[300px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#fff' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Area type="monotone" dataKey="issues" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIssues)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-6">Recent Reviews</h3>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {recentReviews.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <History className="h-10 w-10 text-gray-600 mb-3" />
                <p className="text-sm text-gray-400">No reviews yet.</p>
                <p className="text-xs text-gray-500 mt-1">New PR reviews will appear here.</p>
              </div>
            ) : (
              recentReviews.map((review) => (
                <div key={review.id} className="group relative flex items-center justify-between rounded-xl bg-white/5 border border-white/5 p-4 hover:bg-white/10 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">PR #{review.pr_number}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[150px]">{review.pr_title ?? 'Untitled pull request'}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${
                    review.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                    review.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
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
