import { useState, useEffect, useRef } from 'react';
import { api, ChatMessage } from '@/lib/api';
import { Send, Bot } from 'lucide-react';
import { useNotification } from './Notifications';
import ReactMarkdown from 'react-markdown';

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
      const aiMessage = await api.postChatMessage(reviewId, userMessage);
      // Reload history to get real IDs and AI response
      const history = await api.getChatHistory(reviewId);
      setMessages(history);
    } catch (err) {
      addNotification('Failed to send message', 'error');
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[400px] border border-neutral-200 rounded-lg bg-white overflow-hidden mt-6">
      <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 flex items-center">
        <Bot className="w-4 h-4 mr-2 text-black" />
        <h3 className="text-sm font-medium text-black">AI Assistant</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-400">
            <p className="text-sm">Ask a question about this code review...</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
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
            <div className="bg-neutral-100 text-black border border-neutral-200 rounded-lg px-4 py-2 text-sm">
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
            placeholder="E.g., How do I fix the NullPointerException?"
            className="w-full border border-neutral-200 rounded-lg pl-3 pr-10 py-2 text-sm text-black focus:outline-none focus:border-black transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 text-neutral-400 hover:text-black transition-colors disabled:opacity-50 disabled:hover:text-neutral-400"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
