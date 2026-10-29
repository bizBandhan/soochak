/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — My Profile & Change Password
 */

import React, { useState } from 'react';
import {
  UserCheck,
  Lock,
  Mail,
  User,
  Phone,
  Clock,
  LogOut,
  Save,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Key,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';

export const ProfileSecurityPage: React.FC = () => {
  const { user, updateProfile, changePassword, logout } = useAuth();

  // Profile Edit State (PATCH /me)
  const [firstName, setFirstName] = useState(user?.name?.first || 'Om Prakash');
  const [lastName, setLastName] = useState(user?.name?.last || 'Tiwari');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Kolkata');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Change State (POST /me)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMsg(null);

    try {
      await updateProfile({
        name: {
          first: firstName.trim(),
          last: lastName.trim(),
        },
        phone: phone.trim() || undefined,
        timezone: timezone.trim(),
      });
      setProfileMsg({
        type: 'success',
        text: 'Profile updated successfully via PATCH /me.',
      });
    } catch (err: any) {
      setProfileMsg({
        type: 'error',
        text: err.message || 'Failed to update profile.',
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 8) {
      setPasswordMsg({
        type: 'error',
        text: 'New password must be at least 8 characters long.',
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({
        type: 'error',
        text: 'New password and confirmation do not match.',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordMsg({
        type: 'success',
        text: res.message || 'Password changed successfully via POST /me.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordMsg({
        type: 'error',
        text: err.message || 'Failed to change password.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            <span>My Profile & Security</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Manage your operator credentials, personal details, and active authentication session.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status="connected" label="Auth: /me & /auth" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* User Identity Overview Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-base font-bold text-cyan-300">
              {user?.name?.first ? user.name.first[0].toUpperCase() : 'O'}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-white truncate">
                {user?.name?.first} {user?.name?.last}
              </h2>
              <p className="font-mono text-xs text-slate-400 truncate">@{user?.user}</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-3 border-t border-slate-800 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="font-mono text-slate-200 truncate max-w-[170px]">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Roles:</span>
              <div className="flex gap-1">
                {user?.roles?.map((r) => (
                  <span key={r} className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-800/50 text-cyan-300">
                    {r}
                  </span>
                )) || <span className="font-mono text-slate-400">Owner</span>}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Gender:</span>
              <span className="capitalize text-slate-200">{user?.sex || 'Not set'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">DOB:</span>
              <span className="font-mono text-slate-200">{user?.dob || '1992-06-15'}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/60 text-xs font-medium transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out (DELETE /auth)</span>
            </button>
          </div>
        </div>

        {/* Profile Editing & Password Change Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Details (PATCH /me) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Edit Profile Fields (PATCH /me)</span>
              </h3>
              <span className="font-mono text-[10px] text-slate-500">Current User Scope</span>
            </div>

            {profileMsg && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-red-950/40 border-red-800/60 text-red-300'
                }`}
              >
                {profileMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300">Timezone</label>
                  <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="flex items-center gap-2 px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isUpdatingProfile ? 'Saving...' : 'Update Profile (PATCH)'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password (POST /me) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Change Password (POST /me)</span>
              </h3>
              <span className="font-mono text-[10px] text-slate-500">Current & New Password</span>
            </div>

            {passwordMsg && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-red-950/40 border-red-800/60 text-red-300'
                }`}
              >
                {passwordMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300">Current Password *</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:ring-1 focus:ring-cyan-500"
                  placeholder="enter current password"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300">New Password *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:ring-1 focus:ring-cyan-500"
                    placeholder="min. 8 characters"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:ring-1 focus:ring-cyan-500"
                    placeholder="re-enter new password"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex items-center gap-2 px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition shadow-sm"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{isChangingPassword ? 'Updating...' : 'Change Password (POST /me)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
