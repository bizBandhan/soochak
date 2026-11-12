import type { FC } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  Bell,
  Check,
  Radio,
  type LucideIcon,
} from 'lucide-react';

export interface IndustryLandingConfig {
  vertical: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  optInNote: string;
  notification: {
    title: string;
    body: string;
    website: string;
    heading: string;
    source: string;
    audience: string;
    footer: string;
  };
  painPointsIntro: {
    eyebrow: string;
    title: string;
    description: string;
  };
  stepsEyebrow: string;
  closingDescription: string;
  painPoints: Array<{
    title: string;
    problem: string;
    solution: string;
    icon: LucideIcon;
  }>;
  steps: Array<{
    title: string;
    description: string;
    icon: LucideIcon;
  }>;
}

interface IndustryLandingPageProps {
  config: IndustryLandingConfig;
}

const NotificationMockup: FC<IndustryLandingConfig['notification']> = ({
  title, body, website, heading, source, audience, footer,
}) => (
  <div
    id="live-preview"
    className="relative mx-auto w-full max-w-lg scroll-mt-8"
    aria-label="Live browser notification preview"
  >
    <div aria-hidden="true" className="absolute -inset-6 rounded-[2rem] bg-cyan-500/10 blur-3xl" />
    <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/90 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <div className="ml-3 flex min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-[11px] text-slate-500">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
          <span className="truncate">{website}</span>
        </div>
      </div>

      <div className="bg-[radial-gradient(ellipse_at_top_right,_rgba(34,211,238,0.12),_transparent_55%)] p-5 sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">{heading}</p>
            <p className="mt-1 text-xs text-slate-500">A browser notification preview</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-800/60 bg-cyan-950/50 px-2.5 py-1 text-[10px] font-medium text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            PUSH ALERT
          </span>
        </div>

        <div className="ml-auto max-w-sm rounded-xl border border-slate-700/80 bg-slate-800/95 p-4 shadow-xl backdrop-blur">
          <div className="mb-3 flex items-center gap-2.5 text-[11px] text-slate-400">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-300">
              <Bell className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-semibold text-slate-200">{source}</span>
            <span className="ml-auto shrink-0">now</span>
          </div>
          <p className="text-sm font-bold leading-5 text-white">{title}</p>
          <p className="mt-1.5 text-sm leading-6 text-slate-300">{body}</p>
          <div className="mt-4 flex items-center gap-2 border-t border-slate-700/80 pt-3 text-[11px] text-slate-500">
            <Check className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
            {audience}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-cyan-400">
            <Radio className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          {footer}
        </div>
      </div>
    </div>
  </div>
);

export const IndustryLandingPage: FC<IndustryLandingPageProps> = ({ config }) => (
  <div className="min-h-screen overflow-hidden bg-slate-950 text-slate-100">
    <header className="border-b border-slate-800/80">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8"
      >
        <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
            <Radio className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            Soochak <span className="hidden text-xs font-normal text-slate-400 sm:inline">by BizBandhan</span>
          </span>
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium sm:gap-6">
          <Link to="/login" className="text-slate-300 transition hover:text-white">
            Log in
          </Link>
          <Link
            to={`/register?vertical=${encodeURIComponent(config.vertical)}`}
            className="rounded-lg bg-cyan-400 px-4 py-2.5 text-slate-950 transition hover:bg-cyan-300"
          >
            {config.cta}
          </Link>
        </div>
      </nav>
    </header>

    <main>
      <section className="relative border-b border-slate-800/80">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-36 -top-32 h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-28">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-800/60 bg-cyan-950/40 px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-cyan-300 sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              {config.eyebrow}
            </p>
            <h1 className="max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {config.title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
              {config.description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                to={`/register?vertical=${encodeURIComponent(config.vertical)}`}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                {config.cta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="#live-preview"
                className="inline-flex items-center gap-2 px-1 py-3 text-sm font-semibold text-slate-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                See live preview <ArrowDown className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              </a>
            </div>
            <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-slate-500">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" aria-hidden="true" />
              {config.optInNote}
            </p>
          </div>

          <NotificationMockup {...config.notification} />
        </div>
      </section>

      <section aria-labelledby="pain-points-title" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">{config.painPointsIntro.eyebrow}</p>
          <h2 id="pain-points-title" className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {config.painPointsIntro.title}
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-400 sm:text-base">
            {config.painPointsIntro.description}
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {config.painPoints.map(({ title, problem, solution, icon: Icon }, index) => (
            <article
              key={title}
              className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-cyan-900/80 hover:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-900/50 bg-rose-950/30 text-rose-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs text-slate-600">0{index + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{problem}</p>
              <div className="my-5 h-px bg-slate-800" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">The Soochak way</p>
              <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-200">
                <Check className="mt-1 h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" />
                {solution}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="border-y border-slate-800/80 bg-slate-900/35">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">{config.stepsEyebrow}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              From your website to their screens in three steps.
            </h2>
          </div>

          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {config.steps.map(({ title, description, icon: Icon }, index) => (
              <li key={title} className="relative rounded-2xl border border-slate-800 bg-slate-950/80 p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs tracking-widest text-slate-600">STEP 0{index + 1}</span>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 text-center sm:px-8 sm:py-24">
        <div className="mx-auto max-w-3xl rounded-3xl border border-cyan-900/50 bg-gradient-to-br from-cyan-950/40 via-slate-900/80 to-slate-950 p-8 sm:p-12">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-800/60 bg-cyan-950/70 text-cyan-300">
            <Bell className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Make the next important update easy to hear.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
            {config.closingDescription}
          </p>
          <Link
            to={`/register?vertical=${encodeURIComponent(config.vertical)}`}
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            {config.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="mt-5 text-xs leading-5 text-slate-500">
            Notification delivery depends on browser and device settings; subscribers must opt in.
          </p>
        </div>
      </section>
    </main>

    <footer className="border-t border-slate-800/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span>Soochak by BizBandhan</span>
        <span>Browser notifications for the updates that matter.</span>
      </div>
    </footer>
  </div>
);
