/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface GeminiModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModel: string;
  onSelectModel: (model: string) => void;
  maskedNvidiaKey: string;
}

export const GeminiModelSelectorModal: React.FC<GeminiModelSelectorModalProps> = ({
  isOpen,
  onClose,
  currentModel,
  onSelectModel,
  maskedNvidiaKey,
}) => {
  if (!isOpen) return null;

  const models = [
    {
      id: 'nemotron-3-ultra',
      name: 'NVIDIA Nemotron-3 Ultra 550B',
      subtitle: 'Primary Agent Reasoning (Active NIM)',
      badge: 'ACTIVE NIM',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: 'psychology',
      iconColor: 'text-emerald-600',
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      subtitle: 'Google DeepMind High-Speed Multimodal',
      badge: 'FALLBACK',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: 'bolt',
      iconColor: 'text-blue-600',
    },
    {
      id: 'steel-chromium',
      name: 'Steel.dev Cloud Browser',
      subtitle: 'Headless / Interactive Chromium Automation',
      badge: 'LIVE ENGINE',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: 'language',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-xs" />

      <div className="relative w-full max-w-[430px] bg-white rounded-t-[32px] sm:rounded-[32px] p-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-250 select-none">
        {/* Handle bar on mobile */}
        <div className="w-12 h-1 bg-neutral-200 rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h3 className="text-base font-bold text-neutral-900 tracking-tight">
              Agent & Reasoning Engine
            </h3>
            <p className="text-xs text-neutral-500">
              Select model configuration for autonomous browser decisions
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="py-3 space-y-2">
          {models.map((m) => {
            const isSelected = currentModel === m.id || (m.id === 'nemotron-3-ultra' && !currentModel);

            return (
              <div
                key={m.id}
                onClick={() => {
                  onSelectModel(m.id);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/30' 
                    : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shadow-2xs ${m.iconColor}`}>
                    <span className="material-symbols-outlined text-[20px]">{m.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-900 truncate">
                        {m.name}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-neutral-500 truncate mt-0.5">
                      {m.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${m.badgeColor}`}>
                    {m.badge}
                  </span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[20px] text-blue-600">check_circle</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Active Key: {maskedNvidiaKey || 'nvapi-AY5oFb...'}</span>
          <span className="text-emerald-600 font-medium">Automatic Fallback Active</span>
        </div>
      </div>
    </div>
  );
};
