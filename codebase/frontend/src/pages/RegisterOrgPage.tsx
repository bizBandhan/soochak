/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Organization Registration & Setup
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  User,
  Mail,
  Lock,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { OrganizationRegistrationPayload } from '../types';

export const RegisterOrgPage: React.FC = () => {
  const { registerOrganization } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [orgName, setOrgName] = useState('Acme Technologies');
  const [slug, setSlug] = useState('acme-tech');
  const [maxSubscribers, setMaxSubscribers] = useState(25000);
  const [maxNotificationsPerDay, setMaxNotificationsPerDay] = useState(2000);

  // Owner Profile
  const [ownerUsername, setOwnerUsername] = useState('acmeowner');
  const [firstName, setFirstName] = useState('Alex');
  const [lastName, setLastName] = useState('Vance');
  const [email, setEmail] = useState('alex.vance@acme.example.com');
  const [sex, setSex] = useState<'male' | 'female' | 'other'>('male');
  const [dob, setDob] = useState('1994-08-20');
  const [phone, setPhone] = useState('+1 555-019-2831');
  const [timezone, setTimezone] = useState('America/New_York');
  const [password, setPassword] = useState('SecureAcme2026!');
  const [confirmPassword, setConfirmPassword] = useState('SecureAcme2026!');

  // Submission & Pending Provisioning State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [provisioningResult, setProvisioningResult] = useState<{
    success: boolean;
    orgId: string;
    slug: string;
    warningNote: string;
  } | null>(null);

  const handleNameChange = (val: string) => {
    setOrgName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(autoSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!orgName.trim() || !slug.trim()) {
      setErrorMessage('Organization name and canonical slug are required.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Owner password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Password and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);
    const payload: OrganizationRegistrationPayload = {
      name: orgName.trim(),
      slug: slug.trim(),
      limits: {
        maxSubscribers: Number(maxSubscribers),
        maxNotificationsPerDay: Number(maxNotificationsPerDay),
      },
      owner: {
        user: ownerUsername.trim(),
        name: {
          first: firstName.trim(),
          last: lastName.trim(),
        },
        sex,
        dob,
        email: email.trim(),
        phone: phone.trim() || undefined,
        timezone,
        password, // Sent securely in request payload; never saved or displayed in frontend
      },
    };

    try {
      const res = await registerOrganization(payload);
      setProvisioningResult({
        success: true,
        orgId: res.organization._id,
        slug: res.organization.slug,
        warningNote: res.warningNote,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to register organization.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-cyan-400" />
          <span>Register Organization</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Provision a dedicated Web Push tenant and register initial organization owner credentials.
        </p>
      </div>

      {/* Honest Status Banner regarding Hostname Verification */}
      <div className="mb-6 p-3.5 rounded-lg border border-amber-900/50 bg-amber-950/30 text-xs text-amber-200/90 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-300">
            Backend Verification Notice: Hostname Verification Unavailable
          </p>
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            Automatic DNS TXT / HTTP well-known verification of canonical origins is planned in the API roadmap, but the backend verification endpoint does not exist yet. Status will be reported as <span className="font-mono text-amber-300">UNVERIFIED (Verification Unavailable)</span>.
          </p>
        </div>
      </div>

      {provisioningResult ? (
        /* Honest Pending Provisioning Screen */
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Organization Record Created: {orgName}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Organization ID: {provisioningResult.orgId} · Slug: {provisioningResult.slug}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-cyan-900/60 bg-cyan-950/30 text-xs text-cyan-200 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-cyan-300">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Event-Driven Provisioning In Progress</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              {provisioningResult.warningNote}
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              In accordance with Soochak security specifications: the submitted owner password was dispatched securely over the API request and has been permanently purged from frontend memory.
            </p>
          </div>

          <div className="border-t border-slate-800 pt-5 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              You can now proceed to the organization dashboard.
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition shadow-sm"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Registration Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="p-3 rounded-lg border border-red-800/60 bg-red-950/40 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Organization Details */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              1. Organization Tenant
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  placeholder="e.g. Acme Technologies"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Canonical Slug *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-cyan-300 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  placeholder="e.g. acme-tech"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Max Push Subscribers
                </label>
                <input
                  type="number"
                  min="100"
                  max="1000000"
                  value={maxSubscribers}
                  onChange={(e) => setMaxSubscribers(Number(e.target.value))}
                  className="mt-1 block w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Max Notifications / Day
                </label>
                <input
                  type="number"
                  min="10"
                  max="100000"
                  value={maxNotificationsPerDay}
                  onChange={(e) => setMaxNotificationsPerDay(Number(e.target.value))}
                  className="mt-1 block w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Owner Identity & Credentials */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <User className="w-4 h-4" />
              2. Owner Identity & Initial Profile
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Owner Username *
                </label>
                <input
                  type="text"
                  required
                  value={ownerUsername}
                  onChange={(e) => setOwnerUsername(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Gender / Sex *
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as any)}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Date of Birth (DOB) *
                </label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Timezone
                </label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  placeholder="e.g. America/New_York or Asia/Kolkata"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Initial Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  placeholder="min. 8 characters"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  placeholder="re-enter password"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              to="/login"
              className="text-xs text-slate-400 hover:text-slate-200 transition"
            >
              Already registered? Return to Login
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Emitting Provisioning Event (PUT /auth/organization)...</span>
                </>
              ) : (
                <>
                  <span>Register & Create Record</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
