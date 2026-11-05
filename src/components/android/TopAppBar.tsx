/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bot, Globe, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import type { TaskStatus } from '../../types';

interface TopAppBarProps {
  status: TaskStatus;
  steelConnected: boolean;
  onRefresh?: () => void;
  onOpenSettings?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  status,
  steelConnected,
  onRefresh,
  onOpenSettings,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'running':
      case 'planning':
        return {
          label: 'Running',
          dotClass: 'bg-cyan-400 animate-pulse',
          badgeClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
        };
      case 'paused':
      case 'waiting_approval':
        return {
          label: 'Paused',
          dotClass: 'bg-amber-400',
          badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        };
      case 'failed':
        return {
          label: 'Error',
          dotClass: 'bg-rose-400',
          badgeClass: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
        };
      default:
        return {
          label: steelConnected ? 'Ready' : 'Offline',
          dotClass: steelConnected ? 'bg-emerald-400' : 'bg-slate-400',
          badgeClass: steelConnected 
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
            : 'bg-slate-800 text-slate-400 border-slate-700',
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* App Title & Branding */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-cyan-500/20">
            <Bot className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight leading-none flex items-center gap-1.5">
              SteelAgent
            </h1>
            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
              Autonomous Browser Agent
            </p>
          </div>
        </div>

        {/* Right Status Indicator */}
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              aria-label="Refresh status"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 active:bg-slate-800 transition cursor-pointer"
              title="Refresh status"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${statusBadge.badgeClass}`}
            title="Click to check connection settings"
          >
            <span className={`w-2 h-2 rounded-full ${statusBadge.dotClass}`} />
            <span>{statusBadge.label}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
