import React, { useCallback, useEffect, useState } from 'react';
import { AutoWorkerNative } from '@autoworker/native-agent';

export function NativeAgentControls() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [screenText, setScreenText] = useState('');
  const [target, setTarget] = useState('Network & internet');
  const [message, setMessage] = useState('Android phone control is ready to set up.');

  const refresh = useCallback(async () => {
    try {
      const result = await AutoWorkerNative.isAccessibilityEnabled();
      setEnabled(result.enabled);
      setMessage(result.enabled ? 'Phone control is enabled.' : 'Enable AutoWorker in Android Accessibility settings.');
    } catch {
      setEnabled(false);
      setMessage('Open this APK on Android to use native phone controls.');
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try { await action(); } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action failed.');
    } finally { setBusy(false); }
  };

  return (
    <section className="mx-3 mt-3 mb-2 rounded-2xl border border-emerald-500/30 bg-slate-950/90 p-3 text-white">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">AutoWorker Phone Control</div>
          <div className="text-xs text-slate-300">{enabled ? 'Accessibility enabled' : 'Setup required'}</div>
        </div>
        <span className={`rounded-full px-2 py-1 text-[10px] ${enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
          {enabled ? 'READY' : 'NOT ENABLED'}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-300">{message}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button disabled={busy} onClick={() => run(() => AutoWorkerNative.openAccessibilitySettings())}
          className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium disabled:opacity-50">Enable Accessibility</button>
        <button disabled={busy} onClick={() => run(refresh)}
          className="rounded-xl bg-slate-700 px-3 py-2 text-xs disabled:opacity-50">Check permission</button>
        <button disabled={busy || !enabled} onClick={() => run(async () => {
          await AutoWorkerNative.launchApp({ packageName: 'com.android.settings' });
          setMessage('Opened Android Settings. Return here to read the screen.');
        })} className="rounded-xl bg-slate-700 px-3 py-2 text-xs disabled:opacity-50">Open Settings</button>
        <button disabled={busy || !enabled} onClick={() => run(async () => {
          const result = await AutoWorkerNative.readVisibleText();
          setScreenText(result.text || '(No accessible text on this screen)');
          setMessage('Current screen read complete.');
        })} className="rounded-xl bg-slate-700 px-3 py-2 text-xs disabled:opacity-50">Read screen</button>
        <button disabled={busy || !enabled} onClick={() => run(async () => {
          const result = await AutoWorkerNative.readLastExternalScreen();
          setScreenText(result.text || '(No other app screen captured yet. Open another app, use it briefly, then return here.)');
          setMessage(result.packageName ? `Last app captured: ${result.packageName}` : 'No external app screen captured yet.');
        })} className="rounded-xl bg-slate-700 px-3 py-2 text-xs disabled:opacity-50">Read last app</button>
      </div>
      <div className="mt-3 flex gap-2">
        <input value={target} onChange={event => setTarget(event.target.value)} placeholder="Visible button or label"
          className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white" />
        <button disabled={busy || !enabled || !target.trim()} onClick={() => run(async () => {
          const result = await AutoWorkerNative.clickText({ text: target });
          setMessage(result.clicked ? `Tapped: ${target}` : `Couldn't find a tappable item named: ${target}`);
        })} className="rounded-xl bg-slate-700 px-3 py-2 text-xs disabled:opacity-50">Tap</button>
      </div>
      {screenText && <pre className="mt-3 max-h-36 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-2 text-[10px] text-slate-200">{screenText}</pre>}
    </section>
  );
}
