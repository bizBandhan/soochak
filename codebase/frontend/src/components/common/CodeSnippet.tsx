/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Developer Code Snippet Block
 */

import React, { useState } from 'react';
import { Copy, Check, Terminal, ShieldAlert } from 'lucide-react';

interface CodeSnippetProps {
  title: string;
  language?: string;
  code: string;
  isServiceWorkerSafeNotice?: boolean;
}

export const CodeSnippet: React.FC<CodeSnippetProps> = ({
  title,
  language = 'javascript',
  code,
  isServiceWorkerSafeNotice = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/90 overflow-hidden text-slate-100 shadow-md">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800/80 bg-slate-900/60 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-mono">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>{title}</span>
          <span className="text-slate-500 text-[10px]">({language})</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy snippet</span>
            </>
          )}
        </button>
      </div>

      {isServiceWorkerSafeNotice && (
        <div className="px-3.5 py-2 bg-cyan-950/30 border-b border-cyan-900/40 flex items-start gap-2 text-[11px] text-cyan-200">
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            <strong>Preserve Existing Service Workers:</strong> Do not overwrite or unregister your existing service worker. Append this handler using <code>self.addEventListener('push', ...)</code> or load it via <code>importScripts('/soochak-worker.js')</code> at the top of your existing worker.
          </span>
        </div>
      )}

      <pre className="p-3.5 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed selection:bg-cyan-500/30">
        <code>{code}</code>
      </pre>
    </div>
  );
};
