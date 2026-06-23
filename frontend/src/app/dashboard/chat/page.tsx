"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, 
  MessageSquare, 
  GitPullRequest, 
  Search, 
  BookOpen, 
  Menu, 
  X, 
  ExternalLink, 
  ChevronRight, 
  Copy, 
  Check, 
  Bot 
} from 'lucide-react';
import { api, Review, ChatMessage, Repository } from '@/lib/api';
import { useNotification } from '@/components/Notifications';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

// Helper component for message bubbles clipboard copy button
const CopyButton = ({ text, isUser }: { text: string; isUser: boolean }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      type="button"
      className={cn(
        "p-1 rounded-md transition-all cursor-pointer border border-transparent shadow-2xs",
        isUser 
          ? "hover:bg-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700" 
          : "hover:bg-neutral-100 text-neutral-400 hover:text-black hover:border-neutral-200"
      )}
      title="Copy message to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

// Custom Pre renderer to add "Copy" button to code blocks
const PreRenderer = ({ children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  const handleCopy = () => {
    if (codeRef.current) {
      const text = codeRef.current.innerText || '';
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group my-4">
      <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center space-x-1 px-2 py-1 text-[10px] font-medium bg-white border border-neutral-200 rounded-md text-neutral-600 hover:text-black hover:bg-white shadow-2xs transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-green-600" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre
        ref={codeRef}
        className="overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 font-mono text-xs leading-relaxed text-black"
        {...props}
      >
        {children}
      </pre>
    </div>
  );
};

const QUICK_PROMPTS = [
  { label: '🔍 List Issues', prompt: 'List all issues found in this review with their severity.' },
  { label: '🛡️ Security Risks', prompt: 'What are the main security risks in this pull request?' },
  { label: '⚡ Performance', prompt: 'Are there any performance bottlenecks or optimization suggestions?' },
  { label: '📝 Explain Changes', prompt: 'Can you summarize the code changes in this PR and why they were made?' }
];

export default function GlobalChat() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [activeReview, setActiveReview] = useState<Review | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotification();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Layout panel toggles
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState<'review' | 'tools'>('review');
  
  // Mobile drawer navigation toggles
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Autocomplete dropdown state
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionMenuIndex, setMentionMenuIndex] = useState(0);
  const [mentionTriggerIndex, setMentionTriggerIndex] = useState(-1);

  // Fetch reviews & repositories list on mount
  useEffect(() => {
    Promise.all([api.reviews(), api.repositories()])
      .then(([reviewsData, reposData]) => {
        setReviews(reviewsData);
        setRepositories(reposData);
      })
      .catch((err) => addNotification(err instanceof Error ? err.message : 'Unable to load chat workspace data', 'error'));
  }, [addNotification]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Repository mapping
  const repoMap = useMemo(() => {
    const map = new Map<string, Repository>();
    repositories.forEach(r => map.set(r.id, r));
    return map;
  }, [repositories]);

  const getRepoName = (review: Review) => {
    const repo = repoMap.get(review.repository_id);
    return repo ? `${repo.owner}/${repo.repo_name}` : 'Unknown Repository';
  };

  const getGitHubUrl = (review: Review) => {
    const repo = repoMap.get(review.repository_id);
    if (!repo) return null;
    return `https://github.com/${repo.owner}/${repo.repo_name}/pull/${review.pr_number}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Handle selected PR changes
  const handleSelectPR = (review: Review) => {
    setActiveReview(review);
    setMobileLeftOpen(false); // Close drawer overlay on mobile
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

  // Filter PR list based on left sidebar search
  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      const title = review.pr_title ?? '';
      const num = String(review.pr_number);
      const repo = getRepoName(review);
      const q = (showMentionMenu ? mentionQuery : searchQuery).toLowerCase();
      return title.toLowerCase().includes(q) || num.includes(q) || repo.toLowerCase().includes(q);
    });
  }, [reviews, searchQuery, mentionQuery, showMentionMenu, repoMap]);

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

  const handleQuickPrompt = (promptText: string) => {
    setInput(promptText);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const sendPromptInstantly = async (promptText: string) => {
    if (isLoading || !activeReview) return;
    setIsLoading(true);

    const tempId = Math.random().toString();
    setMessages(prev => [...prev, {
      id: tempId,
      review_id: activeReview.id,
      role: 'user',
      content: promptText,
      created_at: new Date().toISOString()
    }]);

    try {
      await api.postChatMessage(activeReview.id, promptText);
      const history = await api.getChatHistory(activeReview.id);
      setMessages(history);
    } catch (err) {
      addNotification('Failed to execute command', 'error');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] border border-neutral-200 rounded-xl bg-white overflow-hidden shadow-sm relative">
      
      {/* Left Sidebar (Desktop) */}
      <div className={cn(
        "hidden lg:flex flex-col border-r border-neutral-200 flex-shrink-0 transition-all duration-300 bg-white",
        leftSidebarOpen ? "w-80" : "w-0 overflow-hidden border-r-0"
      )}>
        {/* Sidebar Header & Search */}
        <div className="p-4 border-b border-neutral-200 flex flex-col space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-black uppercase tracking-wider">Pull Requests</h3>
            <span className="text-[10px] bg-neutral-100 border border-neutral-200 rounded-full px-2 py-0.5 text-neutral-600 font-medium">
              {reviews.length} reviews
            </span>
          </div>
          <div className="flex items-center rounded-lg border border-neutral-200 px-3 py-1.5 bg-neutral-50/50 focus-within:border-black focus-within:bg-white transition-colors">
            <Search className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="text"
              placeholder="Search title, PR#, repo..."
              className="ml-2 w-full border-none bg-transparent text-xs text-black placeholder-neutral-400 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-neutral-400 hover:text-black text-xs font-semibold cursor-pointer">✕</button>
            )}
          </div>
        </div>

        {/* List of Reviews */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-white">
          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center text-neutral-400 text-xs">
              No code reviews found.
            </div>
          ) : (
            filteredReviews.map((r) => {
              const active = activeReview?.id === r.id;
              const repoName = getRepoName(r);
              const issueCount = r.severity_summary ? Object.values(r.severity_summary).reduce((a, b) => a + b, 0) : 0;
              return (
                <button
                  key={r.id}
                  onClick={() => handleSelectPR(r)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-all flex flex-col space-y-1 relative cursor-pointer",
                    active 
                      ? "bg-neutral-50 border border-neutral-200 shadow-2xs before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1 before:bg-black before:rounded-r" 
                      : "hover:bg-neutral-50/50 border border-transparent"
                  )}
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[10px] font-mono text-neutral-400 truncate flex-1">{repoName}</span>
                    <span className="text-[10px] text-neutral-400 font-medium whitespace-nowrap">{formatDate(r.created_at)}</span>
                  </div>
                  <h4 className={cn("text-xs font-medium truncate w-full", active ? "text-black font-semibold" : "text-neutral-700")}>
                    <span className="font-semibold text-neutral-400 mr-1">#{r.pr_number}</span>
                    {r.pr_title ?? 'Untitled'}
                  </h4>
                  <div className="flex justify-between items-center pt-1">
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-sm border font-medium",
                      issueCount > 0 
                        ? "bg-red-50 text-red-600 border-red-100" 
                        : "bg-green-50 text-green-600 border-green-100"
                    )}>
                      {issueCount > 0 ? `${issueCount} issues` : 'clean'}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">{r.status}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Left Sidebar Overlay Drawer (Mobile) */}
      {mobileLeftOpen && <div onClick={() => setMobileLeftOpen(false)} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden" />}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white w-80 border-r border-neutral-200 flex flex-col transition-transform duration-300 lg:hidden",
        mobileLeftOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 border-b border-neutral-200 flex flex-col space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-black uppercase tracking-wider">Pull Requests</h3>
            <button onClick={() => setMobileLeftOpen(false)} className="p-1 rounded hover:bg-neutral-100 text-neutral-500 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center rounded-lg border border-neutral-200 px-3 py-1.5 bg-neutral-50/50">
            <Search className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="text"
              placeholder="Search PRs..."
              className="ml-2 w-full border-none bg-transparent text-xs text-black focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-white">
          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center text-neutral-400 text-xs">
              No code reviews found.
            </div>
          ) : (
            filteredReviews.map((r) => {
              const active = activeReview?.id === r.id;
              const repoName = getRepoName(r);
              const issueCount = r.severity_summary ? Object.values(r.severity_summary).reduce((a, b) => a + b, 0) : 0;
              return (
                <button
                  key={r.id}
                  onClick={() => handleSelectPR(r)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg flex flex-col space-y-1 relative cursor-pointer",
                    active 
                      ? "bg-neutral-50 border border-neutral-200 shadow-2xs before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1 before:bg-black before:rounded-r" 
                      : "hover:bg-neutral-50/50 border border-transparent"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono text-neutral-400 truncate flex-1 mr-1">{repoName}</span>
                    <span className="text-[10px] text-neutral-400 whitespace-nowrap">{formatDate(r.created_at)}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-black truncate w-full">
                    <span className="font-bold text-neutral-400 mr-1">#{r.pr_number}</span>
                    {r.pr_title ?? 'Untitled'}
                  </h4>
                  <div className="flex justify-between items-center pt-1">
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-sm border font-medium",
                      issueCount > 0 
                        ? "bg-red-50 text-red-600 border-red-100" 
                        : "bg-green-50 text-green-600 border-green-100"
                    )}>
                      {issueCount > 0 ? `${issueCount} issues` : 'clean'}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">{r.status}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Center Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0 bg-white relative h-full">
        {/* Active PR Chat Header */}
        {activeReview ? (
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between flex-shrink-0 bg-white z-10 shadow-2xs">
            <div className="flex items-center space-x-3 min-w-0">
              <button 
                onClick={() => {
                  setLeftSidebarOpen(!leftSidebarOpen);
                  setMobileLeftOpen(true);
                }} 
                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-black transition-colors cursor-pointer"
                title="Toggle Pull Request list"
              >
                <Menu className="w-4 h-4" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center space-x-1.5 text-[10px] text-neutral-400 font-medium">
                  <span className="font-mono truncate max-w-[120px] sm:max-w-none">{getRepoName(activeReview)}</span>
                  <span>·</span>
                  <span>PR #{activeReview.pr_number}</span>
                </div>
                <h3 className="text-sm font-semibold text-black truncate min-w-0 pr-2">
                  {activeReview.pr_title ?? 'Untitled'}
                </h3>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {getGitHubUrl(activeReview) && (
                <a
                  href={getGitHubUrl(activeReview)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center space-x-1.5 text-xs text-neutral-600 hover:text-black font-medium transition-colors border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>GitHub</span>
                </a>
              )}

              {/* Toggle Review Document */}
              <button
                onClick={() => {
                  setRightPanelOpen(!rightPanelOpen);
                  setMobileRightOpen(true);
                }}
                className={cn(
                  "inline-flex items-center space-x-1.5 text-xs border rounded-lg px-2.5 py-1.5 font-medium transition-all shadow-2xs cursor-pointer",
                  (rightPanelOpen && activeReview)
                    ? "bg-black text-white border-black hover:bg-neutral-800" 
                    : "bg-neutral-50 text-neutral-500 hover:text-black border-neutral-200 hover:bg-neutral-100"
                )}
                title="Toggle side-by-side Review Summary document"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{rightPanelOpen ? 'Hide Review' : 'Show Review'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Empty state header (just a small trigger button on mobile) */
          <div className="lg:hidden p-4 border-b border-neutral-200 flex items-center justify-between flex-shrink-0 bg-white z-10">
            <button 
              onClick={() => setMobileLeftOpen(true)}
              className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 flex items-center space-x-1 text-xs font-semibold cursor-pointer"
            >
              <Menu className="w-4 h-4" />
              <span>Select PR</span>
            </button>
            <h3 className="text-sm font-semibold text-black">Chat</h3>
            <div className="w-8" />
          </div>
        )}

        {/* Message Log Viewport */}
        {activeReview ? (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-neutral-50/20">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-400 space-y-2">
                <Bot className="w-8 h-8 text-neutral-300" />
                <p className="text-sm">Ask a question about PR #{activeReview.pr_number}...</p>
                <p className="text-xs text-neutral-400 max-w-xs text-center">Use the action chips below or type your own question to interrogate the review results.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={cn("flex w-full group", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn("flex space-x-2.5 max-w-[85%] sm:max-w-[75%]", msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row')}>
                    
                    {/* Avatar */}
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 shadow-2xs font-semibold border",
                      msg.role === 'user' 
                        ? 'bg-neutral-900 text-white border-neutral-950' 
                        : 'bg-white text-black border-neutral-200'
                    )}>
                      {msg.role === 'user' ? 'U' : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Bubble Content */}
                    <div className="space-y-1">
                      <div className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm shadow-2xs relative group/bubble",
                        msg.role === 'user' 
                          ? 'bg-black text-white' 
                          : 'bg-white text-black border border-neutral-200'
                      )}>
                        
                        {/* Inline copy button */}
                        <div className={cn(
                          "absolute right-2 top-2 z-10 opacity-0 group-hover/bubble:opacity-100 transition-opacity",
                          msg.role === 'user' ? 'text-white' : 'text-neutral-500'
                        )}>
                          <CopyButton text={msg.content} isUser={msg.role === 'user'} />
                        </div>

                        {msg.role === 'user' ? (
                          <p className="whitespace-pre-wrap pr-4 leading-relaxed">{msg.content}</p>
                        ) : (
                          <div className="prose prose-sm prose-neutral max-w-none pr-4 prose-pre:bg-neutral-50 prose-pre:border prose-pre:border-neutral-200">
                            <ReactMarkdown components={{ pre: PreRenderer }}>{msg.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                      <p className={cn("text-[9px] text-neutral-400 px-2 font-medium", msg.role === 'user' ? 'text-right' : 'text-left')}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-white text-black border border-neutral-200 flex items-center justify-center shadow-2xs flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white text-black border border-neutral-200 rounded-2xl px-4 py-3 text-sm shadow-2xs">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          /* Empty placeholder screen */
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-neutral-50/30 overflow-y-auto">
            <div className="max-w-md w-full text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center shadow-md">
                <MessageSquare className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-black">PR Review Chat Workspace</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Select a pull request from the sidebar or type <kbd className="px-1.5 py-0.5 border border-neutral-300 bg-neutral-100 rounded text-xs font-mono font-bold text-black shadow-2xs">@</kbd> in the chat input below to begin a discussion.
                </p>
              </div>

              {reviews.length > 0 && (
                <div className="space-y-3 text-left">
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Quick Start from Recent Reviews</h4>
                  <div className="grid gap-2">
                    {reviews.slice(0, 3).map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleSelectPR(r)}
                        className="w-full text-left p-3.5 rounded-xl border border-neutral-200 bg-white hover:border-black hover:shadow-sm transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="min-w-0 pr-4">
                          <p className="text-[10px] text-neutral-400 font-mono mb-0.5">{getRepoName(r)}</p>
                          <h5 className="text-xs font-medium text-black truncate group-hover:text-black">
                            #{r.pr_number}: {r.pr_title ?? 'Untitled'}
                          </h5>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-black flex-shrink-0 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Input box */}
        <form onSubmit={handleSend} className="p-4 border-t border-neutral-200 bg-white relative flex-shrink-0">
          
          {/* Quick Action Chips */}
          {activeReview && (
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-3 -mx-2 px-2 scrollbar-none flex-shrink-0">
              {QUICK_PROMPTS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickPrompt(chip.prompt)}
                  className="px-2.5 py-1 text-[10px] font-medium bg-neutral-50 hover:bg-neutral-100 text-neutral-600 hover:text-black border border-neutral-200 rounded-full transition-colors whitespace-nowrap shadow-2xs flex-shrink-0 cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Autocomplete mention overlay */}
          {showMentionMenu && filteredReviews.length > 0 && (
            <div className="absolute bottom-full left-4 mb-2 w-72 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden z-30 max-h-48 overflow-y-auto">
              <div className="px-3 py-1.5 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-medium">
                <span>Select Pull Request</span>
                <span className="font-normal font-mono text-[10px]">Use ↑↓ and ↵</span>
              </div>
              <ul className="divide-y divide-neutral-50">
                {filteredReviews.map((review, idx) => (
                  <li
                    key={review.id}
                    onClick={() => selectReview(review)}
                    className={cn(
                      "px-3 py-2 text-xs cursor-pointer transition-colors flex items-center space-x-2",
                      idx === mentionMenuIndex ? 'bg-black text-white' : 'text-neutral-700 hover:bg-neutral-50'
                    )}
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
                placeholder={activeReview 
                  ? `Ask a question about PR #${activeReview.pr_number}... (Type @ to reference another PR)` 
                  : "Type @ to select a pull request..."
                }
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black transition-colors resize-none pr-10 min-h-[60px]"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || !activeReview}
                className="absolute right-3 bottom-3 text-neutral-400 hover:text-black transition-colors disabled:opacity-30 disabled:hover:text-neutral-400 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Right Drawer (Desktop) */}
      <div className={cn(
        "hidden lg:flex flex-col border-l border-neutral-200 flex-shrink-0 transition-all duration-300 bg-neutral-50/10",
        activeReview && rightPanelOpen ? "w-[400px]" : "w-0 overflow-hidden border-l-0"
      )}>
        {activeReview && (
          <>
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between flex-shrink-0 bg-white">
              <div>
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">AI review workspace</h3>
                <p className="text-xs font-medium text-black truncate w-64">PR #{activeReview.pr_number}: {activeReview.pr_title ?? 'Untitled'}</p>
              </div>
              <button 
                onClick={() => setRightPanelOpen(false)}
                className="p-1 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-black transition-colors cursor-pointer"
                title="Collapse review document drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Switched Header */}
            <div className="flex border-b border-neutral-200 bg-neutral-50 p-1 flex-shrink-0">
              <button
                onClick={() => setRightPanelTab('review')}
                className={cn(
                  "flex-1 text-center py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                  rightPanelTab === 'review' ? "bg-white text-black shadow-2xs font-semibold" : "text-neutral-500 hover:text-black"
                )}
              >
                📄 Review summary
              </button>
              <button
                onClick={() => setRightPanelTab('tools')}
                className={cn(
                  "flex-1 text-center py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                  rightPanelTab === 'tools' ? "bg-white text-black shadow-2xs font-semibold" : "text-neutral-500 hover:text-black"
                )}
              >
                🛠️ Developer tools
              </button>
            </div>

            {/* Tab Contents */}
            {rightPanelTab === 'review' ? (
              <div className="flex-1 overflow-y-auto p-5 bg-white">
                <div className="prose prose-sm prose-neutral max-w-none">
                  <ReactMarkdown components={{ pre: PreRenderer }}>
                    {activeReview.review_text || "No review content available."}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-black uppercase tracking-wider">Real-World Developer Toolbox</h4>
                  <p className="text-[10px] text-neutral-400 leading-relaxed">Contextual utilities generated directly from PR #{activeReview.pr_number} review results.</p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="border border-neutral-200 rounded-xl p-3.5 space-y-2 hover:border-neutral-400 transition-colors bg-neutral-50/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black flex items-center gap-1.5">
                        📝 PR Description Generator
                      </span>
                      <span className="text-[9px] bg-neutral-100 border border-neutral-200 text-neutral-500 px-1.5 py-0.5 rounded font-mono">Real-time</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Analyze review findings to draft a professional markdown description for this pull request (includes summary, key changes, and QA checklist).
                    </p>
                    <div className="flex gap-2 pt-1.5">
                      <button
                        onClick={() => sendPromptInstantly("Generate a professional GitHub Pull Request description in markdown format based on this review. Include: 1. Summary of changes, 2. Key refactors, 3. Testing checklist.")}
                        disabled={isLoading}
                        className="px-2.5 py-1 bg-black text-white text-[10px] font-semibold rounded-md hover:bg-neutral-800 transition-all cursor-pointer disabled:opacity-50"
                      >
                        Run in Chat
                      </button>
                      <button
                        onClick={() => handleQuickPrompt("Generate a professional GitHub Pull Request description in markdown format based on this review. Include: 1. Summary of changes, 2. Key refactors, 3. Testing checklist.")}
                        className="px-2.5 py-1 border border-neutral-200 text-neutral-600 hover:text-black text-[10px] font-semibold rounded-md hover:bg-neutral-50 transition-all cursor-pointer"
                      >
                        Edit Prompt
                      </button>
                    </div>
                  </div>

                  <div className="border border-neutral-200 rounded-xl p-3.5 space-y-2 hover:border-neutral-400 transition-colors bg-neutral-50/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black flex items-center gap-1.5">
                        💾 Conventional Commit Drafts
                      </span>
                      <span className="text-[9px] bg-neutral-100 border border-neutral-200 text-neutral-500 px-1.5 py-0.5 rounded font-mono">Git helper</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Draft 3 alternative Conventional Commit messages for your changes to keep your repository history clean and readable.
                    </p>
                    <div className="flex gap-2 pt-1.5">
                      <button
                        onClick={() => sendPromptInstantly("Draft 3 alternative Conventional Commit messages (following the Conventional Commits specification) for the code changes discussed in this review.")}
                        disabled={isLoading}
                        className="px-2.5 py-1 bg-black text-white text-[10px] font-semibold rounded-md hover:bg-neutral-800 transition-all cursor-pointer disabled:opacity-50"
                      >
                        Run in Chat
                      </button>
                      <button
                        onClick={() => handleQuickPrompt("Draft 3 alternative Conventional Commit messages (following the Conventional Commits specification) for the code changes discussed in this review.")}
                        className="px-2.5 py-1 border border-neutral-200 text-neutral-600 hover:text-black text-[10px] font-semibold rounded-md hover:bg-neutral-50 transition-all cursor-pointer"
                      >
                        Edit Prompt
                      </button>
                    </div>
                  </div>

                  <div className="border border-neutral-200 rounded-xl p-3.5 space-y-2 hover:border-neutral-400 transition-colors bg-neutral-50/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black flex items-center gap-1.5">
                        🛡️ OWASP Security Threat Audit
                      </span>
                      <span className="text-[9px] bg-red-50 border border-red-100 text-red-600 px-1.5 py-0.5 rounded font-mono">Security</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Perform a deep security audit on this review to highlight OWASP Top 10 vulnerabilities (SQLi, XSS, SSRF, auth issues, etc.).
                    </p>
                    <div className="flex gap-2 pt-1.5">
                      <button
                        onClick={() => sendPromptInstantly("List all security threats or vulnerabilities found in this code review. Assess their severity and map them to OWASP standards if applicable.")}
                        disabled={isLoading}
                        className="px-2.5 py-1 bg-black text-white text-[10px] font-semibold rounded-md hover:bg-neutral-800 transition-all cursor-pointer disabled:opacity-50"
                      >
                        Run Audit
                      </button>
                      <button
                        onClick={() => handleQuickPrompt("List all security threats or vulnerabilities found in this code review. Assess their severity and map them to OWASP standards if applicable.")}
                        className="px-2.5 py-1 border border-neutral-200 text-neutral-600 hover:text-black text-[10px] font-semibold rounded-md hover:bg-neutral-50 transition-all cursor-pointer"
                      >
                        Edit Prompt
                      </button>
                    </div>
                  </div>

                  <div className="border border-neutral-200 rounded-xl p-3.5 space-y-2 hover:border-neutral-400 transition-colors bg-neutral-50/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black flex items-center gap-1.5">
                        ⚡ Refactoring Code Planner
                      </span>
                      <span className="text-[9px] bg-green-50 border border-green-100 text-green-600 px-1.5 py-0.5 rounded font-mono">Refactor</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Get side-by-side refactored code block suggestions for the most critical bugs or smells identified in this review.
                    </p>
                    <div className="flex gap-2 pt-1.5">
                      <button
                        onClick={() => sendPromptInstantly("List the top 2-3 critical issues in this code review and provide the refactored code snippets side-by-side with explanations.")}
                        disabled={isLoading}
                        className="px-2.5 py-1 bg-black text-white text-[10px] font-semibold rounded-md hover:bg-neutral-800 transition-all cursor-pointer disabled:opacity-50"
                      >
                        Suggest Code
                      </button>
                      <button
                        onClick={() => handleQuickPrompt("List the top 2-3 critical issues in this code review and provide the refactored code snippets side-by-side with explanations.")}
                        className="px-2.5 py-1 border border-neutral-200 text-neutral-600 hover:text-black text-[10px] font-semibold rounded-md hover:bg-neutral-50 transition-all cursor-pointer"
                      >
                        Edit Prompt
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right Drawer Overlay (Mobile) */}
      {mobileRightOpen && <div onClick={() => setMobileRightOpen(false)} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden" />}
      <div className={cn(
        "fixed inset-y-0 right-0 z-50 bg-white w-[85vw] max-w-md border-l border-neutral-200 flex flex-col transition-transform duration-300 lg:hidden",
        mobileRightOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {activeReview && (
          <>
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between flex-shrink-0 bg-white z-10 shadow-2xs">
              <div>
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">AI review workspace</h3>
                <p className="text-xs font-medium text-black truncate max-w-[200px]">PR #{activeReview.pr_number}</p>
              </div>
              <button onClick={() => setMobileRightOpen(false)} className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Switched Header */}
            <div className="flex border-b border-neutral-200 bg-neutral-50 p-1 flex-shrink-0">
              <button
                onClick={() => setRightPanelTab('review')}
                className={cn(
                  "flex-1 text-center py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                  rightPanelTab === 'review' ? "bg-white text-black shadow-2xs font-semibold" : "text-neutral-500 hover:text-black"
                )}
              >
                📄 Review summary
              </button>
              <button
                onClick={() => setRightPanelTab('tools')}
                className={cn(
                  "flex-1 text-center py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                  rightPanelTab === 'tools' ? "bg-white text-black shadow-2xs font-semibold" : "text-neutral-500 hover:text-black"
                )}
              >
                🛠️ Developer tools
              </button>
            </div>

            {rightPanelTab === 'review' ? (
              <div className="flex-1 overflow-y-auto p-5 bg-white">
                <div className="prose prose-sm prose-neutral max-w-none">
                  <ReactMarkdown components={{ pre: PreRenderer }}>
                    {activeReview.review_text || "No review content available."}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-black uppercase tracking-wider">Real-World Developer Toolbox</h4>
                  <p className="text-[10px] text-neutral-400">Contextual utilities generated directly from PR #{activeReview.pr_number} review results.</p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="border border-neutral-200 rounded-xl p-3.5 space-y-2 hover:border-neutral-400 transition-colors bg-neutral-50/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black">📝 PR Description Generator</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Analyze review findings to draft a professional markdown description for this pull request.
                    </p>
                    <button
                      onClick={() => {
                        sendPromptInstantly("Generate a professional GitHub Pull Request description in markdown format based on this review. Include: 1. Summary of changes, 2. Key refactors, 3. Testing checklist.");
                        setMobileRightOpen(false);
                      }}
                      disabled={isLoading}
                      className="px-2.5 py-1 bg-black text-white text-[10px] font-semibold rounded-md hover:bg-neutral-800 cursor-pointer disabled:opacity-50"
                    >
                      Run in Chat
                    </button>
                  </div>

                  <div className="border border-neutral-200 rounded-xl p-3.5 space-y-2 hover:border-neutral-400 transition-colors bg-neutral-50/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black">💾 Conventional Commit Drafts</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Draft 3 alternative Conventional Commit messages for your changes.
                    </p>
                    <button
                      onClick={() => {
                        sendPromptInstantly("Draft 3 alternative Conventional Commit messages (following the Conventional Commits specification) for the code changes discussed in this review.");
                        setMobileRightOpen(false);
                      }}
                      disabled={isLoading}
                      className="px-2.5 py-1 bg-black text-white text-[10px] font-semibold rounded-md hover:bg-neutral-800 cursor-pointer disabled:opacity-50"
                    >
                      Run in Chat
                    </button>
                  </div>

                  <div className="border border-neutral-200 rounded-xl p-3.5 space-y-2 hover:border-neutral-400 transition-colors bg-neutral-50/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black">🛡️ OWASP Security Threat Audit</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Perform a deep security audit on this review to highlight OWASP Top 10 vulnerabilities.
                    </p>
                    <button
                      onClick={() => {
                        sendPromptInstantly("List all security threats or vulnerabilities found in this code review. Assess their severity and map them to OWASP standards if applicable.");
                        setMobileRightOpen(false);
                      }}
                      disabled={isLoading}
                      className="px-2.5 py-1 bg-black text-white text-[10px] font-semibold rounded-md hover:bg-neutral-800 cursor-pointer disabled:opacity-50"
                    >
                      Run Audit
                    </button>
                  </div>

                  <div className="border border-neutral-200 rounded-xl p-3.5 space-y-2 hover:border-neutral-400 transition-colors bg-neutral-50/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black">⚡ Refactoring Code Planner</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Get side-by-side refactored code block suggestions for the most critical bugs.
                    </p>
                    <button
                      onClick={() => {
                        sendPromptInstantly("List the top 2-3 critical issues in this code review and provide the refactored code snippets side-by-side with explanations.");
                        setMobileRightOpen(false);
                      }}
                      disabled={isLoading}
                      className="px-2.5 py-1 bg-black text-white text-[10px] font-semibold rounded-md hover:bg-neutral-800 cursor-pointer disabled:opacity-50"
                    >
                      Suggest Code
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
