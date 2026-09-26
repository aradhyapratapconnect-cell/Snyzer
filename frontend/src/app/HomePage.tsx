import { ArrowRight, History, Settings, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Marketing home page in the demo-reference visual language.
 *
 * All copy describes real production capabilities only (four improvement
 * modes, four tones, live streaming revisions, backend-scored analysis,
 * server-side history, saved presets). No invented metrics or claims.
 */
export function HomePage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section
        aria-label="Getting started"
        className="relative flex min-h-[70vh] flex-col justify-center overflow-hidden py-16"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_40%,rgba(45,212,191,0.12),transparent)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#030c14]/60 via-transparent to-transparent"
        />
        <div className="relative z-10 w-full">
          <div className="font-code mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/50 px-3 py-1 text-xs text-teal-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-assisted writing revision</span>
          </div>
          <h1 className="font-display max-w-3xl text-5xl leading-[1.06] font-bold tracking-tight text-white md:text-7xl">
            Improve your writing
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed font-normal text-slate-300 md:text-xl">
            Sign in, write or paste your draft, choose an improvement mode and tone, and receive a
            clearer, more natural revision — while preserving your meaning and intent.
          </p>
          <p className="font-code mt-4 mb-10 max-w-2xl text-sm font-medium text-teal-200/80 md:text-base">
            Snyzer is a writing-quality product.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/workspace"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 px-7 py-3 text-base font-semibold text-slate-950 shadow-[0_0_25px_rgba(20,184,166,0.35)] transition-all hover:scale-105 hover:opacity-95 hover:shadow-[0_0_30px_rgba(45,212,191,0.55)] active:scale-95"
            >
              <span>Open Playground</span>
              <ArrowRight className="h-4 w-4 font-semibold" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center rounded-full border border-teal-400/25 bg-teal-950/20 px-7 py-3 text-base font-medium text-white backdrop-blur transition-all hover:border-teal-400/50 hover:text-teal-300 hover:shadow-[0_0_15px_rgba(45,212,191,0.15)]"
            >
              How it works
            </Link>
          </div>
          <p className="mt-8 text-sm text-slate-400">
            <Link
              to="/login"
              className="font-medium text-teal-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              Sign in
            </Link>{' '}
            <span>or</span>{' '}
            <Link
              to="/register"
              className="font-medium text-teal-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              create an account
            </Link>{' '}
            to get started.
          </p>

          <div className="w-full pt-16">
            <div className="border-t border-teal-950/60 pt-8">
              <p className="font-code mb-6 text-xs font-medium tracking-widest text-teal-200/50 uppercase">
                Powered by
              </p>
              <div className="flex flex-wrap items-center gap-8 opacity-80 md:gap-14">
                {['OpenRouter', 'Supabase', 'Vercel', 'TypeScript', 'React'].map((name) => (
                  <span
                    key={name}
                    className="font-code text-sm font-bold tracking-wide text-slate-300 transition-colors hover:text-teal-200"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capability grid — real features only */}
      <section
        aria-label="Capabilities"
        className="relative z-10 w-full border-t border-slate-800/80 py-20"
      >
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="font-code mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/50 px-3 py-1 text-xs text-teal-300">
            <Zap className="h-3.5 w-3.5" />
            <span>What Snyzer does</span>
          </div>
          <h2 className="font-display mb-4 text-3xl font-bold tracking-tight text-white md:text-5xl">
            Clearer prose, same intent
          </h2>
          <p className="text-base leading-relaxed text-slate-400 md:text-lg">
            Every revision runs through your backend on OpenRouter and streams back token by token —
            with quality metrics computed from the finished result.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="group relative rounded-2xl border border-teal-500/25 bg-[#061520]/80 p-8 shadow-xl backdrop-blur-xl transition-all hover:border-teal-400/50">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-400 transition-transform group-hover:scale-110">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">Modes &amp; tones</h3>
            <p className="mb-4 text-sm leading-relaxed text-slate-400">
              Four improvement modes and four tones, plus clarity and sentence-variety targets — and
              up to five reusable presets saved to your account.
            </p>
            <span className="font-code text-xs text-teal-300/80">
              Natural · Clarity · Formal · Concise
            </span>
          </div>
          <div className="group relative rounded-2xl border border-teal-500/25 bg-[#061520]/80 p-8 shadow-xl backdrop-blur-xl transition-all hover:border-teal-400/50">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-400 transition-transform group-hover:scale-110">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">Live streaming</h3>
            <p className="mb-4 text-sm leading-relaxed text-slate-400">
              Watch the revision arrive in real time over server-sent events, with connecting,
              streaming, completed, failed, and cancelled states.
            </p>
            <span className="font-code text-xs text-teal-300/80">
              SSE · real tokens · no simulation
            </span>
          </div>
          <div className="group relative rounded-2xl border border-teal-500/25 bg-[#061520]/80 p-8 shadow-xl backdrop-blur-xl transition-all hover:border-teal-400/50">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-400 transition-transform group-hover:scale-110">
              <History className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">History &amp; analysis</h3>
            <p className="mb-4 text-sm leading-relaxed text-slate-400">
              Every job is stored server-side under your account. Reopen any revision and inspect
              its six backend-scored writing metrics.
            </p>
            <span className="font-code text-xs text-teal-300/80">
              PostgreSQL · per-user · private
            </span>
          </div>
        </div>

        <div className="relative mt-16 flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-r from-teal-950/60 via-[#071d2b] to-teal-950/60 p-8 text-center shadow-2xl sm:p-12">
          <div className="relative z-10 max-w-2xl">
            <h3 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
              Ready to revise your first draft?
            </h3>
            <p className="mb-8 text-sm text-slate-300 sm:text-base">
              Open the playground, paste your text, and get a clearer revision in seconds.
            </p>
            <Link
              to="/workspace"
              className="mx-auto flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 px-8 py-3.5 text-base font-bold text-slate-950 shadow-[0_0_30px_rgba(45,212,191,0.55)] transition-all hover:scale-105 hover:shadow-[0_0_45px_rgba(45,212,191,0.8)] active:scale-95"
            >
              <span>Launch Playground</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Settings className="h-3.5 w-3.5 text-teal-400" />
              Preferences sync to your account and follow you across devices.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
