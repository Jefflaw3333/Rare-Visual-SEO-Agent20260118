import React, { useState, useRef } from 'react';
import { generateImage, editImage } from '../services/geminiService';
import { Image as ImageIcon, Wand2, Loader2, Upload, Download } from 'lucide-react';

const ImageStudio: React.FC = () => {
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState<'1K' | '2K' | '4K'>('1K');
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  // Edit mode specific
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setResultImage(null);
    try {
        if (mode === 'create') {
            // Check API key requirement for Pro Image
            if (window.aistudio && window.aistudio.openSelectKey) {
                 const hasKey = await window.aistudio.hasSelectedApiKey();
                 if (!hasKey) await window.aistudio.openSelectKey();
            }
            const res = await generateImage(prompt, resolution);
            if (res) setResultImage(res);
        } else {
             if (!uploadedImage) return;
             const res = await editImage(uploadedImage, prompt);
             if (res) setResultImage(res);
        }
    } catch (e) {
        console.error(e);
        alert("Operation failed. For 2K/4K generation, ensure you have a valid paid API key selected.");
    } finally {
        setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-6">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Visual Studio</h2>
        <p className="text-slate-400">Create high-fidelity assets or edit existing ones using natural language.</p>
      </header>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setMode('create')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${mode === 'create' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          Create New
        </button>
        <button
          onClick={() => setMode('edit')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${mode === 'edit' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          Edit Existing
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          {mode === 'edit' && (
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-900 aspect-video relative overflow-hidden"
            >
                {uploadedImage ? (
                    <img src={uploadedImage} alt="Upload" className="absolute inset-0 w-full h-full object-contain bg-black" />
                ) : (
                    <>
                        <Upload className="text-slate-500 mb-2" size={32} />
                        <span className="text-slate-400 text-sm">Click to upload source image</span>
                    </>
                )}
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
                {mode === 'create' ? 'Image Description' : 'Edit Instruction'}
            </label>
            <textarea
              className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder={mode === 'create' ? "A futuristic neon workspace..." : "Add a lens flare effect..."}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {mode === 'create' && (
            <div>
               <label className="block text-sm font-medium text-slate-300 mb-2">Resolution (Pro Model Only)</label>
               <div className="grid grid-cols-3 gap-2">
                  {(['1K', '2K', '4K'] as const).map(res => (
                      <button
                        key={res}
                        onClick={() => setResolution(res)}
                        className={`py-2 rounded-lg border ${resolution === res ? 'border-indigo-500 bg-indigo-900/20 text-indigo-300' : 'border-slate-700 bg-slate-800 text-slate-400'}`}
                      >
                          {res}
                      </button>
                  ))}
               </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt || (mode === 'edit' && !uploadedImage)}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Wand2 />}
            {mode === 'create' ? 'Generate' : 'Apply Edit'}
          </button>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center relative overflow-hidden">
            {loading ? (
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-indigo-500" size={48} />
                    <span className="text-slate-400 animate-pulse">
                        {mode === 'create' ? 'Rendering with Gemini Pro...' : 'Editing with Gemini Flash...'}
                    </span>
                </div>
            ) : resultImage ? (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                     <img src={resultImage} alt="Result" className="max-w-full max-h-full object-contain" />
                     <a 
                        href={resultImage} 
                        download={`gemini-generated-${Date.now()}.png`}
                        className="absolute bottom-6 right-6 p-3 bg-white text-black rounded-full shadow-lg hover:bg-gray-200 transition-colors"
                     >
                         <Download size={24} />
                     </a>
                </div>
            ) : (
                <div className="text-slate-600 flex flex-col items-center">
                    <ImageIcon size={64} className="mb-4 opacity-20" />
                    <span>Your creation will appear here</span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ImageStudio;