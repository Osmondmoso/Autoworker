/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, MessageSquare, ListTodo, Settings, Sparkles } from 'lucide-react';

export type NavTab = 'home' | 'chat' | 'tasks' | 'settings';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isRunning?: boolean;
  hasUnreadMessage?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  isRunning = false,
  hasUnreadMessage = false,
}) => {
  const tabs: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'chat', label: 'Agent Chat', icon: MessageSquare },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav 
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5 pb-safe transition-colors"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center min-w-[64px] min-h-[48px] px-3 py-1.5 rounded-2xl transition-all select-none cursor-pointer ${
                isActive 
                  ? 'text-cyan-400 font-semibold' 
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
            >
              {/* Active Pill Indicator for Android Material 3 feel */}
              {isActive && (
                <span className="absolute inset-x-2 inset-y-1 bg-cyan-500/15 rounded-xl -z-10 animate-in fade-in zoom-in-95 duration-150" />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                
                {/* Running Agent Indicator Badge on Home or Chat */}
                {isRunning && (tab.id === 'home' || tab.id === 'chat') && (
                  <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                  </span>
                )}

                {/* Unread badge on chat */}
                {hasUnreadMessage && tab.id === 'chat' && !isRunning && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400" />
                )}
              </div>

              <span className={`text-[11px] mt-0.5 tracking-tight ${isActive ? 'text-cyan-400 font-medium' : 'text-slate-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
