/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Live Web Push Notification Preview
 */

import React, { useState } from 'react';
import { Bell, ExternalLink, Globe, Monitor, Smartphone } from 'lucide-react';

interface NotificationPreviewProps {
  title: string;
  body: string;
  url: string;
  tag?: string;
  origin?: string;
}

export const NotificationPreview: React.FC<NotificationPreviewProps> = ({
  title,
  body,
  url,
  tag,
  origin = 'bizbandhan.com',
}) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  const cleanTitle = title.trim() || 'Notification Title';
  const cleanBody = body.trim() || 'Your push notification message text will be displayed here across subscriber devices.';
  const cleanUrl = url.trim() || 'https://bizbandhan.com';

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
        <span className="font-medium text-slate-300 flex items-center gap-2">
          <Bell className="w-3.5 h-3.5 text-cyan-400" />
          Live Subscriber Push Preview
        </span>
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
          <button
            type="button"
            onClick={() => setDeviceMode('desktop')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition ${
              deviceMode === 'desktop'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3 h-3" />
            Desktop
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('mobile')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition ${
              deviceMode === 'mobile'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            Mobile
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 rounded-md border border-slate-900">
        {deviceMode === 'desktop' ? (
          /* Desktop Browser Notification Banner (Chrome/Edge/macOS) */
          <div className="w-full max-w-sm rounded-lg border border-slate-700/80 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md text-slate-100">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 truncate">
                <div className="w-4 h-4 rounded bg-cyan-600 flex items-center justify-center text-white shrink-0">
                  <Bell className="w-2.5 h-2.5" />
                </div>
                <span className="font-semibold text-slate-300">Google Chrome</span>
                <span aria-hidden="true">·</span>
                <span className="truncate">{origin}</span>
              </div>
              <span className="font-mono text-[10px] text-slate-500 shrink-0">just now</span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-white truncate leading-snug">
                  {cleanTitle}
                </h4>
                <p className="mt-1 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {cleanBody}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-cyan-400/90 truncate">
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{cleanUrl}</span>
                </div>
              </div>
            </div>

            {tag && (
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Tag: #{tag}</span>
                <span className="text-slate-500">Service Worker Dispatched</span>
              </div>
            )}
          </div>
        ) : (
          /* Mobile Push Drawer Banner (Android / iOS Web Push) */
          <div className="w-full max-w-xs rounded-xl border border-slate-700/70 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-cyan-600 flex items-center justify-center text-white text-[9px] font-bold">
                  S
                </div>
                <span className="font-medium text-slate-200">Soochak Push</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500">Now</span>
              </div>
            </div>
            <h4 className="text-xs font-semibold text-white leading-tight">
              {cleanTitle}
            </h4>
            <p className="mt-1 text-xs text-slate-300 line-clamp-2 leading-normal">
              {cleanBody}
            </p>
            <div className="mt-2 text-[10px] text-slate-400 font-mono flex items-center gap-1 truncate">
              <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">{cleanUrl}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
        <span>Delivery model: W3C Push API / Web Push Protocol RFC 8030</span>
        <span className="font-mono text-slate-500">AES-128-GCM encrypted payload</span>
      </div>
    </div>
  );
};
