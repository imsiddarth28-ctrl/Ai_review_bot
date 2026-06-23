import { useState, useEffect, useRef } from 'react';
import { api, ChatMessage } from '@/lib/api';
import { Send, Bot, Copy, Check } from 'lucide-react';
import { useNotification } from './Notifications';
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

export default function ReviewChat({ reviewId }: { reviewId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotification();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getChatHistory(reviewId)
      .then(setMessages)
      .catch(() => addNotification('Failed to load chat history', 'error'));
  }, [reviewId, addNotification]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Optimistic UI update
    const tempId = Math.random().toString();
    setMessages(prev => [...prev, {
      id: tempId,
      review_id: reviewId,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    }]);

    try {
      await api.postChatMessage(reviewId, userMessage);
      const history = await api.getChatHistory(reviewId);
      setMessages(history);
    } catch (err) {
      addNotification('Failed to send message', 'error');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[450px] border border-neutral-200 rounded-xl bg-white overflow-hidden mt-6 shadow-sm">
      <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 flex items-center">
        <Bot className="w-4 h-4 mr-2 text-black animate-pulse" />
        <h3 className="text-sm font-semibold text-black">AI Assistant Workspace</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/20">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-400 space-y-2">
            <Bot className="w-8 h-8 text-neutral-300" />
            <p className="text-xs">Ask a question about this code review...</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={cn("flex w-full group", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn("flex space-x-2.5 max-w-[85%] sm:max-w-[75%]", msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row')}>
                
                {/* Avatar */}
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-semibold border shadow-2xs",
                  msg.role === 'user' 
                    ? 'bg-neutral-900 text-white border-neutral-950' 
                    : 'bg-white text-black border-neutral-200'
                )}>
                  {msg.role === 'user' ? 'U' : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Bubble Content */}
                <div className="space-y-0.5">
                  <div className={cn(
                    "rounded-xl px-3.5 py-2 text-sm shadow-2xs relative group/bubble",
                    msg.role === 'user' 
                      ? 'bg-black text-white' 
                      : 'bg-white text-black border border-neutral-200'
                  )}>
                    {/* Inline copy button */}
                    <div className={cn(
                      "absolute right-2 top-1.5 z-10 opacity-0 group-hover/bubble:opacity-100 transition-opacity",
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
                </div>

              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-white border border-neutral-200 flex items-center justify-center shadow-2xs flex-shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white text-black border border-neutral-200 rounded-xl px-4 py-2.5 text-sm shadow-2xs">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-neutral-200 bg-white">
        <div className="flex items-center relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about this code review..."
            className="w-full border border-neutral-200 rounded-lg pl-3 pr-10 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors placeholder-neutral-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 text-neutral-400 hover:text-black transition-colors disabled:opacity-50 disabled:hover:text-neutral-400 cursor-pointer p-1"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
