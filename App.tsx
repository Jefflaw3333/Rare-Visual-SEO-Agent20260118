import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ArticleGenerator from './components/ArticleGenerator';
import ImageStudio from './components/ImageStudio';
import ResearchTool from './components/ResearchTool';
import LocalSeoTool from './components/LocalSeoTool';
import ChatAssistant from './components/ChatAssistant';
import QuickIdeas from './components/QuickIdeas';
import SettingsModal from './components/SettingsModal';
import { AppView } from './types';
import { AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.ARTICLE_GENERATOR);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);

  useEffect(() => {
    const checkKey = () => {
      const envKey = import.meta.env.VITE_API_KEY;
      const localKey = localStorage.getItem('gemini_api_key');
      const hasKey = !!(envKey || localKey);
      setHasApiKey(hasKey);

      if (!hasKey) {
        // Auto-open settings if no key is found
        const hasOpened = sessionStorage.getItem('settings_auto_opened');
        if (!hasOpened) {
          setIsSettingsOpen(true);
          sessionStorage.setItem('settings_auto_opened', 'true');
        }
      }
    };

    checkKey();
    // Re-check when settings modal closes (in case user saved a key)
    if (!isSettingsOpen) {
      checkKey();
    }
  }, [isSettingsOpen]);

  const renderView = () => {
    switch (currentView) {
      case AppView.ARTICLE_GENERATOR:
        return <ArticleGenerator />;
      case AppView.IMAGE_STUDIO:
        return <ImageStudio />;
      case AppView.RESEARCH:
        return <ResearchTool />;
      case AppView.LOCAL_SEO:
        return <LocalSeoTool />;
      case AppView.CHAT:
        return <ChatAssistant />;
      case AppView.QUICK_IDEAS:
        return <QuickIdeas />;
      default:
        return <ArticleGenerator />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <main className="flex-1 relative h-full overflow-hidden flex flex-col">
        {!hasApiKey && (
          <div
            className="bg-amber-500/10 border-b border-amber-500/20 py-2 px-4 flex items-center justify-between cursor-pointer hover:bg-amber-500/20 transition-colors"
            onClick={() => setIsSettingsOpen(true)}
          >
            <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
              <AlertTriangle size={16} />
              <span>API Key Missing: The app functionality is disabled. Click here to configure.</span>
            </div>
            <button className="bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
              Configure Key
            </button>
          </div>
        )}
        <div className="flex-1 overflow-hidden relative">
          {renderView()}
        </div>
      </main>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default App;