/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface GeminiSystemNavBarProps {
  onBack?: () => void;
  onHome?: () => void;
  onRecents?: () => void;
}

export const GeminiSystemNavBar: React.FC<GeminiSystemNavBarProps> = ({
  onBack,
  onHome,
  onRecents,
}) => {
  return (
    <footer 
      aria-label="System Navigation" 
      className="w-full pb-3 pt-1 px-10 flex items-center justify-between text-neutral-600 select-none z-20 shrink-0"
    >
      {/* Back (Triangle/Chevron) Button */}
      <button 
        onClick={onBack}
        aria-label="Back" 
        className="p-2 opacity-75 hover:opacity-100 active:scale-90 transition-transform cursor-pointer" 
        type="button"
        title="Back"
      >
        <svg className="w-4 h-4 fill-current text-neutral-600 -rotate-90" viewBox="0 0 24 24">
          <path d="M12 4L3 18h18L12 4z"></path>
        </svg>
      </button>

      {/* Home (Circle) Button */}
      <button 
        onClick={onHome}
        aria-label="Home" 
        className="p-2 opacity-75 hover:opacity-100 active:scale-90 transition-transform cursor-pointer" 
        type="button"
        title="Scroll to Top / Home"
      >
        <div className="w-4 h-4 rounded-full bg-neutral-600"></div>
      </button>

      {/* Overview / Recents (Square) Button */}
      <button 
        onClick={onRecents}
        aria-label="Recent apps" 
        className="p-2 opacity-75 hover:opacity-100 active:scale-90 transition-transform cursor-pointer" 
        type="button"
        title="Past Tasks & History"
      >
        <div className="w-3.5 h-3.5 rounded-[2px] bg-neutral-600"></div>
      </button>
    </footer>
  );
};
