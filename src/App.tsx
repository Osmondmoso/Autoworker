/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { GeminiTopNav } from './components/gemini/GeminiTopNav';
import { GeminiInputDock } from './components/gemini/GeminiInputDock';
import { GeminiMenuDrawer } from './components/gemini/GeminiMenuDrawer';
import { GeminiModelSelectorModal } from './components/gemini/GeminiModelSelectorModal';
import { GeminiToolsModal } from './components/gemini/GeminiToolsModal';
import { GeminiSettingsModal } from './components/gemini/GeminiSettingsModal';
import { MarkdownRenderer } from './components/common/MarkdownRenderer';
import type { 
  ActiveTask, 
  AgentEvent, 
  Conversation, 
  ChatMessage, 
  AgentStep 
} from './types';

export default function App() {
  // Application Data & State
  const [activeTask, setActiveTask] = useState<ActiveTask | undefined>();
  const [recentTasks, setRecentTasks] = useState<ActiveTask[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | undefined>();
  const [steelConnected, setSteelConnected] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  const [maskedNvidiaKey, setMaskedNvidiaKey] = useState('');
  
  // Settings & Model Selection
  const [selectedModel, setSelectedModel] = useState<string>('nemotron-3-ultra');
  const [maxSteps, setMaxSteps] = useState<number>(10);
  const [autoRelease, setAutoRelease] = useState<boolean>(false);

  // Drawer & Modal States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Active step or tool log toggle & zoomed screenshot preview
  const [showToolTrace, setShowToolTrace] = useState(true);
  const [zoomedScreenshot, setZoomedScreenshot] = useState<string | null>(null);

  // Refs
  const eventSourceRef = useRef<EventSource | null>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initial Fetching
  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setSteelConnected(data.steelConnected);
      if (data.maskedKey) setMaskedKey(data.maskedKey);
      if (data.maskedNvidiaKey) setMaskedNvidiaKey(data.maskedNvidiaKey);
    } catch {
      setSteelConnected(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      const list = await res.json();
      if (Array.isArray(list)) {
        setConversations(list);
      }
    } catch (err) {
      console.warn('Failed to fetch conversations:', err);
    }
  };

  const fetchActiveConversation = async () => {
    try {
      const res = await fetch('/api/conversations/active');
      const conv = await res.json();
      if (conv && conv.id) {
        setActiveConversation(conv);
      }
    } catch (err) {
      console.warn('Failed to fetch active conversation:', err);
    }
  };

  const fetchRecentTasks = async () => {
    try {
      const res = await fetch('/api/agent/tasks');
      const tasks = await res.json();
      if (Array.isArray(tasks)) {
        setRecentTasks(tasks);
        if (tasks.length > 0 && !activeTask) {
          setActiveTask(tasks[0]);
          if (tasks[0].status === 'running' || tasks[0].status === 'planning') {
            connectSSE(tasks[0].id);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch tasks:', err);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchConversations();
    fetchActiveConversation();
    fetchRecentTasks();

    const interval = setInterval(() => {
      checkHealth();
      fetchRecentTasks();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, activeTask?.steps, isSending]);

  // Connect to SSE stream
  const connectSSE = (taskId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`/api/agent/stream/${taskId}`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data: AgentEvent = JSON.parse(event.data);

        if (data.type === 'task_snapshot') {
          setActiveTask(data.payload);
        } else if (data.type === 'session_ready') {
          setActiveTask((prev) => prev ? {
            ...prev,
            sessionId: data.payload.sessionId,
            sessionViewerUrl: data.payload.sessionViewerUrl,
            debugUrl: data.payload.debugUrl,
            websocketUrl: data.payload.websocketUrl,
            status: 'running',
          } : prev);
        } else if (data.type === 'approval_required') {
          setActiveTask((prev) => prev ? {
            ...prev,
            status: 'waiting_approval',
            pendingApproval: data.payload,
          } : prev);
        } else if (data.type === 'approval_resolved') {
          setActiveTask((prev) => prev ? {
            ...prev,
            status: 'running',
            pendingApproval: undefined,
          } : prev);
        } else if (data.type === 'step_start') {
          setActiveTask((prev) => {
            if (!prev) return prev;
            const newSteps = [...prev.steps];
            const idx = newSteps.findIndex((s) => s.id === data.payload.step.id);
            if (idx >= 0) newSteps[idx] = data.payload.step;
            else newSteps.push(data.payload.step);
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
              s.stepNumber === data.payload.stepNumber ? { ...s, screenshot: data.payload.screenshot } : s
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
              s.id === data.payload.step.id 
                ? { ...data.payload.step, screenshot: data.payload.step.screenshot || s.screenshot } 
                : s
            );
            return {
              ...prev,
              steps: newSteps,
              currentUrl: data.payload.step?.url || prev.currentUrl,
              currentTitle: data.payload.step?.pageTitle || prev.currentTitle,
              latestScreenshot: data.payload.step?.screenshot || prev.latestScreenshot,
            };
          });
        } else if (data.type === 'task_completed') {
          setActiveTask((prev) => prev ? {
            ...prev,
            status: 'completed',
            report: data.payload.report,
          } : prev);
          fetchRecentTasks();
          fetchActiveConversation();
        } else if (data.type === 'task_paused') {
          setActiveTask((prev) => prev ? { ...prev, status: 'paused' } : prev);
        } else if (data.type === 'task_resumed') {
          setActiveTask((prev) => prev ? { ...prev, status: 'running' } : prev);
        } else if (data.type === 'task_stopped') {
          setActiveTask((prev) => prev ? { ...prev, status: 'stopped' } : prev);
          fetchRecentTasks();
        } else if (data.type === 'task_failed') {
          setActiveTask((prev) => prev ? {
            ...prev,
            status: 'failed',
            error: data.payload.error,
          } : prev);
          fetchRecentTasks();
          fetchActiveConversation();
        }
      } catch (err) {
        console.warn('SSE parse error:', err);
      }
    };
  };

  // Send message or instruction
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    setIsSending(true);

    try {
      let convId = activeConversation?.id;
      if (!convId) {
        const createRes = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: text.slice(0, 30) }),
        });
        const newConv = await createRes.json();
        convId = newConv.id;
        setActiveConversation(newConv);
      }

      const res = await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send instruction');
      }

      const data = await res.json();
      if (data.conversation) {
        setActiveConversation(data.conversation);
      }

      if (data.message?.taskId) {
        const tRes = await fetch(`/api/agent/task/${data.message.taskId}`);
        if (tRes.ok) {
          const t: ActiveTask = await tRes.json();
          setActiveTask(t);
          connectSSE(t.id);
        }
      }

      fetchRecentTasks();
      fetchConversations();
    } catch (err: any) {
      console.error('Error handling message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Launch a new conversation explicitly
  const handleNewConversation = async () => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation' }),
      });
      const newConv = await res.json();
      setActiveConversation(newConv);
      fetchConversations();
    } catch (err) {
      console.error('New conversation error:', err);
    }
  };

  // Manual browser controls
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
        latestScreenshot: data.screenshot || prev.latestScreenshot,
      } : prev);
    } catch (err) {
      console.error('Manual nav error:', err);
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
    } catch (err) {
      console.error('Snapshot error:', err);
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
    } catch (err) {
      console.error('Scroll error:', err);
    }
  };

  // HITL Approval
  const handleResolveApproval = async (approved: boolean) => {
    if (!activeTask?.id) return;
    try {
      await fetch(`/api/agent/approval/${activeTask.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });
      setActiveTask((prev) => prev ? {
        ...prev,
        status: approved ? 'running' : 'paused',
        pendingApproval: undefined,
      } : prev);
    } catch (err) {
      console.error('Approval resolution error:', err);
    }
  };

  const isRunning = activeTask?.status === 'running' || activeTask?.status === 'planning';
  const steps = activeTask?.steps || [];
  const latestStep = steps.length > 0 ? steps[steps.length - 1] : undefined;

  const currentActionDescription = latestStep
    ? `Observing ${activeTask?.currentUrl ? new URL(activeTask.currentUrl).hostname : 'page'} • Step ${latestStep.stepNumber}: ${latestStep.action.toUpperCase()} (${latestStep.result || latestStep.thought || 'in progress'})`
    : (isRunning ? 'Initializing cloud browser session & loading page DOM...' : '');

  // Messages to display
  const messages = activeConversation?.messages || [];

  return (
    <main className="relative w-full h-full md:h-[92vh] md:max-h-[920px] max-w-[430px] md:max-w-md mx-auto app-screen flex flex-col overflow-hidden shadow-2xl md:rounded-[40px]">
      {/* 1. TOP NAVIGATION BAR (Time, network, and battery removed per request so app fits fully) */}
      <GeminiTopNav
        agentName="Gemini"
        modelName={selectedModel === 'nemotron-3-ultra' ? 'Autoworker Agent' : 'Cloud Agent'}
        onOpenMenu={() => setIsMenuOpen(true)}
        onOpenModelSelector={() => setIsModelSelectorOpen(true)}
        onOpenTools={() => setIsToolsOpen(true)}
        onOpenProfile={() => setIsSettingsOpen(true)}
        isRunning={isRunning}
      />

      {/* 2. CONVERSATION & EXECUTION THREAD */}
      <div 
        className="flex-1 overflow-y-auto px-4 pt-1 pb-3 space-y-3.5 z-10 text-left select-text scroll-smooth" 
        data-purpose="conversation-thread"
      >
        {/* Render persistent conversation messages */}
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const structured = msg.structuredResult;

          if (isUser) {
            return (
              <div key={msg.id} className="flex justify-end animate-in fade-in">
                <div className="max-w-[85%] bg-white/95 backdrop-blur-sm border border-neutral-200/90 rounded-2xl rounded-tr-xs px-4 py-3 shadow-xs text-neutral-900 text-[14px] leading-relaxed">
                  <MarkdownRenderer content={msg.text} />
                </div>
              </div>
            );
          }

          // Agent message card
          return (
            <div key={msg.id} className="space-y-3 animate-in fade-in">
              {/* Agent Bubble with Multicolor Gradient Star */}
              <div className="flex items-start gap-2.5 pt-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 via-teal-400 to-amber-400 p-[1px] shrink-0 mt-0.5">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[13px] text-blue-600">auto_awesome</span>
                  </div>
                </div>
                <div className="flex-1 bg-white/90 backdrop-blur-xs border border-white/90 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs text-neutral-800 text-[13.5px] leading-relaxed">
                  <MarkdownRenderer content={msg.text} />
                </div>
              </div>

              {/* Structured TASK RESULT Card if available */}
              {structured && (
                <div className="bg-white/95 backdrop-blur-sm border border-neutral-200/90 rounded-2xl p-3.5 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-purple-600">task_alt</span>
                      <span className="text-[12px] font-mono font-bold text-neutral-800">
                        TASK RESULT • {structured.status.toUpperCase()}
                      </span>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full ${
                      structured.status === 'Completed'
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        : structured.status === 'Needs Attention'
                        ? 'text-amber-700 bg-amber-50 border border-amber-200'
                        : 'text-rose-700 bg-rose-50 border border-rose-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        structured.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                      }`}></span>
                      {structured.status}
                    </span>
                  </div>

                  <div className="bg-neutral-50/90 rounded-xl p-3 text-[12.5px] text-neutral-700 border border-neutral-100 space-y-2">
                    <div>
                      <span className="font-bold text-neutral-900 block text-[11px] uppercase tracking-wide">
                        What I did:
                      </span>
                      <div className="mt-0.5">
                        <MarkdownRenderer content={structured.whatIDid} />
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-neutral-200/60">
                      <span className="font-bold text-neutral-900 block text-[11px] uppercase tracking-wide text-blue-700">
                        What I found:
                      </span>
                      <div className="mt-0.5">
                        <MarkdownRenderer content={structured.whatIFound} />
                      </div>
                    </div>

                    {structured.whatRemains && structured.whatRemains !== 'None.' && (
                      <div className="pt-1.5 border-t border-neutral-200/60">
                        <span className="font-bold text-neutral-900 block text-[11px] uppercase tracking-wide text-neutral-500">
                          What remains:
                        </span>
                        <div className="mt-0.5 text-neutral-600">
                          <MarkdownRenderer content={structured.whatRemains} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actionable Recovery Option Button */}
                  {structured.actionableOption && (
                    <div className="pt-1 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleSendMessage(structured.actionableOption!.label)}
                        className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs flex items-center gap-1.5 shadow-2xs active:scale-95 transition cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">refresh</span>
                        <span>{structured.actionableOption.label}</span>
                      </button>
                      <button
                        onClick={() => setIsToolsOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 font-medium text-xs flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">visibility</span>
                        <span>Inspect DOM Snapshot</span>
                      </button>
                    </div>
                  )}

                  {/* Browser Live DOM Snapshot Preview with visual zoom */}
                  {msg.screenshot && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-mono uppercase text-neutral-500 font-semibold px-0.5">
                        Latest DOM Screenshot
                      </span>
                      <div 
                        onClick={() => setZoomedScreenshot(msg.screenshot!)}
                        className="rounded-xl overflow-hidden border border-neutral-200 cursor-pointer aspect-video max-h-40 relative group bg-neutral-900 shadow-2xs"
                      >
                        <img
                          src={msg.screenshot.startsWith('data:') ? msg.screenshot : `data:image/jpeg;base64,${msg.screenshot}`}
                          alt="Page snapshot"
                          className="w-full h-full object-cover object-top group-hover:scale-102 transition duration-200"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-xs font-medium gap-1">
                          <span className="material-symbols-outlined text-[16px]">zoom_in</span>
                          <span>Tap to view live snapshot</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Real-time Agent Progress Indicator with Spinning Sync Icon */}
        {(isRunning || isSending) && (
          <div className="flex items-center gap-2 px-1 text-xs text-neutral-600 animate-in fade-in">
            <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[13px] text-blue-600 animate-spin">sync</span>
            </div>
            <span className="font-medium text-neutral-700 text-[13px] truncate">
              {currentActionDescription || 'Analyzing page DOM & telemetry across cluster...'}
            </span>
            <span 
              onClick={() => setShowToolTrace(!showToolTrace)}
              className="material-symbols-outlined text-[16px] text-neutral-400 ml-auto cursor-pointer"
            >
              {showToolTrace ? 'expand_less' : 'expand_more'}
            </span>
          </div>
        )}

        {/* Active Tool Step Card with neat visual DOM progress screenshot */}
        {isRunning && latestStep && showToolTrace && (
          <div className="bg-white/90 backdrop-blur-sm border border-neutral-200 rounded-2xl p-3.5 shadow-xs space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-purple-600">analytics</span>
                <span className="text-[12px] font-mono font-medium text-neutral-800">
                  steel_{latestStep.action}_action
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                In Progress (Step {latestStep.stepNumber})
              </span>
            </div>

            <div className="bg-neutral-50/90 rounded-xl p-2.5 text-[12.5px] text-neutral-700 border border-neutral-100 flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-blue-500 shrink-0 mt-0.5">info</span>
              <p className="leading-normal">
                {latestStep.thought || latestStep.result || `Target: ${latestStep.params?.url || latestStep.params?.selector || 'DOM node'}`}
              </p>
            </div>

            {/* NEAT VISUAL STEP PROGRESS IMAGE */}
            {latestStep.screenshot && (
              <div className="pt-1">
                <div className="flex items-center justify-between text-[10.5px] text-neutral-500 mb-1 px-0.5">
                  <span className="font-mono font-semibold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    Step {latestStep.stepNumber} DOM Snapshot
                  </span>
                  <span className="text-neutral-400">Live Browser State</span>
                </div>
                <div 
                  onClick={() => setZoomedScreenshot(latestStep.screenshot!)}
                  className="rounded-xl overflow-hidden border border-neutral-200 bg-neutral-900 aspect-video max-h-48 cursor-pointer relative group shadow-2xs"
                >
                  <img
                    src={latestStep.screenshot.startsWith('data:') ? latestStep.screenshot : `data:image/jpeg;base64,${latestStep.screenshot}`}
                    alt={`Step ${latestStep.stepNumber} DOM state`}
                    className="w-full h-full object-cover object-top group-hover:scale-102 transition duration-200"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-medium gap-1">
                    <span className="material-symbols-outlined text-[16px]">zoom_in</span>
                    <span>Tap to zoom step progress</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* NEAT STEP PROGRESS IMAGES GALLERY (Shows progress across all completed steps) */}
        {steps.filter(s => s.screenshot).length > 1 && (
          <div className="bg-white/80 backdrop-blur-xs border border-neutral-200/90 rounded-2xl p-3 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-blue-600">view_carousel</span>
                <span>Step Visual Progress</span>
              </span>
              <button 
                onClick={() => setIsToolsOpen(true)}
                className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
              >
                Inspect All ({steps.filter(s => s.screenshot).length})
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar pt-0.5">
              {steps.filter(s => s.screenshot).map((s) => (
                <div
                  key={s.id}
                  onClick={() => setZoomedScreenshot(s.screenshot!)}
                  className="min-w-[130px] max-w-[130px] rounded-xl overflow-hidden border border-neutral-200 bg-white shadow-2xs hover:shadow-xs transition cursor-pointer shrink-0 group"
                >
                  <div className="aspect-video bg-neutral-900 overflow-hidden relative">
                    <img
                      src={s.screenshot!.startsWith('data:') ? s.screenshot! : `data:image/jpeg;base64,${s.screenshot!}`}
                      alt={`Step ${s.stepNumber}`}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition duration-200"
                    />
                    <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-mono px-1 py-0.2 rounded">
                      Step {s.stepNumber}
                    </span>
                  </div>
                  <div className="p-1.5 bg-neutral-50/90 text-[10px]">
                    <span className="font-bold text-neutral-800 uppercase block truncate">
                      {s.action}
                    </span>
                    <p className="text-neutral-500 truncate text-[9.5px]">
                      {s.result || s.thought || 'Verified'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HITL Gate • Approval Required Card matching template */}
        {activeTask?.status === 'waiting_approval' && activeTask.pendingApproval && (
          <div className="bg-gradient-to-br from-white to-blue-50/60 border border-blue-200/90 rounded-xl p-3.5 shadow-sm space-y-2.5 animate-in zoom-in-95">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-800">
                    HITL Gate • Approval Required
                  </span>
                </div>
                <p className="text-[13px] text-neutral-800 font-medium leading-snug mt-0.5">
                  {activeTask.pendingApproval.description} (Target: <span className="font-mono text-[11px] bg-blue-100/70 text-blue-900 px-1 py-0.5 rounded">{activeTask.pendingApproval.targetUrl || 'action'}</span>).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button 
                onClick={() => handleResolveApproval(true)}
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer" 
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                Authorize & Deploy
              </button>
              <button 
                onClick={() => setIsToolsOpen(true)}
                className="px-3 py-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded-lg text-xs font-medium active:scale-95 transition-all cursor-pointer" 
                type="button"
              >
                Inspect Full Trace
              </button>
            </div>
          </div>
        )}

        <div ref={threadEndRef} />
      </div>

      {/* 3. FLOATING PILL DOCK CONTAINER (Sits cleanly at bottom without fake nav buttons) */}
      <GeminiInputDock
        onSendMessage={handleSendMessage}
        onOpenAddModal={() => setIsMenuOpen(true)}
        isSending={isSending}
      />

      {/* MODALS & DRAWERS */}
      <GeminiMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversation?.id}
        onSelectConversation={(conv) => setActiveConversation(conv)}
        onNewConversation={handleNewConversation}
        recentTasks={recentTasks}
        onSelectTask={(task) => {
          setActiveTask(task);
          if (task.status === 'running') connectSSE(task.id);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTools={() => setIsToolsOpen(true)}
        steelConnected={steelConnected}
        onSelectPreset={(goal, url) => {
          handleSendMessage(url ? `${goal} (Target URL: ${url})` : goal);
        }}
      />

      <GeminiModelSelectorModal
        isOpen={isModelSelectorOpen}
        onClose={() => setIsModelSelectorOpen(false)}
        currentModel={selectedModel}
        onSelectModel={(m) => setSelectedModel(m)}
        maskedNvidiaKey={maskedNvidiaKey}
      />

      <GeminiToolsModal
        isOpen={isToolsOpen}
        onClose={() => setIsToolsOpen(false)}
        task={activeTask}
        onNavigateManual={handleNavigateManual}
        onTakeSnapshot={handleTakeSnapshot}
        onScrollManual={handleScrollManual}
      />

      <GeminiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        steelConnected={steelConnected}
        maskedKey={maskedKey}
        maskedNvidiaKey={maskedNvidiaKey}
        maxSteps={maxSteps}
        autoRelease={autoRelease}
        onUpdateSteelKey={async (key) => {
          const res = await fetch('/api/config/key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: key }),
          });
          if (res.ok) {
            checkHealth();
            return true;
          }
          return false;
        }}
        onUpdateNvidiaKey={async (key) => {
          const res = await fetch('/api/config/nvidia-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: key }),
          });
          if (res.ok) {
            checkHealth();
            return true;
          }
          return false;
        }}
        onUpdateMaxSteps={(steps) => setMaxSteps(steps)}
        onToggleAutoRelease={(auto) => setAutoRelease(auto)}
      />

      {/* FULLSCREEN IMAGE ZOOM MODAL */}
      {zoomedScreenshot && (
        <div 
          onClick={() => setZoomedScreenshot(null)}
          className="fixed inset-0 z-60 bg-black/90 p-4 flex flex-col items-center justify-center animate-in fade-in cursor-zoom-out"
        >
          <div className="relative max-w-2xl max-h-[90vh] overflow-auto rounded-2xl">
            <button
              onClick={() => setZoomedScreenshot(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-neutral-900/90 text-white border border-neutral-700 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <img
              src={zoomedScreenshot.startsWith('data:') ? zoomedScreenshot : `data:image/jpeg;base64,${zoomedScreenshot}`}
              alt="Zoomed step progress screenshot"
              className="w-full rounded-2xl"
            />
          </div>
        </div>
      )}
    </main>
  );
}
