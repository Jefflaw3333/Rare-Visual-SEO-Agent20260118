import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ChatAssistant: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{role: 'user' | 'model', text: string}>>([
    { role: 'model', text: "Hello! I'm your Gemini-powered SEO assistant. Ask me anything about content strategy, keyword research, or technical SEO." }
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      // Convert internal message format to API history format
      const history = messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
      }));
      
      const response = await sendChatMessage(history, userMsg);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto border-x border-slate-800 bg-slate-900/50">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
              {msg.role === 'user' ? <User size={20} text-white /> : <Bot size={20} text-white />}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-100' : 'bg-slate-800 border border-slate-700 text-slate-200'}`}>
               <div className="prose prose-invert prose-sm max-w-none">
                 <ReactMarkdown>{msg.text}</ReactMarkdown>
               </div>
            </div>
          </div>
        ))}
        {loading && (
             <div className="flex gap-4">
                 <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                     <Bot size={20} className="text-white" />
                 </div>
                 <div className="bg-slate-800 rounded-2xl p-4 flex items-center">
                     <Loader2 className="animate-spin text-slate-400" size={20} />
                 </div>
             </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <form onSubmit={handleSend} className="relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <button 
            type="submit" 
            disabled={!input || loading}
            className="absolute right-2 top-2 p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatAssistant;