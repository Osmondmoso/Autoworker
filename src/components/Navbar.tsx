import { 
  Bot, 
  Globe, 
  History, 
  Settings, 
  Plus, 
  ExternalLink, 
  Square, 
  Radio, 
  Cpu,
  Boxes,
  Sparkles
} from 'lucide-react';
import type { ActiveTask } from '../types';

interface NavbarProps {
  activeTask?: ActiveTask;
  steelConnected: boolean;
  activeSessionsCount: number;
  activeSkillsCount?: number;
  proposedSkillsCount?: number;
  onOpenSkills: () => void;
  onOpenSessions: () => void;
  onOpenSettings: () => void;
  onNewTask: () => void;
  onReleaseSession?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTask,
  steelConnected,
  activeSessionsCount,
  activeSkillsCount = 0,
  proposedSkillsCount = 0,
  onOpenSkills,
  onOpenSessions,
  onOpenSettings,
  onNewTask,
  onReleaseSession,
}) => {
  const isRunning = activeTask?.status === 'running' || activeTask?.status === 'planning';

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-lg shadow-cyan-500/20 text-white font-bold">
          <Bot className="w-5 h-5 text-white" />
          <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${steelConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${steelConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-100 tracking-tight text-base sm:text-lg">
              Steel<span className="text-cyan-400 font-extrabold">Agent</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
              <Radio className="w-3 h-3 animate-pulse text-cyan-400" />
              Live Browser Studio
            </span>
          </div>
          <p className="hidden md:block text-xs text-slate-400">
            Autonomous web tasks via Steel cloud sandboxes & Gemini 3.8
          </p>
        </div>
      </div>

      {/* Middle: Active Session Info Pill */}
      {activeTask?.sessionId && (
        <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-mono font-medium">Session: {activeTask.sessionId.slice(0, 8)}...</span>
          </div>

          <span className="text-slate-600">|</span>

          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
            isRunning 
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' 
              : activeTask.status === 'paused'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
          }`}>
            {activeTask.status}
          </span>

          {activeTask.sessionViewerUrl && (
            <a
              href={activeTask.sessionViewerUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors"
              title="Open Steel Live Inspector in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {onReleaseSession && (
            <button
              onClick={onReleaseSession}
              className="flex items-center gap-1 px-1.5 py-0.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors text-[11px]"
              title="Release cloud browser session"
            >
              <Square className="w-3 h-3 fill-rose-500" />
              Release
            </button>
          )}
        </div>
      )}

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Status Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Steel Cloud:</span>
          <span className={steelConnected ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
            {steelConnected ? 'Ready' : 'Checking...'}
          </span>
        </div>

        {/* Skills Registry Button */}
        <button
          onClick={onOpenSkills}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
          title="Open Modular Skills Registry & Procedures"
        >
          <Boxes className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Skills</span>
          {activeSkillsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
              {activeSkillsCount}
            </span>
          )}
          {proposedSkillsCount > 0 && (
            <span className="flex h-2 w-2 relative" title={`${proposedSkillsCount} newly learned skills pending approval`}>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          )}
        </button>

        {/* Sessions History Button */}
        <button
          onClick={onOpenSessions}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
          title="View Steel cloud browser sessions"
        >
          <History className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Sessions</span>
          {activeSessionsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/40">
              {activeSessionsCount}
            </span>
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          title="Steel API Key & Engine Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* New Task Button */}
        <button
          onClick={onNewTask}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
};
