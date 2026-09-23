import { ArrowRight, Database, KeyRound, ShieldCheck, Sparkles, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * About page: honest product and architecture description.
 *
 * Documents the real production pipeline (browser → Snyzer backend →
 * OpenRouter; Supabase Auth; PostgreSQL storage; shared Zod contracts) and
 * makes no claims the backend does not support.
 */
const PIPELINE = [
  {
    layer: 'Client',
    title: 'React frontend',
    body: 'Draft editing, tone and mode controls, live streaming display, history browsing, and preferences — authenticated with your Supabase session token.',
  },
  {
    layer: 'API',
    title: 'Snyzer backend',
    body: 'Express API under /api/v1 verifies your token, validates every request against shared Zod schemas, and enforces per-user authorization.',
  },
  {
    layer: 'Model',
    title: 'OpenRouter',
    body: 'Approved writing jobs are sent to the configured model through OpenRouter. Responses stream back to you as server-sent events.',
  },
  {
    layer: 'Storage',
    title: 'PostgreSQL',
    body: 'Jobs, preferences, presets, and usage live in Postgres, scoped to your user id. The API never returns another user\u2019s data.',
  },
];

export function AboutPage() {
  return (
    <div className="w-full">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="font-code mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/60 px-3 py-1 text-xs text-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.2)]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>How Snyzer works</span>
          </div>
          <h1 className="font-display mb-6 text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Clearer writing, same meaning
          </h1>
          <p className="text-base leading-relaxed text-slate-300 sm:text-lg">
            Snyzer is a web-based AI-assisted writing editor. You sign in, write or paste text,
            choose improvement preferences, and receive a clearer, more natural revision while the
            product preserves your meaning and intent.
          </p>
        </div>

        <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="relative rounded-3xl border border-teal-500/20 bg-[#061520]/80 p-8 shadow-xl backdrop-blur-xl">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/10 text-teal-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-white">Your words stay yours</h2>
            <p className="mb-4 text-sm leading-relaxed text-slate-300">
              Revisions target clarity, flow, and register — the ideas, claims, and structure of
              your draft are what the model is instructed to preserve. The original text is always
              kept alongside the revision so you can compare and decide.
            </p>
            <div className="font-code rounded-xl border border-teal-500/30 bg-teal-950/40 p-3 text-xs text-teal-300">
              Original and revision are stored side by side for every job.
            </div>
          </div>
          <div className="relative rounded-3xl border border-teal-500/20 bg-[#061520]/80 p-8 shadow-xl backdrop-blur-xl">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/10 text-teal-400">
              <KeyRound className="h-6 w-6" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-white">Private by construction</h2>
            <p className="mb-4 text-sm leading-relaxed text-slate-300">
              Sign-in runs on Supabase Auth with email confirmation and secure password reset. API
              keys and database credentials never leave the server — the browser only holds your
              public session token.
            </p>
            <div className="font-code rounded-xl border border-teal-500/30 bg-teal-950/40 p-3 text-xs text-teal-300">
              Bearer-token auth · per-user authorization · audited deletes.
            </div>
          </div>
        </div>

        <div className="mb-16 rounded-3xl border border-teal-500/30 bg-[#07131e]/90 p-8 shadow-2xl backdrop-blur-2xl sm:p-12">
          <h2 className="mb-8 text-center text-2xl font-bold text-white sm:text-3xl">
            The request pipeline
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PIPELINE.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-teal-500/20 bg-slate-950/60 p-5"
              >
                <span className="font-code text-xs font-bold text-teal-400">{step.layer}</span>
                <h3 className="mt-1 mb-2 text-base font-bold text-white">{step.title}</h3>
                <p className="text-xs leading-relaxed text-slate-400">{step.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/20 bg-teal-950/40 px-3 py-1">
              <Workflow className="h-3.5 w-3.5 text-teal-400" /> /api/v1/writing/jobs
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/20 bg-teal-950/40 px-3 py-1">
              <Workflow className="h-3.5 w-3.5 text-teal-400" /> /api/v1/writing/jobs/stream
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/20 bg-teal-950/40 px-3 py-1">
              <Database className="h-3.5 w-3.5 text-teal-400" /> /api/v1/preferences · presets ·
              account
            </span>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/workspace"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 px-8 py-3.5 text-base font-bold text-slate-950 shadow-[0_0_30px_rgba(45,212,191,0.55)] transition-all hover:scale-105 active:scale-95"
          >
            <span>Try the Playground</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
