/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { marked } from 'marked';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Configure marked with breaks and GitHub-flavored markdown
  const html = useMemo(() => {
    if (!content) return '';
    try {
      marked.setOptions({
        gfm: true,
        breaks: true,
      });

      let rawHtml = marked.parse(content) as string;

      // Enhance task checkboxes [ ] and [x]
      rawHtml = rawHtml.replace(
        /<li>\s*\[ \]\s*/gi,
        '<li class="flex items-start gap-2 my-1"><span class="inline-flex items-center justify-center w-4 h-4 rounded border border-neutral-300 bg-white text-neutral-400 mt-0.5 shrink-0 text-[10px]">○</span><span>'
      );
      rawHtml = rawHtml.replace(
        /<li>\s*\[x\]\s*/gi,
        '<li class="flex items-start gap-2 my-1"><span class="inline-flex items-center justify-center w-4 h-4 rounded border border-emerald-500 bg-emerald-50 text-emerald-600 mt-0.5 shrink-0 text-[10px] font-bold">✓</span><span class="text-neutral-700">'
      );

      return rawHtml;
    } catch {
      return content;
    }
  }, [content]);

  return (
    <div 
      className={`prose-openai text-[13.5px] leading-relaxed text-neutral-800 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
