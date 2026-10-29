/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Notifications History & Detail View
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Send,
  Info,
  Clock,
  ExternalLink,
  Tag,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronRight,
  X,
  Layers,
} from 'lucide-react';
import { webPushService } from '../services/apiAdapters';
import type { NotificationRecord } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendUnderDev, setBackendUnderDev] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [activeRecord, setActiveRecord] = useState<NotificationRecord | null>(null);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await webPushService.listNotifications();
      setNotifications(res.records);
      setBackendUnderDev(res.backendUnderDevelopment);
      if (res.records.length > 0 && !activeRecord) {
        setActiveRecord(res.records[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const tags = ['all', ...Array.from(new Set(notifications.map((n) => n.tag).filter(Boolean) as string[]))];

  const filtered = notifications.filter((item) => {
    if (selectedTag !== 'all' && item.tag !== selectedTag) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            <span>Push Notifications History</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Log of emitted Web Push notifications, audience tagging, and ingestion status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadNotifications}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/notifications/compose"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Compose Push</span>
          </Link>
        </div>
      </div>

      {/* Distinction Callout */}
      <div className="p-4 rounded-xl border border-cyan-900/60 bg-cyan-950/30 text-xs text-cyan-200 flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-cyan-300">
            Architecture Notice: Ingestion vs End-User Display
          </p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Per the Soochak contract, dispatching a notification via <code className="text-cyan-300 font-mono">PUT /web-push/notify</code> persists the message record and emits an asynchronous delivery event to push services (Apple APNs, Google FCM, Mozilla autopush). Status <span className="font-mono text-cyan-300">"Accepted for Processing"</span> confirms queue acceptance and protocol fan-out, but does not guarantee client device screen display (which depends on subscriber device power state, OS notification permissions, and network availability).
          </p>
        </div>
      </div>

      {backendUnderDev && (
        <div className="p-3 rounded-lg border border-amber-900/40 bg-amber-950/30 text-xs text-amber-200/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Backend Route Status: <code className="font-mono text-amber-300">GET /web-push/notify</code> returns 502 in the current server release. Client session logs are displayed.
            </span>
          </div>
          <StatusBadge status="planned" label="502 Backend Planned" />
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, body content, or URL..."
            className="block w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] text-slate-500 mr-1 flex items-center gap-1 shrink-0">
            <Tag className="w-3 h-3" />
            Tag:
          </span>
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTag(t)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition whitespace-nowrap shrink-0 ${
                selectedTag === t
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              {t === 'all' ? 'All Tags' : `#${t}`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Layout: Table and Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Notifications Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Emitted Notification Records ({filtered.length})</span>
            <span className="font-mono text-slate-500 text-[11px]">RFC 8030 Encrypted</span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <Bell className="w-8 h-8 text-slate-600 mx-auto" />
              <p>No notifications match the active filter or query.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/70">
              {filtered.map((item) => {
                const isSelected = activeRecord?._id === item._id;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setActiveRecord(item)}
                    className={`w-full text-left p-4 transition flex items-start justify-between gap-4 ${
                      isSelected
                        ? 'bg-slate-800/50 border-l-2 border-cyan-400'
                        : 'hover:bg-slate-900/70'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white truncate">
                          {item.title}
                        </span>
                        {item.tag && (
                          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800/40">
                            #{item.tag}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400 line-clamp-1">
                        {item.body}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                        <span>{new Date(item.acceptedAt).toLocaleString()}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate max-w-[200px]">{item.url}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 text-right">
                      <div>
                        <StatusBadge
                          status="accepted"
                          label="Accepted"
                        />
                        <div className="mt-1 text-[10px] text-slate-500 font-mono">
                          ID: {item._id.slice(0, 8)}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Record Outcome & Detail Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 lg:sticky lg:top-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Notification Detail & Outcome
            </h2>
            {activeRecord && (
              <span className="font-mono text-[10px] text-slate-500">
                {activeRecord._id}
              </span>
            )}
          </div>

          {activeRecord ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">Notification Title</span>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {activeRecord.title}
                </p>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Body Message</span>
                <p className="mt-1 text-slate-200 leading-relaxed p-2.5 rounded bg-slate-950/80 border border-slate-800">
                  {activeRecord.body}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Click Destination URL:</span>
                  <a
                    href={activeRecord.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-cyan-400 hover:underline flex items-center gap-1 truncate max-w-[180px]"
                  >
                    <span className="truncate">{activeRecord.url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Audience Tag:</span>
                  <span className="font-mono text-slate-200">
                    {activeRecord.tag ? `#${activeRecord.tag}` : 'All Subscribers'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Ingestion Timestamp:</span>
                  <span className="font-mono text-slate-200">
                    {new Date(activeRecord.acceptedAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Ingestion Pipeline Status:</span>
                  <StatusBadge status="accepted" label="Accepted for Processing" />
                </div>
              </div>

              {/* Delivery Event Outcome Explanation */}
              <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Pipeline Event Dispatched</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {activeRecord.deliveryStats?.note ||
                    'Accepted by Soochak ingestion pipeline. Upstream push event dispatched to subscriber gateways.'}
                </p>
                <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Queued Target Count:</span>
                  <span className="text-slate-300">
                    {activeRecord.deliveryStats?.queuedCount || 'All'} recipients
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              Select a notification from the list to inspect delivery parameters and payload.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
