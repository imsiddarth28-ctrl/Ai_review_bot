"use client";

import { useEffect, useMemo, useState } from 'react';
import { Search, GitPullRequest, ChevronDown, ChevronUp } from 'lucide-react';
import { api, Review } from '@/lib/api';
import { useNotification } from '@/components/Notifications';
import ReactMarkdown from 'react-markdown';
import ReviewChat from '@/components/ReviewChat';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-black">Reviews</h2>
          <p className="mt-0.5 text-sm text-neutral-500">AI-generated code reviews.</p>
        </div>
        
        <div className="flex w-full sm:max-w-sm items-center rounded-lg border border-neutral-200 px-3 py-1.5 transition-colors focus-within:border-black">
          <Search className="h-4 w-4 text-neutral-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="text"
            placeholder="Search..."
            className="ml-2 w-full border-none bg-transparent text-sm text-black placeholder-neutral-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <div className="border border-neutral-200 rounded-lg p-12 text-center">
            <GitPullRequest className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-base font-medium text-black mb-1">No reviews found</h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto">
              Open a pull request on GitHub to trigger an AI review.
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const issueCount = Object.values(review.severity_summary ?? {}).reduce((total, count) => total + count, 0);
            return (
              <div 
                key={review.id} 
                className={`border rounded-lg overflow-hidden transition-colors ${expandedId === review.id ? 'border-black' : 'border-neutral-200 hover:border-neutral-400'}`}
              >
                <div 
                  className="p-4 cursor-pointer flex items-center justify-between"
                  onClick={() => toggleExpand(review.id)}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <GitPullRequest className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-black truncate">
                        {review.pr_title ?? 'Untitled'} <span className="text-neutral-400 font-normal">#{review.pr_number}</span>
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-400">
                        <span>{new Date(review.created_at).toLocaleDateString()}</span>
                        {review.ai_model && (
                          <>
                            <span>·</span>
                            <span className="font-mono">{review.ai_model}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <span className="text-xs font-medium px-2 py-0.5 rounded border border-neutral-200 text-black">
                      {issueCount > 0 ? `${issueCount} issues` : 'clean'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded border border-neutral-200 text-neutral-500">
                      {review.status}
                    </span>
                    {expandedId === review.id ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                  </div>
                </div>
                
                {expandedId === review.id && (
                  <div className="border-t border-neutral-200 px-4 py-5 bg-neutral-50">
                    <div className="prose prose-sm prose-neutral max-w-none prose-pre:bg-white prose-pre:border prose-pre:border-neutral-200 prose-headings:text-black prose-a:text-black prose-a:underline">
                      <ReactMarkdown>
                        {review.review_text || "No review content available."}
                      </ReactMarkdown>
                    </div>
                    
                    <div className="mt-8">
                      <h4 className="text-sm font-semibold text-black mb-2">Interrogate this Review</h4>
                      <p className="text-xs text-neutral-500 mb-4">Ask the AI questions about the code, suggested fixes, or potential security risks.</p>
                      <ReviewChat reviewId={review.id} />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
