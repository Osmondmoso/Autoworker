/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Globe, 
  ExternalLink, 
  Play, 
  Search, 
  Filter, 
  MessageSquare, 
  ChevronRight, 
  X,
  Camera,
  Layers,
  FileText
} from 'lucide-react';
import type { ActiveTask } from '../../types';

interface TasksTabProps {
  tasks: ActiveTask[];
  onSelectTask: (task: ActiveTask) => void;
  onContinueInChat: (task: ActiveTask) => void;
  onRefreshTasks?: () => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  tasks,
  onSelectTask,
  onContinueInChat,
  onRefreshTasks,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetailsTask, setSelectedDetailsTask] = useState<ActiveTask | null>(null);

  const filteredTasks = tasks.filter((t) => {
    const matchesFilter = 
      filterStatus === 'all' ? true :
      filterStatus === 'running' ? (t.status === 'running' || t.status === 'planning') :
      filterStatus === 'completed' ? t.status === 'completed' :
      filterStatus === 'failed' ? t.status === 'failed' :
      filterStatus === 'paused' ? (t.status === 'paused' || t.status === 'waiting_approval') : true;

    const matchesSearch = 
      !searchQuery.trim() || 
      t.goal.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (t.initialUrl && t.initialUrl.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.currentUrl && t.currentUrl.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'Completed', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' };
      case 'running':
      case 'planning':
        return { label: 'Running', class: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25 animate-pulse' };
      case 'failed':
        return { label: 'Failed', class: 'bg-rose-500/10 text-rose-400 border-rose-500/25' };
      case 'paused':
      case 'waiting_approval':
        return { label: 'Paused', class: 'bg-amber-500/10 text-amber-400 border-amber-500/25' };
      case 'stopped':
        return { label: 'Stopped', class: 'bg-slate-800 text-slate-400 border-slate-700' };
      default:
        return { label: 'Queued', class: 'bg-slate-800 text-slate-400 border-slate-700' };
    }
  };

  return (
    <div className="space-y-3.5 pb-24 px-4 pt-2 max-w-md mx-auto">
      {/* Search and Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search past tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[44px] bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {['all', 'running', 'completed', 'failed', 'paused'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition cursor-pointer active:scale-95 ${
                filterStatus === tab
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-8 text-center text-slate-400">
            <Clock className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold">No tasks found</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {searchQuery ? 'Try adjusting your search criteria.' : 'Tasks you run will appear here persistently.'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const badge = getStatusBadge(task.status);
            const websiteUrl = task.currentUrl || task.initialUrl || 'about:blank';
            let domain = 'about:blank';
            try {
              domain = new URL(websiteUrl).hostname;
            } catch {
              domain = websiteUrl;
            }

            const startTime = new Date(task.createdAt).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const shortResult = task.report?.summary
              ? task.report.summary.slice(0, 100) + (task.report.summary.length > 100 ? '...' : '')
              : task.error
              ? task.error
              : `${task.steps?.length || 0} steps executed`;

            return (
              <div
                key={task.id}
                className="bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-800 p-3.5 shadow-sm space-y-2"
              >
                {/* Header: Status and Website */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.class}`}>
                    {badge.label.toUpperCase()}
                  </span>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate max-w-[60%] font-mono">
                    <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{domain}</span>
                  </div>
                </div>

                {/* Task Name */}
                <h3 className="text-xs font-bold text-slate-100 line-clamp-2">
                  {task.goal}
                </h3>

                {/* Short Result Summary */}
                <p className="text-[11px] text-slate-300 bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 leading-relaxed">
                  {shortResult}
                </p>

                {/* Times & Action Buttons */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {startTime}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onContinueInChat(task)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 active:scale-95 transition cursor-pointer"
                      title="Continue this task in chat"
                    >
                      <MessageSquare className="w-3 h-3 text-cyan-400" />
                      <span>Chat</span>
                    </button>

                    <button
                      onClick={() => setSelectedDetailsTask(task)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 active:scale-95 transition cursor-pointer"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* TASK DETAILS MODAL */}
      {selectedDetailsTask && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm p-3 flex flex-col justify-end sm:justify-center items-center animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col p-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="min-w-0 flex-1 mr-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Task Inspection
                </span>
                <h3 className="text-sm font-bold text-slate-100 line-clamp-1">
                  {selectedDetailsTask.goal}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetailsTask(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 active:scale-95 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Scrollable */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 text-xs">
              {/* Status and Session */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Status</span>
                  <span className="font-bold text-slate-200 uppercase">
                    {selectedDetailsTask.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Target Website</span>
                  <span className="font-mono text-cyan-400 truncate max-w-[60%]">
                    {selectedDetailsTask.currentUrl || selectedDetailsTask.initialUrl || 'None'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Steps</span>
                  <span className="text-slate-200">
                    {selectedDetailsTask.steps?.length || 0} / {selectedDetailsTask.maxSteps || 10}
                  </span>
                </div>
                {selectedDetailsTask.report?.durationMs && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Duration</span>
                    <span className="text-slate-200">
                      {(selectedDetailsTask.report.durationMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                )}
              </div>

              {/* Summary / Report */}
              {selectedDetailsTask.report?.summary && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Final Report Summary
                  </span>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {selectedDetailsTask.report.summary}
                  </div>
                </div>
              )}

              {/* Extracted Data Items */}
              {selectedDetailsTask.report?.extractedData && selectedDetailsTask.report.extractedData.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Extracted Data ({selectedDetailsTask.report.extractedData.length})
                  </span>
                  <div className="space-y-1.5">
                    {selectedDetailsTask.report.extractedData.map((d, i) => (
                      <div key={i} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="font-bold text-cyan-400 block">{d.title}</span>
                        <p className="text-slate-300 mt-0.5">{d.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step Execution Log */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Execution Steps ({selectedDetailsTask.steps?.length || 0})
                </span>
                <div className="space-y-1.5">
                  {selectedDetailsTask.steps?.map((s) => (
                    <div key={s.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span className="font-mono text-cyan-400 font-bold">Step {s.stepNumber}</span>
                        <span className="uppercase">{s.action}</span>
                      </div>
                      <p className="text-slate-200 font-medium">{s.result || s.thought}</p>
                      {s.verification?.observedData && (
                        <p className="text-emerald-400/90 text-[10px] mt-1">
                          Verified: {s.verification.observedData}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => {
                  onContinueInChat(selectedDetailsTask);
                  setSelectedDetailsTask(null);
                }}
                className="flex-1 min-h-[44px] rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Continue in Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
