/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Organization Registration & Setup
 */

import React, { useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Link } from 'react-router-dom';
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
import { PhoneInput } from '../components/common/PhoneInput';
import { PLANS, getPlan, type PlanId } from '../constants/plans';

const DEVICE_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const TIMEZONES: string[] = (() => {
  const zones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
  return zones.includes(DEVICE_TIMEZONE) ? zones : [DEVICE_TIMEZONE, ...zones];
})();

interface RegisterFormValues {
  orgName: string;
  slug: string;
  plan: PlanId;
  ownerUsername: string;
  firstName: string;
  lastName: string;
  email: string;
  sex: 'male' | 'female' | 'other';
  dob: string;
  phone: string;
  timezone: string;
  password: string;
  confirmPassword: string;
}

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <p role="alert" className="mt-1 text-[11px] text-red-400">
      {message}
    </p>
  ) : null;

export const RegisterOrgPage: React.FC = () => {
  const { registerOrganization } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    getValues,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      orgName: '',
      slug: '',
      plan: 'free',
      ownerUsername: '',
      firstName: '',
      lastName: '',
      email: '',
      sex: undefined,
      dob: '',
      phone: '',
      timezone: DEVICE_TIMEZONE,
      password: '',
      confirmPassword: '',
    },
  });

  const selectedPlan = getPlan(watch('plan'));
  const phoneValidRef = useRef(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [provisioningResult, setProvisioningResult] = useState<{
    success: boolean;
    orgId: string;
    slug: string;
    orgName: string;
    workspaceHost: string;
    workspaceUrl: string;
    warningNote: string;
  } | null>(null);

  const handleNameChange = (val: string) => {
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setValue('slug', autoSlug, { shouldValidate: true });
  };

  const onSubmit = async (values: RegisterFormValues) => {
    setErrorMessage(null);

    const payload: OrganizationRegistrationPayload = {
      name: values.orgName.trim(),
      slug: values.slug.trim(),
      plan: values.plan,
      limits: {
        maxSubscribers: getPlan(values.plan).maxSubscribers,
        maxNotificationsPerDay: getPlan(values.plan).maxNotificationsPerDay,
      },
      owner: {
        user: values.ownerUsername.trim(),
        name: {
          first: values.firstName.trim(),
          last: values.lastName.trim(),
        },
        sex: values.sex,
        dob: values.dob,
        email: values.email.trim(),
        phone: values.phone.trim() || undefined,
        timezone: values.timezone,
        password: values.password, // Sent securely in request payload; never saved or displayed in frontend
      },
    };

    try {
      const res = await registerOrganization(payload);
      setProvisioningResult({
        success: true,
        orgId: res.organization._id,
        slug: res.organization.slug,
        orgName: values.orgName.trim(),
        workspaceHost: res.workspaceHost,
        workspaceUrl: res.workspaceUrl,
        warningNote: res.warningNote,
      });
      reset();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to register organization.');
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
          Create a personal workspace and register its owner credentials.
        </p>
      </div>

      {/* 
      Honest Status Banner regarding Hostname Verification 
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
      */}

      {provisioningResult ? (
        /* Registration completes on the shared signup host; sign in at the assigned workspace host. */
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Personal Workspace Created: {provisioningResult.orgName}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Organization ID: {provisioningResult.orgId} · Slug: {provisioningResult.slug}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-cyan-900/60 bg-cyan-950/30 text-xs text-cyan-200 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-cyan-300">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Sign In to Your Workspace</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              {provisioningResult.warningNote}
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Your password was sent to the server over HTTPS and cleared from the registration form. Registration does not create a sign-in cookie on this shared hostname; sign in on your assigned workspace hostname.
            </p>
          </div>

          <div className="border-t border-slate-800 pt-5 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Workspace: <span className="font-mono text-cyan-300">{provisioningResult.workspaceHost}</span>
            </div>
            <a
              href={`${provisioningResult.workspaceUrl}/login`}
              className="flex items-center gap-2 px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition shadow-sm"
            >
              <span>Go to Workspace Sign-In</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      ) : (
        /* Registration Form */
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
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
              1. Personal Workspace
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Organization Name *
                </label>
                <input
                  type="text"
                  {...register('orgName', { required: 'Organization name is required.', validate: (v) => v.trim().length > 0 || 'Organization name is required.', onChange: (e) => handleNameChange(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  placeholder="e.g. Acme Technologies"
                />
                <FieldError message={errors.orgName?.message} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Canonical Slug *
                </label>
                <input
                  type="text"
                  {...register('slug', {
                    required: 'Slug is required.',
                    pattern: {
                      value: /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/,
                      message: 'Use 1-63 letters, numbers, or internal hyphens.',
                    },
                  })}
                  className="mt-1 block w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-cyan-300 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  placeholder="e.g. acme-tech"
                />
                <FieldError message={errors.slug?.message} />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300">
                  Plan
                </label>
                <select
                  {...register('plan')}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                >
                  {PLANS.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  {selectedPlan.label} plan includes up to{' '}
                  <span className="font-mono text-cyan-300">{selectedPlan.maxSubscribers.toLocaleString()}</span> push
                  subscribers and{' '}
                  <span className="font-mono text-cyan-300">{selectedPlan.maxNotificationsPerDay.toLocaleString()}</span>{' '}
                  notifications per day.
                </p>
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
                  {...register('ownerUsername', { required: 'Owner username is required.' })}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                />
                <FieldError message={errors.ownerUsername?.message} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  First Name *
                </label>
                <input
                  type="text"
                  {...register('firstName', { required: 'First name is required.' })}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                />
                <FieldError message={errors.firstName?.message} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Last Name *
                </label>
                <input
                  type="text"
                  {...register('lastName', { required: 'Last name is required.' })}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                />
                <FieldError message={errors.lastName?.message} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Email Address *
                </label>
                <input
                  type="email"
                  {...register('email', { required: 'Email address is required.', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address.' } })}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                />
                <FieldError message={errors.email?.message} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Gender / Sex *
                </label>
                <select
                  {...register('sex', { required: 'Select a value.' })}
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
                  {...register('dob', { required: 'Date of birth is required.' })}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                />
                <FieldError message={errors.dob?.message} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Phone (Optional)
                </label>
                <Controller
                  name="phone"
                  control={control}
                  rules={{ validate: (v) => !v || phoneValidRef.current || 'Enter a valid phone number for the selected country.' }}
                  render={({ field }) => (
                    <PhoneInput
                      value={field.value}
                      onChange={(val, isValid) => {
                        phoneValidRef.current = isValid;
                        field.onChange(val);
                      }}
                      onBlur={field.onBlur}
                      className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                    />
                  )}
                />
                <FieldError message={errors.phone?.message} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Timezone
                </label>
                <select
                  {...register('timezone')}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Initial Password *
                </label>
                <input
                  type="password"
                  {...register('password', { required: 'Owner password is required.', minLength: { value: 8, message: 'Owner password must be at least 8 characters long.' } })}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  placeholder="min. 8 characters"
                />
                <FieldError message={errors.password?.message} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  {...register('confirmPassword', { required: 'Please confirm the password.', validate: (v) => v === getValues('password') || 'Password and confirmation do not match.' })}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  placeholder="re-enter password"
                />
                <FieldError message={errors.confirmPassword?.message} />
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
