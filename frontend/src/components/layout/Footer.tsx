import { SHARED_PACKAGE_VERSION } from '@snyzer/shared';
import { Link } from 'react-router-dom';
import { SnyzerLogo } from '../brand/SnyzerLogo.js';

/**
 * Production footer in the demo-reference visual language: brand block,
 * product/company columns over real routes, giant hollow SNYZER watermark,
 * and a status pill. No marketing metrics — only real product facts.
 */
export function Footer() {
  return (
    <footer className="relative z-20 w-full overflow-hidden border-t border-slate-800/80 bg-[#030911] px-4 pt-16 pb-12 text-white sm:px-6 lg:px-12">
      <div className="pointer-events-none absolute top-0 right-1/4 -z-10 h-64 w-96 rounded-full bg-teal-500/5 blur-3xl" />
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-16 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col items-start lg:col-span-5">
            <Link
              to="/"
              className="group flex cursor-pointer items-center gap-3"
              aria-label="Snyzer home"
            >
              <SnyzerLogo size="md" showText={false} />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Snyzer is an AI-assisted writing revision editor preserving human intent and quality.
            </p>
            <p className="font-code mt-4 text-[11px] text-teal-300/60">
              shared v{SHARED_PACKAGE_VERSION}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            <div>
              <h3 className="font-code mb-4 text-xs font-bold tracking-wider text-slate-200 uppercase">
                Product
              </h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li>
                  <Link to="/workspace" className="transition-colors hover:text-teal-300">
                    Playground
                  </Link>
                </li>
                <li>
                  <Link to="/history" className="transition-colors hover:text-teal-300">
                    History
                  </Link>
                </li>
                <li>
                  <Link to="/settings" className="transition-colors hover:text-teal-300">
                    Settings
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-code mb-4 text-xs font-bold tracking-wider text-slate-200 uppercase">
                Tech stack
              </h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="cursor-default transition-colors hover:text-white">TypeScript</li>
                <li className="cursor-default transition-colors hover:text-white">React</li>
                <li className="cursor-default transition-colors hover:text-white">Supabase</li>
                <li className="cursor-default transition-colors hover:text-white">Vercel</li>
              </ul>
            </div>
            <div>
              <h3 className="font-code mb-4 text-xs font-bold tracking-wider text-slate-200 uppercase">
                Company
              </h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li>
                  <Link to="/about" className="transition-colors hover:text-teal-300">
                    About Us
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:contact@snyzer.ai"
                    className="inline-block transition-colors hover:text-teal-300"
                  >
                    Email
                  </a>
                </li>
                <li>
                  <Link to="/login" className="transition-colors hover:text-teal-300">
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pointer-events-none flex w-full items-center justify-center overflow-hidden py-4 select-none">
          <svg
            viewBox="0 0 1200 170"
            className="h-auto w-full max-w-6xl"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <text
              x="50%"
              y="55%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="none"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1.6"
              letterSpacing="0.26em"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontWeight="900"
              fontSize="165"
            >
              SNYZER
            </text>
          </svg>
        </div>

        <div className="my-6 w-full border-t border-slate-800/80" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-center font-mono text-xs tracking-wide text-slate-400 sm:text-left sm:text-sm">
            © 2026 Snyzer, Inc. All rights reserved.
          </p>
          <div className="inline-flex items-center gap-2.5 rounded-full border border-teal-500/30 bg-[#051821] px-4 py-1.5 shadow-[0_0_15px_rgba(45,212,191,0.15)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf]" />
            <span className="font-mono text-xs font-medium tracking-wide text-teal-300">
              All systems normal
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
