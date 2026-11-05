/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

export const GeminiStatusBar: React.FC = () => {
  const [timeStr, setTimeStr] = useState('10:33');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full pt-3 px-6 flex justify-between items-center text-xs tracking-tight text-neutral-700 select-none z-20 shrink-0">
      {/* Current Time */}
      <span className="font-medium text-[15px] pl-1 tracking-normal text-neutral-800">
        {timeStr}
      </span>

      {/* Network & Battery Icons */}
      <div className="flex items-center gap-1.5 text-neutral-800 scale-95 origin-right">
        {/* VoLTE Badge */}
        <span className="text-[9px] font-bold tracking-tighter border border-neutral-700 rounded px-[2px] leading-tight py-[0.5px]">
          VoLTE
        </span>

        {/* 4G and Network Signal */}
        <div className="flex items-baseline space-x-0.5 ml-0.5">
          <span className="text-[9px] font-bold">4G</span>
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M2 22h20L12 2z"></path>
          </svg>
        </div>

        {/* Battery Icon */}
        <div className="relative w-2.5 h-4 border-[1.5px] border-neutral-800 rounded-[2px] p-[0.5px] flex flex-col justify-end ml-1">
          <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-1 h-[1.5px] bg-neutral-800 rounded-t-xs"></div>
          <div className="w-full h-[70%] bg-neutral-800 rounded-[0.5px]"></div>
        </div>
      </div>
    </header>
  );
};
