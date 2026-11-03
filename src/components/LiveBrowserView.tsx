/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Globe, 
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  Lock, 
  Copy, 
  Check, 
  ExternalLink, 
  Maximize2, 
  Minimize2,
  Pause, 
  Play, 
  Square, 
  Camera, 
  ArrowDown, 
  Eye, 
  Layers, 
  Terminal, 
  Sparkles,
  MousePointer,
  Radio,
  Clock,
  Send,
  Zap,
  Sliders,
  ChevronDown,
  ChevronUp,
  Database,
  ListTodo,
  Boxes,
  CheckCircle2,
  Compass,
  Type,
  Flag,
  FileText,
  UserCheck
} from 'lucide-react';
import type { ActiveTask, AgentStep } from '../types';

interface LiveBrowserViewProps {
  task?: ActiveTask;
  isHumanMode: boolean;
  onToggleHumanMode: (enabled: boolean) => void;
  onNavigateManual: (url: string) => void;
  onScrollManual: () => void;
  onTakeSnapshot: () => void;
  onPauseTask: () => void;
  onResumeTask: () => void;
  onStopTask: () => void;
  onReleaseSession: () => void;
  onRunTask?: (params: {
    goal: string;
    initialUrl?: string;
    maxSteps: number;
    autoRelease: boolean;
  }) => void;
  isLoadingTask?: boolean;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

const QUICK_AGENT_PRESETS = [
  { label: 'Gmail Multi-Step Login', goal: 'Navigate to accounts.google.com, enter email address in the email field, click Next, wait for password prompt, enter password safely, and verify multi-step progression.', url: 'https://accounts.google.com' },
  { label: 'Hacker News Intel', goal: 'Go to news.ycombinator.com, extract the top 3 AI or tech stories with points and comments, and summarize them.', url: 'https://news.ycombinator.com' },
  { label: 'GitHub Trending', goal: 'Go to github.com/trending, look at the top 3 repositories today, extract names and stars.', url: 'https://github.com/trending' },
  { label: 'Tokyo Weather', goal: 'Check the 3-day weather forecast for Tokyo on wttr.in and summarize high/low temperatures.', url: 'https://wttr.in/Tokyo' },
  { label: 'Book Store Scrape', goal: 'Go to books.toscrape.com, find 3 top-rated fiction books, extract their titles and prices in GBP.', url: 'https://books.toscrape.com' },
];

export const LiveBrowserView: React.FC<LiveBrowserViewProps> = ({
  task,
  isHumanMode,
  onToggleHumanMode,
  onNavigateManual,
  onScrollManual,
  onTakeSnapshot,
  onPauseTask,
  onResumeTask,
  onStopTask,
  onReleaseSession,
  onRunTask,
  isLoadingTask = false,
  isExpanded = false,
  onToggleExpanded,
}) => {
  const [viewTab, setViewTab] = useState<'live' | 'snapshot' | 'history'>('live');
  const [manualUrlInput, setManualUrlInput] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [selectedHistoryShot, setSelectedHistoryShot] = useState<string | null>(null);
  
  // Agent Omnibar State
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentUrl, setAgentUrl] = useState('');
  const [showOmnibarConfig, setShowOmnibarConfig] = useState(false);
  const [maxSteps, setMaxSteps] = useState(10);
  const [autoRelease, setAutoRelease] = useState(false);
  
  // In-Canvas Sidecar Drawer
  const [showSidecar, setShowSidecar] = useState(false);
  const [sidecarTab, setSidecarTab] = useState<'plan' | 'data' | 'reasoning'>('reasoning');

  const currentUrl = task?.currentUrl || task?.initialUrl || 'about:blank';
  const pageTitle = task?.currentTitle || 'Steel Cloud Browser Sandbox';
  const isRunning = task?.status === 'running' || task?.status === 'planning';
  const isPaused = task?.status === 'paused';
  const steps = task?.steps || [];
  const latestStep = steps.length > 0 ? steps[steps.length - 1] : undefined;
  const plan = task?.plan || [];
  const extractedData = task?.report?.extractedData || [];

  const formatBase64Image = (data?: string | null) => {
    if (!data) return '';
    if (data.startsWith('data:')) return data;
    const mime = data.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
    return `data:${mime};base64,${data}`;
  };

