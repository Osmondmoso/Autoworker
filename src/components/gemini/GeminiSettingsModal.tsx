/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface GeminiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  steelConnected: boolean;
  maskedKey: string;
  maskedNvidiaKey: string;
  maxSteps: number;
  autoRelease: boolean;
  onUpdateSteelKey: (key: string) => Promise<boolean>;
  onUpdateNvidiaKey: (key: string) => Promise<boolean>;
  onUpdateMaxSteps: (steps: number) => void;
  onToggleAutoRelease: (auto: boolean) => void;
}

export const GeminiSettingsModal: React.FC<GeminiSettingsModalProps> = ({
  isOpen,
  onClose,
  steelConnected,
  maskedKey,
  maskedNvidiaKey,
  maxSteps,
  autoRelease,
  onUpdateSteelKey,
  onUpdateNvidiaKey,
  onUpdateMaxSteps,
  onToggleAutoRelease,
}) => {
  const [steelInput, setSteelInput] = useState('');
  const [nvidiaInput, setNvidiaInput] = useState('');
  const [steelSaved, setSteelSaved] = useState(false);
  const [nvidiaSaved, setNvidiaSaved] = useState(false);

  if (!isOpen) return null;

  const handleSaveSteel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!steelInput.trim()) return;
    const ok = await onUpdateSteelKey(steelInput.trim());
    if (ok) {
      setSteelSaved(true);
      setSteelInput('');
      setTimeout(() => setSteelSaved(false), 2000);
    }
  };

  const handleSaveNvidia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nvidiaInput.trim()) return;
    const ok = await onUpdateNvidiaKey(nvidiaInput.trim());
    if (ok) {
      setNvidiaSaved(true);
      setNvidiaInput('');
      setTimeout(() => setNvidiaSaved(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-xs" />

      <div className="relative w-full max-w-[430px] bg-white rounded-t-[32px] sm:rounded-[32px] p-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-250 select-none">
        <div className="w-12 h-1 bg-neutral-200 rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#684339] text-[#ffdcc9] flex items-center justify-center font-normal text-sm shadow-xs">
              D
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 tracking-tight leading-none">
                Agent Configuration
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Steel Cloud & NVIDIA Credentials
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="py-3 space-y-4 text-xs">
          {/* Steel.dev Key */}
          <form onSubmit={handleSaveSteel} className="space-y-1.5">
            <div className="flex justify-between items-center text-[11.5px]">
              <span className="font-semibold text-neutral-800">Steel.dev API Key</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                steelConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'
              }`}>
                {steelConnected ? 'CONNECTED' : 'STANDBY'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 font-mono">
              Current: {maskedKey || 'ste-...'}
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={steelInput}
                onChange={(e) => setSteelInput(e.target.value)}
                placeholder="Update Steel API key"
                className="flex-1 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!steelInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-white font-medium cursor-pointer"
              >
                {steelSaved ? 'Saved!' : 'Save'}
              </button>
            </div>
          </form>

          {/* NVIDIA NIM Key */}
          <form onSubmit={handleSaveNvidia} className="space-y-1.5 pt-2 border-t border-neutral-100">
            <div className="flex justify-between items-center text-[11.5px]">
              <span className="font-semibold text-neutral-800">NVIDIA NIM Agent API Key</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 font-mono">
              Current: {maskedNvidiaKey || 'nvapi-AY5oFb...'}
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={nvidiaInput}
                onChange={(e) => setNvidiaInput(e.target.value)}
                placeholder="Update NVIDIA NIM key"
                className="flex-1 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!nvidiaInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-white font-medium cursor-pointer"
              >
                {nvidiaSaved ? 'Saved!' : 'Save'}
              </button>
            </div>
          </form>

          {/* Max Steps Slider */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-100">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-neutral-800">Max Steps Per Task</span>
              <span className="font-bold text-blue-600">{maxSteps} steps</span>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[5, 10, 15, 20].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onUpdateMaxSteps(n)}
                  className={`py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    maxSteps === n
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Auto Release Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
            <div>
              <span className="font-semibold text-neutral-800 block">Auto-Release Sessions</span>
              <p className="text-[11px] text-neutral-500">Release cloud browser sandbox upon completion</p>
            </div>
            <button
              type="button"
              onClick={() => onToggleAutoRelease(!autoRelease)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                autoRelease ? 'bg-blue-600' : 'bg-neutral-300'
              }`}
            >
              <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                autoRelease ? 'right-0.5' : 'left-0.5'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
