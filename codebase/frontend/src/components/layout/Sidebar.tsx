/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Sidebar Navigation
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bell,
  Send,
  Users,
  Globe,
  Key,
  ShieldCheck,
  Settings,
  UserCheck,
  Building,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { organization } = useAuth();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition ${
      isActive
        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 shadow-xs'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
    }`;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Organization Context Card in Sidebar Header */}
        <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-cyan-600 to-sky-700 flex items-center justify-center text-white shadow-xs shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-semibold text-white truncate">
                {organization?.name || 'BizBandhan Tech'}
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono truncate">
                <span className="truncate">{organization?.canonicalOrigin ? new URL(organization.canonicalOrigin).hostname : 'bizbandhan.com'}</span>
              </div>
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 font-mono px-2 py-1 rounded bg-slate-900/80 border border-slate-800/60">
            <span>Org Slug:</span>
            <span className="text-cyan-400 truncate max-w-[120px]">{organization?.slug || 'bizbandhan-tech'}</span>
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Section: Overview */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Overview
            </div>
            <div className="space-y-0.5">
              <NavLink to="/" end className={navItemClass} onClick={onClose}>
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                  <span>Dashboard</span>
                </div>
              </NavLink>
            </div>
          </div>

          {/* Section: Web Push Management */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Web Push Delivery
            </div>
            <div className="space-y-0.5">
              <NavLink to="/notifications" end className={navItemClass} onClick={onClose}>
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span>Notifications History</span>
                </div>
              </NavLink>

              <NavLink to="/notifications/compose" className={navItemClass} onClick={onClose}>
                <div className="flex items-center gap-2.5">
                  <Send className="w-4 h-4 text-cyan-400" />
                  <span>Compose & Send</span>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/50">
                  PUT
                </span>
              </NavLink>

              <NavLink to="/subscribers" className={navItemClass} onClick={onClose}>
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>Push Subscribers</span>
                </div>
              </NavLink>

              <NavLink to="/sites" className={navItemClass} onClick={onClose}>
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span>Sites & Resources</span>
                </div>
              </NavLink>

              <NavLink to="/config" className={navItemClass} onClick={onClose}>
                <div className="flex items-center gap-2.5">
                  <Key className="w-4 h-4 text-slate-400" />
                  <span>Push Config (VAPID)</span>
                </div>
              </NavLink>
            </div>
          </div>

          {/* Section: Administration */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Administration
            </div>
            <div className="space-y-0.5">
              <NavLink to="/administration" className={navItemClass} onClick={onClose}>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>Users & Permissions</span>
                </div>
                <span className="text-[9px] text-amber-400 font-mono bg-amber-950/60 px-1 py-0.5 rounded">
                  Read-Only
                </span>
              </NavLink>

              <NavLink to="/settings" className={navItemClass} onClick={onClose}>
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Organization Settings</span>
                </div>
              </NavLink>

              <NavLink to="/register-org" className={navItemClass} onClick={onClose}>
                <div className="flex items-center gap-2.5">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span>Register Organization</span>
                </div>
              </NavLink>
            </div>
          </div>

          {/* Section: Account */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Account
            </div>
            <div className="space-y-0.5">
              <NavLink to="/profile" className={navItemClass} onClick={onClose}>
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-slate-400" />
                  <span>Profile & Security</span>
                </div>
              </NavLink>
            </div>
          </div>
        </div>

        {/* Footer: Service Worker Preservation Note */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Soochak Web Push</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500 leading-normal">
            Preserves existing customer Service Workers. Zero private key exposure in browser.
          </p>
        </div>
      </aside>
    </>
  );
};
