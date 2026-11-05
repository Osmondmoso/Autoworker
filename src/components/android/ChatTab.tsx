/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Plus, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Camera, 
  Globe, 
  Sparkles,
  Bot,
  User,
  ArrowRight,
  Maximize2,
  X
} from 'lucide-react';
import type { Conversation, ChatMessage, TaskStructuredResult, ActiveTask } from '../../types';

interface ChatTabProps {
  conversation?: Conversation;
  onSendMessage: (text: string) => Promise<void>;
  onNewConversation: () => void;
  onRetryAction?: (text: string) => void;
  onOpenBrowser?: () => void;
  isSending?: boolean;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  conversation,
  onSendMessage,
  onNewConversation,
  onRetryAction,
  onOpenBrowser,
  isSending = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [previewScreenshot, setPreviewScreenshot] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, isSending]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;
    const text = inputText.trim();
    setInputText('');
    await onSendMessage(text);
  };

  const toggleDetails = (msgId: string) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const messages = conversation?.messages || [];

  const QUICK_PROMPTS = [
    'Try again',
    'What is on the screen?',
    'Inspect the page and continue',
    'Look for search results',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] max-w-md mx-auto">
      {/* 1. TOP HEADER: Conversation Title & Explicit New Conversation Action */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 dark:bg-slate-950/80 border-b border-slate-800 backdrop-blur-sm shrink-0">
        <div className="min-w-0 flex-1 mr-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Agent Conversation
          </span>
          <h2 className="text-xs font-semibold text-slate-200 truncate">
            {conversation?.title || 'Continuous Assistant'}
          </h2>
        </div>

        {/* New Conversation Button - only provided when explicitly requested */}
        <button
          onClick={onNewConversation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 active:scale-95 transition cursor-pointer shrink-0"
          title="Start fresh conversation"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" />
          <span>New</span>
        </button>
      </div>

      {/* 2. CHAT MESSAGES SCROLL AREA */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Bot className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium">Ready for your instructions.</p>
            <p className="text-xs text-slate-500 mt-1">
              Ask me to open, test, or interact with any website.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const structured = msg.structuredResult;
            const isDetailsOpen = !!expandedDetails[msg.id];

            if (isUser) {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] bg-cyan-600 text-white rounded-2xl rounded-tr-xs px-3.5 py-2.5 shadow-sm text-xs font-medium leading-relaxed">
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span className="text-[10px] text-cyan-200/80 mt-1 block text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            }

            // AGENT STRUCTURED RESPONSE CARD conforming to SECTION 7
            return (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[95%] w-full bg-slate-900 dark:bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-xs p-3.5 shadow-sm space-y-3">
                  {/* Top Bar with Agent Tag & Status */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white">
                        <Bot className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-bold text-slate-200">
                        SteelAgent
                      </span>
                    </div>

                    {structured?.status && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        structured.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' :
                        structured.status === 'Needs Attention' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' :
                        structured.status === 'Running' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25 animate-pulse' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/25'
                      }`}>
                        {structured.status.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* STRUCTURED OUTPUT: Section 7 Format */}
                  {structured ? (
                    <div className="space-y-2.5 text-xs">
                      {/* What I did */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          What I did:
                        </span>
                        <p className="text-slate-200 font-medium leading-relaxed">
                          {structured.whatIDid}
                        </p>
                      </div>

                      {/* What I found */}
                      <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-0.5">
                          What I found:
                        </span>
                        <p className="text-slate-200 leading-relaxed font-normal whitespace-pre-wrap">
                          {structured.whatIFound}
                        </p>
                      </div>

                      {/* What remains */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          What remains:
                        </span>
                        <p className="text-slate-300">
                          {structured.whatRemains}
                        </p>
                      </div>

                      {/* Next action */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Next action:
                        </span>
                        <p className="text-slate-300">
                          {structured.nextAction}
                        </p>
                      </div>

                      {/* Actionable Recovery Option (Section 8) */}
                      {structured.actionableOption && (
                        <div className="pt-1 flex gap-2">
                          <button
                            onClick={() => {
                              if (structured.actionableOption?.action === 'retry' && onRetryAction) {
                                onRetryAction('Try again');
                              } else if (onOpenBrowser) {
                                onOpenBrowser();
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs active:scale-95 transition cursor-pointer"
                          >
                            <RotateCw className="w-3 h-3" />
                            <span>{structured.actionableOption.label}</span>
                          </button>
                        </div>
                      )}

                      {/* Expandable Technical Details */}
                      {(structured.technicalDetails || msg.screenshot) && (
                        <div className="pt-2 border-t border-slate-800/80">
                          <button
                            onClick={() => toggleDetails(msg.id)}
                            className="flex items-center justify-between w-full text-[11px] text-slate-400 hover:text-slate-300 py-1 cursor-pointer"
                          >
                            <span>Technical Details & Snapshot</span>
                            {isDetailsOpen ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {isDetailsOpen && (
                            <div className="mt-2 space-y-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px]">
                              {structured.technicalDetails && (
                                <p className="font-mono text-slate-400 break-all">
                                  {structured.technicalDetails}
                                </p>
                              )}

                              {msg.screenshot && (
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                                    Observed Page Snapshot
                                  </span>
                                  <div
                                    onClick={() => setPreviewScreenshot(msg.screenshot!)}
                                    className="rounded-lg overflow-hidden border border-slate-800 max-h-40 aspect-video cursor-pointer"
                                  >
                                    <img
                                      src={msg.screenshot.startsWith('data:') ? msg.screenshot : `data:image/jpeg;base64,${msg.screenshot}`}
                                      alt="Page state snapshot"
                                      className="w-full h-full object-cover object-top"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Regular text fallback if structured isn't ready yet
                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </p>
                  )}

                  <span className="text-[10px] text-slate-500 block">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {isSending && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-2 text-xs text-slate-300">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span>Agent is observing and executing browser actions...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. QUICK SUGGESTION CHIPS */}
      <div className="px-3 py-1 bg-slate-900/60 border-t border-slate-800/60 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex gap-1.5 w-max">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onSendMessage(prompt)}
              disabled={isSending}
              className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 active:scale-95 transition cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* 4. PERSISTENT INPUT BAR (Min 48px touch target) */}
      <div className="p-3 bg-slate-900/90 dark:bg-slate-950/90 border-t border-slate-800 backdrop-blur-md shrink-0 mb-16">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Tell agent what to do or correct next..."
            disabled={isSending}
            className="flex-1 min-h-[48px] bg-slate-950 border border-slate-800 rounded-2xl px-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            aria-label="Send message"
            className="w-12 h-12 rounded-2xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 disabled:opacity-40 text-white flex items-center justify-center transition shadow-md shadow-cyan-600/20 cursor-pointer shrink-0"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>

      {/* Snapshot Preview Modal */}
      {previewScreenshot && (
        <div 
          onClick={() => setPreviewScreenshot(null)}
          className="fixed inset-0 z-50 bg-black/90 p-4 flex flex-col items-center justify-center animate-in fade-in"
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-auto">
            <button
              onClick={() => setPreviewScreenshot(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/90 text-white border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewScreenshot.startsWith('data:') ? previewScreenshot : `data:image/jpeg;base64,${previewScreenshot}`}
              alt="Screenshot preview"
              className="w-full rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
