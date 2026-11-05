/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { ActiveTask } from '../../types';

interface GeminiToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: ActiveTask;
  onNavigateManual: (url: string) => void;
  onTakeSnapshot: () => void;
  onScrollManual: () => void;
  onReleaseSession?: () => void;
}

export const GeminiToolsModal: React.FC<GeminiToolsModalProps> = ({
  isOpen,
  onClose,
  task,
  onNavigateManual,
  onTakeSnapshot,
  onScrollManual,
  onReleaseSession,
}) => {
  const [navInput, setNavInput] = useState('');
  const [activeTab, setActiveTab] = useState<'browser' | 'trace' | 'extracted'>('browser');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUrl = task?.currentUrl || task?.initialUrl || 'about:blank';
  let domain = 'about:blank';
  try {
    domain = new URL(currentUrl).hostname;
  } catch {
    domain = currentUrl;
  }

  const steps = task?.steps || [];
  const latestScreenshot = task?.latestScreenshot || (steps.length > 0 ? steps[steps.length - 1].screenshot : undefined);

  const handleNav = (e: React.FormEvent) => {
    e.preventDefault();
    if (!navInput.trim()) return;
    onNavigateManual(navInput.trim());
    setNavInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xs" />

      <div className="relative w-full max-w-[430px] h-[90vh] max-h-[820px] bg-white rounded-[32px] flex flex-col shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200 select-none">
        {/* Top Header */}
        <div className="p-3.5 px-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[18px]">photo_library</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-neutral-900 truncate">
                Live DOM Screenshots
              </h3>
              <p className="text-[11px] text-neutral-500 truncate font-mono">
                {domain} • Step {task?.currentStepIndex || steps.length}/{task?.maxSteps || 10}
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

        {/* Tab switchers */}
        <div className="flex border-b border-neutral-100 px-3 shrink-0 bg-neutral-50/50">
          <button
            onClick={() => setActiveTab('browser')}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'browser' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500'
            }`}
          >
            Live DOM Screenshot
          </button>
          <button
            onClick={() => setActiveTab('trace')}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'trace' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500'
            }`}
          >
            Step Progress ({steps.length})
          </button>
          <button
            onClick={() => setActiveTab('extracted')}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'extracted' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500'
            }`}
          >
            Data ({task?.report?.extractedData?.length || 0})
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col min-h-0">
          {activeTab === 'browser' && (
            <div className="flex flex-col h-full space-y-2.5">
              {/* Navigation URL Bar */}
              <form onSubmit={handleNav} className="flex gap-1.5 shrink-0">
                <input
                  type="url"
                  value={navInput}
                  onChange={(e) => setNavInput(e.target.value)}
                  placeholder="Navigate to https://..."
                  className="flex-1 text-xs border border-neutral-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!navInput.trim()}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-medium cursor-pointer"
                >
                  Go
                </button>
                <button
                  type="button"
                  onClick={onTakeSnapshot}
                  className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer"
                  title="Capture fresh screenshot"
                >
                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                </button>
              </form>

              {/* LIVE DOM SCREENSHOT VIEW (Replaced live sandbox iframe) */}
              <div className="flex-1 rounded-2xl border border-neutral-200 bg-neutral-900 overflow-hidden relative flex flex-col items-center justify-center min-h-[300px]">
                {latestScreenshot ? (
                  <div 
                    onClick={() => setZoomedImage(latestScreenshot)}
                    className="w-full h-full relative cursor-pointer group flex items-center justify-center overflow-auto"
                  >
                    <img
                      src={latestScreenshot.startsWith('data:') ? latestScreenshot : `data:image/jpeg;base64,${latestScreenshot}`}
                      alt="Live DOM Page Screenshot"
                      className="w-full h-full object-contain object-top"
                    />
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>LIVE DOM SCREENSHOT</span>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[10px] px-2 py-1 rounded-lg opacity-80 group-hover:opacity-100 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                      <span>Tap to zoom</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 text-neutral-400">
                    <span className="material-symbols-outlined text-[40px] text-neutral-600 mb-1">image</span>
                    <p className="text-xs">No DOM screenshot captured yet.</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Start a task or trigger navigation to observe.</p>
                  </div>
                )}
              </div>

              {/* Quick Actions Footer */}
              <div className="flex items-center justify-between text-xs pt-1 shrink-0">
                <button
                  onClick={onScrollManual}
                  className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">arrow_downward</span>
                  <span>Scroll Page</span>
                </button>

                <button
                  onClick={onTakeSnapshot}
                  className="text-blue-600 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">refresh</span>
                  <span>Refresh Snapshot</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'trace' && (
            <div className="space-y-3">
              {steps.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-8">No steps executed yet.</p>
              ) : (
                steps.map((s) => (
                  <div key={s.id} className="bg-neutral-50 rounded-2xl p-3 border border-neutral-200/90 text-xs shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        Step {s.stepNumber}
                      </span>
                      <span className="font-semibold text-neutral-600 uppercase">
                        {s.action}
                      </span>
                    </div>

                    <p className="font-medium text-neutral-800 leading-snug">
                      {s.result || s.thought}
                    </p>

                    {/* Step Visual Progress Image */}
                    {s.screenshot && (
                      <div 
                        onClick={() => setZoomedImage(s.screenshot!)}
                        className="rounded-xl overflow-hidden border border-neutral-200 bg-neutral-900 aspect-video max-h-48 cursor-pointer relative group shadow-inner"
                      >
                        <img
                          src={s.screenshot.startsWith('data:') ? s.screenshot : `data:image/jpeg;base64,${s.screenshot}`}
                          alt={`Step ${s.stepNumber} browser state`}
                          className="w-full h-full object-cover object-top group-hover:scale-102 transition duration-200"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-medium gap-1">
                          <span className="material-symbols-outlined text-[16px]">fullscreen</span>
                          <span>View full screenshot</span>
                        </div>
                      </div>
                    )}

                    {s.verification?.observedData && (
                      <div className="text-[11px] text-emerald-800 bg-emerald-50/80 p-2 rounded-xl border border-emerald-200/70">
                        <span className="font-semibold block text-[10px] uppercase text-emerald-600">Verification</span>
                        {s.verification.observedData}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'extracted' && (
            <div className="space-y-2">
              {!task?.report?.extractedData || task.report.extractedData.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-8">No data items extracted yet.</p>
              ) : (
                task.report.extractedData.map((d, i) => (
                  <div key={i} className="bg-neutral-50 rounded-xl p-2.5 border border-neutral-100 text-xs">
                    <span className="font-bold text-neutral-900 block">{d.title}</span>
                    <p className="text-neutral-700 mt-0.5">{d.content}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full Screenshot Zoom Modal */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-60 bg-black/90 p-3 flex flex-col items-center justify-center animate-in fade-in cursor-zoom-out"
        >
          <div className="relative max-w-2xl max-h-[92vh] overflow-auto rounded-2xl">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-neutral-900/90 text-white border border-neutral-700 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <img
              src={zoomedImage.startsWith('data:') ? zoomedImage : `data:image/jpeg;base64,${zoomedImage}`}
              alt="Zoomed DOM screenshot"
              className="w-full rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
