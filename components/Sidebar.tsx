import React from 'react';
import { AppView } from '../types';
import {
  LayoutDashboard,
  PenTool,
  Image as ImageIcon,
  Search,
  MapPin,
  MessageSquare,
  Zap,
  Settings
} from 'lucide-react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton
} from "@clerk/clerk-react";

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onOpenSettings }) => {
  const menuItems = [
    { id: AppView.ARTICLE_GENERATOR, label: 'SEO Writer', icon: PenTool },
    { id: AppView.RESEARCH, label: 'SERP Research', icon: Search },
    { id: AppView.IMAGE_STUDIO, label: 'Visual Studio', icon: ImageIcon },
    { id: AppView.LOCAL_SEO, label: 'Local SEO', icon: MapPin },
    { id: AppView.QUICK_IDEAS, label: 'Fast Ideas', icon: Zap },
    { id: AppView.CHAT, label: 'Assistant', icon: MessageSquare },
  ];

  return (
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
        {/* Auth Section */}
        <div className="flex justify-center md:justify-start px-3">
          <SignedIn>
            <div className="flex items-center gap-3">
              <UserButton afterSignOutUrl="/" />
              <span className="hidden md:block text-sm font-medium text-slate-400">Account</span>
            </div>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
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
    </div >
  );
};

export default Sidebar;