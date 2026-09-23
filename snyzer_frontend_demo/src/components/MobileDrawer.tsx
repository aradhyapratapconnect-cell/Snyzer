import { PageRoute } from '../types';
import SnyzerLogo from './SnyzerLogo';
import { X, Info, Sparkles, History as HistoryIcon, Code2, ArrowRight, ExternalLink, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: PageRoute) => void;
  onOpenGithub: () => void;
}

export default function MobileDrawer({
  isOpen,
  onClose,
  onNavigate,
  onOpenGithub
}: MobileDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          {/* Backdrop Click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />

          {/* Drawer Box matching Image 9 */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-md bg-[#040e17] border border-teal-500/20 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(45,212,191,0.15)] flex flex-col justify-between max-h-[92vh] overflow-y-auto"
            id="mobile-navigation-drawer"
          >
            <div>
              {/* Header with Logo & Close */}
              <div className="flex items-center justify-between pb-6 border-b border-teal-500/10">
                <div onClick={() => { onNavigate('home'); onClose(); }}>
                  <SnyzerLogo size="md" />
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-teal-950/40 border border-teal-500/30 flex items-center justify-center text-teal-300 hover:bg-teal-900/50 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* System Status Pill from Image 9 */}
              <div className="mt-5 p-3 rounded-2xl bg-teal-950/30 border border-teal-500/25 flex items-center justify-between font-code text-xs">
                <div className="flex items-center gap-2 text-teal-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                  <span>System Status: All systems normal</span>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-teal-900/50 text-teal-300 border border-teal-500/30">
                  v2.4
                </span>
              </div>

              {/* Navigation Menu List */}
              <div className="mt-5 space-y-3">
                {/* About Us */}
                <button
                  onClick={() => { onNavigate('about'); onClose(); }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-teal-950/40 border border-transparent hover:border-teal-500/20 text-slate-200 hover:text-white transition-all group active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-teal-400/80 group-hover:text-teal-300" />
                    <span className="font-semibold text-base">About Us</span>
                  </div>
                  <span className="text-slate-600 group-hover:text-teal-400 transition-colors">›</span>
                </button>

                {/* Playground (ACTIVE / LIVE) */}
                <button
                  onClick={() => { onNavigate('playground'); onClose(); }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-teal-950/40 border border-teal-500/40 text-teal-100 shadow-[0_0_20px_rgba(45,212,191,0.1)] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-teal-400" />
                    <span className="font-semibold text-base text-white">Playground</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-teal-400/20 text-teal-300 text-xs font-code font-bold border border-teal-400/30">
                    LIVE
                  </span>
                </button>

                {/* History */}
                <button
                  onClick={() => { onNavigate('history'); onClose(); }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-teal-950/40 border border-transparent hover:border-teal-500/20 text-slate-200 hover:text-white transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <HistoryIcon className="w-5 h-5 text-teal-400/80 group-hover:text-teal-300" />
                    <span className="font-semibold text-base">History</span>
                  </div>
                  <span className="text-slate-600 group-hover:text-teal-400 transition-colors">›</span>
                </button>

                {/* Settings Tab */}
                <button
                  onClick={() => { onNavigate('settings'); onClose(); }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-teal-950/40 border border-transparent hover:border-teal-500/20 text-slate-200 hover:text-white transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-teal-400/80 group-hover:text-teal-300" />
                    <span className="font-semibold text-base">Settings</span>
                  </div>
                  <span className="text-slate-600 group-hover:text-teal-400 transition-colors">›</span>
                </button>

                {/* Github */}
                <button
                  onClick={() => { onOpenGithub(); onClose(); }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-teal-950/40 border border-transparent hover:border-teal-500/20 text-slate-200 hover:text-white transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Code2 className="w-5 h-5 text-teal-400/80 group-hover:text-teal-300" />
                    <span className="font-semibold text-base">Github</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-teal-400" />
                </button>
              </div>

              {/* Start Free CTA button matching Image 9 */}
              <div className="mt-6">
                <button
                  onClick={() => { onNavigate('auth'); onClose(); }}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 hover:opacity-95 text-slate-950 font-bold text-base flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(45,212,191,0.45)] hover:shadow-[0_0_40px_rgba(45,212,191,0.6)] transition-all active:scale-[0.98]"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Bottom Tech Stack & Socials from Image 9 */}
            <div className="pt-8 mt-6 border-t border-slate-800/80">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
                <span className="text-[11px] font-code uppercase tracking-wider text-slate-400">TECH STACK</span>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-teal-950/50 border border-teal-500/30 text-teal-300 text-xs font-code">
                    TypeScript
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-teal-950/50 border border-teal-500/30 text-teal-300 text-xs font-code">
                    React
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-teal-950/50 border border-teal-500/30 text-teal-300 text-xs font-code">
                    Supabase
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-teal-950/40 border border-teal-500/30 flex items-center justify-center text-slate-300 hover:text-teal-300 transition-colors text-xs"
                  >
                    gh
                  </a>
                  <a
                    href="https://x.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-teal-950/40 border border-teal-500/30 flex items-center justify-center text-slate-300 hover:text-teal-300 transition-colors text-xs"
                  >
                    𝕏
                  </a>
                  <a
                    href="https://discord.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-teal-950/40 border border-teal-500/30 flex items-center justify-center text-slate-300 hover:text-teal-300 transition-colors text-xs"
                  >
                    dc
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-teal-950/40 border border-teal-500/30 flex items-center justify-center text-slate-300 hover:text-teal-300 transition-colors text-xs"
                  >
                    in
                  </a>
                </div>
                <span className="text-xs text-slate-500 font-code">© 2026 Snyzer</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
