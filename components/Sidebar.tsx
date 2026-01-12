import React, { useState, useEffect } from 'react';
import { AppView } from '../types';
import {
  LayoutDashboard,
  PenTool,
  Image as ImageIcon,
  Search,
  MapPin,
  MessageSquare,
  Zap,
  Settings,
  CreditCard,
  Globe
} from 'lucide-react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useAuth
} from "@clerk/clerk-react";
import TopUpModal from './TopUpModal';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onOpenSettings: () => void;
}

const menuTranslations = {
  en: {
    [AppView.ARTICLE_GENERATOR]: 'SEO Writer',
    [AppView.RESEARCH]: 'SERP Research',
    [AppView.IMAGE_STUDIO]: 'Visual Studio',
    [AppView.LOCAL_SEO]: 'Local SEO',
    [AppView.QUICK_IDEAS]: 'Fast Ideas',
    [AppView.CHAT]: 'Assistant',
    credits: 'CREDITS',
    addCredits: 'Add Credits',
    settings: 'Settings',
    account: 'Account',
    signIn: 'Sign In'
  },
  cn: {
    [AppView.ARTICLE_GENERATOR]: 'SEO 文章撰写',
    [AppView.RESEARCH]: 'SERP 搜索调研',
    [AppView.IMAGE_STUDIO]: '视觉工作室',
    [AppView.LOCAL_SEO]: '本地 SEO',
    [AppView.QUICK_IDEAS]: '快速创意',
    [AppView.CHAT]: '智能助手',
    credits: '当前积分',
    addCredits: '立即充值',
    settings: '设置',
    account: '我的账户',
    signIn: '登录'
  }
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onOpenSettings }) => {
  const { getToken, isSignedIn } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [lang, setLang] = useState<'en' | 'cn'>('en');

  useEffect(() => {
    const fetchCredits = async () => {
      if (!isSignedIn) return;
      try {
        const token = await getToken();
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        if (!backendUrl) return;

        const res = await fetch(`${backendUrl}/api/user/credits`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCredits(data.credits);
        }
      } catch (e) {
        console.error("Failed to fetch credits", e);
      }
    };

    fetchCredits();
    const interval = setInterval(fetchCredits, 10000);
    return () => clearInterval(interval);
  }, [isSignedIn, getToken, currentView]);

  const t = menuTranslations[lang];

  const menuItems = [
    { id: AppView.ARTICLE_GENERATOR, icon: PenTool },
    { id: AppView.RESEARCH, icon: Search },
    { id: AppView.IMAGE_STUDIO, icon: ImageIcon },
    { id: AppView.LOCAL_SEO, icon: MapPin },
    { id: AppView.QUICK_IDEAS, icon: Zap },
    { id: AppView.CHAT, icon: MessageSquare },
  ];

  return (
    <>
      <div className="w-20 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <span className="text-white font-bold text-lg hidden md:block tracking-tight">RareVisual</span>
          </div>
          {/* Language Toggle */}
          <button
            onClick={() => setLang(l => l === 'en' ? 'cn' : 'en')}
            className="text-slate-500 hover:text-white transition-colors"
            title="Switch Language"
          >
            <Globe size={16} />
            <span className="sr-only">Switch Language</span>
          </button>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                <span className="hidden md:block font-medium">{t[item.id]}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-2">
          {/* Credits Display */}
          {isSignedIn && credits !== null && (
            <div className="flex flex-col gap-2 mb-2">
              <div className="flex items-center justify-center md:justify-between px-4 py-2 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="hidden md:block text-xs font-bold text-slate-300">{t.credits}</span>
                </div>
                <span className="hidden md:block text-sm font-mono text-white">{credits}</span>
              </div>
              <button
                onClick={() => setIsTopUpOpen(true)}
                className="hidden md:block w-full text-xs font-bold bg-green-600 hover:bg-green-500 text-white py-2 rounded transition-colors text-center"
              >
                {t.addCredits}
              </button>
            </div>
          )}

          {/* Auth Section */}
          <div className="flex justify-center md:justify-start px-3">
            <SignedIn>
              <div className="flex items-center gap-3">
                <UserButton afterSignOutUrl="/Rare-Visual-SEO-Agent20260118/">
                  <UserButton.MenuItems>
                    <UserButton.Action label={`${t.credits}: ${credits ?? '...'}`} labelIcon={<Zap size={14} className="text-yellow-500" />} onClick={() => { }} />
                    <UserButton.Action label={t.addCredits} labelIcon={<CreditCard size={14} />} onClick={() => setIsTopUpOpen(true)} />
                  </UserButton.MenuItems>
                </UserButton>
                <span className="hidden md:block text-sm font-medium text-slate-400">{t.account}</span>
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/Rare-Visual-SEO-Agent20260118/">
                <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" x2="3" y1="12" y2="12" /></svg>
                  </div>
                  <span className="hidden md:block font-medium">{t.signIn}</span>
                </button>
              </SignInButton>
            </SignedOut>
          </div>

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:bg-slate-800 hover:text-white group"
          >
            <Settings size={20} className="text-slate-400 group-hover:text-white" />
            <span className="hidden md:block font-medium">{t.settings}</span>
          </button>
        </div>
      </div>

      <TopUpModal isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} lang={lang} />
    </>
  );
};

export default Sidebar;