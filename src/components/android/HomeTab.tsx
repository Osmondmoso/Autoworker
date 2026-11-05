/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  Pause, 
  RotateCw, 
  Globe, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  ExternalLink,
  ChevronRight,
  Bot,
  Zap,
  Sparkles,
  X
} from 'lucide-react';
import { CompactBrowserActivity } from './CompactBrowserActivity';
import type { ActiveTask, SteelSession } from '../../types';

interface HomeTabProps {
  activeTask?: ActiveTask;
  recentTasks: ActiveTask[];
  onStartTask: (goal: string, url?: string) => void;
  onStopTask: () => void;
  onPauseTask: () => void;
  onResumeTask: () => void;
  onSelectTask: (task: ActiveTask) => void;
  onNavigateToChat: () => void;
  isLoading?: boolean;
}

const POPULAR_PRESETS = [
  { 
    label: 'Test Duck.ai', 
    goal: 'Open Duck.ai and test it. Ask a question and verify the AI response is received.', 
    url: 'https://duck.ai' 
  },
  { 
    label: 'Hacker News Intel', 
    goal: 'Navigate to news.ycombinator.com and extract the top 3 tech stories with scores.', 
    url: 'https://news.ycombinator.com' 
  },
  { 
    label: 'GitHub Trending', 
    goal: 'Go to github.com/trending, look at the top 3 repositories today, and report their names and stars.', 
    url: 'https://github.com/trending' 
  },
  { 
    label: 'Tokyo Weather', 
    goal: 'Check the 3-day weather forecast for Tokyo on wttr.in and summarize temperatures.', 
    url: 'https://wttr.in/Tokyo' 
  },
];

export const HomeTab: React.FC<HomeTabProps> = ({
  activeTask,
  recentTasks,
  onStartTask,
  onStopTask,
  onPauseTask,
  onResumeTask,
  onSelectTask,
  onNavigateToChat,
  isLoading = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [urlInput, setUrlInput] = useState('');

  const isRunning = activeTask?.status === 'running' || activeTask?.status === 'planning';
  const isPaused = activeTask?.status === 'paused' || activeTask?.status === 'waiting_approval';
  const hasError = activeTask?.status === 'failed';

  const handleLaunchFromModal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!goalInput.trim()) return;
    onStartTask(goalInput.trim(), urlInput.trim() || undefined);
    setIsModalOpen(false);
    setGoalInput('');
    setUrlInput('');
  };

  const handleSelectPreset = (preset: typeof POPULAR_PRESETS[0]) => {
    setGoalInput(preset.goal);
    setUrlInput(preset.url);
  };

  // Find last activity text
  const steps = activeTask?.steps || [];
  const lastStep = steps[steps.length - 1];
  const lastActivity = lastStep
    ? `${lastStep.action}: ${lastStep.result || lastStep.thought || 'Processing'}`
    : (activeTask ? 'Initializing task...' : 'Agent waiting for next goal.');

  const progressPercent = activeTask?.maxSteps
    ? Math.min(100, Math.round(((activeTask.currentStepIndex || steps.length) / activeTask.maxSteps) * 100))
    : 0;

  return (
    <div className="space-y-4 pb-24 px-4 pt-2 max-w-md mx-auto">
      {/* 1. AGENT STATUS CARD */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-3xl border border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white ${
              isRunning ? 'bg-cyan-600 shadow-lg shadow-cyan-500/25' :
              isPaused ? 'bg-amber-600' :
              hasError ? 'bg-rose-600' : 'bg-slate-800 text-slate-300'
            }`}>
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase block">
                Agent Status
              </span>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>
                  {isRunning ? 'Running Task' : 
                   isPaused ? 'Task Paused' : 
                   hasError ? 'Task Error' : 'Ready for Work'}
                </span>
                {isRunning && (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                  </span>
                )}
              </h2>
            </div>
          </div>

          {/* Quick Chat Shortcut */}
          <button
            onClick={onNavigateToChat}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 active:scale-95 transition cursor-pointer"
          >
            <span>Chat</span>
            <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>

        {/* CURRENT TASK (If Active or Last) */}
        {activeTask && (
          <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Current Task
              </span>
              <p className="text-sm font-semibold text-slate-100 line-clamp-2 mt-0.5">
                {activeTask.goal}
              </p>
            </div>

            {/* Current Website & Progress */}
            <div className="flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate font-mono text-[11px]">
                  {activeTask.currentUrl || activeTask.initialUrl || 'about:blank'}
                </span>
              </div>
              <span className="text-slate-400 font-mono shrink-0 ml-2">
                Step {activeTask.currentStepIndex || steps.length} / {activeTask.maxSteps || 10}
              </span>
            </div>

            {/* Progress Bar */}
            {isRunning && (
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            {/* Last Activity */}
            <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/60 text-xs">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                Last Activity
              </span>
              <p className="text-slate-200 line-clamp-2">
                {lastActivity}
              </p>
            </div>

            {/* Task Controls: Stop / Pause / Resume */}
            {isRunning && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={onStopTask}
                  className="flex-1 min-h-[44px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold active:scale-95 transition cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Task</span>
                </button>
                <button
                  onClick={onPauseTask}
                  className="flex-1 min-h-[44px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold active:scale-95 transition cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              </div>
            )}

            {isPaused && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={onResumeTask}
                  className="flex-1 min-h-[44px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold active:scale-95 transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume Task</span>
                </button>
                <button
                  onClick={onStopTask}
                  className="min-h-[44px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium active:scale-95 transition cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. PRIMARY ACTION: START TASK BUTTON (Min 52px high for Android thumb reach) */}
      {!isRunning && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full min-h-[52px] rounded-2xl bg-cyan-600 hover:bg-cyan-500 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Start New Task</span>
        </button>
      )}

      {/* 3. COMPACT BROWSER ACTIVITY PANEL */}
      {activeTask && (
        <div>
          <CompactBrowserActivity task={activeTask} />
        </div>
      )}

      {/* 4. COMPACT RECENT TASKS */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recent Tasks
          </h3>
          <span className="text-[11px] text-slate-500">
            {recentTasks.length} recorded
          </span>
        </div>

        {recentTasks.length === 0 ? (
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800/70 p-4 text-center text-slate-400">
            <p className="text-xs">No recent tasks yet.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Start your first autonomous task above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTasks.slice(0, 3).map((task) => {
              const statusColors = {
                completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
                failed: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
                running: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
                paused: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
                stopped: 'bg-slate-800 text-slate-400 border-slate-700',
                planning: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
                idle: 'bg-slate-800 text-slate-400 border-slate-700',
                waiting_approval: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
              };

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="bg-slate-900 dark:bg-slate-950 hover:bg-slate-850 rounded-2xl border border-slate-800/80 p-3 flex items-center justify-between gap-3 active:scale-[0.99] transition cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColors[task.status] || statusColors.idle}`}>
                        {task.status.toUpperCase()}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate font-mono">
                        {task.initialUrl || task.currentUrl || 'Browser'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {task.goal}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* START TASK MODAL / BOTTOM SHEET */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-100">
                  New Browser Task
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 active:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets Chips */}
            <div className="my-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                Quick Presets
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/80 active:scale-95 transition cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleLaunchFromModal} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Goal / Instruction *
                </label>
                <textarea
                  required
                  rows={3}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="e.g. Open Duck.ai and test it, or Search github for trending repo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Target Website URL (Optional)
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://duck.ai"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 min-h-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!goalInput.trim() || isLoading}
                  className="flex-1 min-h-[48px] rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-cyan-600/20 cursor-pointer"
                >
                  {isLoading ? 'Starting...' : 'Launch Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
