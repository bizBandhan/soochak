/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Top Navigation Bar
 * Follows strict Top Bar Contract: 3 zones separated by gap-8
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bell,
  Building2,
  ChevronDown,
  LogOut,
  Send,
  User,
  Settings,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, organization, logout, isSimulationMode, setSimulationMode } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const location = useLocation();

  // Get current section name for breadcrumb
  const getSectionTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Overview';
    if (path.startsWith('/notifications/compose')) return 'Compose Web Push';
    if (path.startsWith('/notifications')) return 'Push Notifications';
    if (path.startsWith('/sites')) return 'Sites & Resources';
    if (path.startsWith('/subscribers')) return 'Push Subscribers';
    if (path.startsWith('/config')) return 'Push Configuration (VAPID)';
    if (path.startsWith('/administration')) return 'Users, Roles & Permissions';
    if (path.startsWith('/settings')) return 'Organization Settings';
    if (path.startsWith('/profile')) return 'My Profile & Security';
    if (path.startsWith('/register-org')) return 'Register Organization';
    return 'Console';
  };

  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-8 z-30 shrink-0">
      {/* Zone 1: Single text element wordmark + mobile sidebar toggle */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="md:hidden text-slate-400 hover:text-white p-1"
          aria-label="Toggle navigation menu"
        >
          <Layers className="w-5 h-5" />
        </button>
        <Link
          to="/"
          className="text-base font-bold tracking-tight text-white flex items-center gap-2 whitespace-nowrap shrink-0 hover:text-cyan-400 transition"
        >
          <div className="w-6 h-6 rounded bg-cyan-600 flex items-center justify-center text-white">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <span>Soochak</span>
        </Link>
      </div>

      {/* Zone 2: Breadcrumb trail / Section link */}
      <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 whitespace-nowrap shrink-0">
        <span className="text-slate-500 font-mono">
          {organization?.name || 'BizBandhan Technologies'}
        </span>
        <span className="text-slate-700">/</span>
        <span className="text-slate-200 font-medium">{getSectionTitle()}</span>
      </div>

      {/* Zone 3: Actions + PWA Install + Simulation Toggle + Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Quick Send CTA */}
        <Link
          to="/notifications/compose"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition shadow-sm whitespace-nowrap shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Compose Push</span>
        </Link>

        {/* PWA Install */}
        <PWAInstallButton />

        {/* API Mode Selector */}
        <button
          type="button"
          onClick={() => setSimulationMode(!isSimulationMode)}
          className={`hidden lg:flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono border transition whitespace-nowrap shrink-0 ${
            isSimulationMode
              ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
              : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
          }`}
          title={
            isSimulationMode
              ? 'Currently in local developer simulation mode. Click to switch to Live API (/api/v1)'
              : 'Connected to API endpoint /api/v1. Click to toggle Sandbox Simulation'
          }
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isSimulationMode ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
          />
          <span>{isSimulationMode ? 'Sandbox Mode' : 'API /api/v1'}</span>
        </button>

        {/* User Profile & Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-md hover:bg-slate-900 border border-transparent hover:border-slate-800 transition"
            aria-expanded={userDropdownOpen}
          >
            <div className="w-7 h-7 rounded-md bg-cyan-950 border border-cyan-800 flex items-center justify-center text-xs font-semibold text-cyan-300">
              {user?.name?.first ? user.name.first[0].toUpperCase() : 'U'}
            </div>
            <span className="hidden xl:inline-block text-xs font-medium text-slate-200 truncate max-w-[110px]">
              {user?.name?.first || 'Operator'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {userDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-800 bg-slate-900 p-1.5 shadow-2xl z-50 text-xs text-slate-200 animate-in fade-in"
              onMouseLeave={() => setUserDropdownOpen(false)}
            >
              <div className="px-2.5 py-2 border-b border-slate-800/80 mb-1">
                <p className="font-semibold text-white truncate">
                  {user?.name ? `${user.name.first} ${user.name.last}` : 'Operator'}
                </p>
                <p className="font-mono text-[11px] text-slate-400 truncate mt-0.5">
                  {user?.email || 'operator@bizbandhan.com'}
                </p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-cyan-400">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate">{organization?.slug || 'bizbandhan-tech'}</span>
                </div>
              </div>

              <Link
                to="/profile"
                onClick={() => setUserDropdownOpen(false)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>My Profile & Password</span>
              </Link>

              <Link
                to="/settings"
                onClick={() => setUserDropdownOpen(false)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Organization Settings</span>
              </Link>

              <div className="border-t border-slate-800/80 my-1" />

              <button
                type="button"
                onClick={() => {
                  setUserDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-red-950/40 text-red-400 hover:text-red-300 transition text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out (Invalidate Token)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
