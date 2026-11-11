import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const UsersRolesPermissionsPage: React.FC = () => (
  <section className="space-y-4">
    <h1 className="text-xl font-bold text-white">Users, Roles &amp; Permissions</h1>
    <div role="status" className="p-4 rounded-xl border border-amber-900/60 bg-amber-950/30 text-xs text-amber-200 flex gap-3">
      <ShieldAlert className="w-5 h-5 shrink-0" />
      <p>Administration is not yet available in the dashboard. No sample users, roles or permissions are displayed.</p>
    </div>
  </section>
);
