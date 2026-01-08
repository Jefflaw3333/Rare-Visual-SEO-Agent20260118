import React, { useState } from 'react';
import { generateQuickIdeas } from '../services/geminiService';
import { Zap, Loader2, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const QuickIdeas: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [ideas, setIdeas] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const res = await generateQuickIdeas(topic);
      setIdeas(res || "No ideas generated.");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center p-6">
      <div className="w-full max-w-2xl text-center mb-8">
        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap size={32} className="text-yellow-500" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Lightning Fast Ideas</h2>
        <p className="text-slate-400">Powered by Gemini 2.5 Flash Lite for instant brainstorming.</p>
      </div>

      <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-800 p-2 shadow-2xl flex gap-2">
        <input 
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a broad topic (e.g. 'Coffee')"
          className="flex-1 bg-transparent px-4 text-white outline-none placeholder-slate-600"
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
        />
        <button 
          onClick={handleGenerate}
          disabled={loading || !topic}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
        >
            {loading ? <Loader2 className="animate-spin" /> : 'Spark'}
        </button>
      </div>

      {ideas && (
        <div className="w-full max-w-2xl mt-8 bg-slate-900/50 rounded-2xl p-8 border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="prose prose-invert max-w-none">
               <ReactMarkdown>{ideas}</ReactMarkdown>
           </div>
        </div>
      )}
    </div>
  );
};

export default QuickIdeas;