  const handleCopyUrl = () => {
    if (currentUrl && currentUrl !== 'about:blank') {
      navigator.clipboard.writeText(currentUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleManualNavigateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualUrlInput.trim()) {
      onNavigateManual(manualUrlInput.trim());
      setManualUrlInput('');
    }
  };

  const handleDeployAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentPrompt.trim() || !onRunTask || isLoadingTask) return;

    onRunTask({
      goal: agentPrompt.trim(),
      initialUrl: agentUrl.trim() || (currentUrl !== 'about:blank' ? currentUrl : undefined),
      maxSteps,
      autoRelease,
    });
    setAgentPrompt('');
  };

  const handleSelectPreset = (preset: typeof QUICK_AGENT_PRESETS[0]) => {
    setAgentPrompt(preset.goal);
    setAgentUrl(preset.url);
  };

  const viewerUrl = task?.sessionViewerUrl || (task?.sessionId ? `https://app.steel.dev/sessions/${task.sessionId}` : '');

  const getActionColor = (action?: string) => {
    switch (action) {
      case 'click': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'type': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'navigate': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'extract': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'finish': return 'text-emerald-300 bg-emerald-500/20 border-emerald-400/40';
      default: return 'text-slate-300 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className={`flex flex-col h-full bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'fixed inset-3 z-50 rounded-2xl' : ''}`}>
      {/* 1. Browser Chrome Header */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 select-none">
        {/* Left: Window Dots & Nav Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            <button 
              disabled={!task?.sessionId} 
              className="p-1 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button 
              disabled={!task?.sessionId} 
              className="p-1 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded transition-colors"
              title="Forward"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={onTakeSnapshot}
              disabled={!task?.sessionId} 
              className="p-1 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded transition-colors"
              title="Refresh / Capture Snapshot"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center: Address Bar */}
        <div className="flex-1 min-w-[240px] max-w-2xl">
          <form onSubmit={handleManualNavigateSubmit} className="relative flex items-center">
            <div className="absolute left-2.5 flex items-center text-slate-400">
              <Lock className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
            </div>

            <input
              type="text"
              value={manualUrlInput || (currentUrl !== 'about:blank' ? currentUrl : '')}
              onChange={(e) => setManualUrlInput(e.target.value)}
              placeholder={currentUrl !== 'about:blank' ? currentUrl : 'Enter URL to direct navigate (e.g. news.ycombinator.com)'}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-16 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 font-mono transition-all"
            />

            <div className="absolute right-1.5 flex items-center gap-1">
              {currentUrl !== 'about:blank' && (
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors"
                  title="Copy Page URL"
                >
                  {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
              {viewerUrl && (
                <a
                  href={viewerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 text-slate-400 hover:text-cyan-400 rounded transition-colors"
                  title="Pop out Live Browser into new window"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </form>
        </div>

        {/* Right: Agent Takeover Mode, Controls & Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Autonomous vs Human Takeover Toggle */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => onToggleHumanMode(false)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                !isHumanMode 
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Agent drives browser autonomously"
            >
              <Sparkles className="w-3 h-3" />
              <span>Agent</span>
            </button>

            <button
              onClick={() => onToggleHumanMode(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                isHumanMode 
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Take direct mouse & keyboard control inside browser frame"
            >
              <MousePointer className="w-3 h-3" />
              <span>Co-Pilot</span>
            </button>
          </div>

          {/* Pause / Resume Controls */}
          {isRunning && (
            <button
              onClick={onPauseTask}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs transition-colors cursor-pointer"
              title="Pause autonomous execution"
            >
              <Pause className="w-3.5 h-3.5 fill-amber-400" />
              <span className="hidden md:inline">Pause</span>
            </button>
          )}

          {isPaused && (
            <button
              onClick={onResumeTask}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs transition-colors cursor-pointer"
              title="Resume autonomous execution"
            >
              <Play className="w-3.5 h-3.5 fill-emerald-400" />
              <span className="hidden md:inline">Resume</span>
            </button>
          )}

          {task?.status && task.status !== 'idle' && (
            <button
              onClick={onStopTask}
              className="flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs transition-colors cursor-pointer"
              title="Stop task execution"
            >
              <Square className="w-3.5 h-3.5 fill-rose-400" />
              <span className="hidden md:inline">Stop</span>
            </button>
          )}

          {/* Fullscreen Expand Toggle */}
          {onToggleExpanded && (
            <button
              onClick={onToggleExpanded}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title={isExpanded ? 'Restore split view' : 'Maximize Agent Canvas'}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* 2. Embedded Agent Omnibar (Command the Agent directly in the Watch experience) */}
      <div className="bg-slate-950/90 border-b border-slate-800/80 px-4 py-2.5">
        <form onSubmit={handleDeployAgent} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-cyan-400">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>

              <input
                type="text"
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                placeholder={
                  isRunning 
                    ? `Agent is currently executing: "${task?.goal}"`
                    : 'Command Agent: e.g. "Find the top 3 trending AI repos on GitHub and extract star counts"...'
                }
                disabled={isLoadingTask}
                className="w-full bg-slate-900 border border-cyan-500/30 focus:border-cyan-400 rounded-xl pl-9 pr-24 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all shadow-inner"
              />

              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowOmnibarConfig(!showOmnibarConfig)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Agent Parameters"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                </button>

                <button
                  type="submit"
                  disabled={!agentPrompt.trim() || isLoadingTask}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Deploy</span>
                </button>
              </div>
            </div>
          </div>

          {/* Expandable Advanced Omnibar Options */}
          {showOmnibarConfig && (
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-300 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Target URL:</span>
                <input
                  type="text"
                  value={agentUrl}
                  onChange={(e) => setAgentUrl(e.target.value)}
                  placeholder="https://... (Optional)"
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono w-48 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Max Steps:</span>
                <input
                  type="number"
                  min="3"
                  max="30"
                  value={maxSteps}
                  onChange={(e) => setMaxSteps(parseInt(e.target.value, 10) || 10)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono w-16 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={autoRelease}
                  onChange={(e) => setAutoRelease(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                />
                <span>Auto-release on completion</span>
              </label>
            </div>
          )}

          {/* Quick Preset Chips */}
          {!isRunning && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-amber-400" />
                Presets:
              </span>
              {QUICK_AGENT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className="shrink-0 px-2.5 py-0.5 rounded-full text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer font-medium"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* 3. Secondary Bar: View Modes & Agent Telemetry */}
      <div className="bg-slate-900/90 px-4 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {/* View Mode Tabs */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewTab('live')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                viewTab === 'live'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Live Agent Stream</span>
            </button>

            <button
              onClick={() => setViewTab('snapshot')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                viewTab === 'snapshot'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3 h-3" />
              <span>DOM Snapshot</span>
            </button>

            <button
              onClick={() => setViewTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                viewTab === 'history'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Step Gallery ({steps.filter(s => s.screenshot).length})</span>
            </button>
          </div>

          {/* Quick interactive helpers */}
          {task?.sessionId && (
            <div className="hidden sm:flex items-center gap-1 ml-2">
              <button
                onClick={onScrollManual}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] transition-colors cursor-pointer"
                title="Scroll page down by 500px"
              >
                <ArrowDown className="w-3 h-3" />
                <span>Scroll</span>
              </button>
              <button
                onClick={onTakeSnapshot}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] transition-colors cursor-pointer"
                title="Capture instant screenshot"
              >
                <Camera className="w-3 h-3 text-cyan-400" />
                <span>Snap</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Sidecar Toggle & Resolution */}
        <div className="flex items-center gap-2">
          {/* Agent Sidecar Drawer Toggle */}
          <button
            onClick={() => setShowSidecar(!showSidecar)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              showSidecar 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Toggle Agent Reasoning, Plan & Extracted Data sidecar"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Agent Data ({extractedData.length})</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>1280 × 800</span>
          </div>
        </div>
      </div>

      {/* 4. Main Viewport & Interactive Agent Canvas */}
      <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden min-h-[440px]">
        {/* If no session is active */}
        {!task?.sessionId ? (
          <div className="text-center p-8 max-w-lg">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-cyan-400 shadow-xl shadow-cyan-500/10">
              <Sparkles className="w-8 h-8 animate-pulse-subtle" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-1">
              Autonomous Browser Agent Ready
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Command the agent above or select a preset. Watch the agent plan, coordinate modular skills, inspect live DOM elements, and verify outcomes in real time.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {QUICK_AGENT_PRESETS.slice(0, 3).map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-xs text-slate-200 transition-all"
                >
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative flex">
            {/* Main Interactive Stream / Canvas */}
            <div className="flex-1 h-full relative">
              {/* Tab 1: Live Interactive Stream */}
              {viewTab === 'live' && (
                <div className="w-full h-full relative">
                  {viewerUrl ? (
                    <iframe
                      src={viewerUrl}
                      title="Steel Live Browser Session"
                      className="w-full h-full border-0 bg-white"
                      allow="clipboard-read; clipboard-write; camera; microphone"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6">
                      <Radio className="w-8 h-8 text-cyan-400 animate-pulse mb-2" />
                      <p className="text-sm">Connecting live stream for session {task.sessionId}...</p>
                    </div>
                  )}

                  {/* IN-CANVAS AGENT HUD OVERLAY (When Agent is executing) */}
                  {isRunning && latestStep && (
                    <div className="absolute top-4 left-4 right-4 max-w-2xl mx-auto z-30 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="bg-slate-950/90 border border-cyan-500/40 backdrop-blur-md p-3 rounded-2xl shadow-2xl pointer-events-auto flex flex-col gap-2">
                        {/* Top HUD Line: Action Badge, Step Number & Skill */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            <span className="text-xs font-black uppercase tracking-wider text-cyan-300 font-mono">
                              Step {latestStep.stepNumber} of {task.maxSteps}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${getActionColor(latestStep.action)}`}>
                              {latestStep.action}
                            </span>
                          </div>

                          {latestStep.skillName && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 font-mono">
                              {latestStep.skillName}
                            </span>
                          )}
                        </div>

                        {/* Thought Reasoning Stream */}
                        <p className="text-xs text-slate-200 font-medium leading-relaxed">
                          {latestStep.thought}
                        </p>

                        {/* Observable Evidence Proof (if verified) */}
                        {latestStep.verification && (
                          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5 text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="font-medium truncate max-w-md">
                                {latestStep.verification.observedData}
                              </span>
                            </div>
                            <span className="text-slate-500 font-mono">
                              Evidence Verified
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* IN-CANVAS HUMAN TAKEOVER BANNER */}
                  {isHumanMode && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-950/95 border border-amber-500/70 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 text-amber-200 text-xs z-30 animate-in fade-in slide-in-from-top duration-200">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                        <MousePointer className="w-4 h-4 animate-bounce" />
                      </div>
                      <div>
                        <strong className="block text-amber-300 font-bold">Human Co-Pilot In Control</strong>
                        <span className="text-amber-100/80 text-[11px]">Click or type anywhere in the browser session.</span>
                      </div>
                      <button
                        onClick={() => onToggleHumanMode(false)}
                        className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-colors cursor-pointer"
                      >
                        Hand back to Agent
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Snapshot View */}
              {viewTab === 'snapshot' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 overflow-auto">
                  {task.latestScreenshot ? (
                    <div className="relative max-w-full max-h-full rounded-lg overflow-hidden border border-slate-800 shadow-2xl group">
                      <img
                        src={formatBase64Image(task.latestScreenshot)}
                        alt="Current Browser Snapshot"
                        className="max-h-[75vh] w-auto object-contain rounded"
                      />
                      <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded border border-slate-700 text-[11px] text-slate-300 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-3 h-3 text-cyan-400" />
                        <span>Captured live from Steel sandbox</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 p-6">
                      <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No snapshot captured yet for this step.</p>
                      <button
                        onClick={onTakeSnapshot}
                        className="mt-3 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs transition-colors cursor-pointer"
                      >
                        Take Snapshot Now
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Step Gallery Timeline */}
              {viewTab === 'history' && (
                <div className="w-full h-full p-4 overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {steps
                      .filter((s) => s.screenshot)
                      .map((s) => (
                        <div
                          key={s.id}
                          onClick={() => setSelectedHistoryShot(s.screenshot || null)}
                          className="bg-slate-900 rounded-xl border border-slate-800 hover:border-cyan-500/50 overflow-hidden cursor-pointer group transition-all"
                        >
                          <div className="relative aspect-video bg-slate-950 overflow-hidden">
                            <img
                              src={formatBase64Image(s.screenshot)}
                              alt={`Step ${s.stepNumber}`}
                              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[11px] font-bold text-cyan-400 border border-slate-800">
                              Step #{s.stepNumber}
                            </div>
                            <div className="absolute bottom-2 right-2 bg-slate-950/80 px-1.5 py-0.5 rounded text-[10px] text-slate-300 font-mono">
                              {s.action}
                            </div>
                          </div>
                          <div className="p-2.5">
                            <p className="text-xs text-slate-300 line-clamp-2">{s.thought}</p>
                            {s.durationMs && (
                              <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                                Duration: {s.durationMs}ms
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>

                  {steps.filter((s) => s.screenshot).length === 0 && (
                    <div className="text-center text-slate-400 p-8">
                      <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Screenshots will appear here as the agent progresses.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* IN-CANVAS AGENT SIDECAR DRAWER */}
            {showSidecar && (
              <div className="w-80 h-full border-l border-slate-800 bg-slate-950/95 backdrop-blur-md flex flex-col z-20 animate-in slide-in-from-right duration-200">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      onClick={() => setSidecarTab('reasoning')}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${sidecarTab === 'reasoning' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                    >
                      Audit ({steps.length})
                    </button>
                    <button
                      onClick={() => setSidecarTab('plan')}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${sidecarTab === 'plan' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                    >
                      Plan ({plan.length})
                    </button>
                    <button
                      onClick={() => setSidecarTab('data')}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${sidecarTab === 'data' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                    >
                      Data ({extractedData.length})
                    </button>
                  </div>

                  <button
                    onClick={() => setShowSidecar(false)}
                    className="text-slate-400 hover:text-white p-1 rounded"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 p-3 overflow-y-auto space-y-2">
                  {sidecarTab === 'reasoning' && (
                    <div className="space-y-2">
                      {steps.map((st) => (
                        <div key={st.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold text-cyan-400 font-mono">Step #{st.stepNumber}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-mono border ${getActionColor(st.action)}`}>
                              {st.action}
                            </span>
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed">{st.thought}</p>
                          {st.result && (
                            <div className="mt-1 text-[10px] text-slate-400 font-mono truncate">
                              ↳ {st.result}
                            </div>
                          )}
                        </div>
                      ))}
                      {steps.length === 0 && (
                        <p className="text-xs text-slate-500 italic p-3 text-center">No agent actions recorded yet.</p>
                      )}
                    </div>
                  )}

                  {sidecarTab === 'plan' && (
                    <div className="space-y-2">
                      {plan.map((p) => (
                        <div key={p.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-start gap-2">
                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${p.status === 'completed' ? 'bg-emerald-400' : p.status === 'in_progress' ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`}></span>
                          <div>
                            <span className="font-bold text-slate-200 block">{p.title}</span>
                            <span className="text-[11px] text-slate-400 leading-relaxed block">{p.description}</span>
                          </div>
                        </div>
                      ))}
                      {plan.length === 0 && (
                        <p className="text-xs text-slate-500 italic p-3 text-center">Plan will generate when task begins.</p>
                      )}
                    </div>
                  )}

                  {sidecarTab === 'data' && (
                    <div className="space-y-2">
                      {extractedData.map((d, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                          <span className="font-bold text-purple-300 block mb-1">{d.title}</span>
                          <p className="text-slate-300 text-[11px] leading-relaxed">{d.content}</p>
                        </div>
                      ))}
                      {extractedData.length === 0 && (
                        <p className="text-xs text-slate-500 italic p-3 text-center">No entities extracted yet.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Snapshot Modal */}
      {selectedHistoryShot && (
        <div 
          onClick={() => setSelectedHistoryShot(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 cursor-zoom-out"
        >
          <div className="relative max-w-6xl max-h-[90vh]">
            <img
              src={formatBase64Image(selectedHistoryShot)}
              alt="Expanded Step Snapshot"
              className="w-full h-full object-contain rounded-xl border border-slate-700 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
