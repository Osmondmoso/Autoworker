/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface GeminiTopNavProps {
  agentName?: string;
  modelName?: string;
  onOpenMenu: () => void;
  onOpenModelSelector: () => void;
  onOpenTools: () => void;
  onOpenProfile: () => void;
  isRunning?: boolean;
}

export const GeminiTopNav: React.FC<GeminiTopNavProps> = ({
  agentName = 'Gemini',
  modelName = 'Autoworker Agent',
  onOpenMenu,
  onOpenModelSelector,
  onOpenTools,
  onOpenProfile,
  isRunning = false,
}) => {
  return (
    <nav 
      aria-label="Top Navigation" 
      className="w-full px-4 sm:px-5 pt-3.5 pb-2.5 flex items-center justify-between z-20 shrink-0 select-none bg-transparent"
      style={{ paddingTop: 'max(14px, env(safe-area-inset-top, 14px))' }}
    >
      {/* Left: Menu Drawer Toggle */}
      <button 
        onClick={onOpenMenu}
        aria-label="Open menu" 
        className="p-2 -ml-1 text-neutral-800 hover:opacity-70 active:scale-95 transition-all cursor-pointer rounded-full" 
        type="button"
      >
        <svg className="w-6 h-6 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M3.75 8.25h16.5M3.75 15.75h16.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      </button>

      {/* Center: Model Selector Dropdown */}
      <button 
        onClick={onOpenModelSelector}
        className="flex items-center gap-1.5 px-3 py-1.5 text-neutral-800 font-medium text-lg tracking-tight active:scale-95 transition-all cursor-pointer select-none" 
        type="button"
      >
        <span className="font-normal text-neutral-900 shrink-0">{agentName}</span>
        <span className="text-neutral-500 font-normal text-xs sm:text-base truncate max-w-[125px] sm:max-w-none whitespace-nowrap">
          {modelName}
        </span>
        {isRunning && (
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping ml-0.5" />
        )}
        <svg className="w-4 h-4 text-neutral-500 stroke-[2.2] ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      </button>

      {/* Right: Action Icons (Sparkle tool & User Avatar) */}
      <div className="flex items-center gap-3">
        {/* Magic Wand / Sparkle Action Button */}
        <button 
          onClick={onOpenTools}
          aria-label="Tools and browser activity" 
          className="p-1.5 text-neutral-800 hover:opacity-70 active:scale-95 transition-all cursor-pointer relative" 
          type="button"
        >
          <svg className="w-6 h-6 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          {isRunning && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600" />
          )}
        </button>

        {/* Profile Avatar */}
        <button 
          onClick={onOpenProfile}
          aria-label="Account profile" 
          className="w-8 h-8 rounded-full bg-[#684339] text-[#ffdcc9] flex items-center justify-center font-normal text-sm shadow-sm active:scale-95 transition-transform cursor-pointer" 
          type="button"
        >
          D
        </button>
      </div>
    </nav>
  );
};
