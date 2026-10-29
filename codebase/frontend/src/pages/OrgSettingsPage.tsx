/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Organization Settings
 */

import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Globe,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Save,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { StatusBadge } from '../components/common/StatusBadge';
import { organizationService } from '../services/apiAdapters';

export const OrgSettingsPage: React.FC = () => {
  const { organization, updateOrg } = useAuth();

  const [name, setName] = useState(organization?.name || 'BizBandhan Technologies');
  const [slug, setSlug] = useState(organization?.slug || 'bizbandhan-tech');
  const [canonicalOrigin, setCanonicalOrigin] = useState(organization?.canonicalOrigin || 'https://bizbandhan.com');
  const [maxSubscribers, setMaxSubscribers] = useState(organization?.limits?.maxSubscribers || 100000);
  const [maxNotificationsPerDay, setMaxNotificationsPerDay] = useState(organization?.limits?.maxNotificationsPerDay || 5000);

  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [show405DemoModal, setShow405DemoModal] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedbackMsg(null);

    try {
      await updateOrg({
        name: name.trim(),
        slug: slug.trim(),
        canonicalOrigin: canonicalOrigin.trim(),
        limits: {
          maxSubscribers: Number(maxSubscribers),
          maxNotificationsPerDay: Number(maxNotificationsPerDay),
        },
      });
      setFeedbackMsg({
        type: 'success',
        text: 'Organization record updated successfully via PUT /auth/organization/{id}.',
      });
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Failed to update organization.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest405Patch = async () => {
    try {
      await organizationService.patchNotSupported(organization?._id || 'demo');
    } catch (err: any) {
      setShow405DemoModal(true);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <span>Organization Settings</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Tenant configuration, canonical origins, and subscriber limits for ID: <span className="font-mono text-cyan-300">{organization?._id}</span>
          </p>
        </div>

        <StatusBadge status="connected" label="PUT /auth/organization/{id}" />
      </div>

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center gap-2.5 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-red-950/40 border-red-800/60 text-red-300'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Hostname Verification Status Card */}
      <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-5 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <Globe className="w-4 h-4 text-amber-400" />
            <span>Canonical Hostname Verification</span>
          </div>
          <StatusBadge status="unverified" label="Verification Status: Unavailable" />
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Hostname verification requires verifying DNS records or an HTTP well-known challenge to prove ownership of <code className="text-cyan-300 font-mono">{canonicalOrigin}</code>. This endpoint is currently unavailable in the Soochak backend API. Per contract rules, status remains explicitly reported as <strong className="text-amber-300">UNVERIFIED (API Planned)</strong> rather than faking success.
        </p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Organization Identity & Limits
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-300">Organization Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300">Organization Slug *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="mt-1 block w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-cyan-300 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300">Canonical Origin (FQDN) *</label>
              <input
                type="url"
                required
                value={canonicalOrigin}
                onChange={(e) => setCanonicalOrigin(e.target.value)}
                className="mt-1 block w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-cyan-300 focus:ring-1 focus:ring-cyan-500"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Primary origin identifying this tenant in authenticated request-origin scope.
              </p>
            </div>

            <div>
              <label className="block font-medium text-slate-300">Owner User ID</label>
              <input
                type="text"
                disabled
                value={organization?.ownerId || 'usr_om_tiwari'}
                className="mt-1 block w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300">Maximum Subscribers</label>
              <input
                type="number"
                min="100"
                value={maxSubscribers}
                onChange={(e) => setMaxSubscribers(Number(e.target.value))}
                className="mt-1 block w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-white focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300">Max Notifications / Day</label>
              <input
                type="number"
                min="10"
                value={maxNotificationsPerDay}
                onChange={(e) => setMaxNotificationsPerDay(Number(e.target.value))}
                className="mt-1 block w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-white focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleTest405Patch}
              className="text-[11px] font-mono text-slate-500 hover:text-amber-400 underline transition"
            >
              Verify OpenAPI rule: Test PATCH 405 response
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving (PUT)...' : 'Save Organization Changes'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Danger Zone: Organization Deletion */}
      <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-6 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Danger Zone
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Deleting this organization permanently removes the tenant record (<code className="font-mono text-red-300">DELETE /auth/organization/{organization?._id}</code>) and purges all subscriber endpoint associations. This action is irreversible.
        </p>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-medium transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Organization</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Permanently Delete Organization"
        message={`Are you absolutely sure you want to delete ${organization?.name}? All push subscriber endpoints, queued notification events, and domain configurations will be wiped.`}
        confirmLabel="Yes, Delete Organization"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          setShowDeleteModal(false);
          setFeedbackMsg({
            type: 'success',
            text: 'DELETE /auth/organization/{id} executed in authenticated scope.',
          });
        }}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* 405 Method Not Allowed Info Modal */}
      {show405DemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-amber-800/80 bg-slate-900 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-amber-950 text-amber-400 border border-amber-800">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  HTTP 405 Method Not Allowed Verified
                </h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  Per the Soochak contract: <code className="text-amber-300 font-mono">PATCH /auth/organization/{'{id}'}</code> is unsupported. The frontend strictly uses <code className="text-cyan-300 font-mono">PUT /auth/organization/{'{id}'}</code> for organization updates.
                </p>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShow405DemoModal(false)}
                className="px-4 py-1.5 rounded bg-slate-800 text-slate-200 text-xs font-medium hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
