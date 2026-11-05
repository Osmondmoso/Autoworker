/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Key, 
  Moon, 
  Sun, 
  ShieldCheck, 
  Sliders, 
  Database, 
  HelpCircle, 
  Check, 
  Cpu, 
  Zap,
  Info,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface SettingsTabProps {
  steelConnected: boolean;
  maskedKey: string;
  maskedNvidiaKey: string;
  maxSteps: number;
  autoRelease: boolean;
  theme: 'dark' | 'light';
  onUpdateSteelKey: (key: string) => Promise<boolean>;
  onUpdateNvidiaKey: (key: string) => Promise<boolean>;
  onUpdateMaxSteps: (steps: number) => void;
  onToggleAutoRelease: (auto: boolean) => void;
  onToggleTheme: (theme: 'dark' | 'light') => void;
  onClearTasks: () => void;
  onResetConversation: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  steelConnected,
  maskedKey,
  maskedNvidiaKey,
  maxSteps,
  autoRelease,
  theme,
  onUpdateSteelKey,
  onUpdateNvidiaKey,
  onUpdateMaxSteps,
  onToggleAutoRelease,
  onToggleTheme,
  onClearTasks,
  onResetConversation,
}) => {
  const [steelKeyInput, setSteelKeyInput] = useState('');
  const [nvidiaKeyInput, setNvidiaKeyInput] = useState('');
  const [steelSaved, setSteelSaved] = useState(false);
  const [nvidiaSaved, setNvidiaSaved] = useState(false);

  const handleSaveSteel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!steelKeyInput.trim()) return;
    const ok = await onUpdateSteelKey(steelKeyInput.trim());
    if (ok) {
      setSteelSaved(true);
      setSteelKeyInput('');
      setTimeout(() => setSteelSaved(false), 2000);
    }
  };

  const handleSaveNvidia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nvidiaKeyInput.trim()) return;
    const ok = await onUpdateNvidiaKey(nvidiaKeyInput.trim());
    if (ok) {
      setNvidiaSaved(true);
      setNvidiaKeyInput('');
      setTimeout(() => setNvidiaSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-4 pb-24 px-4 pt-2 max-w-md mx-auto text-xs">
      {/* 1. APPEARANCE (Dark / Light Theme Toggle) */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3">
        <div className="flex items-center gap-2">
          {theme === 'dark' ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
          <h3 className="text-sm font-bold text-slate-100">Appearance</h3>
        </div>
        <p className="text-slate-400">Choose between neutral dark or clean light visual style.</p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => onToggleTheme('dark')}
            className={`min-h-[44px] rounded-xl flex items-center justify-center gap-2 border font-semibold transition cursor-pointer active:scale-95 ${
              theme === 'dark'
                ? 'bg-cyan-600 text-white border-cyan-500'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Dark Theme</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleTheme('light')}
            className={`min-h-[44px] rounded-xl flex items-center justify-center gap-2 border font-semibold transition cursor-pointer active:scale-95 ${
              theme === 'light'
                ? 'bg-cyan-600 text-white border-cyan-500'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Light Theme</span>
          </button>
        </div>
      </div>

      {/* 2. AGENT CONNECTIONS (Steel & NVIDIA NIM) */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">API Credentials</h3>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            steelConnected 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            {steelConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>

        {/* Steel API Key */}
        <form onSubmit={handleSaveSteel} className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px]">
            <span className="font-semibold text-slate-300">Steel.dev API Key</span>
            <span className="font-mono text-slate-500">{maskedKey || 'Not set'}</span>
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="ste-..."
              value={steelKeyInput}
              onChange={(e) => setSteelKeyInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <button
              type="submit"
              disabled={!steelKeyInput.trim()}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-semibold text-xs border border-slate-700 cursor-pointer active:scale-95 transition"
            >
              {steelSaved ? <Check className="w-4 h-4 text-emerald-400" /> : 'Update'}
            </button>
          </div>
        </form>

        {/* NVIDIA NIM Key */}
        <form onSubmit={handleSaveNvidia} className="space-y-1.5 pt-2 border-t border-slate-800/80">
          <div className="flex justify-between text-[11px]">
            <span className="font-semibold text-slate-300">NVIDIA NIM Agent API Key</span>
            <span className="font-mono text-slate-500">{maskedNvidiaKey || 'Active'}</span>
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="nvapi-..."
              value={nvidiaKeyInput}
              onChange={(e) => setNvidiaKeyInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <button
              type="submit"
              disabled={!nvidiaKeyInput.trim()}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-semibold text-xs border border-slate-700 cursor-pointer active:scale-95 transition"
            >
              {nvidiaSaved ? <Check className="w-4 h-4 text-emerald-400" /> : 'Update'}
            </button>
          </div>
        </form>
      </div>

      {/* 3. EXECUTION SETTINGS */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100">Execution Parameters</h3>
        </div>

        {/* Step Limit Selector */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="font-semibold text-slate-300">Max Steps Per Task</span>
            <span className="font-bold text-cyan-400">{maxSteps} steps</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[5, 10, 15, 20].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => onUpdateMaxSteps(num)}
                className={`min-h-[38px] rounded-xl font-bold transition cursor-pointer active:scale-95 ${
                  maxSteps === num
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Auto Release Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <div>
            <span className="font-semibold text-slate-200 block">Auto-Release Sessions</span>
            <p className="text-[11px] text-slate-400">Release browser sandbox immediately upon completion</p>
          </div>
          <button
            type="button"
            onClick={() => onToggleAutoRelease(!autoRelease)}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              autoRelease ? 'bg-cyan-600' : 'bg-slate-800'
            }`}
          >
            <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
              autoRelease ? 'right-0.5' : 'left-0.5'
            }`} />
          </button>
        </div>
      </div>

      {/* 4. ERROR & RECOVERY GUIDE (Section 8) */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100">Error Handling & Recovery</h3>
        </div>
        <p className="text-slate-400 leading-relaxed">
          SteelAgent features guardrails to keep execution safe and transparent:
        </p>

        <div className="space-y-1.5 text-[11px] text-slate-300">
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
            <span className="font-bold text-slate-200 block">CAPTCHA Encountered:</span>
            <span>Tap "Expand" in the browser panel to view or intervene directly in the cloud session.</span>
          </div>
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
            <span className="font-bold text-slate-200 block">Multi-Step Logins:</span>
            <span>Agent enters email first, verifies next screen, then safely inputs password.</span>
          </div>
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
            <span className="font-bold text-slate-200 block">Consequential Actions:</span>
            <span>Payments or external submissions trigger an explicit approval request.</span>
          </div>
        </div>
      </div>

      {/* 5. DATA RESET */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100">Data Management</h3>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onResetConversation}
            className="min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition cursor-pointer active:scale-95"
          >
            Fresh Chat
          </button>
          <button
            type="button"
            onClick={onClearTasks}
            className="min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition cursor-pointer active:scale-95"
          >
            Reset History
          </button>
        </div>
      </div>
    </div>
  );
};
