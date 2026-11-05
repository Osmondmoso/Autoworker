/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Globe, 
  Lock, 
  Maximize2, 
  Minimize2, 
  ExternalLink, 
  Camera, 
  ArrowRight, 
  CheckCircle2, 
  X,
  Play,
  RotateCw
} from 'lucide-react';
import type { ActiveTask, AgentStep } from '../../types';

interface CompactBrowserActivityProps {
  task?: ActiveTask;
  onNavigateManual?: (url: string) => void;
  onTakeSnapshot?: () => void;
  onReleaseSession?: () => void;
}

export const CompactBrowserActivity: React.FC<CompactBrowserActivityProps> = ({
  task,
  onNavigateManual,
  onTakeSnapshot,
  onReleaseSession,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [showFullScreenshot, setShowFullScreenshot] = useState(false);

  if (!task) {
    return null;
  }

  const currentUrl = task.currentUrl || task.initialUrl || 'about:blank';
  let cleanDomain = 'about:blank';
  try {
    cleanDomain = new URL(currentUrl).hostname;
  } catch {
    cleanDomain = currentUrl;
  }

  // Find last step and last successful action
  const steps = task.steps || [];
  const currentStep = steps.length > 0 ? steps[steps.length - 1] : undefined;
  const lastSuccessStep = [...steps].reverse().find((s) => s.status === 'completed');

  const currentActionText = currentStep
    ? `${currentStep.action.toUpperCase()}: ${currentStep.params?.url || currentStep.params?.text || currentStep.params?.selector || currentStep.thought || 'In progress'}`
    : (task.status === 'running' ? 'Connecting to website...' : 'Idle');

  const lastSuccessfulActionText = lastSuccessStep
    ? `${lastSuccessStep.action}: ${lastSuccessStep.result || lastSuccessStep.params?.url || 'Done'}`
    : 'None yet';

  const currentStepNumber = task.currentStepIndex || steps.length || 1;
  const maxSteps = task.maxSteps || 10;
  const screenshot = task.latestScreenshot || currentStep?.screenshot;

  return (
    <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-800 p-3.5 shadow-sm">
      {/* Header with URL & Expand control */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div className="p-1 rounded-md bg-slate-800 text-cyan-400">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <span 
            className="text-xs font-semibold text-slate-200 truncate"
            title={currentUrl}
          >
            {cleanDomain}
          </span>
          <span className="text-[10px] text-slate-500 font-mono shrink-0">
            Step {currentStepNumber}/{maxSteps}
          </span>
        </div>

        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 active:scale-95 transition cursor-pointer"
        >
          <Maximize2 className="w-3 h-3 text-cyan-400" />
          <span>Expand</span>
        </button>
      </div>

      {/* Activity Details Grid */}
      <div className="mt-2.5 space-y-2 text-xs">
        <div>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-0.5">
            Current Action
          </span>
          <p className="text-slate-200 font-medium truncate">
            {currentActionText}
          </p>
        </div>

        <div>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-0.5">
            Last Successful Action
          </span>
          <p className="text-emerald-400/90 font-medium truncate flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-400" />
            <span className="truncate">{lastSuccessfulActionText}</span>
          </p>
        </div>

        {/* Screenshot Preview Card */}
        {screenshot && (
          <div className="mt-2 pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1">
                <Camera className="w-3 h-3 text-cyan-400" />
                Latest Browser Capture
              </span>
              <button
                onClick={() => setShowFullScreenshot(true)}
                className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
              >
                View full
              </button>
            </div>
            <div 
              onClick={() => setShowFullScreenshot(true)}
              className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video max-h-36 cursor-pointer group"
            >
              <img
                src={screenshot.startsWith('data:') ? screenshot : `data:image/jpeg;base64,${screenshot}`}
                alt="Latest browser state"
                className="w-full h-full object-cover object-top transition duration-200 group-hover:scale-102"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition">
                <span className="text-[10px] text-slate-200 bg-slate-900/80 px-1.5 py-0.5 rounded">
                  Tap to view full snapshot
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Browser View Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-3 animate-in fade-in duration-200">
          {/* Top Bar with Dismiss */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Globe className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-100 truncate">
                  {task.currentTitle || cleanDomain}
                </h3>
                <p className="text-[11px] text-slate-400 truncate font-mono">
                  {currentUrl}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95 transition cursor-pointer"
              aria-label="Close browser view"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Navigation Input */}
          <div className="flex gap-2 my-2.5">
            <input
              type="url"
              placeholder="Enter URL (https://...)"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => {
                if (manualUrl && onNavigateManual) {
                  onNavigateManual(manualUrl);
                  setManualUrl('');
                }
              }}
              disabled={!manualUrl}
              className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-medium cursor-pointer"
            >
              Go
            </button>
            {onTakeSnapshot && (
              <button
                onClick={onTakeSnapshot}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                title="Capture Fresh Screenshot"
              >
                <Camera className="w-4 h-4 text-cyan-400" />
              </button>
            )}
          </div>

          {/* Viewer area: Live Steel session or full screenshot */}
          <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 relative flex items-center justify-center">
            {task.sessionViewerUrl ? (
              <iframe
                src={task.sessionViewerUrl}
                title="Interactive Steel Cloud Browser"
                className="w-full h-full border-0"
                allow="clipboard-read; clipboard-write"
              />
            ) : screenshot ? (
              <div className="w-full h-full overflow-auto p-2 flex items-start justify-center">
                <img
                  src={screenshot.startsWith('data:') ? screenshot : `data:image/jpeg;base64,${screenshot}`}
                  alt="Full browser page view"
                  className="max-w-full rounded-lg shadow-lg"
                />
              </div>
            ) : (
              <div className="text-center p-6 text-slate-400">
                <Globe className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-sm">No live browser frame available.</p>
                <p className="text-xs text-slate-500 mt-1">Start a task or navigate to a URL.</p>
              </div>
            )}
          </div>

          {/* Bottom Bar Details */}
          <div className="flex items-center justify-between pt-2.5 text-xs text-slate-400">
            <span>Session: {task.sessionId?.slice(0, 10) || 'None'}</span>
            {task.sessionViewerUrl && (
              <a
                href={task.sessionViewerUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-cyan-400 hover:underline"
              >
                <span>Open in Tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Simple Full Screenshot Modal */}
      {showFullScreenshot && screenshot && (
        <div 
          onClick={() => setShowFullScreenshot(false)}
          className="fixed inset-0 z-50 bg-black/90 p-4 flex flex-col items-center justify-center animate-in fade-in"
        >
          <div className="relative max-w-2xl max-h-[90vh] overflow-auto">
            <button
              onClick={() => setShowFullScreenshot(false)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/90 text-white border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={screenshot.startsWith('data:') ? screenshot : `data:image/jpeg;base64,${screenshot}`}
              alt="Full browser screenshot"
              className="w-full rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
