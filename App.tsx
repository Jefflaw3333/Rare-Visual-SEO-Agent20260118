import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ArticleGenerator from './components/ArticleGenerator';
import ImageStudio from './components/ImageStudio';
import ResearchTool from './components/ResearchTool';
import LocalSeoTool from './components/LocalSeoTool';
import ChatAssistant from './components/ChatAssistant';
import QuickIdeas from './components/QuickIdeas';
import SettingsModal from './components/SettingsModal';
import { AppView } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.ARTICLE_GENERATOR);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
      <main className="flex-1 relative h-full overflow-hidden">
        {renderView()}
      </main>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default App;