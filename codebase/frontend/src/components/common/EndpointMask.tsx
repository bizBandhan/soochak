/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Safe Push Endpoint Mask & Reveal
 */

import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';

interface EndpointMaskProps {
  endpoint: string;
  className?: string;
}

export const EndpointMask: React.FC<EndpointMaskProps> = ({ endpoint, className = '' }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(endpoint);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  // Mask endpoint keeping host visible but obscuring subscription token
  const formatMasked = (url: string) => {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname;
      const pathPrefix = parsed.pathname.slice(0, 14);
      return `${parsed.protocol}//${host}${pathPrefix}••••••••••••[TOKEN HIDDEN]`;
    } catch {
      return url.slice(0, 24) + '••••••••••••[TOKEN HIDDEN]';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 max-w-full ${className}`}>
      <span
        className="font-mono text-xs text-slate-300 truncate select-all bg-slate-950/60 px-2 py-1 rounded border border-slate-800"
        title={isRevealed ? endpoint : 'Click Reveal to inspect raw endpoint token'}
      >
        {isRevealed ? endpoint : formatMasked(endpoint)}
      </span>

      <button
        type="button"
        onClick={() => setIsRevealed(!isRevealed)}
        className="text-slate-400 hover:text-cyan-400 p-1 rounded hover:bg-slate-800/60 transition shrink-0"
        title={isRevealed ? 'Mask Endpoint' : 'Reveal Full Endpoint'}
        aria-label={isRevealed ? 'Mask Endpoint' : 'Reveal Full Endpoint'}
      >
        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>

      <button
        type="button"
        onClick={handleCopy}
        className="text-slate-400 hover:text-emerald-400 p-1 rounded hover:bg-slate-800/60 transition shrink-0"
        title="Copy raw endpoint URL"
        aria-label="Copy raw endpoint URL"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
