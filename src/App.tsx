/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { LiveBrowserView } from './components/LiveBrowserView';
import { TaskInput } from './components/TaskInput';
import { AgentProgress } from './components/AgentProgress';
import { TaskResults } from './components/TaskResults';
import { SessionDrawer } from './components/SessionDrawer';
import { SettingsModal } from './components/SettingsModal';
import { SkillsDashboard } from './components/SkillsDashboard';
import { ConsequentialApprovalModal } from './components/ConsequentialApprovalModal';
import type { ActiveTask, AgentEvent, SteelSession, SkillDefinition } from './types';

export default function App() {
  const [activeTask, setActiveTask] = useState<ActiveTask | undefined>();
  const [eventsLog, setEventsLog] = useState<AgentEvent[]>([]);
  const [sessions, setSessions] = useState<SteelSession[]>([]);
  const [skills, setSkills] = useState<SkillDefinition[]>([]);
  const [steelConnected, setSteelConnected] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  const [isHumanMode, setIsHumanMode] = useState(false);
  const [isLoadingTask, setIsLoadingTask] = useState(false);
  const [isCanvasExpanded, setIsCanvasExpanded] = useState(false);

  // Modals & Drawers
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);

  // Active SSE connection ref
  const eventSourceRef = useRef<EventSource | null>(null);

  // Initial fetch of health and sessions
  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setSteelConnected(data.steelConnected);
      if (data.maskedKey) setMaskedKey(data.maskedKey);
    } catch {
      setSteelConnected(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.sessions || []);
      setSessions(list);
    } catch (err) {
      console.warn('Failed to fetch sessions:', err);
    }
  };

  const fetchRecentTasks = async () => {
    try {
      const res = await fetch('/api/agent/tasks');
      const tasks = await res.json();
      if (Array.isArray(tasks) && tasks.length > 0) {
        // pick latest task if not already set
        if (!activeTask) {
          setActiveTask(tasks[0]);
          if (tasks[0].status === 'running' || tasks[0].status === 'planning') {
            connectSSE(tasks[0].id);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch recent tasks:', err);
    }
  };

  const fetchSkills = async () => {
    try {
      const res = await fetch('/api/skills');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSkills(data);
      }
    } catch (err) {
      console.warn('Failed to fetch skills:', err);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchSessions();
    fetchRecentTasks();
    fetchSkills();

    const interval = setInterval(() => {
      fetchSessions();
      fetchSkills();
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  // Connect to SSE stream for a task
  const connectSSE = (taskId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`/api/agent/stream/${taskId}`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setEventsLog((prev) => [data, ...prev].slice(0, 50));

        if (data.type === 'task_snapshot') {
          setActiveTask(data.payload);
        } else if (data.type === 'session_ready') {
          setActiveTask((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              sessionId: data.payload.sessionId,
              sessionViewerUrl: data.payload.sessionViewerUrl,
              debugUrl: data.payload.debugUrl,
              websocketUrl: data.payload.websocketUrl,
              status: 'running',
            };
          });
          fetchSessions();
        } else if (data.type === 'skills_selected') {
          const rawSkills = data.payload.skills || [];
          const skillIds = Array.isArray(rawSkills)
            ? rawSkills.map((s: any) => (typeof s === 'string' ? s : s?.id || String(s)))
            : [];
          const skillObjects = Array.isArray(rawSkills)
            ? rawSkills.map((s: any) => (typeof s === 'string' ? { id: s, name: s } : s))
            : [];
          setActiveTask((prev) => prev ? {
            ...prev,
            selectedSkills: skillIds,
            selectedSkillObjects: skillObjects,
          } : prev);
        } else if (data.type === 'skill_activated') {
          setActiveTask((prev) => prev ? {
            ...prev,
            activeSkillId: data.payload.skillId,
          } : prev);
        } else if (data.type === 'approval_required') {
          setActiveTask((prev) => prev ? {
            ...prev,
            status: 'waiting_approval',
            pendingApproval: data.payload.approvalRequest,
          } : prev);
        } else if (data.type === 'approval_resolved') {
          setActiveTask((prev) => prev ? {
            ...prev,
            status: 'running',
            pendingApproval: undefined,
          } : prev);
        } else if (data.type === 'skill_proposed') {
          fetchSkills();
        } else if (data.type === 'plan_ready' || data.type === 'plan_updated') {
          setActiveTask((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              plan: data.payload.plan,
              maxSteps: data.payload.maxSteps || prev.maxSteps,
            };
          });
        } else if (data.type === 'step_start') {
          setActiveTask((prev) => {
            if (!prev) return prev;
            const newSteps = [...prev.steps];
            const existingIdx = newSteps.findIndex((s) => s.id === data.payload.step.id);
            if (existingIdx >= 0) {
              newSteps[existingIdx] = data.payload.step;
            } else {
              newSteps.push(data.payload.step);
            }
            return {
              ...prev,
              steps: newSteps,
              currentStepIndex: data.payload.step.stepNumber,
            };
          });
        } else if (data.type === 'step_screenshot') {
          setActiveTask((prev) => {
            if (!prev) return prev;
            const newSteps = prev.steps.map((s) => 
              s.stepNumber === data.payload.stepNumber 
                ? { ...s, screenshot: data.payload.screenshot } 
                : s
            );
            return {
              ...prev,
              steps: newSteps,
              latestScreenshot: data.payload.screenshot,
            };
          });
        } else if (data.type === 'step_complete') {
          setActiveTask((prev) => {
            if (!prev) return prev;
            const newSteps = prev.steps.map((s) => 
              s.id === data.payload.step.id ? data.payload.step : s
            );
            return {
              ...prev,
              steps: newSteps,
            };
          });
        } else if (data.type === 'step_verified') {
          setActiveTask((prev) => {
            if (!prev) return prev;
            const newSteps = prev.steps.map((s) => 
              s.id === data.payload.stepId 
                ? { ...s, verification: data.payload.evidence }
                : s
            );
            return {
              ...prev,
              steps: newSteps,
            };
          });
        } else if (data.type === 'task_completed') {
          setActiveTask((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: 'completed',
              report: data.payload.report,
            };
          });
          fetchSessions();
        } else if (data.type === 'task_paused') {
          setActiveTask((prev) => prev ? { ...prev, status: 'paused' } : prev);
        } else if (data.type === 'task_resumed') {
          setActiveTask((prev) => prev ? { ...prev, status: 'running' } : prev);
        } else if (data.type === 'task_stopped') {
          setActiveTask((prev) => prev ? { ...prev, status: 'stopped' } : prev);
          fetchSessions();
        } else if (data.type === 'task_failed') {
          setActiveTask((prev) => prev ? { ...prev, status: 'failed', error: data.payload.error } : prev);
          fetchSessions();
        }
      } catch (err) {
        console.warn('Error parsing SSE data:', err);
      }
    };

    es.onerror = () => {
      // Reconnection handled automatically by EventSource
    };
  };

  // Launch a new autonomous task
  const handleRunTask = async (params: {
    goal: string;
    initialUrl?: string;
    maxSteps: number;
    autoRelease: boolean;
  }) => {
    setIsLoadingTask(true);
    setEventsLog([]);
    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to start agent task');
      }

      const task: ActiveTask = await res.json();
      setActiveTask(task);
      connectSSE(task.id);
      fetchSessions();
    } catch (err: any) {
      alert(`Error starting agent: ${err.message}`);
    } finally {
      setIsLoadingTask(false);
    }
  };

  // Manual browser actions
  const handleNavigateManual = async (url: string) => {
    if (!activeTask?.sessionId) return;
    try {
      const res = await fetch(`/api/sessions/${activeTask.sessionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'navigate', url }),
      });
      const data = await res.json();
      setActiveTask((prev) => prev ? { 
        ...prev, 
        currentUrl: data.url, 
        currentTitle: data.title, 
        latestScreenshot: data.screenshot || prev.latestScreenshot 
      } : prev);
    } catch (err: any) {
      console.error('Manual navigation error:', err);
    }
  };

  const handleScrollManual = async () => {
    if (!activeTask?.sessionId) return;
    try {
      const res = await fetch(`/api/sessions/${activeTask.sessionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'scroll' }),
      });
      const data = await res.json();
      if (data.screenshot) {
        setActiveTask((prev) => prev ? { ...prev, latestScreenshot: data.screenshot } : prev);
      }
    } catch (err: any) {
      console.error('Manual scroll error:', err);
    }
  };

  const handleTakeSnapshot = async () => {
    if (!activeTask?.sessionId) return;
    try {
      const res = await fetch(`/api/sessions/${activeTask.sessionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'screenshot' }),
      });
      const data = await res.json();
      if (data.screenshot) {
        setActiveTask((prev) => prev ? { ...prev, latestScreenshot: data.screenshot } : prev);
      }
    } catch (err: any) {
      console.error('Take snapshot error:', err);
    }
  };

  const handlePauseTask = async () => {
    if (!activeTask?.id) return;
    await fetch(`/api/agent/pause/${activeTask.id}`, { method: 'POST' });
  };

  const handleResumeTask = async () => {
    if (!activeTask?.id) return;
    await fetch(`/api/agent/resume/${activeTask.id}`, { method: 'POST' });
  };

  const handleStopTask = async () => {
    if (!activeTask?.id) return;
    await fetch(`/api/agent/stop/${activeTask.id}`, { method: 'POST' });
  };

  const handleReleaseActiveSession = async () => {
    if (!activeTask?.sessionId) return;
    await fetch(`/api/sessions/${activeTask.sessionId}/release`, { method: 'POST' });
    fetchSessions();
  };

  const handleReleaseSessionById = async (sessionId: string) => {
    await fetch(`/api/sessions/${sessionId}/release`, { method: 'POST' });
    fetchSessions();
    if (activeTask?.sessionId === sessionId) {
      setActiveTask((prev) => prev ? { ...prev, status: 'stopped' } : prev);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    const s = sessions.find((item) => item.id === sessionId);
    if (s) {
      setActiveTask({
        id: 'view_' + s.id.slice(0, 8),
        goal: 'Attached interactive cloud browser sandbox inspection',
        status: s.status === 'live' ? 'running' : 'completed',
        sessionId: s.id,
        sessionViewerUrl: s.sessionViewerUrl || `https://app.steel.dev/sessions/${s.id}`,
        debugUrl: s.debugUrl,
        createdAt: s.createdAt,
        currentStepIndex: 0,
        steps: [],
        maxSteps: 10,
        autoRelease: false,
      });
      setIsSessionsOpen(false);
    }
  };

  const handleUpdateKey = async (newKey: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/config/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: newKey }),
      });
      if (res.ok) {
        const data = await res.json();
        setMaskedKey(data.maskedKey);
        setSteelConnected(true);
        fetchSessions();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleApproveConsequential = async () => {
    if (!activeTask?.id) return;
    try {
      await fetch(`/api/agent/approval/${activeTask.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      });
      setActiveTask((prev) => prev ? { ...prev, status: 'running', pendingApproval: undefined } : prev);
    } catch (err) {
      console.error('Failed to submit approval:', err);
    }
  };

  const handleRejectConsequential = async () => {
    if (!activeTask?.id) return;
    try {
      await fetch(`/api/agent/approval/${activeTask.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false }),
      });
      setActiveTask((prev) => prev ? { ...prev, status: 'running', pendingApproval: undefined } : prev);
    } catch (err) {
      console.error('Failed to submit rejection:', err);
    }
  };

  const handleToggleSkill = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/skills/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      if (res.ok) {
        await fetchSkills();
      }
    } catch (err) {
      console.error('Failed to toggle skill:', err);
    }
  };

  const handleApproveProposedSkill = async (id: string) => {
    try {
      const res = await fetch(`/api/skills/${id}/approve`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchSkills();
      }
    } catch (err) {
      console.error('Failed to approve proposed skill:', err);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      const res = await fetch(`/api/skills/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchSkills();
      }
    } catch (err) {
      console.error('Failed to delete skill:', err);
    }
  };

  const handleCreateSkill = async (draft: Partial<SkillDefinition>) => {
    try {
      const res = await fetch('/api/skills/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        await fetchSkills();
      }
    } catch (err) {
      console.error('Failed to create custom skill:', err);
    }
  };

  const activeSkillsCount = skills.filter((s) => s.status === 'active').length;
  const proposedSkillsCount = skills.filter((s) => s.status === 'proposed').length;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTask={activeTask}
        steelConnected={steelConnected}
        activeSessionsCount={sessions.filter((s) => s.status === 'live').length}
        activeSkillsCount={activeSkillsCount}
        proposedSkillsCount={proposedSkillsCount}
        onOpenSkills={() => setIsSkillsOpen(true)}
        onOpenSessions={() => setIsSessionsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onNewTask={() => {
          setActiveTask(undefined);
          setEventsLog([]);
        }}
        onReleaseSession={activeTask?.sessionId ? handleReleaseActiveSession : undefined}
      />

      {/* Main Workspace Body */}
      <main className={`flex-1 p-3 sm:p-4 lg:p-6 grid gap-4 lg:gap-6 max-w-[1920px] mx-auto w-full ${isCanvasExpanded ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'}`}>
        {/* Left Column: Autonomous Agent Watch Studio (Full width when expanded, or 7 of 12 cols) */}
        <div className={`${isCanvasExpanded ? 'col-span-1' : 'lg:col-span-7'} flex flex-col min-h-[550px] lg:min-h-[calc(100vh-6.5rem)]`}>
          <LiveBrowserView
            task={activeTask}
            isHumanMode={isHumanMode}
            onToggleHumanMode={setIsHumanMode}
            onNavigateManual={handleNavigateManual}
            onScrollManual={handleScrollManual}
            onTakeSnapshot={handleTakeSnapshot}
            onPauseTask={handlePauseTask}
            onResumeTask={handleResumeTask}
            onStopTask={handleStopTask}
            onReleaseSession={handleReleaseActiveSession}
            onRunTask={handleRunTask}
            isLoadingTask={isLoadingTask}
            isExpanded={isCanvasExpanded}
            onToggleExpanded={() => setIsCanvasExpanded(!isCanvasExpanded)}
          />
        </div>

        {/* Right Column: Task Control, Real-Time Progress & Findings (Hidden in fullscreen canvas or 5 of 12 cols) */}
        {!isCanvasExpanded && (
          <div className="lg:col-span-5 flex flex-col gap-4 min-h-[500px] lg:min-h-[calc(100vh-6.5rem)] overflow-hidden">
            {/* Task Input Section */}
            <TaskInput onRunTask={handleRunTask} isLoading={isLoadingTask} />

            {/* If Task Completed: Synthesized Report */}
            {activeTask?.report && (
              <TaskResults report={activeTask.report} />
            )}

            {/* Real-time Agent Execution Timeline & Reasoning */}
            <div className="flex-1 min-h-[350px]">
              <AgentProgress task={activeTask} eventsLog={eventsLog} />
            </div>
          </div>
        )}
      </main>

      {/* Slide-over Sessions Drawer */}
      <SessionDrawer
        isOpen={isSessionsOpen}
        onClose={() => setIsSessionsOpen(false)}
        sessions={sessions}
        onRefresh={fetchSessions}
        onReleaseSession={handleReleaseSessionById}
        onSelectSession={handleSelectSession}
      />

      {/* Skills Engine Dashboard Modal */}
      <SkillsDashboard
        isOpen={isSkillsOpen}
        onClose={() => setIsSkillsOpen(false)}
        skills={skills}
        activeTask={activeTask}
        onToggleSkill={handleToggleSkill}
        onApproveProposedSkill={handleApproveProposedSkill}
        onDeleteSkill={handleDeleteSkill}
        onCreateSkill={handleCreateSkill}
        onRefresh={fetchSkills}
      />

      {/* Consequential Action Approval Modal (Human-in-the-Loop) */}
      {activeTask?.pendingApproval && (
        <ConsequentialApprovalModal
          request={activeTask.pendingApproval}
          onApprove={handleApproveConsequential}
          onReject={handleRejectConsequential}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        maskedKey={maskedKey}
        onUpdateKey={handleUpdateKey}
      />
    </div>
  );
}
