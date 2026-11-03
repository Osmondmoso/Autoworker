import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  Clock, 
  Database, 
  Sparkles, 
  Layers,
  FileText
} from 'lucide-react';
import { marked } from 'marked';
import type { TaskReport } from '../types';

interface TaskResultsProps {
  report: TaskReport;
}

export const TaskResults: React.FC<TaskResultsProps> = ({ report }) => {
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    navigator.clipboard.writeText(report.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const content = `# Task Report\n\n**Total Steps:** ${report.totalSteps}\n**Duration:** ${(report.durationMs / 1000).toFixed(1)}s\n**Final URL:** ${report.finalUrl}\n**Steel Session:** ${report.sessionId}\n\n## Summary\n\n${report.summary}\n\n## Extracted Data\n\n${report.extractedData.map(d => `- **${d.title}**: ${d.content} (${d.url || ''})`).join('\n')}\n`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `steel-task-report-${report.sessionId.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `steel-task-report-${report.sessionId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Convert markdown to HTML safely
  const htmlContent = marked.parse(report.summary || '', { breaks: true }) as string;

  return (
    <div className="bg-slate-900 rounded-2xl border border-emerald-500/30 p-5 shadow-2xl relative overflow-hidden animate-in fade-in duration-300">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500"></div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Autonomous Task Completed</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                SUCCESS
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Completed {report.totalSteps} steps in {(report.durationMs / 1000).toFixed(1)}s on Steel cloud sandbox
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
            title="Copy Report Summary"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
            title="Download Markdown Report"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Markdown</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
            title="Download JSON"
          >
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>JSON</span>
          </button>

          {report.sessionViewerUrl && (
            <a
              href={report.sessionViewerUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-medium border border-cyan-500/30 transition-all"
              title="Open full Steel Session Viewer & Replay"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Steel Replay</span>
            </a>
          )}
        </div>
      </div>

      {/* Synthesized Report Content */}
      <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 mb-4 text-xs sm:text-sm text-slate-200 leading-relaxed">
        <div 
          className="prose prose-invert prose-xs sm:prose-sm max-w-none prose-headings:text-cyan-300 prose-headings:font-bold prose-a:text-cyan-400 prose-p:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />
      </div>

      {/* Extracted Data Items if any */}
      {report.extractedData && report.extractedData.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>Extracted Entities & Highlights ({report.extractedData.length})</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {report.extractedData.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-xs text-slate-200">{item.title}</span>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
