import React from 'react';
import { PageRoute } from '../types';
import SnyzerLogo from './SnyzerLogo';

interface FooterProps {
  onNavigate: (route: PageRoute) => void;
  onOpenGithub: () => void;
  onOpenShortcuts?: () => void;
}

export default function Footer({ onNavigate, onOpenGithub, onOpenShortcuts }: FooterProps) {
  return (
    <footer className="w-full bg-[#030911] border-t border-slate-800/80 text-white pt-16 pb-12 px-4 sm:px-6 lg:px-12 relative z-20 overflow-hidden">
      {/* Subtle atmospheric glow */}
      <div className="absolute top-0 right-1/4 w-96 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto w-full">
        {/* Top Grid: Logo & Tagline + 4 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          {/* Left Column: Brand, Description, Social Buttons (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <div 
              onClick={() => onNavigate('home')} 
              className="flex items-center gap-3 cursor-pointer group"
              role="button" 
              tabIndex={0}
            >
              <SnyzerLogo size="md" showText={false} />
              <span className="text-2xl font-bold font-display tracking-tight text-white group-hover:text-teal-200 transition-colors">
                Snyzer
              </span>
            </div>

            <p className="mt-4 text-sm text-slate-400 max-w-sm leading-relaxed">
              AI-assisted writing revision editor preserving human intent and quality.
            </p>

            {/* Social Icons Row */}
            <div className="flex items-center gap-3 mt-6">
              {/* GitHub */}
              <button
                onClick={onOpenGithub}
                aria-label="GitHub"
                className="w-10 h-10 rounded-xl bg-[#091723] border border-slate-800 hover:border-teal-500/40 text-slate-300 hover:text-white hover:bg-teal-950/40 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </button>

              {/* X (Twitter) */}
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="X (Twitter)"
                className="w-10 h-10 rounded-xl bg-[#091723] border border-slate-800 hover:border-teal-500/40 text-slate-300 hover:text-white hover:bg-teal-950/40 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* Discord */}
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Discord"
                className="w-10 h-10 rounded-xl bg-[#091723] border border-slate-800 hover:border-teal-500/40 text-slate-300 hover:text-white hover:bg-teal-950/40 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-10 h-10 rounded-xl bg-[#091723] border border-slate-800 hover:border-teal-500/40 text-slate-300 hover:text-white hover:bg-teal-950/40 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right Columns: 4 distinct link groups (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {/* 1. PRODUCT */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 font-code">
                PRODUCT
              </h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li>
                  <button 
                    onClick={() => onNavigate('playground')} 
                    className="hover:text-teal-300 transition-colors text-left cursor-pointer"
                  >
                    Playground
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      onNavigate('home');
                      setTimeout(() => {
                        document.getElementById('why-choose-snyzer')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }} 
                    className="hover:text-teal-300 transition-colors text-left cursor-pointer"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onNavigate('playground')} 
                    className="hover:text-teal-300 transition-colors text-left cursor-pointer"
                  >
                    Writing Engine
                  </button>
                </li>
                {onOpenShortcuts && (
                  <li>
                    <button 
                      onClick={onOpenShortcuts} 
                      className="hover:text-teal-300 transition-colors text-left cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Keyboard Shortcuts</span>
                      <kbd className="font-mono text-[9px] px-1 py-0.2 rounded bg-slate-900 border border-slate-800 text-teal-400">
                        Ctrl+K
                      </kbd>
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* 2. TECH STACK */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 font-code">
                TECH STACK
              </h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="hover:text-white transition-colors cursor-default">TypeScript</li>
                <li className="hover:text-white transition-colors cursor-default">React</li>
                <li className="hover:text-white transition-colors cursor-default">Supabase</li>
                <li className="hover:text-white transition-colors cursor-default">Vercel</li>
              </ul>
            </div>

            {/* 3. COMPANY */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 font-code">
                COMPANY
              </h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li>
                  <button 
                    onClick={() => onNavigate('about')} 
                    className="hover:text-teal-300 transition-colors text-left cursor-pointer"
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <a 
                    href="mailto:contact@snyzer.ai" 
                    className="hover:text-teal-300 transition-colors text-left inline-block"
                  >
                    Email
                  </a>
                </li>
                <li>
                  <a 
                    href="https://instagram.com" 
                    target="_blank" 
                    rel="noreferrer"
                    className="hover:text-teal-300 transition-colors text-left inline-block"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <button 
                    onClick={() => onNavigate('about')} 
                    className="hover:text-teal-300 transition-colors text-left cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onNavigate('about')} 
                    className="hover:text-teal-300 transition-colors text-left cursor-pointer"
                  >
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>

            {/* 4. CONNECT */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 font-code">
                CONNECT
              </h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li>
                  <button 
                    onClick={onOpenGithub} 
                    className="hover:text-teal-300 transition-colors text-left cursor-pointer"
                  >
                    GitHub
                  </button>
                </li>
                <li>
                  <a 
                    href="https://discord.com" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="hover:text-teal-300 transition-colors text-left inline-block"
                  >
                    Discord
                  </a>
                </li>
                <li>
                  <a 
                    href="https://x.com" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="hover:text-teal-300 transition-colors text-left inline-block"
                  >
                    X (Twitter)
                  </a>
                </li>
                <li>
                  <a 
                    href="https://linkedin.com" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="hover:text-teal-300 transition-colors text-left inline-block"
                  >
                    LinkedIn
                  </a>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      onNavigate('home');
                      setTimeout(() => {
                        document.getElementById('why-choose-snyzer')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }} 
                    className="hover:text-teal-300 transition-colors text-left cursor-pointer"
                  >
                    Status
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* GIANT HOLLOW OUTLINED "S N Y Z E R" TEXT WATERMARK (Exact to image)   */}
        {/* ===================================================================== */}
        <div className="w-full flex items-center justify-center py-4 my-2 overflow-hidden select-none pointer-events-none">
          <svg
            viewBox="0 0 1200 170"
            className="w-full max-w-6xl h-auto"
            preserveAspectRatio="xMidYMid meet"
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

        {/* Divider line below SNYZER outline text */}
        <div className="w-full border-t border-slate-800/80 my-6" />

        {/* Bottom Bar: Copyright on left, "All systems normal" badge on right */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs sm:text-sm text-slate-400 tracking-wide text-center sm:text-left">
            © 2026 Snyzer, Inc. All rights reserved.
          </p>

          {/* Glowing Status Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#051821] border border-teal-500/30 shadow-[0_0_15px_rgba(45,212,191,0.15)]">
            <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf] animate-pulse" />
            <span className="font-mono text-xs text-teal-300 font-medium tracking-wide">
              All systems normal
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
