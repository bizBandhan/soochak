/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Sites, Resources & SDK Integration
 */

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Code,
  Copy,
  Check,
  ExternalLink,
  Users,
  Server,
  Layers,
  FileCode,
} from 'lucide-react';
import { sitesService, webPushService } from '../services/apiAdapters';
import type { SiteResource, PublicVapidConfig } from '../types';
import { CodeSnippet } from '../components/common/CodeSnippet';
import { StatusBadge } from '../components/common/StatusBadge';

export const SitesResourcesPage: React.FC = () => {
  const [sites, setSites] = useState<SiteResource[]>([]);
  const [vapidConfig, setVapidConfig] = useState<PublicVapidConfig | null>(null);
  const [selectedSite, setSelectedSite] = useState<SiteResource | null>(null);
  const [loading, setLoading] = useState(true);

  // New site modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteOrigin, setNewSiteOrigin] = useState('');
  const [newWorkerPath, setNewWorkerPath] = useState('/sw.js');
  const [newQuota, setNewQuota] = useState(15000);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sitesData, config] = await Promise.all([
        sitesService.listSites(),
        webPushService.getConfig(),
      ]);
      setSites(sitesData);
      setVapidConfig(config);
      if (sitesData.length > 0 && !selectedSite) {
        setSelectedSite(sitesData[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName || !newSiteOrigin) return;

    const created = await sitesService.addSite({
      name: newSiteName.trim(),
      origin: newSiteOrigin.trim(),
      serviceWorkerPath: newWorkerPath.trim() || '/sw.js',
      subscriberLimit: Number(newQuota),
    });

    setSites([...sites, created]);
    setSelectedSite(created);
    setShowAddModal(false);
    setNewSiteName('');
    setNewSiteOrigin('');
  };

  const clientIntegrationCode = `// 1. Client-Side Browser Subscription Code
// Place in your website frontend bundle (e.g., app.js / index.html)

const SOOCHAK_PUBLIC_VAPID_KEY = "${vapidConfig?.publicKey || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgD...'}";

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerSoochakSubscriber(subscriberTag = 'product_updates') {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Web Push is not supported in this browser.');
    return;
  }

  // Register or reuse your existing service worker
  const registration = await navigator.serviceWorker.register('${selectedSite?.serviceWorkerPath || '/sw.js'}');
  await navigator.serviceWorker.ready;

  // Request notification permissions
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('Push notification permission denied by user.');
    return;
  }

  // Subscribe with public VAPID key
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlB64ToUint8Array(SOOCHAK_PUBLIC_VAPID_KEY),
  });

  // Transmit subscription to Soochak API
  const response = await fetch('/api/v1/web-push/subscriber', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
        auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth')))),
      },
      tag: subscriberTag,
      origin: window.location.origin,
    }),
  });

  return await response.json();
}`;

  const workerPreservationCode = `// 2. Service Worker Integration (Preserving Your Existing SW)
// Append this block to your existing Service Worker (${selectedSite?.serviceWorkerPath || '/sw.js'})
// OR load it cleanly at the top of your worker via: importScripts('/soochak-worker.js');

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || 'Soochak Notification';
    const options = {
      body: payload.body || '',
      icon: payload.icon || '/icon.png',
      badge: payload.badge || '/badge.png',
      tag: payload.tag || 'soochak-push',
      data: {
        url: payload.url || '/',
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    // Plain text fallback
    event.waitUntil(
      self.registration.showNotification('Notification', {
        body: event.data.text(),
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <span>Sites & Allowed Origins</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Configure client web applications, allowed origin scopes, and safe Service Worker push listeners.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Website Origin</span>
        </button>
      </div>

      {/* Preservation Rule Banner */}
      <div className="p-4 rounded-xl border border-cyan-900/60 bg-cyan-950/30 text-xs text-cyan-200 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-cyan-300">
            Customer Service Worker Preservation Policy
          </p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Soochak enforces non-destructive integrations. Integrating push notifications must never silently replace, unregister, or blow away a customer's existing Service Worker (caching, offline sync, Workbox, PWAs). Instead, append the push event listener to the existing worker script or invoke it via <code className="text-cyan-300 font-mono">importScripts()</code>.
          </p>
        </div>
      </div>

      {/* Split View: Sites List + Detail Integration Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Sites List */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
            Registered Sites & Origins ({sites.length})
          </div>

          <div className="space-y-2">
            {sites.map((site) => {
              const isSelected = selectedSite?._id === site._id;
              return (
                <button
                  key={site._id}
                  type="button"
                  onClick={() => setSelectedSite(site)}
                  className={`w-full text-left p-3.5 rounded-xl border transition ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500/60 shadow-xs'
                      : 'bg-slate-900/50 border-slate-800 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white truncate">
                      {site.name}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/40">
                      Active
                    </span>
                  </div>

                  <div className="mt-1 font-mono text-[11px] text-cyan-400 truncate">
                    {site.origin}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-500" />
                      {site.subscriberCount.toLocaleString()} subs
                    </span>
                    <span>Limit: {site.subscriberLimit.toLocaleString()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Integration Instructions & Public Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {selectedSite ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-semibold text-white">
                    {selectedSite.name}
                  </h2>
                  <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 mt-0.5">
                    <span>Origin: {selectedSite.origin}</span>
                    <span aria-hidden="true">·</span>
                    <span>Worker: {selectedSite.serviceWorkerPath}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status="connected" label="Origin Allowed" />
                </div>
              </div>

              {/* Public VAPID Configuration */}
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                  <span>Public VAPID Application Server Key</span>
                  <span className="text-[10px] font-mono text-slate-500">GET /web-push/config</span>
                </span>
                <p className="font-mono text-xs text-cyan-300 break-all select-all p-2 rounded bg-slate-900/90 border border-slate-800">
                  {vapidConfig?.publicKey || 'Loading VAPID key...'}
                </p>
                <p className="text-[10px] text-slate-500">
                  Safe for public inclusion in client JavaScript. Zero private key material is returned or stored in client code.
                </p>
              </div>

              {/* Code Snippets */}
              <div className="space-y-4">
                <CodeSnippet
                  title="Step 1: Frontend Browser Subscription Helper"
                  language="javascript"
                  code={clientIntegrationCode}
                />

                <CodeSnippet
                  title="Step 2: Service Worker Push Event Handler"
                  language="javascript"
                  code={workerPreservationCode}
                  isServiceWorkerSafeNotice={true}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center text-xs text-slate-400">
              Select a site to view integration instructions.
            </div>
          )}
        </div>
      </div>

      {/* Add Site Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">
              Add New Website Origin
            </h3>

            <form onSubmit={handleCreateSite} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300">Site Name *</label>
                <input
                  type="text"
                  required
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:ring-1 focus:ring-cyan-500"
                  placeholder="e.g. Customer Portal"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300">Allowed Origin (FQDN) *</label>
                <input
                  type="url"
                  required
                  value={newSiteOrigin}
                  onChange={(e) => setNewSiteOrigin(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-cyan-300 focus:ring-1 focus:ring-cyan-500"
                  placeholder="https://portal.example.com"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300">Service Worker Path</label>
                <input
                  type="text"
                  required
                  value={newWorkerPath}
                  onChange={(e) => setNewWorkerPath(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-white focus:ring-1 focus:ring-cyan-500"
                  placeholder="/sw.js"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300">Subscriber Quota Limit</label>
                <input
                  type="number"
                  required
                  value={newQuota}
                  onChange={(e) => setNewQuota(Number(e.target.value))}
                  className="mt-1 block w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-white focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
                >
                  Save Allowed Origin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
