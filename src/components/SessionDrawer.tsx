import React from 'react';
import { 
  X, 
  ExternalLink, 
  Square, 
  RotateCw, 
  Radio, 
  Clock, 
  Layers, 
  Trash2,
  Globe
} from 'lucide-react';
import type { SteelSession } from '../types';

interface SessionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SteelSession[];
  onRefresh: () => void;
  onReleaseSession: (sessionId: string) => void;
  onSelectSession: (sessionId: string) => void;
}

export const SessionDrawer: React.FC<SessionDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  onRefresh,
  onReleaseSession,
  onSelectSession,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-sm text-slate-100">
                Steel Cloud Sessions
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-300 font-mono">
                {sessions.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                title="Refresh sessions list"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List of Sessions */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {sessions.map((session) => {
              const isLive = session.status === 'live';
              return (
                <div
                  key={session.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isLive
                      ? 'bg-slate-950 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                      <span className="font-mono font-medium text-xs text-slate-200">
                        {session.id.slice(0, 12)}...
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isLive 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {session.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-1 mb-3">
                    <div className="flex items-center justify-between">
                      <span>Created:</span>
                      <span className="font-mono text-slate-300">
                        {new Date(session.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    {session.duration && (
                      <div className="flex items-center justify-between">
                        <span>Duration:</span>
                        <span className="font-mono text-slate-300">
                          {(session.duration / 1000).toFixed(1)}s
                        </span>
                      </div>
                    )}
                    {session.dimensions && (
                      <div className="flex items-center justify-between">
                        <span>Viewport:</span>
                        <span className="font-mono text-slate-300">
                          {session.dimensions.width} × {session.dimensions.height}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => onSelectSession(session.id)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer"
                    >
                      Attach View
                    </button>

                    <div className="flex items-center gap-2">
                      {session.sessionViewerUrl && (
                        <a
                          href={session.sessionViewerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Replay</span>
                        </a>
                      )}

                      {isLive && (
                        <button
                          onClick={() => onReleaseSession(session.id)}
                          className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                        >
                          <Square className="w-3 h-3 fill-rose-500" />
                          <span>Release</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {sessions.length === 0 && (
              <div className="text-center p-8 text-slate-500 text-xs">
                No active or previous sessions recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
