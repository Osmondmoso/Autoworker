/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Conversation, ActiveTask } from '../../types';

interface GeminiMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (conv: Conversation) => void;
  onNewConversation: () => void;
  recentTasks: ActiveTask[];
  onSelectTask: (task: ActiveTask) => void;
  onOpenSettings: () => void;
  onOpenTools: () => void;
  steelConnected: boolean;
  onSelectPreset: (goal: string, url?: string) => void;
}

export const GeminiMenuDrawer: React.FC<GeminiMenuDrawerProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  recentTasks,
  onSelectTask,
  onOpenSettings,
  onOpenTools,
  steelConnected,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs" 
      />

      {/* Drawer Container (Slide in from left) */}
      <div className="relative w-[310px] max-w-[85vw] h-full bg-white flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-250 select-none">
        {/* Top Header */}
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 via-teal-400 to-amber-400 p-[1.5px]">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[15px] text-blue-600">auto_awesome</span>
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 tracking-tight leading-none">
                Gemini
              </h2>
              <span className="text-[11px] text-neutral-500 font-normal">
                Autoworker Agent
              </span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-600 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {/* New Conversation Button */}
          <button
            onClick={() => {
              onNewConversation();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 py-2.5 px-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs shadow-xs active:scale-98 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>New conversation</span>
          </button>

          {/* Quick Browser Automation Presets */}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 px-1 mb-1.5 block">
              Quick Tasks
            </span>
            <div className="space-y-1">
              {[
                { title: 'Test Duck.ai', goal: 'Open Duck.ai and test it. Ask a question and verify AI response.', url: 'https://duck.ai' },
                { title: 'Hacker News Intel', goal: 'Go to news.ycombinator.com and extract top 3 stories.', url: 'https://news.ycombinator.com' },
                { title: 'GitHub Trending', goal: 'Go to github.com/trending, look at top 3 repositories today.', url: 'https://github.com/trending' },
                { title: 'Tokyo Weather', goal: 'Check the 3-day weather forecast for Tokyo on wttr.in.', url: 'https://wttr.in/Tokyo' },
              ].map((p) => (
                <button
                  key={p.title}
                  onClick={() => {
                    onSelectPreset(p.goal, p.url);
                    onClose();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-blue-50/70 text-neutral-700 hover:text-blue-900 flex items-center justify-between group transition cursor-pointer"
                >
                  <span className="font-medium text-xs">{p.title}</span>
                  <span className="material-symbols-outlined text-[15px] text-neutral-400 group-hover:text-blue-600">arrow_forward</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Conversations */}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 px-1 mb-1.5 block">
              Recent Chats
            </span>
            {conversations.length === 0 ? (
              <p className="text-[11px] text-neutral-400 px-1">No chats yet.</p>
            ) : (
              <div className="space-y-0.5">
                {conversations.slice(0, 6).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectConversation(c);
                      onClose();
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2 truncate transition cursor-pointer ${
                      c.id === activeConversationId
                        ? 'bg-neutral-100 font-semibold text-neutral-900'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px] text-neutral-400 shrink-0">chat_bubble</span>
                    <span className="truncate">{c.title || 'Conversation'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent Tasks */}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 px-1 mb-1.5 block">
              Task History ({recentTasks.length})
            </span>
            {recentTasks.length === 0 ? (
              <p className="text-[11px] text-neutral-400 px-1">No tasks executed yet.</p>
            ) : (
              <div className="space-y-1">
                {recentTasks.slice(0, 4).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      onSelectTask(t);
                      onClose();
                    }}
                    className="p-2 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50/70 text-left transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-0.5">
                      <span className="font-semibold uppercase text-blue-700">{t.status}</span>
                      <span>{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[11.5px] font-medium text-neutral-800 line-clamp-1">{t.goal}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Area with Steel Status and Settings */}
        <div className="p-3 border-t border-neutral-100 bg-neutral-50/70 space-y-2">
          {/* Steel Connection Indicator */}
          <div className="flex items-center justify-between px-2 py-1 text-xs text-neutral-600">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${steelConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>Steel Cloud Sandbox</span>
            </span>
            <span className="text-[10px] font-mono text-neutral-500">
              {steelConnected ? 'Live' : 'Standby'}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                onOpenTools();
                onClose();
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 font-medium text-xs flex items-center justify-center gap-1.5 shadow-2xs hover:bg-neutral-50 active:scale-95 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-blue-600">visibility</span>
              <span>Browser View</span>
            </button>
            <button
              onClick={() => {
                onOpenSettings();
                onClose();
              }}
              className="p-2 rounded-xl bg-white border border-neutral-200 text-neutral-800 hover:bg-neutral-50 active:scale-95 transition cursor-pointer"
              title="Settings & API Keys"
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
