/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Status Badge Component
 */

import React from 'react';
import type { EndpointStatus } from '../../types';

interface StatusBadgeProps {
  status: EndpointStatus | 'active' | 'pending_provisioning' | 'unverified';
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
  const configMap: Record<
    string,
    { text: string; bg: string; border: string; label: string }
  > = {
    connected: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-950/50',
      border: 'border-emerald-800/50',
      label: 'Connected API',
    },
    active: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-950/50',
      border: 'border-emerald-800/50',
      label: 'Active',
    },
    planned: {
      text: 'text-sky-400',
      bg: 'bg-sky-950/50',
      border: 'border-sky-800/50',
      label: 'Planned Route',
    },
    unavailable: {
      text: 'text-amber-400',
      bg: 'bg-amber-950/50',
      border: 'border-amber-800/50',
      label: 'Unavailable / Pending Backend',
    },
    unverified: {
      text: 'text-amber-400',
      bg: 'bg-amber-950/50',
      border: 'border-amber-800/50',
      label: 'Verification Unavailable',
    },
    accepted: {
      text: 'text-cyan-400',
      bg: 'bg-cyan-950/50',
      border: 'border-cyan-800/50',
      label: 'Accepted for Ingestion',
    },
    pending_provisioning: {
      text: 'text-violet-400',
      bg: 'bg-violet-950/50',
      border: 'border-violet-800/50',
      label: 'Pending Provisioning',
    },
  };

  const current = configMap[status] || {
    text: 'text-slate-400',
    bg: 'bg-slate-900',
    border: 'border-slate-800',
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center text-xs font-mono px-2 py-0.5 rounded border ${current.bg} ${current.border} ${current.text} whitespace-nowrap ${className}`}
    >
      {label || current.label}
    </span>
  );
};
