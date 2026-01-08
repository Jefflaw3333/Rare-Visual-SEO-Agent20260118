import React, { useState } from 'react';
import { performResearch } from '../services/geminiService';
import { ResearchResult } from '../types';
import { Search, Loader2, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ResearchTool: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setResult(null);
    try {
      const res = await performResearch(query);
      setResult({
          text: res.text || "No result found.",
          groundingChunks: res.candidates?.[0]?.groundingMetadata?.groundingChunks
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">SERP Intelligence</h2>
        <p className="text-slate-400">Deep dive into topics using Google Search Grounding.</p>
      </div>

      <form onSubmit={handleResearch} className="relative mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Research a topic, e.g., 'Latest trends in sustainable fashion 2025'..."
          className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 pl-6 pr-14 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none shadow-xl"
        />
        <button
          type="submit"
          disabled={loading || !query}
          className="absolute right-3 top-3 p-2 bg-indigo-600 rounded-xl text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
        </button>
      </form>

      {result && (
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
             <div className="prose prose-invert max-w-none">
                 <ReactMarkdown>{result.text}</ReactMarkdown>
             </div>
          </div>

          {result.groundingChunks && result.groundingChunks.length > 0 && (
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4">Sources & Citations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.groundingChunks.map((chunk, i) => {
                      if (chunk.web) {
                          return (
                              <a 
                                key={i} 
                                href={chunk.web.uri} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors group"
                              >
                                  <div className="p-2 bg-slate-900 rounded-full group-hover:bg-indigo-500/20 transition-colors">
                                      <ExternalLink size={14} className="text-slate-400 group-hover:text-indigo-400"/>
                                  </div>
                                  <div className="overflow-hidden">
                                      <div className="text-sm font-medium text-white truncate">{chunk.web.title}</div>
                                      <div className="text-xs text-slate-500 truncate">{chunk.web.uri}</div>
                                  </div>
                              </a>
                          );
                      }
                      return null;
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResearchTool;