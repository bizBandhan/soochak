/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Dashboard Overview Page
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Bell,
  Send,
  Globe,
  Radio,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { webPushService, sitesService } from '../services/apiAdapters';
import type { PushSubscriber, NotificationRecord, SiteResource } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const DashboardOverviewPage: React.FC = () => {
  const { organization } = useAuth();

  const [subscribers, setSubscribers] = useState<PushSubscriber[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [sites, setSites] = useState<SiteResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [subs, notifsData, sitesList] = await Promise.all([
        webPushService.listSubscribers(),
        webPushService.listNotifications(),
        sitesService.listSites(),
      ]);
      setSubscribers(subs);
      setNotifications(notifsData.records);
      setSites(sitesList);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalSubscribers = subscribers.length;
  const subscriberLimit = organization?.limits?.maxSubscribers;
  const dailyQuota = organization?.limits?.maxNotificationsPerDay;

  return (
    <div className="space-y-6">
      {loadError && <p role="alert" className="text-xs text-red-400">{loadError}</p>}
      {/* Top Banner: Organization Context & Hostname Notice */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white tracking-tight">
              {organization?.name || 'Organization unavailable'}
            </h1>
            <StatusBadge
              status={organization?.status === 'active' ? 'active' : 'pending_provisioning'}
            />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>Canonical:</span>
            <span className="font-mono text-cyan-300">
              {organization?.canonicalOrigin || 'Not configured'}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Hostname Verification:</span>
            <span className="text-amber-400 font-medium">Unavailable (API Planned)</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={loadData}
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

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Push Subscribers</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold font-mono tabular-nums text-white">
            {loadError ? 'Unavailable' : totalSubscribers.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            Limit: {subscriberLimit?.toLocaleString() ?? 'Unavailable'} subscribers
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Web Sites</span>
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold font-mono tabular-nums text-white">
            {loadError ? 'Unavailable' : sites.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Allowed origins registered
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Saved Notifications</span>
            <Bell className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold font-mono tabular-nums text-white">
            {loadError ? 'Unavailable' : notifications.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            Daily limit: {dailyQuota?.toLocaleString() ?? 'Unavailable'}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Push Delivery Pipeline</span>
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Provider status in history</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            Device delivery and clicks: next version
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Recent Notifications & Quick Site Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Recent Notifications History */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">
                Recent Emitted Notifications
              </h2>
            </div>
            <Link
              to="/notifications"
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
            >
              <span>View full history</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <Bell className="w-8 h-8 text-slate-600 mx-auto" />
              <p>No notifications have been emitted yet for this organization.</p>
              <Link
                to="/notifications/compose"
                className="inline-flex items-center gap-1 text-cyan-400 hover:underline pt-1"
              >
                <span>Compose your first push notification</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {notifications.map((item) => (
                <div key={item._id} className="py-3.5 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-semibold text-white truncate">
                        {item.title}
                      </h3>
                      {item.tag && (
                        <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/40">
                          #{item.tag}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-1">
                      {item.body}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      <span>{new Date(item.acceptedAt).toLocaleTimeString()}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{item.url}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <StatusBadge
                      status="accepted"
                      label="Saved"
                    />
                    <div className="mt-1 text-[10px] text-slate-500 font-mono">
                      See history for provider status
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (1 span): Organization Integration Status & Service Worker Notice */}
        <div className="space-y-6">
          {/* Sites & Allowed Origins Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Integrated Sites</span>
              </h2>
              <Link
                to="/sites"
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Manage
              </Link>
            </div>

            <div className="space-y-3">
              {sites.map((site) => (
                <div
                  key={site._id}
                  className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {site.name}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded">
                      Active
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-cyan-300 truncate">
                    {site.origin}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
                    <span>{site.subscriberCount == null ? 'Site registered' : `${site.subscriberCount.toLocaleString()} subs`}</span>
                    <span>Worker: {site.serviceWorkerPath}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                to="/sites"
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-slate-800/60 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white border border-slate-700/60 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Allowed Origin</span>
              </Link>
            </div>
          </div>

          {/* Service Worker Preservation Callout */}
          <div className="rounded-xl border border-cyan-900/50 bg-cyan-950/20 p-4 space-y-2 text-xs text-cyan-200">
            <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>Preserve Existing Service Workers</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Soochak integration attaches listener events to your existing <code>sw.js</code> or imports scripts via <code>importScripts('/soochak-worker.js')</code>. It never replaces your application caching or offline worker logic.
            </p>
          </div>
        </div>
      </div>

      {/* Backend API Contract Implementation Status Grid */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-white">
              API Contract Capabilities & Mounting Matrix
            </h2>
            <p className="text-xs text-slate-400">
              State of backend endpoints according to attached OpenAPI contract specifications.
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500">Base: /api/v1</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-cyan-400 font-semibold">PUT /web-push/notify</span>
              <StatusBadge status="connected" label="Connected" />
            </div>
            <p className="text-[11px] text-slate-400">
              Saves notification and starts in-process provider dispatch.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-cyan-400 font-semibold">GET /web-push/config</span>
              <StatusBadge status="connected" label="Connected" />
            </div>
            <p className="text-[11px] text-slate-400">
              Supplies public VAPID key. Private key never exposed.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-cyan-400 font-semibold">/web-push/subscriber</span>
              <StatusBadge status="connected" label="Connected" />
            </div>
            <p className="text-[11px] text-slate-400">
              GET, POST, PUT collection and GET, PUT, DELETE, PATCH by id.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-amber-400 font-semibold">GET /web-push/notify</span>
              <StatusBadge status="connected" label="Records available" />
            </div>
            <p className="text-[11px] text-slate-400">
              Reads saved notifications; provider outcomes are shown in history.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-amber-400 font-semibold">/auth/user, role, perm</span>
              <StatusBadge status="unavailable" label="Mutations Disabled" />
            </div>
            <p className="text-[11px] text-slate-400">
              Administration UI is unavailable.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-amber-400 font-semibold">Hostname Verification</span>
              <StatusBadge status="unverified" label="API Unavailable" />
            </div>
            <p className="text-[11px] text-slate-400">
              Automated domain check is planned; honest status shown.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
