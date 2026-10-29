/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Push Subscribers Management
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Trash2,
  Tag,
  Shield,
  Key,
  Calendar,
  Monitor,
  RefreshCw,
  Plus,
  AlertTriangle,
  Info,
  ExternalLink,
} from 'lucide-react';
import { webPushService } from '../services/apiAdapters';
import type { PushSubscriber } from '../types';
import { EndpointMask } from '../components/common/EndpointMask';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { StatusBadge } from '../components/common/StatusBadge';

export const SubscribersPage: React.FC = () => {
  const [subscribers, setSubscribers] = useState<PushSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Deletion modal state
  const [subscriberToDelete, setSubscriberToDelete] = useState<PushSubscriber | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New simulated test subscriber modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState('');
  const [newTag, setNewTag] = useState('product_updates');

  const loadSubscribers = async () => {
    setLoading(true);
    try {
      const data = await webPushService.listSubscribers();
      setSubscribers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscribers();
  }, []);

  const tags = ['all', ...Array.from(new Set(subscribers.map((s) => s.tag).filter(Boolean) as string[]))];

  const filtered = subscribers.filter((sub) => {
    if (selectedTag !== 'all' && sub.tag !== selectedTag) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        sub.endpoint.toLowerCase().includes(q) ||
        (sub.origin && sub.origin.toLowerCase().includes(q)) ||
        (sub.userAgent && sub.userAgent.toLowerCase().includes(q)) ||
        (sub.tag && sub.tag.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleDeleteConfirm = async () => {
    if (!subscriberToDelete) return;
    setIsDeleting(true);
    try {
      await webPushService.deleteSubscriberByEndpoint(subscriberToDelete.endpoint);
      setSubscribers(subscribers.filter((s) => s.endpoint !== subscriberToDelete.endpoint));
      setSubscriberToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRegisterTestSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await webPushService.createSubscriber({
      endpoint:
        newEndpoint.trim() ||
        `https://fcm.googleapis.com/fcm/send/test_${Date.now().toString(36)}_${Math.random().toString(36).substring(7)}`,
      keys: {
        p256dh: 'BNcDemoBrowserPublicKey_' + Math.random().toString(36).substring(7),
        auth: 'AuthKey_' + Math.random().toString(36).substring(7),
      },
      tag: newTag.trim() || 'general',
      origin: window.location.origin,
      userAgent: navigator.userAgent,
    });
    setSubscribers([created, ...subscribers]);
    setShowAddModal(false);
    setNewEndpoint('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>Push Subscribers</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Registered browser push subscription endpoints and cryptographic key material.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadSubscribers}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Test Subscriber</span>
          </button>
        </div>
      </div>

      {/* Safe Endpoint Reveal Policy Banner */}
      <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-slate-300 flex items-start gap-3">
        <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">
            Endpoint Privacy & Token Masking Standard
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Per Soochak specifications, raw push service token identifiers are masked by default to protect end-user subscription tokens from accidental shoulder surfing or log leakage. Click the <span className="text-cyan-400 font-mono">eye icon</span> to deliberately reveal the full endpoint URL.
          </p>
        </div>
      </div>

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
            placeholder="Search endpoint host, tag, or user agent..."
            className="block w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] text-slate-500 mr-1 flex items-center gap-1 shrink-0">
            <Tag className="w-3 h-3" />
            Segment:
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
              {t === 'all' ? 'All Segments' : `#${t}`}
            </button>
          ))}
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>Active Subscribers ({filtered.length})</span>
          <span className="text-[11px] font-mono text-slate-500">Method: DELETE /web-push/subscriber</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs space-y-2">
            <Users className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No subscribers found matching the criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/60 text-[11px] font-semibold text-slate-400">
                  <th className="py-3 px-4">Endpoint (W3C Push Service)</th>
                  <th className="py-3 px-4">Tag</th>
                  <th className="py-3 px-4">Origin & Client</th>
                  <th className="py-3 px-4">Keys (p256dh / auth)</th>
                  <th className="py-3 px-4">Subscribed</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((sub) => (
                  <tr
                    key={sub._id}
                    className="hover:bg-slate-900/80 transition group"
                  >
                    <td className="py-3 px-4 max-w-xs">
                      <EndpointMask endpoint={sub.endpoint} />
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {sub.tag ? (
                        <span className="font-mono text-[11px] text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/40">
                          #{sub.tag}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">unassigned</span>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate font-mono text-[11px] text-slate-300">
                      <div className="truncate text-slate-200">{sub.origin || 'https://bizbandhan.com'}</div>
                      <div className="text-slate-500 text-[10px] truncate max-w-xs">
                        {sub.userAgent || 'Web Push Client'}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Key className="w-3 h-3 text-slate-500" />
                        <span>p256dh: {sub.keys?.p256dh ? sub.keys.p256dh.slice(0, 8) + '...' : 'present'}</span>
                      </div>
                      <div className="text-slate-500">auth: {sub.keys?.auth ? sub.keys.auth.slice(0, 6) + '...' : 'present'}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSubscriberToDelete(sub)}
                        className="text-slate-400 hover:text-red-400 p-1.5 rounded hover:bg-red-950/40 transition"
                        title="Delete subscriber endpoint"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete / Unsubscribe Confirmation Modal */}
      <ConfirmModal
        isOpen={!!subscriberToDelete}
        title="Confirm Subscriber Deletion"
        message="Are you sure you want to remove and unsubscribe this push endpoint? The subscriber device will no longer receive Web Push notifications emitted by your organization."
        subMessage={subscriberToDelete ? `Endpoint: ${subscriberToDelete.endpoint.slice(0, 48)}...` : undefined}
        confirmLabel="Delete Subscriber"
        cancelLabel="Keep Subscriber"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setSubscriberToDelete(null)}
      />

      {/* Register Test Subscriber Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">
              Register New Test Push Subscriber
            </h3>
            <p className="text-xs text-slate-400">
              Simulates a browser device calling <code className="text-cyan-300 font-mono">PUT /web-push/subscriber</code> with W3C PushSubscription credentials.
            </p>

            <form onSubmit={handleRegisterTestSubscriber} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300">Push Endpoint (leave blank for auto-generated FCM URL)</label>
                <input
                  type="text"
                  value={newEndpoint}
                  onChange={(e) => setNewEndpoint(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-cyan-300 focus:ring-1 focus:ring-cyan-500"
                  placeholder="https://fcm.googleapis.com/fcm/send/..."
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300">Audience Tag</label>
                <input
                  type="text"
                  required
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-white focus:ring-1 focus:ring-cyan-500"
                  placeholder="product_updates"
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
                  Create Subscriber (PUT)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
