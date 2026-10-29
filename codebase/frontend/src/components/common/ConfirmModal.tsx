/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Accessible Confirm Modal
 */

import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  subMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  subMessage,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-6 text-slate-100">
        <div className="flex items-start gap-4">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              isDestructive
                ? 'bg-red-950/60 text-red-400 border border-red-800/50'
                : 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/50'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 id="confirm-modal-title" className="text-base font-semibold text-white">
              {title}
            </h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              {message}
            </p>
            {subMessage && (
              <div className="mt-3 p-2.5 rounded bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-400 leading-normal">
                {subMessage}
              </div>
            )}
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-500 hover:text-slate-300 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded border border-slate-700/60 transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-medium rounded transition flex items-center gap-2 ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-950'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm shadow-cyan-950'
            } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading && (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
