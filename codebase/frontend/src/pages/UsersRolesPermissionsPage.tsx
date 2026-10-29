/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Users, Roles & Permissions Administration
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Key,
  ShieldAlert,
  Lock,
  Plus,
  AlertTriangle,
  UserCheck,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { adminService } from '../services/apiAdapters';
import type { ManagedUser, Role, Permission } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';

export const UsersRolesPermissionsPage: React.FC = () => {
  const { organization } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions'>('users');

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdminData = async () => {
      setLoading(true);
      try {
        const [u, r, p] = await Promise.all([
          adminService.getUsers(),
          adminService.getRoles(),
          adminService.getPermissions(),
        ]);
        setUsers(u);
        setRoles(r);
        setPermissions(p);
      } finally {
        setLoading(false);
      }
    };
    loadAdminData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span>Users, Roles & Permissions</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Access control governance for organization <span className="font-mono text-cyan-300">{organization?.name}</span>.
          </p>
        </div>

        <StatusBadge status="unavailable" label="Mutations Disabled (Backend Route Unmounted)" />
      </div>

      {/* Mandatory Contract Compliance Notice */}
      <div className="p-4 rounded-xl border border-amber-900/60 bg-amber-950/30 text-xs text-amber-200 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-300">
            API Contract Guard: Read-Only Administration View
          </p>
          <p className="text-[11px] text-amber-200/90 leading-relaxed">
            The OpenAPI specification documents CRUD route groups for <code className="font-mono text-amber-300">/auth/user</code>, <code className="font-mono text-amber-300">/auth/role</code>, <code className="font-mono text-amber-300">/auth/permission</code>, and <code className="font-mono text-amber-300">/auth/vendor</code>. However, these endpoints are not yet mounted or integrated with <code className="font-mono text-amber-300">isAuthorized</code> middleware in the backend router (and vendor currently has no database model).
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            To prevent accidental data corruption and respect server authorization authority, all creation, update, and deletion mutations are strictly disabled in this interface until the corresponding backend routes exist. No fake writes or mock success mutations will be executed.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition ${
            activeTab === 'users'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Organization Users ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition ${
            activeTab === 'roles'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Defined Roles ({roles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition ${
            activeTab === 'permissions'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Permission Registry ({permissions.length})</span>
        </button>
      </div>

      {/* Tab 1: Organization Users */}
      {activeTab === 'users' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-white">
                Assigned Team Members & Roles
              </h2>
              <p className="text-[11px] text-slate-400">
                Scope: Users associated with organization canonical origin
              </p>
            </div>

            <button
              type="button"
              disabled
              title="Mutation disabled: POST /auth/user route not mounted yet"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 text-slate-500 text-xs font-medium border border-slate-700/50 cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Invite User (Disabled)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/60 text-[11px] font-semibold text-slate-400">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Roles</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right">Mutations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-900/60 transition">
                    <td className="py-3 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-cyan-950 border border-cyan-800 flex items-center justify-center text-[10px] text-cyan-300">
                          {u.name[0]}
                        </div>
                        <div>
                          <div>{u.name}</div>
                          <div className="font-mono text-[10px] text-slate-500">@{u.user}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                      {u.email}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <span
                            key={r}
                            className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
                        {u.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {u.lastActive}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        disabled
                        title="Backend mutation route unmounted"
                        className="text-[10px] font-mono text-slate-500 hover:text-slate-400 px-2 py-0.5 rounded border border-slate-800 bg-slate-950 cursor-not-allowed"
                      >
                        Edit Roles (Disabled)
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Defined Roles */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div
              key={role._id}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-white">{role.name}</h3>
                {role.isSystem && (
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800/50">
                    System Role
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed min-h-[3rem]">
                {role.description}
              </p>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-medium text-slate-300 block mb-1.5">
                  Granted Scope:
                </span>
                <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                  {role.permissions.map((p) => (
                    <span
                      key={p}
                      className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  disabled
                  className="w-full text-center py-1.5 text-[11px] font-mono text-slate-500 bg-slate-950 rounded border border-slate-800 cursor-not-allowed"
                >
                  Modify Permissions (Blocked)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Permission Registry */}
      {activeTab === 'permissions' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-xs font-semibold text-white">
              System Permission Schema
            </h2>
            <p className="text-[11px] text-slate-400">
              Evaluated against OpenAPI request scopes when isAuthorized enforcement is mounted.
            </p>
          </div>

          <div className="divide-y divide-slate-800/60">
            {permissions.map((perm) => (
              <div key={perm._id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{perm.name}</span>
                    <span className="font-mono text-[11px] text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800/40">
                      {perm.key}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-400 text-[11px]">{perm.description}</p>
                </div>

                <div className="text-right font-mono text-[11px] text-slate-500">
                  Resource: <span className="text-slate-300">{perm.resource}</span> · Action: <span className="text-slate-300">{perm.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
