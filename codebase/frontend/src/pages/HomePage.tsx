/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Public Home
 */

import { Link } from 'react-router-dom';
import { ArrowRight, Bell, Check, Globe2, Mail, MousePointerClick, Radio, ShieldCheck } from 'lucide-react';

const steps = [
  { icon: Globe2, number: '01', title: 'Connect your website', text: 'Add your website origin and integrate the client and service worker with your site.' },
  { icon: ShieldCheck, number: '02', title: 'Let visitors opt in', text: 'Ask visitors for permission before subscribing their browser to notifications.' },
  { icon: Bell, number: '03', title: 'Send an update', text: 'Compose a message in your workspace and send it to your subscribers.' },
];

export const HomePage = () => (
  <div className="min-h-screen bg-slate-950 text-slate-100">
    <header className="border-b border-slate-800/80">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500 text-slate-950"><Radio className="h-5 w-5" aria-hidden="true" /></span>
          <span>Soochak <span className="hidden text-xs font-normal text-slate-400 sm:inline">by BizBandhan</span></span>
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium sm:gap-6">
          <Link to="/login" className="text-slate-300 transition hover:text-white">Log in</Link>
          <Link to="/register" className="rounded-lg bg-cyan-400 px-4 py-2.5 text-slate-950 transition hover:bg-cyan-300">Get started</Link>
        </div>
      </nav>
    </header>

    <main>
      <section className="relative overflow-hidden border-b border-slate-800/80">
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-800/60 bg-cyan-950/40 px-3 py-1.5 text-xs font-semibold tracking-wide text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> WEB PUSH, MADE SIMPLE
            </p>
            <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Stay connected, <span className="text-cyan-400">beyond the visit.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-400 sm:text-lg">
              Soochak helps you send timely browser notifications to people who choose to hear from your website.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                Create a workspace <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a href="#how-it-works" className="px-1 py-3 text-sm font-semibold text-slate-300 transition hover:text-white">See how it works &darr;</a>
            </div>
            <p className="mt-5 text-xs leading-5 text-slate-500">Already have a workspace? Log in from your assigned workspace URL.</p>
          </div>

          <div className="relative mx-auto w-full max-w-md" aria-label="Example notification">
            <div className="absolute inset-4 rounded-3xl bg-cyan-500/10 blur-2xl" aria-hidden="true" />
            <div className="relative rounded-2xl border border-slate-700/70 bg-slate-900 p-5 shadow-2xl shadow-black/30 sm:p-7">
              <div className="mb-6 flex items-center justify-between text-xs font-medium text-slate-400">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-400" /> YOUR WEBSITE</span>
                <span>Notification preview</span>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-300"><Bell className="h-5 w-5" aria-hidden="true" /></span>
                  <div>
                    <p className="text-sm font-semibold text-white">Something new for you</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">Share an update with your community, right in their browser.</p>
                  </div>
                </div>
              </div>
              <p className="mt-5 flex items-center gap-2 text-xs text-slate-400"><MousePointerClick className="h-4 w-4 text-cyan-400" aria-hidden="true" /> An example of what a subscriber might see</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">How it works</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">From your site to their browser.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map(({ icon: Icon, number, title, text }) => (
            <article key={number} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="flex items-center justify-between">
                <Icon className="h-6 w-6 text-cyan-400" aria-hidden="true" />
                <span className="font-mono text-xs text-slate-500">{number}</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-800/80 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Two channels, different strengths</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Web Push and email work better together.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">Choose the channel that fits your message. Soochak currently focuses on Web Push; it does not send emails.</p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <article className="rounded-2xl border border-cyan-800/50 bg-slate-950/70 p-6 sm:p-8">
              <Bell className="h-6 w-6 text-cyan-400" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-semibold text-white">Web Push</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">Short updates delivered through a supported browser after the visitor opts in.</p>
              <p className="mt-5 flex items-start gap-2 text-sm text-slate-300"><Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" /> Suited to timely, concise alerts and announcements.</p>
            </article>
            <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 sm:p-8">
              <Mail className="h-6 w-6 text-sky-400" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-semibold text-white">Email</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">Messages sent to an email address and kept in an inbox for later reference.</p>
              <p className="mt-5 flex items-start gap-2 text-sm text-slate-300"><Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" /> Suited to longer content, receipts and detailed updates.</p>
            </article>
          </div>
          <p className="mt-6 text-xs leading-5 text-slate-500">Notification display depends on browser and device settings. Provider acceptance does not guarantee delivery or display.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 text-center sm:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white">Ready to connect with your audience?</h2>
        <p className="mt-4 text-sm text-slate-400">Create your workspace and start integrating Web Push with your website.</p>
        <Link to="/register" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">Get started <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </section>
    </main>

    <footer className="border-t border-slate-800/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span>Soochak by BizBandhan</span>
        <span>Already registered? Sign in at your workspace URL.</span>
      </div>
    </footer>
  </div>
);
