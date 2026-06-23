"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Send, MessageSquare, GitPullRequest } from 'lucide-react';
import { api, Review, ChatMessage } from '@/lib/api';
import { useNotification } from '@/components/Notifications';
import ReactMarkdown from 'react-markdown';

export default function GlobalChat() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeReview, setActiveReview] = useState<Review | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotification();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Autocomplete dropdown state
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionMenuIndex, setMentionMenuIndex] = useState(0);
  const [mentionTriggerIndex, setMentionTriggerIndex] = useState(-1);

  // Fetch reviews list on mount
  useEffect(() => {
    api.reviews()
      .then(setReviews)
      .catch((err) => addNotification(err instanceof Error ? err.message : 'Unable to load reviews', 'error'));
  }, [addNotification]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle selected PR changes
  const handleSelectPR = (review: Review) => {
    setActiveReview(review);
    setIsLoading(true);
    api.getChatHistory(review.id)
      .then(setMessages)
      .catch(() => addNotification('Failed to load chat history', 'error'))
      .finally(() => setIsLoading(false));
  };

  // Detect and handle @ mention trigger in textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    const selectionStart = e.target.selectionStart;
    const lastAtOffset = value.lastIndexOf('@', selectionStart - 1);
    
    if (lastAtOffset !== -1) {
      const textAfterAt = value.substring(lastAtOffset + 1, selectionStart);
      const hasWhitespaceOrNewlines = /\s/.test(textAfterAt);
      
      if (!hasWhitespaceOrNewlines) {
        setShowMentionMenu(true);
        setMentionQuery(textAfterAt);
        setMentionTriggerIndex(lastAtOffset);
        setMentionMenuIndex(0);
        return;
      }
    }
    
    setShowMentionMenu(false);
  };

  // Filter PR list based on @query
  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      const title = review.pr_title ?? '';
      const num = String(review.pr_number);
      const q = mentionQuery.toLowerCase();
      return title.toLowerCase().includes(q) || num.includes(q);
    });
  }, [reviews, mentionQuery]);

  // Autocomplete selection
  const selectReview = (review: Review) => {
    if (!textareaRef.current) return;
    
    const beforeMention = input.substring(0, mentionTriggerIndex);
    const afterMention = input.substring(textareaRef.current.selectionStart);
    
    // Insert reference tag in textbox
    const mentionText = `@PR-${review.pr_number} `;
    const newInput = beforeMention + mentionText + afterMention;
    
    setInput(newInput);
    setShowMentionMenu(false);
    
    // Change current chat context
    handleSelectPR(review);
    
    // Position cursor right after the mention badge
    const newCursorPos = beforeMention.length + mentionText.length;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 50);
  };

  // Keyboard navigation inside mention dropdown list
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionMenu && filteredReviews.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionMenuIndex(prev => (prev + 1) % filteredReviews.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionMenuIndex(prev => (prev - 1 + filteredReviews.length) % filteredReviews.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectReview(filteredReviews[mentionMenuIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionMenu(false);
      }
    } else {
      // If menu is closed, Enter sends the message, Shift+Enter creates a new line
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend(e);
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !activeReview) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    const tempId = Math.random().toString();
    setMessages(prev => [...prev, {
      id: tempId,
      review_id: activeReview.id,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    }]);

    try {
      await api.postChatMessage(activeReview.id, userMessage);
      const history = await api.getChatHistory(activeReview.id);
      setMessages(history);
    } catch (err) {
      addNotification('Failed to send message', 'error');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-black">Global Chat</h2>
          <p className="mt-0.5 text-sm text-neutral-500">Ask questions and discuss code reviews with AI.</p>
        </div>
        
        {/* Dropdown Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="pr-select" className="text-sm font-medium text-neutral-600 whitespace-nowrap">Active PR:</label>
          <select
            id="pr-select"
            value={activeReview?.id ?? ''}
            onChange={(e) => {
              const review = reviews.find(r => r.id === e.target.value);
              if (review) handleSelectPR(review);
            }}
            className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors min-w-[200px]"
          >
            <option value="" disabled>-- Select a Review --</option>
            {reviews.map((r) => (
              <option key={r.id} value={r.id}>
                PR #{r.pr_number}: {r.pr_title ?? 'Untitled'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat messages viewport */}
      <div className="flex-1 border border-neutral-200 rounded-xl bg-white overflow-hidden flex flex-col min-h-0 relative">
        {!activeReview ? (
          /* Empty placeholder screen */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-neutral-50/50">
            <MessageSquare className="h-12 w-12 text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-black mb-1">No Active Review</h3>
            <p className="text-sm text-neutral-500 max-w-sm">
              Type <span className="font-mono bg-neutral-100 border border-neutral-200 px-1 py-0.5 rounded text-black font-semibold">@</span> in the chat box to select a pull request review, or choose one from the selector above.
            </p>
          </div>
        ) : (
          /* Conversation messages */
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                <p className="text-sm">Ask a question about PR #{activeReview.pr_number}...</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-black text-white' 
                      : 'bg-neutral-100 text-black border border-neutral-200'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm prose-neutral max-w-none prose-pre:bg-white prose-pre:border prose-pre:border-neutral-200 prose-headings:text-black prose-a:text-black prose-a:underline">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 text-black border border-neutral-200 rounded-2xl px-4 py-2.5 text-sm">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input box */}
        <form onSubmit={handleSend} className="p-4 border-t border-neutral-200 bg-white relative">
          
          {/* Autocomplete mention overlay */}
          {showMentionMenu && filteredReviews.length > 0 && (
            <div className="absolute bottom-full left-4 mb-2 w-72 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden z-30 max-h-48 overflow-y-auto">
              <div className="px-3 py-1.5 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-medium">
                <span>Select Pull Request</span>
                <span className="font-normal font-mono">Use ↑↓ and ↵</span>
              </div>
              <ul className="divide-y divide-neutral-50">
                {filteredReviews.map((review, idx) => (
                  <li
                    key={review.id}
                    onClick={() => selectReview(review)}
                    className={`px-3 py-2 text-sm cursor-pointer transition-colors flex items-center space-x-2 ${
                      idx === mentionMenuIndex ? 'bg-black text-white' : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <GitPullRequest className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-semibold">#{review.pr_number}</span>
                    <span className="truncate flex-1 font-normal opacity-90">{review.pr_title ?? 'Untitled'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={2}
                placeholder="E.g., @PR-1 What are the security issues in this PR?"
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black transition-colors resize-none pr-10"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || !activeReview}
                className="absolute right-3 bottom-3 text-neutral-400 hover:text-black transition-colors disabled:opacity-30 disabled:hover:text-neutral-400"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
