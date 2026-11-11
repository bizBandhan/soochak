/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Sites, Resources & SDK Integration
 */

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Download, Globe, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { sitesService, webPushService } from '../services/apiAdapters';
import { createClientScript, downloadScript, workerScript } from '../services/integrationKit';
import type { SiteResource, PublicVapidConfig } from '../types';
import { CodeSnippet } from '../components/common/CodeSnippet';
import { ConfirmModal } from '../components/common/ConfirmModal';

type SiteFormValues = Pick<SiteResource, 'name' | 'origin' | 'serviceWorkerPath'>;

export const SitesResourcesPage: React.FC = () => {
  const [sites, setSites] = useState<SiteResource[]>([]);
  const [config, setConfig] = useState<PublicVapidConfig | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SiteFormValues>({
    defaultValues: { name: '', origin: '', serviceWorkerPath: '/sw.js' },
  });
  const selected = sites.find((site) => site._id === selectedId);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [siteList, publicConfig] = await Promise.all([sitesService.listSites(), webPushService.getConfig()]);
        if (!active) return;
        setSites(siteList);
        setSelectedId(siteList[0]?._id ?? null);
        setConfig(publicConfig);
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load sites.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const addSite = async (values: SiteFormValues) => {
    setError(null);
    try {
      const created = await sitesService.addSite({
        name: values.name.trim(), origin: values.origin.trim(), serviceWorkerPath: values.serviceWorkerPath.trim(),
      });
      setSites((current) => [...current, created]);
      setSelectedId(created._id);
      setShowAdd(false);
      reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save site.');
    }
  };

  const deleteSite = async () => {
    if (!selected) return;
    setDeleting(true);
    setError(null);
    try {
      await sitesService.deleteSite(selected._id);
      const remaining = sites.filter((site) => site._id !== selected._id);
      setSites(remaining);
      setSelectedId(remaining[0]?._id ?? null);
      setShowDelete(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove site.');
    } finally {
      setDeleting(false);
    }
  };

  const clientScript = config?.publicKey
    ? createClientScript(window.location.origin, config.publicKey) : null;
  const inputClass = 'mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white';
  const buttonClass = 'inline-flex items-center gap-2 px-3 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs disabled:opacity-50';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Globe className="w-5 h-5" /> Sites & Allowed Origins</h1>
          <p className="mt-1 text-xs text-slate-400">Register exact HTTPS origins for this workspace's public push API.</p>
        </div>
        <button type="button" className={buttonClass} onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Website Origin</button>
      </div>
      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
      <div className="p-4 rounded-xl border border-cyan-900/60 bg-cyan-950/30 text-xs text-cyan-200 flex gap-3">
        <ShieldAlert className="w-5 h-5 shrink-0" />
        <p>Keep existing Service Workers. If the site already handles push or notification clicks, merge the downloaded handlers rather than adding duplicate listeners. Origin access is not domain ownership verification.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase text-slate-400">Registered origins ({sites.length})</h2>
          {loading && <p className="text-xs text-slate-400">Loading sites...</p>}
          {!loading && !sites.length && <p className="text-xs text-slate-400">No sites registered.</p>}
          {sites.map((site) => (
            <button type="button" key={site._id} onClick={() => setSelectedId(site._id)}
              className={`w-full text-left p-3 rounded-lg border ${selectedId === site._id ? 'border-cyan-500 bg-slate-900' : 'border-slate-800 bg-slate-900/50'}`}>
              <span className="block text-xs font-semibold text-white">{site.name}</span>
              <span className="block mt-1 text-xs text-cyan-400 break-all">{site.origin}</span>
            </button>
          ))}
        </div>
        <div className="lg:col-span-2">
          {selected ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-5">
              <div className="flex justify-between gap-3">
                <div><h2 className="text-sm font-semibold text-white">{selected.name}</h2><p className="text-xs text-cyan-400 break-all">{selected.origin}</p></div>
                <button type="button" onClick={() => setShowDelete(true)} className="text-red-400 text-xs flex items-center gap-1"><Trash2 className="w-4 h-4" /> Remove</button>
              </div>
              <p className="text-xs text-slate-300">Public VAPID key: <span className="font-mono break-all text-cyan-300">{config?.publicKey || 'Unavailable'}</span></p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={buttonClass} disabled={!clientScript} onClick={() => clientScript && downloadScript('soochak-client.js', clientScript)}><Download className="w-4 h-4" /> Download client JavaScript</button>
                <button type="button" className={buttonClass} onClick={() => downloadScript('soochak-worker.js', workerScript)}><Download className="w-4 h-4" /> Download worker handler</button>
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <p><strong>Existing worker:</strong> host the handler on your site and add <code>importScripts('/soochak-worker.js')</code> to your existing classic worker, or merge its handlers. For module workers, merge or import it as a module.</p>
                <p><strong>No worker:</strong> host the downloaded handler at <code>{selected.serviceWorkerPath}</code>, then register that path on your site. Do not register it over an existing worker.</p>
                <p>Host the client as an ES module and call <code>subscribeSoochak()</code> from a user click after your worker is registered. Call <code>unsubscribeSoochak()</code> to remove the subscription.</p>
                <p>The Service Worker scope must cover the page running the client. The subscriber ID is saved in that browser's local storage for unsubscription.</p>
                <p>A worker can have only one push subscription: the helper will refuse to replace a subscription using another VAPID key.</p>
                <p>Each site origin must be registered separately. CORS is not authentication; public subscription endpoints remain reachable by non-browser clients.</p>
              </div>
              <CodeSnippet title="Example integration" code={`// Only when your site does not already have a Service Worker:
if (!(await navigator.serviceWorker.getRegistration())) {
  await navigator.serviceWorker.register(${JSON.stringify(selected.serviceWorkerPath)});
}

// Host soochak-client.js on your site and wire this to a user action.
import { subscribeSoochak, unsubscribeSoochak } from '/soochak-client.js';
document.querySelector('#subscribe').addEventListener('click', async () => {
  try { await subscribeSoochak(); } catch (error) { console.error(error); }
});
document.querySelector('#unsubscribe').addEventListener('click', async () => {
  try { await unsubscribeSoochak(); } catch (error) { console.error(error); }
});`} />
              {clientScript && <CodeSnippet title="Client JavaScript" code={clientScript} />}
              <CodeSnippet title="Worker handler" code={workerScript} isServiceWorkerSafeNotice />
            </div>
          ) : <p className="text-xs text-slate-400">Select or add a site to view integration instructions.</p>}
        </div>
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <form onSubmit={handleSubmit(addSite)} className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-3 text-xs">
            <h2 className="text-sm font-semibold text-white">Add Website Origin</h2>
            <label className="block text-slate-300">Site name
              <input className={inputClass} {...register('name', { required: 'Site name is required.' })} />
              {errors.name && <span role="alert" className="text-red-400">{errors.name.message}</span>}
            </label>
            <label className="block text-slate-300">HTTPS origin
              <input type="url" className={inputClass} placeholder="https://example.com" {...register('origin', { required: 'Origin is required.' })} />
              {errors.origin && <span role="alert" className="text-red-400">{errors.origin.message}</span>}
            </label>
            <label className="block text-slate-300">Service Worker path
              <input className={inputClass} {...register('serviceWorkerPath', { required: 'Service Worker path is required.' })} />
              {errors.serviceWorkerPath && <span role="alert" className="text-red-400">{errors.serviceWorkerPath.message}</span>}
            </label>
            {error && <p role="alert" className="text-red-400">{error}</p>}
            <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowAdd(false)} className="text-slate-300">Cancel</button><button type="submit" disabled={isSubmitting} className={buttonClass}>Save origin</button></div>
          </form>
        </div>
      )}
      <ConfirmModal isOpen={showDelete} title="Remove allowed origin" message={`Remove ${selected?.origin}? New cross-origin subscriptions and unsubscriptions from this site will be blocked. Existing subscriptions remain.`}
        confirmLabel="Remove origin" isDestructive isLoading={deleting} onConfirm={() => void deleteSite()} onCancel={() => setShowDelete(false)} />
    </div>
  );
};
