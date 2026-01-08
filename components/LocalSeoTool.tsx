import React, { useState, useEffect } from 'react';
import { localSeoQuery } from '../services/geminiService';
import { MapResult } from '../types';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const LocalSeoTool: React.FC = () => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MapResult | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Location access denied", err)
      );
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await localSeoQuery(query, location?.lat, location?.lng);
      setResult({
        text: res.text || "",
        groundingChunks: res.candidates?.[0]?.groundingMetadata?.groundingChunks
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Local SEO Explorer</h2>
        <p className="text-slate-400">Find real-world entities and local competitors using Gemini Maps Grounding.</p>
        {!location && <p className="text-xs text-yellow-500 mt-2">Location permission needed for best results.</p>}
      </div>

      <form onSubmit={handleSearch} className="mb-8 flex gap-2">
        <div className="relative flex-1">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. 'Best Italian restaurants nearby' or 'SEO agencies in New York'"
            />
        </div>
        <button 
            disabled={loading}
            className="px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
        >
            {loading ? <Loader2 className="animate-spin" /> : 'Search Maps'}
        </button>
      </form>

      {result && (
         <div className="flex-1 overflow-y-auto">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 prose prose-invert">
                     <ReactMarkdown>{result.text}</ReactMarkdown>
                 </div>
                 
                 <div className="space-y-4">
                     {result.groundingChunks?.map((chunk, i) => {
                         if (chunk.maps) {
                             return (
                                 <div key={i} className="bg-slate-800 rounded-xl p-4 flex flex-col gap-2 hover:bg-slate-700/80 transition-colors">
                                     <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-white">{chunk.maps.title}</h4>
                                        <a href={chunk.maps.uri} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300">
                                            <Navigation size={16} />
                                        </a>
                                     </div>
                                     <p className="text-xs text-slate-400 truncate">{chunk.maps.uri}</p>
                                 </div>
                             )
                         }
                         return null;
                     })}
                 </div>
             </div>
         </div>
      )}
    </div>
  );
};

export default LocalSeoTool;