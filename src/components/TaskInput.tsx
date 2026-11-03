import React, { useState } from 'react';
import { 
  Play, 
  Sparkles, 
  Sliders, 
  Globe, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Newspaper, 
  GitBranch, 
  SunMedium, 
  BookOpen, 
  ShoppingCart,
  Compass,
  Lock
} from 'lucide-react';

interface TaskInputProps {
  onRunTask: (params: {
    goal: string;
    initialUrl?: string;
    maxSteps: number;
    autoRelease: boolean;
  }) => void;
  isLoading: boolean;
}

const PRESET_RECIPES = [
  {
    icon: Lock,
    label: 'Gmail / Multi-Step Login',
    tag: 'Auth',
    goal: 'Navigate to accounts.google.com, enter email address in the email field, click Next, wait for the password prompt to render, enter the password safely, and verify multi-step progression.',
    initialUrl: 'https://accounts.google.com',
  },
  {
    icon: Newspaper,
    label: 'Hacker News Intel',
    tag: 'Tech',
    goal: 'Navigate to news.ycombinator.com, identify the top 3 AI or tech stories today, extract their titles, points, and comments count, and summarize why they matter.',
    initialUrl: 'https://news.ycombinator.com',
  },
  {
    icon: GitBranch,
    label: 'GitHub Trending',
    tag: 'Dev',
    goal: 'Go to github.com/trending, look at the top 3 trending open-source repositories today, extract their names, star counts, and the core problems they solve.',
    initialUrl: 'https://github.com/trending',
  },
  {
    icon: SunMedium,
    label: 'Tokyo Weather Check',
    tag: 'Utility',
    goal: 'Check the current weather and upcoming 3-day forecast for Tokyo on wttr.in or duckduckgo, extract high/low temperatures, and give advice for outdoor plans.',
    initialUrl: 'https://wttr.in/Tokyo',
  },
  {
    icon: BookOpen,
    label: 'Wikipedia Research',
    tag: 'Research',
    goal: 'Go to wikipedia.org, search for "Autonomous Agent", extract the formal definition, early history, and key algorithmic components.',
    initialUrl: 'https://en.wikipedia.org',
  },
  {
    icon: ShoppingCart,
    label: 'E-Commerce Scrape',
    tag: 'Extraction',
    goal: 'Go to books.toscrape.com, find 3 top-rated fiction books, extract their titles, price in GBP, and availability status.',
    initialUrl: 'https://books.toscrape.com',
  },
];

export const TaskInput: React.FC<TaskInputProps> = ({ onRunTask, isLoading }) => {
  const [goal, setGoal] = useState('');
  const [initialUrl, setInitialUrl] = useState('');
  const [maxSteps, setMaxSteps] = useState(10);
  const [autoRelease, setAutoRelease] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || isLoading) return;

    onRunTask({
      goal: goal.trim(),
      initialUrl: initialUrl.trim() || undefined,
      maxSteps,
      autoRelease,
    });
  };

  const handleSelectPreset = (preset: typeof PRESET_RECIPES[0]) => {
    setGoal(preset.goal);
    setInitialUrl(preset.initialUrl);
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-100">
            Define Autonomous Browser Task
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Config</span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Preset Badges */}
      <div className="mb-3">
        <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>Quick Launch Presets:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_RECIPES.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 text-xs transition-all cursor-pointer group"
              >
                <Icon className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Describe the task for the agent... (e.g. 'Search Hacker News for AI agent discussions, extract key links and summarize takeaways')"
            rows={2}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none font-sans"
            required
          />
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-3 text-xs animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Start URL (Optional)</span>
                </label>
                <input
                  type="url"
                  value={initialUrl}
                  onChange={(e) => setInitialUrl(e.target.value)}
                  placeholder="https://news.ycombinator.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Max Steps Limit ({maxSteps} steps)
                </label>
                <input
                  type="range"
                  min="3"
                  max="20"
                  value={maxSteps}
                  onChange={(e) => setMaxSteps(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
              <input
                type="checkbox"
                id="autoRelease"
                checked={autoRelease}
                onChange={(e) => setAutoRelease(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="autoRelease" className="text-slate-400 cursor-pointer">
                Auto-release cloud sandbox when finished (Uncheck to keep browser live for interactive exploration)
              </label>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>Autonomous agent navigates, reasons, and executes via Steel & Gemini</span>
          </span>

          <button
            type="submit"
            disabled={!goal.trim() || isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition-all cursor-pointer whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Spinning Up Cloud Sandbox...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Execute Task</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
