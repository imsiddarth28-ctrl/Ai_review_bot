"use client";

import { useEffect, useMemo, useState } from 'react';
import { Search, AlertCircle, CheckCircle2, Clock, GitPullRequest, ChevronDown, ChevronUp } from 'lucide-react';
import { api, Review } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '@/components/Notifications';
import ReactMarkdown from 'react-markdown';

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { addNotification } = useNotification();

  useEffect(() => {
    api.reviews()
      .then(setReviews)
      .catch((err) => addNotification(err instanceof Error ? err.message : 'Unable to load reviews', 'error'));
  }, [addNotification]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredReviews = useMemo(() => {
    const search = query.toLowerCase();
    return reviews.filter((review) =>
      `pr ${review.pr_number} ${review.pr_title ?? ''} ${review.status}`.toLowerCase().includes(search)
    );
  }, [query, reviews]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Review History</h2>
          <p className="mt-1 text-sm text-gray-500">View all AI-generated code reviews for your connected repositories.</p>
        </div>
        
        <div className="flex w-full sm:max-w-md items-center rounded-xl bg-gray-50 border border-gray-200 px-4 py-2 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="text"
            placeholder="Search PRs or status..."
            className="ml-3 w-full border-none bg-transparent text-sm text-gray-900 placeholder-gray-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {filteredReviews.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-100 shadow-sm rounded-2xl p-12 text-center flex flex-col items-center justify-center"
            >
              <GitPullRequest className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
              <p className="text-sm text-gray-500 max-w-md">
                We haven't reviewed any pull requests yet. Ensure your webhook is configured and open a pull request on GitHub.
              </p>
            </motion.div>
          ) : (
            filteredReviews.map((review, index) => {
              const issueCount = Object.values(review.severity_summary ?? {}).reduce((total, count) => total + count, 0);
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={review.id} 
                  className={`minimal-card rounded-2xl transition-all border ${expandedId === review.id ? 'border-blue-300 shadow-md ring-1 ring-blue-100' : 'hover:border-blue-300 hover:shadow-md'} group overflow-hidden`}
                >
                  <div 
                    className="p-6 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0"
                    onClick={() => toggleExpand(review.id)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <GitPullRequest className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {review.pr_title ?? 'Untitled pull request'} <span className="text-gray-500 font-normal">#{review.pr_number}</span>
                        </h3>
                        <div className="mt-1.5 flex items-center space-x-3 text-sm text-gray-500">
                          <span>Reviewed {new Date(review.created_at).toLocaleString()}</span>
                          {review.ai_model && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                              <span className="font-mono text-xs text-gray-500">{review.ai_model}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {issueCount > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200">
                          <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                          {issueCount} Issues
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600 border border-green-200">
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          Clean
                        </span>
                      )}
                      <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium border ${
                        review.status === 'completed' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        review.status === 'failed' ? 'bg-red-50 text-red-600 border-red-200' :
                        'bg-yellow-50 text-yellow-600 border-yellow-200'
                      }`}>
                        <Clock className="mr-1.5 h-3.5 w-3.5" />
                        {review.status}
                      </span>
                      <div className="ml-2 text-gray-400 group-hover:text-gray-900 transition-colors">
                        {expandedId === review.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedId === review.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100 px-6 py-6 bg-gray-50"
                      >
                        <div className="prose prose-slate max-w-none prose-pre:bg-white prose-pre:border prose-pre:border-gray-200 prose-p:text-gray-700 prose-headings:text-gray-900 prose-a:text-blue-600">
                          <ReactMarkdown>
                            {review.review_text || "No review content available."}
                          </ReactMarkdown>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
