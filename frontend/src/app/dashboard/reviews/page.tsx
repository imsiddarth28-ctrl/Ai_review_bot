"use client";

import { useEffect, useMemo, useState } from 'react';
import { Search, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { api, Review } from '@/lib/api';

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.reviews()
      .then(setReviews)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load reviews'));
  }, []);

  const filteredReviews = useMemo(() => {
    const search = query.toLowerCase();
    return reviews.filter((review) =>
      `pr ${review.pr_number} ${review.pr_title ?? ''} ${review.status}`.toLowerCase().includes(search)
    );
  }, [query, reviews]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Review History</h2>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex items-center space-x-4">
        <div className="flex w-full max-w-md items-center rounded-md border border-gray-300 bg-white px-3 py-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="text"
            placeholder="Search PRs or status..."
            className="ml-2 w-full border-none bg-transparent text-sm text-gray-900 focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
            No reviews yet. Open or update a pull request after configuring your GitHub webhook.
          </div>
        ) : (
          filteredReviews.map((review) => {
            const issueCount = Object.values(review.severity_summary ?? {}).reduce((total, count) => total + count, 0);
            return (
              <div key={review.id} className="cursor-pointer rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-colors hover:border-blue-300">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600">
                      {review.pr_title ?? 'Untitled pull request'} #{review.pr_number}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Reviewed {new Date(review.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {issueCount > 0 ? (
                      <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        {issueCount} Issues
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Clean
                      </span>
                    )}
                    <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                      <Clock className="mr-1 h-3 w-3" />
                      {review.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
