import React, { useState } from 'react';
import { 
  X, 
  Key, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  Cpu, 
  Globe, 
  Server,
  Sparkles
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  maskedKey: string;
  onUpdateKey: (newKey: string) => Promise<boolean>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  maskedKey,
  onUpdateKey,
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    setStatus('saving');
    try {
      const ok = await onUpdateKey(keyInput.trim());
      if (ok) {
        setStatus('success');
        setTimeout(() => {
          setStatus('idle');
          setKeyInput('');
          onClose();
        }, 1200);
      } else {
        setStatus('error');
        setErrorMessage('Failed to update API key.');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Error updating key');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">
              Steel & Agent Engine Settings
            </h3>
            <p className="text-xs text-slate-400">
              Configure cloud browser sandbox credentials & telemetry
            </p>
          </div>
        </div>

        {/* Current Active Key Pill */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 mb-5">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span>Active Steel API Key:</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Authenticated
            </span>
          </div>
          <div className="font-mono text-xs text-slate-200 bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800/80">
            {maskedKey || 'ste-Yn9dfe...b5EGJ'}
          </div>
        </div>

        {/* Update Key Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Update Steel API Key
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste new ste-... key"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {status === 'error' && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {status === 'success' && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Steel API Key updated successfully!</span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!keyInput.trim() || status === 'saving'}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              {status === 'saving' ? 'Verifying...' : 'Save & Connect'}
            </button>
          </div>
        </form>

        {/* Engine Specs */}
        <div className="border-t border-slate-800 pt-4 text-[11px] text-slate-400 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Agent Intelligence Model:</span>
            </span>
            <span className="font-mono text-slate-300 font-medium">gemini-3.8-flash</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Browser Sandbox Runtime:</span>
            </span>
            <span className="font-mono text-slate-300 font-medium">Steel.dev Cloud Chromium (1280x800)</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Streaming Protocol:</span>
            </span>
            <span className="font-mono text-slate-300 font-medium">WebRTC 25 FPS + Puppeteer CDP</span>
          </div>
        </div>
      </div>
    </div>
  );
};
