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
  CreditCard
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

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onOpenSettings }) => {
  const { getToken, isSignedIn } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

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
    // Refresh every 10s or on view change roughly
    const interval = setInterval(fetchCredits, 10000);
    return () => clearInterval(interval);
  }, [isSignedIn, getToken, currentView]);

  const menuItems = [
    { id: AppView.ARTICLE_GENERATOR, label: 'SEO Writer', icon: PenTool },
    { id: AppView.RESEARCH, label: 'SERP Research', icon: Search },
    { id: AppView.IMAGE_STUDIO, label: 'Visual Studio', icon: ImageIcon },
    { id: AppView.LOCAL_SEO, label: 'Local SEO', icon: MapPin },
    { id: AppView.QUICK_IDEAS, label: 'Fast Ideas', icon: Zap },
    { id: AppView.CHAT, label: 'Assistant', icon: MessageSquare },
  ];

  return (
    <>
      <div className="w-20 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
        <div className="p-6 flex items-center justify-center md:justify-start gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xl">R</span>
          </div>
          <span className="text-white font-bold text-lg hidden md:block tracking-tight">RareVisual</span>
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
                <span className="hidden md:block font-medium">{item.label}</span>
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
                  <span className="hidden md:block text-xs font-bold text-slate-300">CREDITS</span>
                </div>
                <span className="hidden md:block text-sm font-mono text-white">{credits}</span>
              </div>
              <button
                onClick={() => setIsTopUpOpen(true)}
                className="hidden md:block w-full text-xs font-bold bg-green-600 hover:bg-green-500 text-white py-1 rounded transition-colors text-center"
              >
                TOP UP
              </button>
            </div>
          )}

          {/* Auth Section */}
          <div className="flex justify-center md:justify-start px-3">
            <SignedIn>
              <div className="flex items-center gap-3">
                <UserButton afterSignOutUrl="/Rare-Visual-SEO-Agent20260118/">
                  <UserButton.MenuItems>
                    <UserButton.Action label={`Credits: ${credits ?? '...'}`} labelIcon={<Zap size={14} className="text-yellow-500" />} onClick={() => { }} />
                    <UserButton.Action label="Buy More (Promo)" labelIcon={<CreditCard size={14} />} onClick={() => setIsTopUpOpen(true)} />
                  </UserButton.MenuItems>
                </UserButton>
                <span className="hidden md:block text-sm font-medium text-slate-400">Account</span>
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/Rare-Visual-SEO-Agent20260118/">
                <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" x2="3" y1="12" y2="12" /></svg>
                  </div>
                  <span className="hidden md:block font-medium">Sign In</span>
                </button>
              </SignInButton>
            </SignedOut>
          </div>

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:bg-slate-800 hover:text-white group"
          >
            <Settings size={20} className="text-slate-400 group-hover:text-white" />
            <span className="hidden md:block font-medium">Settings</span>
          </button>
        </div>
      </div>

      <TopUpModal isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} />
    </>
  );
};

export default Sidebar;