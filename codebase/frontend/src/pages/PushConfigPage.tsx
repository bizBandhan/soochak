/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Push Configuration (VAPID)
 */

import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Lock,
  Terminal,
} from 'lucide-react';
import { webPushService } from '../services/apiAdapters';
import type { PublicVapidConfig } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { CodeSnippet } from '../components/common/CodeSnippet';

export const PushConfigPage: React.FC = () => {
  const [config, setConfig] = useState<PublicVapidConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await webPushService.getConfig();
      setConfig(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleCopy = async () => {
    if (!config?.publicKey) return;
    try {
      await navigator.clipboard.writeText(config.publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const curlTestSnippet = `# Verify Soochak Public VAPID Configuration endpoint
curl -X GET "https://api.bizbandhan.com/api/v1/web-push/config" \\
  -H "Accept: application/json"`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-cyan-400" />
            <span>Web Push Configuration</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Cryptographic Application Server Key (VAPID RFC 8292) for browser push subscription negotiation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadConfig}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <StatusBadge status="connected" label="GET /web-push/config" />
        </div>
      </div>

      {/* Strict Browser Security & Zero-Private-Key Policy Banner */}
      <div className="p-4 rounded-xl border border-emerald-900/60 bg-emerald-950/20 text-xs text-emerald-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-emerald-300">
            Zero-Private-Key Browser Policy Enforced
          </p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            In compliance with W3C Web Push protocols and Soochak engineering specifications: <strong>private VAPID signing keys are strictly isolated in secure server-side infrastructure</strong>. The frontend application never requests, displays, persists, or transmits private keys. Only the public application server key is distributed to client browsers for push subscription validation.
          </p>
        </div>
      </div>

      {/* Public VAPID Key Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>Public Application Server Key (VAPID)</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">P-256 Curve / Base64URL</span>
        </div>

        <div className="relative">
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 break-all select-all leading-relaxed">
            {config?.publicKey || 'Loading public VAPID key...'}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Key</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800 text-xs font-mono text-slate-400">
          <div>
            <span className="text-slate-500 block text-[10px]">Protocol Specification</span>
            <span className="text-slate-200">RFC 8292 VAPID</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Security Contact Claim</span>
            <span className="text-slate-200">{config?.contactEmail || 'mailto:security@bizbandhan.com'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Browser Client Scope</span>
            <span className="text-emerald-400">Publicly Exposable</span>
          </div>
        </div>
      </div>

      {/* Terminal Test Verification */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Terminal Inspection
        </h3>
        <CodeSnippet
          title="Inspect VAPID Public Endpoint via cURL"
          language="bash"
          code={curlTestSnippet}
        />
      </div>
    </div>
  );
};
