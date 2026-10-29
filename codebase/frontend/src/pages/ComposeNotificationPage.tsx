/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Compose & Dispatch Web Push Notification
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Send,
  Bell,
  Globe,
  Tag,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { webPushService } from '../services/apiAdapters';
import { useAuth } from '../context/AuthContext';
import { NotificationPreview } from '../components/common/NotificationPreview';
import { ConfirmModal } from '../components/common/ConfirmModal';
import type { NotificationPayload } from '../types';

export const ComposeNotificationPage: React.FC = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  // Form Fields
  const [title, setTitle] = useState('New Product Announcement');
  const [body, setBody] = useState('Explore the latest real-time push notification features released today in your BizBandhan dashboard.');
  const [url, setUrl] = useState(organization?.canonicalOrigin || 'https://bizbandhan.com');
  const [tag, setTag] = useState('product_updates');
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'tag'>('tag');

  // Confirmation modal & emission states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isEmitting, setIsEmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emissionResult, setEmissionResult] = useState<{
    success: boolean;
    notificationId: string;
    message: string;
    persistedAt: string;
  } | null>(null);

  useEffect(() => {
    if (organization?.canonicalOrigin && url === 'https://bizbandhan.com') {
      setUrl(organization.canonicalOrigin);
    }
  }, [organization]);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Please specify a notification title.');
      return;
    }
    if (!body.trim()) {
      setErrorMsg('Please write the notification body message.');
      return;
    }
    if (!url.trim()) {
      setErrorMsg('Please specify a destination click URL.');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSend = async () => {
    setIsEmitting(true);
    setErrorMsg(null);

    const payload: NotificationPayload = {
      title: title.trim(),
      body: body.trim(),
      url: url.trim(),
      tag: audienceFilter === 'tag' ? tag.trim() : undefined,
    };

    try {
      const res = await webPushService.notify(payload);
      setEmissionResult(res);
      setShowConfirmModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to emit push notification.');
      setShowConfirmModal(false);
    } finally {
      setIsEmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-cyan-400" />
            <span>Compose Web Push Notification</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Dispatch W3C Push API messages across all registered browser subscriber endpoints.
          </p>
        </div>

        <Link
          to="/notifications"
          className="text-xs text-slate-400 hover:text-white transition"
        >
          View notification history
        </Link>
      </div>

      {emissionResult ? (
        /* Accepted for Processing Outcome Banner */
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Notification Accepted for Processing
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Event ID: {emissionResult.notificationId} · Persisted at: {new Date(emissionResult.persistedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-cyan-900/60 bg-cyan-950/30 text-xs text-cyan-200 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-cyan-300">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Event Emitted & Ingestion Pipeline Queued</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              {emissionResult.message}
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              <strong>Architectural Note:</strong> As documented in the OpenAPI contract, the server returns 200/202 confirmation upon persisting the payload and emitting the async push event. This acknowledges receipt by the Soochak gateway, but does not represent proof of end-user screen display (which depends on subscriber browser connectivity and OS permissions).
            </p>
          </div>

          <div className="border-t border-slate-800 pt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setEmissionResult(null);
                setTitle('');
                setBody('');
              }}
              className="px-4 py-2 rounded border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
            >
              Compose Another Notification
            </button>

            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="flex items-center gap-2 px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition shadow-sm"
            >
              <span>View in History</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Compose Form + Split Live Preview */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Form */}
          <form onSubmit={handleOpenConfirm} className="space-y-5">
            {errorMsg && (
              <div className="p-3 rounded-lg border border-red-800/60 bg-red-950/40 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                1. Notification Content (RFC 8030 Payload)
              </h3>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-300">
                    Title *
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {title.length}/65 chars
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  placeholder="e.g. Critical Security Update"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-300">
                    Body Message *
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {body.length}/240 chars
                  </span>
                </div>
                <textarea
                  required
                  rows={3}
                  maxLength={300}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500 leading-relaxed"
                  placeholder="Summary text displayed inside the system notification banner..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Target Click URL *
                </label>
                <div className="mt-1 flex rounded-md shadow-xs">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-700 bg-slate-950 text-slate-500 text-xs">
                    <Globe className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="block w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-r-md text-cyan-300 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                    placeholder="https://bizbandhan.com/feature"
                  />
                </div>
              </div>
            </div>

            {/* Audience Targeting */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center justify-between">
                <span>2. Audience Targeting</span>
                <span className="text-[11px] font-mono text-slate-400 lowercase font-normal">
                  PUT /web-push/notify
                </span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setAudienceFilter('all')}
                  className={`p-3 rounded-lg border text-left transition ${
                    audienceFilter === 'all'
                      ? 'bg-cyan-950/60 border-cyan-700 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <p className="font-semibold text-xs">All Active Subscribers</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Broadcast to every subscriber in this organization
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAudienceFilter('tag')}
                  className={`p-3 rounded-lg border text-left transition ${
                    audienceFilter === 'tag'
                      ? 'bg-cyan-950/60 border-cyan-700 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <p className="font-semibold text-xs">Filter by Tag</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Target a specific subscriber segment tag
                  </p>
                </button>
              </div>

              {audienceFilter === 'tag' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Subscriber Tag
                  </label>
                  <div className="mt-1 flex rounded-md">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-700 bg-slate-950 text-slate-500 text-xs font-mono">
                      #
                    </span>
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      className="block w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-r-md text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                      placeholder="e.g. product_updates, dev_alerts"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Review Audience & Emit Notification</span>
            </button>
          </form>

          {/* Right Column: Live Interactive Preview */}
          <div className="space-y-4">
            <NotificationPreview
              title={title}
              body={body}
              url={url}
              tag={audienceFilter === 'tag' ? tag : undefined}
              origin={organization?.canonicalOrigin ? new URL(organization.canonicalOrigin).hostname : 'bizbandhan.com'}
            />

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-slate-400 space-y-2">
              <span className="font-semibold text-slate-300 block">
                Ingestion Contract Specifications:
              </span>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
                <li>Method: <code className="text-cyan-300 font-mono">PUT /web-push/notify</code></li>
                <li>Payload includes <code className="text-cyan-300 font-mono">title</code>, <code className="text-cyan-300 font-mono">body</code>, <code className="text-cyan-300 font-mono">url</code>, and optional <code className="text-cyan-300 font-mono">tag</code>.</li>
                <li>Emission persists message and releases worker delivery event.</li>
                <li>Web Push router currently has no frontend-enforced auth middleware; API server validates origin scope.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Explicit Audience & Send Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="Confirm Notification Dispatch"
        message={`Are you sure you want to emit this Web Push notification? It will be sent to ${
          audienceFilter === 'tag'
            ? `subscribers tagged with #${tag}`
            : 'all registered subscribers across your organization'
        }.`}
        subMessage={`Payload: "${title}" -> ${url}`}
        confirmLabel="Emit Notification Event"
        cancelLabel="Back to Editing"
        isLoading={isEmitting}
        onConfirm={handleConfirmSend}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
};
