import React, { useState } from 'react';
import { 
  CheckCircle2, 
  CircleDashed, 
  AlertCircle, 
  Compass, 
  MousePointer, 
  Type, 
  ArrowDown, 
  Clock, 
  Database, 
  Flag, 
  Camera, 
  Terminal, 
  ChevronRight, 
  Sparkles, 
  Maximize2,
  ListTodo,
  ShieldCheck,
  ShieldAlert,
  Lock,
  CheckCircle,
  Circle,
  Boxes,
  FileCheck2
} from 'lucide-react';
import type { ActiveTask, AgentStep } from '../types';

interface AgentProgressProps {
  task?: ActiveTask;
  eventsLog: any[];
}

export const AgentProgress: React.FC<AgentProgressProps> = ({ task, eventsLog }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'plan' | 'skills' | 'logs'>('timeline');
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  if (!task) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-center text-slate-500 h-full flex flex-col items-center justify-center">
        <Compass className="w-10 h-10 mb-2 opacity-30 text-cyan-400" />
        <p className="text-xs">No active task. Launch a task above to watch live step execution.</p>
      </div>
    );
  }

  const steps = task.steps || [];
  const plan = task.plan || [];
  const currentStepNum = steps.length;
  const isRunning = task.status === 'running' || task.status === 'planning';

  const formatBase64Image = (data?: string | null) => {
    if (!data) return '';
    if (data.startsWith('data:')) return data;
    const mime = data.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
    return `data:${mime};base64,${data}`;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'navigate': return <Compass className="w-4 h-4 text-cyan-400" />;
      case 'click': return <MousePointer className="w-4 h-4 text-amber-400" />;
      case 'type': return <Type className="w-4 h-4 text-emerald-400" />;
      case 'scroll': return <ArrowDown className="w-4 h-4 text-indigo-400" />;
      case 'extract': return <Database className="w-4 h-4 text-purple-400" />;
      case 'wait': return <Clock className="w-4 h-4 text-slate-400" />;
      case 'finish': return <Flag className="w-4 h-4 text-emerald-400" />;
      default: return <Sparkles className="w-4 h-4 text-cyan-400" />;
    }
  };

  const isAuthTask = /login|signin|sign in|gmail|google|password|account/i.test(task.goal);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col h-full overflow-hidden shadow-xl">
      {/* Header with Step Tracker */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`}></span>
            <span className="text-xs font-bold text-slate-200">
              {isRunning ? 'Agent Executing' : task.status === 'completed' ? 'Task Completed' : 'Task Status'}
            </span>
          </div>

          <span className="text-slate-600">|</span>

          <span className="text-[11px] font-mono text-slate-400">
            Step {currentStepNum} of {task.maxSteps}
          </span>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Steps ({steps.length})
          </button>

          {plan.length > 0 && (
            <button
              onClick={() => setActiveTab('plan')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                activeTab === 'plan'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListTodo className="w-3 h-3" />
              <span>Plan ({plan.filter(p => p.status === 'completed').length}/{plan.length})</span>
            </button>
          )}

          {task.selectedSkills && task.selectedSkills.length > 0 && (
            <button
              onClick={() => setActiveTab('skills')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                activeTab === 'skills'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Boxes className="w-3 h-3 text-cyan-400" />
              <span>Skills ({task.selectedSkills.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3 h-3" />
            <span>Raw Log</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 h-1 overflow-hidden">
        <div
          className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full transition-all duration-500"
          style={{ width: `${Math.min((currentStepNum / task.maxSteps) * 100, 100)}%` }}
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Goal & Active Skills Pill */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
              Objective
            </span>
            {task.activeSkillId && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                <Boxes className="w-2.5 h-2.5" />
                Active Skill: {task.activeSkillId}
              </span>
            )}
          </div>
          <p className="font-medium text-slate-200">{task.goal}</p>

          {task.selectedSkills && task.selectedSkills.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-slate-500">Selected Skills:</span>
              {task.selectedSkills.map((s, idx) => {
                const sId = typeof s === 'string' ? s : (s?.id || s?.name || `skill-${idx}`);
                const sName = typeof s === 'string' ? s : (s?.name || s?.id || 'Skill');
                return (
                  <span
                    key={`${sId}-${idx}`}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      task.activeSkillId === sId
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-700/60'
                    }`}
                  >
                    {sName}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Security Shield Banner for Auth/Login Tasks */}
        {isAuthTask && (
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-100 block">Strict Form & Credential Safety Active</span>
              <span className="text-[11px] text-emerald-300/80">
                Multi-step isolation enforced: password inputs are strictly prevented from entering email or username fields.
              </span>
            </div>
          </div>
        )}

        {/* Tab 1: Live Step Timeline */}
        {activeTab === 'timeline' && (
          <div className="space-y-3 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {steps.map((step) => {
              const isStepRunning = step.status === 'running';
              const isStepCompleted = step.status === 'completed';
              const isStepFailed = step.status === 'failed';
              const hasPassword = step.params?.isPassword || step.params?.inputType === 'password';

              return (
                <div key={step.id} className="relative pl-9 group">
                  {/* Node Dot */}
                  <div className={`absolute left-2.5 -translate-x-1/2 top-2 w-4 h-4 rounded-full flex items-center justify-center ${
                    isStepRunning
                      ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/20'
                      : isStepCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : isStepFailed
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isStepRunning ? (
                      <CircleDashed className="w-3 h-3 animate-spin text-slate-950" />
                    ) : isStepCompleted ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : isStepFailed ? (
                      <AlertCircle className="w-3 h-3 text-rose-400" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                    )}
                  </div>

                  {/* Step Card */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    isStepRunning 
                      ? 'bg-slate-950 border-cyan-500/60 shadow-lg shadow-cyan-500/10' 
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}>
                    {/* Step Header */}
                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 font-mono">
                          #{step.stepNumber}
                        </span>

                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-xs font-semibold">
                          {getActionIcon(step.action)}
                          <span className="capitalize text-slate-200">{step.action}</span>
                        </div>

                        {step.skillName && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800 flex items-center gap-1">
                            <Boxes className="w-2.5 h-2.5" />
                            {step.skillName}
                          </span>
                        )}

                        {step.procedureStepId && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                            Proc #{step.procedureStepId}
                          </span>
                        )}

                        {step.params?.targetId && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {step.params.targetId}
                          </span>
                        )}

                        {hasPassword && (
                          <span className="flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Protected</span>
                          </span>
                        )}

                        {step.requiresApproval && (
                          <span className={`flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            step.approvalStatus === 'approved'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : step.approvalStatus === 'rejected'
                              ? 'bg-rose-950 text-rose-300 border border-rose-700'
                              : 'bg-amber-950 text-amber-300 border border-amber-500 animate-pulse'
                          }`}>
                            <ShieldAlert className="w-2.5 h-2.5" />
                            {step.approvalStatus ? `Action ${step.approvalStatus}` : 'Approval Required'}
                          </span>
                        )}
                      </div>

                      {step.durationMs && (
                        <span className="text-[10px] font-mono text-slate-500">
                          {step.durationMs}ms
                        </span>
                      )}
                    </div>

                    {/* Reasoning Thought */}
                    <div className="mb-2">
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {step.thought}
                      </p>
                    </div>

                    {/* Action Result / Params */}
                    {step.result && (
                      <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-cyan-300/90 break-words flex items-start gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
                        <span>{step.result}</span>
                      </div>
                    )}

                    {/* Observable Evidence Verification Card */}
                    {step.verification && (
                      <div className={`mt-2 p-2.5 rounded-lg border text-xs ${
                        step.verification.verified
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                      }`}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 font-bold text-[11px]">
                            {step.verification.verified ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                            )}
                            <span>
                              {step.verification.verified
                                ? 'Observable Evidence Verified'
                                : 'Verification Incomplete'}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            Confidence: {Math.round(step.verification.confidence * 100)}%
                          </span>
                        </div>

                        <div className="space-y-0.5 text-[11px] text-slate-300">
                          <p className="text-slate-400">
                            <span className="font-semibold text-slate-200">Rule: </span>
                            {step.verification.criteria}
                          </p>
                          <p className="font-mono text-[10px] text-cyan-300/90 bg-slate-950/60 p-1.5 rounded border border-slate-800/60 mt-1">
                            {step.verification.observedData}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Step Snapshot Preview Thumbnail */}
                    {step.screenshot && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Camera className="w-3 h-3 text-cyan-400" />
                          <span>Visual Observation</span>
                        </span>

                        <button
                          onClick={() => setSelectedScreenshot(step.screenshot || null)}
                          className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>View Frame</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {steps.length === 0 && isRunning && (
              <div className="p-6 text-center text-slate-400">
                <CircleDashed className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                <p className="text-xs">Formulating task-dependent execution plan...</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Task-Dependent Plan */}
        {activeTab === 'plan' && (
          <div className="space-y-2.5">
            <div className="text-xs text-slate-400 mb-1">
              Task-dependent milestones dynamically tailored for this goal:
            </div>
            {plan.map((item) => {
              const isCompleted = item.status === 'completed';
              const isInProgress = item.status === 'in_progress';

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isInProgress
                      ? 'bg-slate-950 border-cyan-500/70 shadow-md shadow-cyan-500/10'
                      : isCompleted
                      ? 'bg-slate-950/80 border-emerald-500/30'
                      : 'bg-slate-950/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : isInProgress ? (
                        <CircleDashed className="w-4 h-4 text-cyan-400 animate-spin" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600" />
                      )}
                      <span className={`text-xs font-bold ${
                        isCompleted ? 'text-emerald-300 line-through opacity-80' : isInProgress ? 'text-cyan-300' : 'text-slate-400'
                      }`}>
                        Milestone {item.id}: {item.title}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isCompleted
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : isInProgress
                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>

                  {item.description && (
                    <p className={`text-xs pl-6 ${isCompleted ? 'text-slate-500' : 'text-slate-300'}`}>
                      {item.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Active Skills in Task */}
        {activeTab === 'skills' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400">
              Modular skills selected by Gemini intelligence for this task execution plan:
            </div>
            {task.selectedSkills && task.selectedSkills.map((s, idx) => {
              const skillId = typeof s === 'string' ? s : (s?.id || s?.name || `skill-${idx}`);
              const skillName = typeof s === 'string' ? s : (s?.name || s?.id || skillId);
              const isActive = task.activeSkillId === skillId;
              const skillSteps = steps.filter((st) => st.skillId === skillId || st.skillName === skillName);
              const verifiedSteps = skillSteps.filter((st) => st.verification?.verified);

              return (
                <div
                  key={`${skillId}-${idx}`}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-slate-950 border-cyan-500/70 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                        <Boxes className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-100 text-xs block">
                          {skillName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {skillSteps.length} steps executed • {verifiedSteps.length} verified
                        </span>
                      </div>
                    </div>

                    {isActive && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                        Active Procedure
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 4: Raw SSE Log Feed */}
        {activeTab === 'logs' && (
          <div className="font-mono text-[11px] space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
            {eventsLog.map((ev, i) => (
              <div key={i} className="text-slate-400 leading-tight">
                <span className="text-slate-600">[{new Date(ev.timestamp || Date.now()).toLocaleTimeString()}]</span>{' '}
                <span className="text-cyan-400 font-semibold">{ev.type}</span>:{' '}
                <span className="text-slate-300">
                  {typeof ev.payload === 'string' ? ev.payload : JSON.stringify(ev.payload || {}).slice(0, 160)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Snapshot Modal */}
      {selectedScreenshot && (
        <div
          onClick={() => setSelectedScreenshot(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 cursor-zoom-out"
        >
          <div className="relative max-w-5xl max-h-[85vh]">
            <img
              src={formatBase64Image(selectedScreenshot)}
              alt="Step Snapshot"
              className="w-full h-full object-contain rounded-xl border border-slate-700 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
