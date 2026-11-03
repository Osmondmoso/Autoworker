import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Lock, 
  KeyRound,
  FileCheck2,
  Clock
} from 'lucide-react';
import type { ConsequentialApprovalRequest } from '../types';

interface ConsequentialApprovalModalProps {
  request: ConsequentialApprovalRequest;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
}

export const ConsequentialApprovalModal: React.FC<ConsequentialApprovalModalProps> = ({
  request,
  onApprove,
  onReject,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (approved: boolean) => {
    setIsSubmitting(true);
    try {
      if (approved) {
        await onApprove();
      } else {
        await onReject();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFinancialOrConsequential = 
    request.permissionLevel === 'consequential_action' ||
    /payment|purchase|checkout|card|pay|transfer|deposit|withdraw|book/i.test(request.description + request.impactRisk);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-amber-500/50 rounded-2xl shadow-2xl shadow-amber-500/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="approval-modal-title"
      >
        {/* Urgent Header Banner */}
        <div className={`p-4 sm:p-5 border-b flex items-start gap-3.5 ${
          isFinancialOrConsequential 
            ? 'bg-gradient-to-r from-amber-950/80 via-rose-950/40 to-slate-900 border-amber-500/40'
            : 'bg-gradient-to-r from-indigo-950/80 to-slate-900 border-indigo-500/40'
        }`}>
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Human-in-the-Loop Guardrail
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Step #{request.stepNumber}
              </span>
            </div>

            <h3 id="approval-modal-title" className="text-base sm:text-lg font-bold text-slate-100 leading-snug">
              Approval Required for Consequential Action
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              The agent has paused before executing an irreversible or high-permission browser operation.
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 text-xs">
          {/* Action Description */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Proposed Operation
            </div>
            <p className="text-sm font-medium text-slate-100 leading-relaxed">
              {request.description}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Active Skill
              </span>
              <div className="font-semibold text-cyan-300">
                {request.skillName || request.skillId || 'General Browser Skill'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Permission Tier
              </span>
              <div className="inline-flex items-center gap-1 font-semibold text-amber-300 uppercase text-[11px]">
                <Lock className="w-3 h-3 text-amber-400" />
                {request.permissionLevel.replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Target URL */}
          {request.targetUrl && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                  Target Endpoint
                </span>
                <span className="text-slate-300 font-mono truncate block text-[11px]">
                  {request.targetUrl}
                </span>
              </div>
              <a 
                href={request.targetUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 transition-colors shrink-0 p-1"
                title="Inspect URL in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Impact Risk Note */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 block mb-0.5">
                Impact & Risk Assessment
              </span>
              <p className="text-amber-200/90 leading-relaxed text-[11px]">
                {request.impactRisk || 'This action cannot be undone automatically once executed.'}
              </p>
            </div>
          </div>

          {/* Action Parameters (if typing/clicking specific form inputs) */}
          {request.parameters && Object.keys(request.parameters).length > 0 && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Target Element & Parameters
              </span>
              <div className="font-mono text-[11px] text-slate-300 space-y-1">
                {request.parameters.text && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Value:</span>
                    <span className="text-cyan-300">
                      {request.parameters.isPassword ? '••••••••••••' : request.parameters.text}
                    </span>
                  </div>
                )}
                {request.parameters.targetId && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">DOM Element:</span>
                    <span className="text-indigo-300">{request.parameters.targetId}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={() => handleAction(false)}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>Reject & Abort Step</span>
          </button>

          <button
            onClick={() => handleAction(true)}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve & Execute</span>
          </button>
        </div>
      </div>
    </div>
  );
};
