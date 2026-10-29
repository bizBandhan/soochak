/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Login Page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Lock, User, AlertCircle, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_API_BASE } from '../services/apiClient';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('optiwari');
  const [password, setPassword] = useState('SecurePass2026!');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number>(0);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (rateLimitSeconds > 0) {
      timer = setInterval(() => {
        setRateLimitSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [rateLimitSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rateLimitSeconds > 0) return;

    setErrorMsg(null);
    if (!username.trim()) {
      setErrorMsg('Please enter your username or email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ user: username.trim(), password });
      navigate('/');
    } catch (err: any) {
      if (err.status === 429) {
        setRateLimitSeconds(60);
        setErrorMsg('Rate limit exceeded: Too many failed credential attempts. Please wait 60 seconds.');
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please verify credentials or server connectivity.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-cyan-600 flex items-center justify-center text-white shadow-lg shadow-cyan-950">
            <Bell className="w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          Sign in to Soochak
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Developer-first Web Push management console for BizBandhan organizations
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-4 shadow-2xl rounded-xl sm:px-10">
          {errorMsg && (
            <div
              className={`mb-5 p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                rateLimitSeconds > 0
                  ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                  : 'bg-red-950/40 border-red-800/60 text-red-300'
              }`}
            >
              {rateLimitSeconds > 0 ? (
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span>{errorMsg}</span>
                {rateLimitSeconds > 0 && (
                  <p className="mt-1 font-mono text-[11px] font-semibold text-amber-400">
                    Retry available in {rateLimitSeconds}s
                  </p>
                )}
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-medium text-slate-300"
              >
                Username or Email
              </label>
              <div className="mt-1.5 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting || rateLimitSeconds > 0}
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition"
                  placeholder="e.g. optiwari"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-slate-300"
                >
                  Password
                </label>
                <span className="text-[11px] text-slate-500">min. 6 characters</span>
              </div>
              <div className="mt-1.5 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting || rateLimitSeconds > 0}
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || rateLimitSeconds > 0}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Validating credentials (PUT /auth)...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Credential Test Hint */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold text-slate-300">Operator Sandbox Login:</span>
              <button
                type="button"
                onClick={() => {
                  setUsername('optiwari');
                  setPassword('SecurePass2026!');
                }}
                className="text-cyan-400 hover:underline"
              >
                Fill test credentials
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              API Base: <code className="font-mono text-cyan-400">{DEFAULT_API_BASE}</code>
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">New organization?</span>
            <Link
              to="/register-org"
              className="font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
            >
              <span>Register Organization</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>RFC 8292 Web Push VAPID Transport · Zero Private Keys in Client</span>
        </div>
      </div>
    </div>
  );
};
